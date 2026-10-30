export interface FanpageSummary {
  id: string
  code: string
  name: string
  fullName: string
  avatarText: string
  avatarUrl?: string
  role: string
  isVerified: boolean
  email: string
  phone: string
  address: string
  followersCount: number
  eventsCount: number
  description: string
  parentOrg?: string
  orgType?: string
}

export interface FanpageActivityStats {
  periodLabel: string
  eventsCount: number
  interactionsCount: number
  newFollowersCount: number
  responseRatePercent: number
  pendingCommentsCount: number
}

export interface UpcomingEventReminder {
  id: string
  title: string
  monthText: string
  dayText: string
  registrationsCount: number
  dateText: string
}

export interface FanpageFeedPost {
  id: string
  eventId?: string
  authorName: string
  authorCode: string
  authorAvatarText: string
  authorAvatarUrl?: string
  timeAgo: string
  isPublic: boolean
  title: string
  summary: string
  bannerUrl?: string
  startTime?: string
  endTime?: string
  location?: string
  pointsReward?: string
  capacity?: number
  quotaText?: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  isLiked?: boolean
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'

export interface AdminEvent {
  id: string
  code: string
  name: string
  description: string
  eventTypeId: number
  eventTypeName: string
  fanpageId: string
  organizerName: string
  dateStart: string
  dateHappen?: string
  dateEnd: string
  timeStart: string
  timeEnd: string
  format: 'OFFLINE' | 'ONLINE' | 'HYBRID'
  location: string
  capacity: number
  maleQuantity?: number
  femaleQuantity?: number
  registeredCount: number
  checkedInCount: number
  status: EventStatus
  bannerUrl: string
  requiresApproval: boolean
  attendanceMethod?: 'MANUAL' | 'STUDENT_PROOF'
  attendanceSessionType?: 'START' | 'END' | 'BOTH'
  autoEmail: boolean
  isPublic: boolean
  // Học kỳ & Thời gian đăng ký (Schema)
  semesterId?: number
  semesterName?: string
  dateOpen?: string
  dateClose?: string
  // Quyền lợi sinh viên
  trainingPointCategoryId?: number
  trainingPointCategoryName?: string
  trainingPointCategoryCode?: string
  trainingPoints?: number
  sv5tCriteriaId?: number
  sv5tCriteriaName?: string
  eventPoints?: Array<{
    pointCategoryId: number
    pointCategoryName: string
    pointCategoryCode?: string
    point: number
    maximum?: number
  }>
  hasCertificate: boolean
  tags: string[]
  createdAt: string
}

export type RegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ENTRY_CHECKED'
  | 'COMPLETED'
  | 'CHECKED_IN'
  | 'ABSENTED'
  | 'CANCELLED'

export interface EventRegistrationItem {
  id: string
  userId: string
  studentId: string
  fullName: string
  major: string
  kNumber: number
  email: string
  phone: string
  avatarUrl?: string
  registeredAt: string
  status: RegistrationStatus
  entryCheckInTime?: string
  checkOutTime?: string
  pinCheckInTime?: string
  checkInTime?: string
  evidenceUrl?: string
  startEvidenceUrl?: string
  endEvidenceUrl?: string
}

export type FanpageMemberRole = 'ADMIN' | 'COLLABORATOR'

export interface FanpageMember {
  id: string
  userId: string
  staffId?: string
  fullName: string
  email: string
  avatarText: string
  avatarUrl?: string
  role: FanpageMemberRole
  title: string
  phone?: string
  joinedAt: string
  isActive: boolean
}

export interface FanpageInvitation {
  id: string
  email: string
  fanpageId?: number
  code?: string
  name?: string
  inviter?: string
  avatarUrl?: string
  role: 'COLLABORATOR' | string
  invitedBy?: string
  invitedAt?: string
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'REJECTED'
  createdAt?: string
}

export type AdminNavTab =
  | 'overview'
  | 'events'
  | 'create-event'
  | 'event-detail'
  | 'members'
  | 'profile'
  | 'settings'

export type VolunteerRole = 'CHECKIN' | 'LOGISTICS' | 'RECEPTION' | 'MEDIA'

export interface EventVolunteerItem {
  id: string
  studentId: string
  fullName: string
  major: string
  phone: string
  role: VolunteerRole
  roleName: string
  taskDescription: string
  status: 'ASSIGNED' | 'CHECKED_IN' | 'COMPLETED'
  trainingPoints: number
  sv5tCriteria: string
  hasCertificate: boolean
}

export interface VolunteerRoleSlot {
  role: VolunteerRole
  roleName: string
  targetCount: number
  description: string
}

export interface VolunteerRecruitmentPost {
  id: string
  eventId: string
  title: string
  description: string
  benefits: string[]
  targetCount: number
  deadline: string
  status: 'OPEN' | 'CLOSED'
  rolesNeeded: VolunteerRoleSlot[]
  createdAt: string
}

export interface VolunteerApplicant {
  id: string
  recruitmentId: string
  eventId: string
  studentId: string
  fullName: string
  major: string
  kNumber: number
  email: string
  phone: string
  appliedRole: VolunteerRole
  assignedRole?: VolunteerRole
  reason: string
  appliedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface PointCategoryItem {
  id: number
  name: string
  note?: string | null
  maximum: number
  level: number
  childrenOrder: number
  parentCategoryId: number | null
  isActive?: boolean
}

export interface Sv5tCriteriaItem {
  id: number
  name: string
  note?: string | null
  scope?: string
  level: number
  childrenOrder: number
  parentId: number | null
  isActive?: boolean
}
