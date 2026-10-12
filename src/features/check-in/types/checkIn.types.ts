export type CheckInStatus = 'PENDING' | 'CHECKED_IN' | 'FAILED'

export interface CheckInPayload {
  registrationId: string
  photo: File | Blob
}

export interface CheckInResult {
  registrationId: string
  status: CheckInStatus
  verifiedAt: string
  confidenceScore?: number
  message: string
}
