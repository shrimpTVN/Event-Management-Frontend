export type CheckInStatus = 'PENDING' | 'CHECKED_IN' | 'COMPLETED' | 'FAILED'

export type AttendanceSessionType = 'check-in' | 'check-out'

export interface AttendancePayload {
  eventId: string | number
  sessionType: AttendanceSessionType
  proofUrl?: string
}

export interface AttendanceEventItem {
  eventId: number | string
  eventName: string
  location?: string
  dateHappen?: string
  bannerUrl?: string
  status: string
  checkInAt?: string | null
  checkOutAt?: string | null
  evidenceUrl?: string | null
}
