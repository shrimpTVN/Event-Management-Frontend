import { describe, expect, it } from 'vitest'
import { canCancelRegistration, isUpcomingRegistration } from '../registrationEligibility'

const date = '2026-11-25T08:00:00+07:00'
const now = Date.parse(date)

describe('registration rules shared with BE', () => {
  it('allows cancellation through the deadline, but not after it', () => {
    const registration = { status: 'REGISTERED', dateClose: date }
    expect(canCancelRegistration(registration, now - 1)).toBe(true)
    expect(canCancelRegistration(registration, now)).toBe(true)
    expect(canCancelRegistration(registration, now + 1)).toBe(false)
  })

  it.each(['CHECKED_IN', 'SPENDING_CONFIRM', 'CONFIRMED', 'RECORDED', 'CANCELLED', undefined])(
    'does not allow cancellation for %s', (status) => {
      expect(canCancelRegistration({ status }, now)).toBe(false)
    }
  )

  it('handles absent deadlines and explicit denial', () => {
    expect(canCancelRegistration({ status: 'REGISTERED' }, now)).toBe(true)
    expect(canCancelRegistration({ status: 'REGISTERED', canCancel: false }, now)).toBe(false)
    expect(canCancelRegistration({ status: 'REGISTERED', dateClose: 'invalid' }, now)).toBe(false)
  })

  it('only includes registered events strictly in the future', () => {
    const registration = { status: 'REGISTERED', startsAt: date }
    expect(isUpcomingRegistration(registration, now - 1)).toBe(true)
    expect(isUpcomingRegistration(registration, now)).toBe(false)
    expect(isUpcomingRegistration(registration, now + 1)).toBe(false)
    expect(isUpcomingRegistration({ status: 'CHECKED_IN', startsAt: date }, now - 1)).toBe(false)
    expect(isUpcomingRegistration({ status: 'REGISTERED' }, now)).toBe(false)
    expect(isUpcomingRegistration({ status: 'REGISTERED', startsAt: 'invalid' }, now)).toBe(false)
  })
})
