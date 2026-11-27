export type SuperAdminNavTab =
  | 'overview'
  | 'fanpages'
  | 'users'
  | 'events'
  | 'semesters'
  | 'point-categories'
  | 'sv5t-criterias'
  | 'schools'

export type UserRole = 'STUDENT' | 'STAFF' | 'SUPERADMIN'
export type UserSystemRole = 'ADMIN' | 'STUDENT' | 'FANPAGE_ADMIN'
export interface AdminStudentProfile {
  studentId: string
  schoolName: string
  majorName: string
  kNumber: string
  associationName: string
}
export interface AdminStaffProfile {
  staffId: string
  orgName: string
  title: string
  phoneNumber: string
}
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING'

export interface SuperAdminUser {
  id: string
  name: string
  code: string // MSSV hoặc Mã cán bộ
  email: string
  role: UserRole
  baseRole?: 'STUDENT' | 'STAFF' | null
  systemRoles?: UserSystemRole[]
  studentProfile?: AdminStudentProfile
  staffProfile?: AdminStaffProfile
  schoolName: string
  majorName?: string
  status: UserStatus
  avatarUrl?: string
  phone?: string
  createdAt: string
  eventsParticipatedCount: number | null
}

export interface UserFanpageMembership {
  id: string
  name: string
  avatarUrl?: string
  role: 'ADMIN' | 'MEMBER'
}

export type FanpageStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'LOCKED'

export interface SuperAdminFanpage {
  id: string
  name: string
  representativeName: string
  representativeCode: string
  representativePhone: string
  representativeEmail: string
  contactEmail?: string
  contactPhone?: string
  schoolName: string
  proofFileUrl?: string
  proofFileName?: string
  createdAt: string
  status: FanpageStatus
  avatarUrl?: string
  coverUrl?: string
  description?: string
  rejectionReason?: string
  eventsCount: number | null
  followersCount: number | null
}

export type AdminEventStatus =
  'OPEN' | 'HAPPENING' | 'COMPLETED' | 'HIDDEN' | 'DRAFT' | 'CANCELLED'

export interface SuperAdminEvent {
  id: string
  title: string
  fanpageId: string
  fanpageName: string
  startDateTime: string
  endDateTime: string
  location: string
  capacity: number | null
  registeredCount: number | null
  eventPoints?: { pointCategoryId: number; name: string; code?: string; point: number }[]
  trainingPoint: number
  trainingPointCategoryName: string
  sv5tCriteriaName?: string
  createdAt: string
  status: AdminEventStatus
  bannerUrl?: string
  violationReason?: string
}

export type SemesterStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED'

export interface SuperAdminSemester {
  id: number
  academicYearId?: number
  number: number // 1, 2, 3
  academicYear: string // ví dụ: "2025-2026"
  startDate: string
  endDate: string
  status: SemesterStatus
  isCurrent: boolean
  isActive: boolean
}

export interface SuperAdminPointCategory {
  id: number
  name: string
  note?: string
  maximum: number
  dateApply?: string
  isMaxChild?: boolean
  level: number
  childrenOrder: number
  parentCategoryId?: number | null
  isActive: boolean
  children?: SuperAdminPointCategory[]
}

export type Sv5tScope = 'UNIVERSITY' | 'FACULTY'

export interface SuperAdminSv5tCriteria {
  id: number
  name: string
  note?: string
  scope: Sv5tScope
  requiredChildren?: number | null
  requiredOccurrences?: number
  level: number
  childrenOrder: number
  parentId?: number | null
  isActive: boolean
  children?: SuperAdminSv5tCriteria[]
}

export interface SuperAdminMajor {
  id: number
  code: string
  name: string
  schoolId: number
  isActive: boolean
  studentCount?: number
}

export interface SuperAdminSchool {
  id: number
  name: string
  description?: string
  isActive: boolean
  majorsCount?: number
  majors?: SuperAdminMajor[]
}

export interface SuperAdminOverviewStats {
  totalUsers: number
  totalFanpages: number
  totalEvents: number
  totalParticipations: number | null
  pendingFanpagesCount: number
  violationReportsCount: number
  userGrowthRate: number | null
  eventGrowthRate: number | null
}

export interface FanpageRankItem {
  id: string
  name: string
  eventsCount: number
  participationsCount: number
  avatarUrl?: string
}
