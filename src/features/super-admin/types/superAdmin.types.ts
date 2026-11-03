export type SuperAdminTab =
  | 'overview'
  | 'users'
  | 'fanpages'
  | 'events'
  | 'semesters'
  | 'training-points'
  | 'sv5t'

export interface UserAdminItem {
  id: number | string
  email: string
  fullName?: string
  studentId?: string
  role: string
  roles?: string[]
  isActive: boolean
  avatarUrl?: string
  schoolName?: string
  majorName?: string
  classCode?: string
  phone?: string
  createdAt?: string
}

export type FanpageStatus = 'PENDING' | 'ACTIVE' | 'BANNED'

export interface FanpageAdminItem {
  id: number | string
  code: string
  name: string
  orgName?: string
  status: FanpageStatus
  isActive: boolean
  followerCount: number
  eventCount: number
  helpContact?: string
  helpPhone?: string
  address?: string
  avatarUrl?: string
  description?: string
  parentOrg?: string
  createdAt?: string
}

export type EventAdminStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'

export interface EventAdminItem {
  id: number | string
  name: string
  description: string
  location: string
  dateOpen: string
  dateClose: string
  dateHappen: string
  capacity: number
  maleQuantity?: number
  femaleQuantity?: number
  registeredCount: number
  checkedInCount?: number
  status: EventAdminStatus
  eventTypeId: number
  eventTypeName?: string
  fanpageId: number
  fanpageName?: string
  semesterId: number
  semesterName?: string
  criteriaId?: number
  criteriaName?: string
  bannerUrl?: string
  createdAt?: string
}

export interface SemesterAdminItem {
  id: number
  number: number
  startDate: string
  endDate: string
  status: 'ONGOING' | 'UPCOMING' | 'CLOSED' | string
  academicYearId: number
  academicYearName?: string
  isActive?: boolean
}

export interface AcademicYearItem {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface PointCategoryAdminItem {
  id: number
  name: string
  maximum: number
  level: number
  note?: string
  parentCategoryId?: number | null
  parentCategoryName?: string
  dateApply?: string
  isActive: boolean
  childrenOrder?: number
  children?: PointCategoryAdminItem[]
}

export interface CriteriaAdminItem {
  id: number
  name: string
  note?: string
  scope: string
  level: number
  parentId?: number | null
  parentName?: string
  childrenOrder?: number
  requiredChildren?: number | null
  isActive?: boolean
  children?: CriteriaAdminItem[]
}

export interface SuperAdminOverviewStats {
  totalUsers: number
  studentCount: number
  staffCount: number
  adminCount: number
  totalFanpages: number
  activeFanpages: number
  pendingFanpages: number
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  closedEvents: number
  ongoingSemester?: SemesterAdminItem | null
}

