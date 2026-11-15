import { describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({
  apiClient: { get: vi.fn() },
  formatEventTitle: (title: string) => title,
}))
import { apiClient } from '@/shared'
import { normalizeAttendanceConfig } from '../attendanceConfig'
import { normalizeRegisteredEvent } from '@/features/registration-history/services/historyService'
import { normalizeEvent } from '@/features/events/services/eventService'
import { fanpageAdminService } from '@/features/fanpage-admin/services/fanpageAdminService'

describe('attendance configuration across frontend views', () => {
  it('keeps manual defaults for old responses and accepts both session naming formats', () => {
    expect(normalizeAttendanceConfig({})).toEqual({
      attendanceMethod: 'MANUAL',
      attendanceSessionType: 'BOTH',
    })
    expect(
      normalizeAttendanceConfig({
        attendanceMethod: 'STUDENT_PROOF',
        attendanceSessionType: 'CHECK_IN',
      })
    ).toEqual({ attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'START' })
    expect(
      normalizeAttendanceConfig({
        attendanceMethod: 'STUDENT_PROOF',
        attendanceSessionType: 'CHECK_OUT',
      })
    ).toEqual({ attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'END' })
  })

  it('reads configuration from nested history eventInfo instead of losing it at registration level', () => {
    const row = normalizeRegisteredEvent({
      attendanceMethod: 'MANUAL',
      attendanceSessionType: 'BOTH',
      eventInfo: { id: 10, attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'END' },
    })
    expect(row).toMatchObject({ attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'END' })
  })

  it('preserves the same mode in student event details and fanpage management', async () => {
    const raw = {
      id: 10,
      name: 'Nộp ảnh điểm danh',
      attendanceMethod: 'STUDENT_PROOF' as const,
      attendanceSessionType: 'CHECK_IN' as const,
    }
    vi.mocked(apiClient.get).mockResolvedValue([raw] as any)
    expect(normalizeEvent(raw)).toMatchObject({
      attendanceMethod: 'STUDENT_PROOF',
      attendanceSessionType: 'START',
    })
    expect((await fanpageAdminService.getAdminEvents('7'))[0]).toMatchObject({
      attendanceMethod: 'STUDENT_PROOF',
      attendanceSessionType: 'START',
    })
  })
})
