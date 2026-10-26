export interface CriteriaProgressNode {
  criteriaId: number
  name: string
  note?: string | null
  scope: string // 'UNIVERSITY' | 'FACULTY'
  level: number
  childrenOrder: number
  requiredChildren?: number | null
  isCompleted: boolean
  completedChildren: number
  totalChildren: number
  completionSource?: 'MANUAL' | 'EVENT_CHECKOUT' | 'SYSTEM' | null
  completedAt?: string | null
  children: CriteriaProgressNode[]
}

export interface StudentCriteriaProgressResponse {
  academicYearId: number
  academicYear: string
  completedLeafCriteria: number
  totalLeafCriteria: number
  completedMainCriteria: number
  totalMainCriteria: number
  criteria: CriteriaProgressNode[]
}

export interface ManualCriteriaProgressRequest {
  academicYearId: number
  completed: boolean
  note?: string
}

export interface AcademicYearOption {
  id: number
  code: string
  isActive: boolean
}

export type EvaluationScope = 'UNIVERSITY' | 'FACULTY'

export interface CriteriaRowItem {
  node: CriteriaProgressNode
  code: string // e.g. "1.1", "1.2", "1.3", "1.3.1"
  isLeaf: boolean
  isGroupBanner?: boolean // For banner row like "1.3: Đạt thêm 01 trong 05 tiêu chí sau:"
}
