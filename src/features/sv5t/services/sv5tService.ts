import { apiClient } from '@/shared'
import type {
  AcademicYearOption,
  StudentCriteriaProgressResponse,
  ManualCriteriaProgressRequest,
  CriteriaProgressNode,
} from '../types/sv5t.types'

function normalizeCriteriaNode(node: any): CriteriaProgressNode {
  const criteriaId = Number(node.criteriaId ?? node.id ?? 0)
  const children = Array.isArray(node.children) ? node.children.map(normalizeCriteriaNode) : []
  return {
    ...node,
    criteriaId,
    name: node.name || '',
    note: node.note ?? null,
    scope: node.scope || 'UNIVERSITY',
    level: Number(node.level || 1),
    childrenOrder: Number(node.childrenOrder || 1),
    requiredChildren: node.requiredChildren ?? null,
    isCompleted: Boolean(node.isCompleted),
    completedChildren: Number(node.completedChildren ?? node.completedChildrenCount ?? 0),
    totalChildren: Number(node.totalChildren ?? children.length),
    completionSource: node.completionSource ?? null,
    completedAt: node.completedAt ?? null,
    children,
  }
}

export const sv5tService = {
  /**
   * Lấy danh sách các năm học
   */
  async getAcademicYears(): Promise<AcademicYearOption[]> {
    try {
      const res = await apiClient.get<unknown, AcademicYearOption[]>('/academic-years')
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  },

  /**
   * Lấy cây tiến độ tiêu chuẩn Sinh viên 5 tốt của sinh viên theo năm học
   */
  async getStudentCriteriaProgress(academicYearId?: number): Promise<StudentCriteriaProgressResponse> {
    try {
      if (academicYearId) {
        // Backend endpoint: /criteria-progress/me/academic-years/{academicYearId}
        const res = await apiClient.get<unknown, any>(`/criteria-progress/me/academic-years/${academicYearId}`)
        if (res) {
          const rawCriteria = res.criteria || res.criterias || []
          const normalizedCriteria: CriteriaProgressNode[] = Array.isArray(rawCriteria)
            ? rawCriteria.map(normalizeCriteriaNode)
            : []
          return {
            academicYearId: Number(res.academicYearId || academicYearId),
            academicYear: res.academicYear || '',
            completedLeafCriteria: Number(res.completedLeafCriteria || 0),
            totalLeafCriteria: Number(res.totalLeafCriteria || 0),
            completedMainCriteria: Number(res.completedMainCriteria || 0),
            totalMainCriteria: Number(res.totalMainCriteria || 0),
            criteria: normalizedCriteria,
          }
        }
      }
    } catch {
      // Graceful fallback for new students with no progress records yet
    }
    return {
      academicYearId: academicYearId || 0,
      academicYear: '',
      completedLeafCriteria: 0,
      totalLeafCriteria: 0,
      completedMainCriteria: 0,
      totalMainCriteria: 0,
      criteria: [],
    }
  },

  /**
   * Cập nhật trạng thái tự đánh giá và minh chứng tiêu chí con của sinh viên
   * Backend endpoint: POST /criteria-transactions/me
   */
  async toggleManualCriteriaProgress(
    criteriaId: number,
    payload: ManualCriteriaProgressRequest
  ): Promise<void> {
    const targetYearId = payload.academicYearId && payload.academicYearId > 0 ? payload.academicYearId : 2
    const resolvedNote =
      payload.note && payload.note.trim().length > 0
        ? payload.note.trim()
        : payload.completed
        ? 'Sinh viên tự đánh giá đạt tiêu chuẩn'
        : 'Sinh viên tự đánh giá chưa đạt'
    await apiClient.post(`/criteria-transactions/me`, {
      academicYearId: targetYearId,
      criteriaId,
      note: resolvedNote,
    })
  },

  /**
   * Lấy lịch sử giao dịch / ghi nhận của 1 tiêu chí SV5T
   * Backend endpoint: GET /criteria-transactions/me/criterias/{criteriaId}/academic-years/{academicYearId}
   */
  async getCriteriaTransactions(
    criteriaId: number,
    academicYearId: number
  ): Promise<any[]> {
    try {
      const res: any = await apiClient.get(
        `/criteria-transactions/me/criterias/${criteriaId}/academic-years/${academicYearId}`
      )
      return Array.isArray(res) ? res : res?.data || []
    } catch {
      return []
    }
  },

  /**
   * Lấy toàn bộ giao dịch / minh chứng tiêu chí SV5T của sinh viên trong năm học
   * Backend endpoint: GET /criteria-transactions/me/academic-years/{academicYearId}
   */
  async getAllCriteriaTransactions(academicYearId: number): Promise<any[]> {
    try {
      const res: any = await apiClient.get(
        `/criteria-transactions/me/academic-years/${academicYearId}`
      )
      return Array.isArray(res) ? res : res?.data || []
    } catch {
      return []
    }
  },

  /**
   * Xóa giao dịch / bản ghi sinh viên tự đánh giá tiêu chí SV5T
   * Backend endpoint: DELETE /criteria-transactions/me/{criteriaTransactionId}
   */
  async deleteCriteriaTransaction(criteriaTransactionId: number | string): Promise<void> {
    await apiClient.delete(`/criteria-transactions/me/${criteriaTransactionId}`)
  },
}
