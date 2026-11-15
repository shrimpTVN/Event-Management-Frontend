import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), patch: vi.fn() } }))
import { apiClient } from '@/shared'
import { fanpageAdminService } from '../fanpageAdminService'

const get = vi.mocked(apiClient.get)
beforeEach(() => vi.resetAllMocks())

describe('attendee list used by select all', () => {
  it('finalizes attendance with the new API instead of just changing event status', async () => {
    await fanpageAdminService.completeEventAttendance('17')
    expect(apiClient.patch).toHaveBeenCalledExactlyOnceWith(
      '/registrations/fanpage-member/events/17/event-completed'
    )
  })
  it('reads the new paginated registration contract, nested profile, evidence and attendance times', async () => {
    get
      .mockResolvedValueOnce({
        content: [
          {
            userId: 136,
            eventId: 15,
            status: 'SPENDING_CONFIRM',
            regDate: '2026-11-13T14:00:00Z',
            checkInAt: '2026-11-14T01:00:00Z',
            checkOutAt: '2026-11-14T03:00:00Z',
            checkInEvidenceUrl: '/real-start.jpg',
            checkOutEvidenceUrl: '/real-end.jpg',
            studentProfile: {
              firstName: 'Lộc',
              lastName: 'Đoàn Tài',
              studentId: 'B2303827',
              email: 'loc@example.edu.vn',
              kNumber: 49,
              majorName: 'Kỹ thuật phần mềm',
              avatarUrl: '/avatar.jpg',
            },
          },
        ],
        last: false,
        size: 1,
        number: 0,
        totalPages: 2,
      } as any)
      .mockResolvedValueOnce({
        content: [
          { userId: 101, eventId: 15, status: 'REGISTERED', studentProfile: { studentId: 'B101' } },
        ],
        last: true,
        size: 1,
        number: 1,
        totalPages: 2,
      } as any)
    const rows = await fanpageAdminService.getEventAttendees('1', '15')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: '136',
      userId: '136',
      status: 'SPENDING_CONFIRM',
      fullName: 'Đoàn Tài Lộc',
      studentId: 'B2303827',
      email: 'loc@example.edu.vn',
      kNumber: 49,
      major: 'Kỹ thuật phần mềm',
      avatarUrl: '/avatar.jpg',
      startEvidenceUrl: '/real-start.jpg',
      endEvidenceUrl: '/real-end.jpg',
    })
    expect(rows[0].entryCheckInTime).toBeTruthy()
    expect(rows[0].checkOutTime).toBeTruthy()
    expect(String(get.mock.calls[0][0])).toContain('/events/15/registrations?')
    expect(String(get.mock.calls[1][0])).toContain('page=1')
  })
  it('handles missing student profiles without losing account identity or checkout evidence', async () => {
    get.mockResolvedValueOnce({
      content: [
        {
          userId: 136,
          status: 'CONFIRMED',
          studentProfile: null,
          checkOutEvidenceUrl: '/end-only.jpg',
        },
      ],
      last: true,
    } as any)
    const [row] = await fanpageAdminService.getEventAttendees('1', '15')
    expect(row).toMatchObject({
      id: '136',
      userId: '136',
      fullName: 'Người dùng #136',
      studentId: '',
      status: 'CONFIRMED',
      endEvidenceUrl: '/end-only.jpg',
    })
  })
  it('downloads the original CSV blob from the BE export endpoint', async () => {
    const csv = new Blob(['\uFEFFMSSV,Họ tên\nB2303827,Đoàn Tài Lộc'], {
      type: 'text/csv;charset=utf-8',
    })
    get.mockResolvedValueOnce(csv as any)
    expect(await fanpageAdminService.exportAttendeesCsv('7', '13')).toBe(csv)
    expect(get).toHaveBeenCalledExactlyOnceWith(
      '/registrations/fanpage-member/fanpages/7/events/13/attendees/export',
      { responseType: 'blob', headers: { Accept: 'text/csv' } }
    )
  })
  it('rejects JSON and empty files instead of downloading an error as CSV', async () => {
    get.mockResolvedValueOnce(
      new Blob(['{"message":"failed"}'], { type: 'application/json' }) as any
    )
    await expect(fanpageAdminService.exportAttendeesCsv('7', '13')).rejects.toThrow('CSV hợp lệ')
    get.mockResolvedValueOnce(new Blob([]) as any)
    await expect(fanpageAdminService.exportAttendeesCsv('7', '13')).rejects.toThrow('CSV hợp lệ')
  })
  it('confirms pending attendance using student account IDs and the BE confirmation endpoint', async () => {
    await fanpageAdminService.confirmAttendance('12', ['136', '1'])
    expect(apiClient.patch).toHaveBeenCalledExactlyOnceWith(
      '/registrations/fanpage-member/events/12/confirm-attendance',
      { studentUserIds: [136, 1] }
    )
  })
  it('does not submit invalid or empty account IDs for confirmation', async () => {
    await expect(fanpageAdminService.confirmAttendance('12', ['invalid'])).rejects.toThrow()
    await fanpageAdminService.confirmAttendance('12', [])
    expect(apiClient.patch).not.toHaveBeenCalled()
  })
  it('reads every page, excludes cancellations and preserves uploaded images and server status', async () => {
    get.mockImplementation(async (url) => {
      if (String(url).includes('page=0'))
        return Array.from({ length: 200 }, (_, index) => ({
          userId: index + 1,
          status: 'REGISTERED',
        })) as any
      return [
        { userId: 201, status: 'CANCELLED' },
        {
          userId: 202,
          status: 'CHECKED_IN',
          checkInEvidenceUrl: '/start.jpg',
          checkOutEvidenceUrl: '/end.jpg',
        },
      ] as any
    })
    const rows = await fanpageAdminService.getEventAttendees('7', '10')
    expect(rows).toHaveLength(201)
    expect(get).toHaveBeenCalledTimes(2)
    expect(String(get.mock.calls[1][0])).toContain('page=1')
    expect(rows.find((row) => row.userId === '202')).toMatchObject({
      status: 'CHECKED_IN',
      evidenceUrl: '/start.jpg',
      endEvidenceUrl: '/end.jpg',
    })
    expect(rows.some((row) => row.userId === '201')).toBe(false)
  })

  it('propagates a later-page failure instead of pretending a partial list is complete', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    get.mockImplementation(async (url) => {
      if (String(url).includes('page=0'))
        return Array.from({ length: 200 }, (_, index) => ({
          userId: index + 1,
          status: 'REGISTERED',
        })) as any
      throw new Error('offline')
    })
    await expect(fanpageAdminService.getEventAttendees('7', '10')).rejects.toThrow('offline')
    consoleError.mockRestore()
  })
})
