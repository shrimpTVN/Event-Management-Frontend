interface RegistrationTiming {
  status?: string
  dateClose?: string | null
  canCancel?: boolean
}

export function nextTimeBoundary(dates: (string | null | undefined)[]): string | undefined {
  const now = Date.now()
  return dates.filter((date): date is string => typeof date === 'string' && Date.parse(date) >= now)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0]
}

// BE allows cancellation through dateClose, and only while REGISTERED.
export function canCancelRegistration(registration: RegistrationTiming, now = Date.now()): boolean {
  if (registration.status !== 'REGISTERED' || registration.canCancel === false) return false
  if (!registration.dateClose) return true
  const deadline = Date.parse(registration.dateClose)
  return Number.isFinite(deadline) && now <= deadline
}

export function isUpcomingRegistration(
  registration: { status: string; startsAt?: string },
  now = Date.now()
): boolean {
  return registration.status === 'REGISTERED' &&
    Boolean(registration.startsAt && Date.parse(registration.startsAt) > now)
}
