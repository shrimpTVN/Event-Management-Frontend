export interface PendingApplicant {
  id: string
  name: string
  email: string
  eventTitle: string
  step: 'STAGE_1_REVIEW' | 'STAGE_2_FINAL_APPROVAL'
}
