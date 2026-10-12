export type RegistrationStatus =
  'PENDING_INITIAL_REVIEW' | 'PENDING_FINAL_APPROVAL' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'

export type CheckInStatus = 'PENDING' | 'CHECKED_IN' | 'FAILED'

export interface Registration {
  id: string
  eventId: string
  userId: string
  attendeeName: string
  attendeeEmail: string
  status: RegistrationStatus
  moderationNotes?: string
  checkInStatus: CheckInStatus
  checkInPhotoUrl?: string
  checkInTime?: string
  certificateId?: string
  createdAt: string
  updatedAt: string
}

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

export interface Certificate {
  id: string
  registrationId: string
  eventId: string
  attendeeName: string
  eventTitle: string
  issueDate: string
  verificationCode: string
  downloadUrl: string
}
