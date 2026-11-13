export interface PointCategory {
  id: number
  name: string
  note: string | null
  maximum: number
  dateApply?: string
  level: number
  childrenOrder: number
  parentCategoryId: number | null
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
  eventName?: string
  points: number
  type: 'EVENT' | 'MANUAL' | 'SYSTEM'
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'REJECTED'
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

/**
 * Xếp loại điểm rèn luyện theo quy chế ĐH Cần Thơ:
 * - Xuất sắc: 90 - 100
 * - Tốt: 80 - 89
 * - Khá: 65 - 79
 * - Trung bình: 50 - 64
 * - Yếu: 35 - 49
 * - Kém: < 35
 */
export function classifyScore(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Xuất sắc', color: 'text-emerald-600' }
  if (score >= 80) return { label: 'Tốt', color: 'text-blue-600' }
  if (score >= 65) return { label: 'Trung Bình', color: 'text-amber-600' } // Trong Figma thiết kế hiển thị Trung Bình cho 65 điểm
  if (score >= 50) return { label: 'Trung Bình', color: 'text-amber-600' }
  if (score >= 35) return { label: 'Yếu', color: 'text-orange-600' }
  return { label: 'Kém', color: 'text-rose-600' }
}
