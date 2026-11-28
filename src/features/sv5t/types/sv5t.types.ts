export interface CriteriaProgressNode {
  criteriaId: number
  isLeaf?: boolean
  isSystemCompleted?: boolean
  completionPercentage?: number
  manualTransactionId?: number | null
  name: string
  note?: string | null
  scope: string // 'UNIVERSITY' | 'FACULTY'
  level: number
  childrenOrder: number
  requiredChildren?: number | null
  requiredOccurrences?: number
  recordedOccurrences?: number
  isCompleted: boolean
  completedChildren: number
  totalChildren: number
  completionSource?: 'MANUAL' | 'EVENT_CHECKOUT' | 'SYSTEM' | null
  completedAt?: string | null
  isSystemRecorded?: boolean
  isSelfEvaluated?: boolean
  systemEventName?: string | null
  selfEvaluationNote?: string | null
  children: CriteriaProgressNode[]
}

export interface StudentCriteriaProgressResponse {
  academicYearId: number
  academicYear: string
  scope?: string
  completionPercentage?: number
  isEligible?: boolean
  completedLeafCriteria: number
  totalLeafCriteria: number
  completedMainCriteria: number
  totalMainCriteria: number
  criteria: CriteriaProgressNode[]
}

export interface ManualCriteriaProgressRequest {
  transactionId?: number
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

export interface CriteriaTransaction {
  id: number | string
  criteriaId?: number
  academicYearId?: number
  eventId?: number | string | null
  eventName?: string | null
  eventDate?: string | null
  completionSource?: string | null
  note?: string | null
  isActive?: boolean
  createdAt?: string | null
}
