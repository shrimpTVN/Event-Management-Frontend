export type SuperAdminNavTab =
  | 'overview'
  | 'fanpages'
  | 'users'
  | 'events'
  | 'semesters'
  | 'point-categories'
  | 'sv5t-criterias'
  | 'schools'

export type UserRole = 'STUDENT' | 'STAFF' | 'ORGANIZER' | 'SUPERADMIN'
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING'

export interface SuperAdminUser {
  id: string
  name: string
  code: string // MSSV hoặc Mã cán bộ
  email: string
  role: UserRole
  schoolName: string
  majorName?: string
  status: UserStatus
  avatarUrl?: string
  phone?: string
  createdAt: string
  eventsParticipatedCount: number
}

export type FanpageStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'LOCKED'

export interface SuperAdminFanpage {
  id: string
  name: string
  representativeName: string
  representativeCode: string
  representativePhone: string
  representativeEmail: string
  schoolName: string
  proofFileUrl?: string
  proofFileName?: string
  createdAt: string
  status: FanpageStatus
  avatarUrl?: string
  coverUrl?: string
  description?: string
  rejectionReason?: string
  eventsCount: number
  followersCount: number
}

export type AdminEventStatus =
  | 'OPEN'
  | 'HAPPENING'
  | 'COMPLETED'
  | 'VIOLATED'
  | 'HIDDEN'

export interface SuperAdminEvent {
  id: string
  title: string
  fanpageId: string
  fanpageName: string
  startDateTime: string
  endDateTime: string
  location: string
  capacity: number
  registeredCount: number
  trainingPoint: number
  trainingPointCategoryName: string
  sv5tCriteriaName?: string
  createdAt: string
  status: AdminEventStatus
  bannerUrl?: string
  violationReason?: string
  reportCount?: number
}

export type SemesterStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED'

export interface SuperAdminSemester {
  id: number
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
  totalParticipations: number
  pendingFanpagesCount: number
  violationReportsCount: number
  userGrowthRate: number
  eventGrowthRate: number
}

export interface FanpageRankItem {
  id: string
  name: string
  eventsCount: number
  participationsCount: number
  avatarUrl?: string
}
