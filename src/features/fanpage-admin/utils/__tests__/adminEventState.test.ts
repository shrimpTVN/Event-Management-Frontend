import { describe, expect, it } from 'vitest'
import { adminEventState } from '../adminEventState'
import type { AdminEvent } from '../../types/fanpageAdmin.types'

const now = Date.parse('2026-11-25T10:00:00+07:00')
const base = {
  status: 'PUBLISHED',
  capacity: 100,
  registeredCount: 10,
  startsAt: '2026-11-26T08:00:00+07:00',
  endsAt: null,
  dateOpen: '2026-11-20T00:00:00+07:00',
  dateClose: '2026-11-25T11:00:00+07:00',
} as AdminEvent

describe('fanpage event tabs and badges', () => {
  it('uses the registration window and capacity instead of PUBLISHED alone', () => {
    expect(adminEventState(base, 10, now).tab).toBe('OPEN_REGISTRATION')
    expect(adminEventState(base, 100, now)).toMatchObject({
      tab: null,
      label: 'Chờ diễn ra',
      detail: 'Đã đủ chỗ',
    })
    expect(
      adminEventState({ ...base, dateOpen: '2026-11-25T11:00:00+07:00' }, 10, now).detail
    ).toBe('Chưa mở đăng ký')
    expect(
      adminEventState({ ...base, dateClose: '2026-11-25T09:00:00+07:00' }, 10, now)
    ).toMatchObject({ tab: null, label: 'Chờ diễn ra', detail: 'Đã đóng đăng ký' })
  })

  it('allows registration at the exact deadline and closes it one millisecond later', () => {
    const boundary = Date.parse(base.dateClose!)
    expect(adminEventState(base, 10, boundary).tab).toBe('OPEN_REGISTRATION')
    expect(adminEventState(base, 10, boundary + 1).tab).toBeNull()
  })

  it('uses real start and end instants for ongoing and ended', () => {
    const event = {
      ...base,
      startsAt: '2026-11-25T09:00:00+07:00',
      endsAt: '2026-11-25T11:00:00+07:00',
    }
    expect(adminEventState(event, 10, now).tab).toBe('ONGOING')
    expect(adminEventState(event, 10, Date.parse(event.endsAt)).tab).toBe('COMPLETED')
  })

  it('does not invent an end time or confuse registration closure with event completion', () => {
    expect(adminEventState({ ...base, dateClose: '2026-11-25T09:00:00+07:00' }, 10, now)).toMatchObject({
      tab: null,
      label: 'Chờ diễn ra',
      detail: 'Đã đóng đăng ký',
    })
    expect(
      adminEventState({ ...base, startsAt: '2026-11-20T08:00:00+07:00', endsAt: null }, 10, now).tab
    ).toBe('ONGOING')
    expect(
      adminEventState(
        { ...base, startsAt: '2026-11-25T09:00:00+07:00', endsAt: '2026-11-25T09:00:00+07:00' },
        10,
        now
      ).tab
    ).toBe('ONGOING')
  })

  it('keeps an old CLOSED event in the ended tab even when its end timestamp is missing', () => {
    expect(adminEventState({ ...base, status: 'CLOSED', startsAt: '2026-04-09T11:48:00+07:00', endsAt: null }, 51, now))
      .toMatchObject({ tab: 'COMPLETED', label: 'Đã kết thúc' })
  })

  it.each(['CANCELLED', 'DRAFT', 'COMPLETED'] as const)(
    'prioritizes explicit %s over event dates',
    (status) => {
      expect(adminEventState({ ...base, status }, 10, now).tab).toBe(status)
    }
  )

  it('treats zero capacity as unlimited', () => {
    expect(adminEventState({ ...base, capacity: 0 }, 500, now).tab).toBe('OPEN_REGISTRATION')
  })
})
