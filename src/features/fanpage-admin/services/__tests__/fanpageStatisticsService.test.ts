import { fanpageAdminService } from '../fanpageAdminService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { fanpageStatisticsService } from '../fanpageStatisticsService'
vi.mock('@/features/events', () => ({ resolveEventTypeId: vi.fn() }))
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn() } }))
const get = vi.mocked(apiClient.get)
beforeEach(() => vi.clearAllMocks())
describe('fanpage statistics API', () => {
  it('uses the backend fanpage overview and accepts real zeros', async () => {
    const data = { totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 }
    get.mockResolvedValue(data)
    expect(await fanpageStatisticsService.getFanpageOverview('7')).toEqual(data)
    expect(get).toHaveBeenCalledWith('/fanpages/7/statistics/overview')
  })
  it('scopes event statistics to both fanpage and event IDs', async () => {
    const data = { capacity: 30, totalRegistrations: 9, totalAttended: 6, attendanceRate: 66.7 }
    get.mockResolvedValue({ data })
    expect(await fanpageStatisticsService.getEventOverview('7', '81')).toEqual(data)
    expect(get).toHaveBeenCalledWith('/fanpages/7/events/81/statistics/overview')
  })
  it('rejects missing or malformed numbers rather than silently returning zeros', async () => {
    get.mockResolvedValue({ capacity: 30 })
    await expect(fanpageStatisticsService.getEventOverview('7', '81')).rejects.toThrow(
      'Dữ liệu thống kê không hợp lệ'
    )
  })
  it('propagates request failures', async () => {
    get.mockRejectedValue(new Error('Forbidden'))
    await expect(fanpageStatisticsService.getFanpageOverview('7')).rejects.toThrow('Forbidden')
  })
})

describe('fanpage sidebar data', () => {
  it('maps genuine totals into the activity card', async () => {
    get.mockResolvedValue({ totalEvents: 12, totalRegistrations: 52, totalAttendees: 36 })
    expect(await fanpageAdminService.getActivityStats('7')).toMatchObject({
      available: true,
      eventsCount: 12,
      totalRegistrations: 52,
      totalAttendees: 36,
    })
  })
  it('marks failed totals as unavailable instead of displaying zeros', async () => {
    get.mockRejectedValue(new Error('Unavailable'))
    expect(await fanpageAdminService.getActivityStats('7')).toMatchObject({ available: false })
  })
  it('does not fetch an arbitrary fanpage when the current ID is absent', async () => {
    expect(await fanpageAdminService.getActivityStats()).toMatchObject({ available: false })
    expect(get).not.toHaveBeenCalled()
  })
  it('maps backend member names and user identifiers', async () => {
    get.mockResolvedValue([
      {
        userId: 42,
        firstName: 'An',
        lastName: 'Nguyễn Văn',
        email: 'an@ctu.edu.vn',
        role: 'ADMIN',
      },
    ])
    expect(await fanpageAdminService.getFanpageMembers('7')).toEqual([
      expect.objectContaining({ userId: '42', fullName: 'Nguyễn Văn An', role: 'ADMIN' }),
    ])
  })
  it('propagates a failed member request for the retry state', async () => {
    get.mockRejectedValue(new Error('Forbidden'))
    await expect(fanpageAdminService.getFanpageMembers('7')).rejects.toThrow('Forbidden')
  })
})

describe('dashboard backend contract', () => {
  it('normalizes the aggregate response, preserving actual zero counts', async () => {
    get.mockResolvedValue({
      overview: { totalEvents: 1, totalFollowers: 0, totalRegistrations: 0, totalAttendees: 0 },
      monthlyTrends: [
        { monthYear: '2026-03', eventCount: 1, registrationCount: 0, attendeeCount: 0 },
      ],
      eventsByType: [{ eventTypeName: 'Học thuật', eventCount: 1, percentage: 100 }],
      topEvents: [
        {
          eventId: 81,
          eventName: 'Ngày hội',
          dateHappen: null,
          registrationCount: 0,
          attendeeCount: 0,
          attendanceRate: 0,
        },
      ],
      demographics: {
        cohorts: [{ label: 'UNKNOWN', count: 0, percentage: 0 }],
        schools: [],
        majors: [],
      },
    })
    const data = await fanpageStatisticsService.getDashboard('7', 2026)
    expect(get).toHaveBeenCalledWith('/fanpages/7/statistics/dashboard', { params: { year: 2026 } })
    expect(data.monthlyTrends[0]).toEqual({
      month: '2026-03',
      eventsCount: 1,
      registrationsCount: 0,
      attendeesCount: 0,
    })
    expect(data.eventDistribution[0].eventCount).toBe(1)
    expect(data.topEvents[0]).toMatchObject({
      eventId: 81,
      totalRegistrations: 0,
      totalAttendees: 0,
    })
    expect(data.demographics.cohorts[0]).toEqual({
      label: 'Chưa xác định',
      studentCount: 0,
      percentage: 0,
    })
  })
  it('rejects a malformed overview instead of manufacturing zeros', async () => {
    get.mockResolvedValue({ totalEvents: 1 })
    await expect(fanpageStatisticsService.getFanpageOverview('7')).rejects.toThrow()
  })
  it('rejects a malformed dashboard instead of presenting it as empty', async () => {
    get.mockResolvedValue({
      overview: { totalEvents: 0, totalRegistrations: 0, totalAttendees: 0 },
    })
    await expect(fanpageStatisticsService.getDashboard('7', 2026)).rejects.toThrow()
  })
  it('propagates failures from every dashboard request', async () => {
    get.mockRejectedValue(new Error('Unavailable'))
    for (const request of [
      () => fanpageStatisticsService.getDashboard('7'),
      () => fanpageStatisticsService.getMonthlyTrends('7'),
      () => fanpageStatisticsService.getEventDistribution('7'),
      () => fanpageStatisticsService.getTopEvents('7'),
      () => fanpageStatisticsService.getDemographics('7'),
    ])
      await expect(request()).rejects.toThrow('Unavailable')
  })
})
