export type RegistrationStatus =
  'PENDING_INITIAL_REVIEW' | 'PENDING_FINAL_APPROVAL' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'

export interface Registration {
  id: string
  eventId: string
  userId: string
  attendeeName: string
  attendeeEmail: string
  status: RegistrationStatus
  moderationNotes?: string
  checkInStatus: 'PENDING' | 'CHECKED_IN' | 'FAILED'
  checkInPhotoUrl?: string
  checkInTime?: string
  certificateId?: string
  createdAt: string
  updatedAt: string
}

export interface RegistrationFormData {
  fullName: string
  email: string
  organization?: string
  dietaryRestrictions?: string
}
