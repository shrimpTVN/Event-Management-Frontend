export interface PointCategory {
  id: number
  name: string
  note: string | null
  maximum: number
  totalPoint?: number
  systemPointRecord?: number
  manualPointRecord?: number
  isAtMaximum?: boolean
  completionPercentage?: number
  selectedChildId?: number | null
  contributesToParent?: boolean
  dateApply?: string
  level: number
  childrenOrder: number
  parentCategoryId: number | null
  isMaxChild?: boolean
  isActive?: boolean
}

export interface PointCategoryNode extends PointCategory {
  children?: PointCategoryNode[]
}

/**
 * Tiêu chí con đã được Backend trải phẳng theo thứ tự DFS
 * Từ API: GET /student-semester-points/grouped-tree/{semesterId}
 */
export interface StudentSemesterPointFlattenedItem {
  id: number
  name: string
  note: string | null
  maximum: number
  dateApply?: string
  level: number
  parentCategoryId: number | null
  isActive: boolean
  childrenOrder: number
  isLeaf: boolean
  isMaxChild?: boolean
  studentSemesterPointId?: number | null
  totalPoint: number
  systemPointRecord: number
  manualPointRecord: number
  finalizedAt?: string | null
  isAtMaximum?: boolean
  completionPercentage?: number
  selectedChildId?: number | null
  contributesToParent?: boolean
}

/**
 * 5 Mục lớn (Mục I, II, III, IV, V) ở gốc kèm mảng items trải phẳng
 * Từ API: GET /student-semester-points/grouped-tree/{semesterId}
 */
export interface StudentSemesterPointGroupedTree {
  id: number
  name: string
  note: string | null
  maximum: number
  dateApply?: string
  level: number
  parentCategoryId: number | null
  isActive: boolean
  childrenOrder: number
  isMaxChild?: boolean
  studentSemesterPointId?: number | null
  totalPoint: number
  systemPointRecord: number
  manualPointRecord: number
  finalizedAt?: string | null
  isAtMaximum?: boolean
  completionPercentage?: number
  selectedChildId?: number | null
  contributesToParent?: boolean
  items: StudentSemesterPointFlattenedItem[]
}

/**
 * Tiêu chí con khung danh mục chuẩn từ BE (không kèm điểm sinh viên)
 * Từ API: GET /point-categories/grouped-tree
 */
export interface PointCategoryFlattenedItem {
  id: number
  name: string
  note: string | null
  maximum: number
  dateApply?: string
  level: number
  parentCategoryId: number | null
  isActive: boolean
  childrenOrder: number
  isLeaf: boolean
  isMaxChild?: boolean
}

/**
 * 5 Mục lớn khung danh mục chuẩn từ BE (không kèm điểm sinh viên)
 * Từ API: GET /point-categories/grouped-tree
 */
export interface PointCategoryGroupedTree {
  id: number
  name: string
  note: string | null
  maximum: number
  dateApply?: string
  level: number
  parentCategoryId: number | null
  isActive: boolean
  childrenOrder: number
  isMaxChild?: boolean
  items: PointCategoryFlattenedItem[]
}

export interface StudentSemesterPoint {
  id: number
  userId: number
  semesterId: number
  pointCategoryId: number
  totalPoint: number
  finalizedAt: string | null
}

export interface PointTransaction {
  id: number
  userId: number
  semesterId: number
  pointCategoryId: number
  eventId: number | null
  eventDate?: string | null
  eventName?: string
  points: number
  type: 'EVENT' | 'MANUAL' | 'SYSTEM'
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'REJECTED' | 'REVOKED'
  description: string
  createdAt: string
}

export interface AcademicYear {
  id: number
  code: string
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export interface Semester {
  id: number
  number: number
  academicYear?: string
  academicYearId?: number
  startDate?: string
  endDate?: string
  status?: string
}

export interface SaveSelfEvaluationPayload {
  semesterId: number
  pointCategoryId: number
  points: number
  description?: string
}

export interface StudentSemesterPointSummary {
  semesterId: number
  totalPoint: number
  maximum: number
  classificationLabel: string
  nextClassificationLabel: string | null
  pointsNeeded: number
  activitiesCount: number
}
