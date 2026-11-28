import { apiClient } from '@/shared'
import type {
  AcademicYearOption,
  CriteriaTransaction,
  StudentCriteriaProgressResponse,
  ManualCriteriaProgressRequest,
  CriteriaProgressNode,
  EvaluationScope,
} from '../types/sv5t.types'

function normalizeCriteriaNode(node: any): CriteriaProgressNode {
  if (!node || typeof node.id !== 'number' || !Array.isArray(node.children) ||
      ['isCompleted', 'isLeaf', 'isSystemRecorded', 'isSystemCompleted', 'isSelfEvaluated']
        .some((key) => typeof node[key] !== 'boolean') ||
      ['requiredOccurrences', 'completedOccurrences', 'completedChildrenCount', 'totalChildren', 'completionPercentage']
        .some((key) => typeof node[key] !== 'number' || !Number.isFinite(node[key]))) {
    throw new Error('Dữ liệu tiến độ SV5T không hợp lệ')
  }
  return {
    ...node,
    criteriaId: node.id,
    recordedOccurrences: node.completedOccurrences,
    completedChildren: node.completedChildrenCount,
    children: node.children.map(normalizeCriteriaNode),
  }
}

export const sv5tService = {
  /**
   * Lấy danh sách các năm học
   */
  async getAcademicYears(): Promise<AcademicYearOption[]> {
    const res: any = await apiClient.get<unknown, AcademicYearOption[]>('/academic-years')
    const list = Array.isArray(res) ? res : res?.data || []
    return Array.isArray(list) ? list : []
  },

  /**
   * Lấy cây tiến độ tiêu chuẩn Sinh viên 5 tốt của sinh viên theo năm học
   */
  async getStudentCriteriaProgress(
    academicYearId?: number,
    scope: EvaluationScope = 'UNIVERSITY'
  ): Promise<StudentCriteriaProgressResponse> {
    if (!academicYearId) throw new Error('Vui lòng chọn năm học')
    const backendScope = scope
    const res = await apiClient.get<unknown, any>(
      `/criteria-progress/me/academic-years/${academicYearId}?scope=${backendScope}`
    )
    if (!res || !Array.isArray(res.criterias) || res.scope !== backendScope ||
        typeof res.isEligible !== 'boolean' ||
        ['completedMainCriteria', 'totalMainCriteria', 'completionPercentage']
          .some((key) => typeof res[key] !== 'number' || !Number.isFinite(res[key]))) {
      throw new Error('Dữ liệu tiến độ SV5T không hợp lệ')
    }
    return { ...res, criteria: res.criterias.map(normalizeCriteriaNode) }
  },

  /**
   * Cập nhật trạng thái tự đánh giá và minh chứng tiêu chí con của sinh viên
   * Backend endpoint: POST /criteria-transactions/me hoặc DELETE /criteria-transactions/me/{id}
   */
  async toggleManualCriteriaProgress(
    criteriaId: number,
    payload: ManualCriteriaProgressRequest
  ): Promise<void> {
    const targetYearId = payload.academicYearId
    if (!targetYearId) throw new Error('Vui lòng chọn năm học')
    if (!payload.completed) {
      if (payload.transactionId) await this.deleteCriteriaTransaction(payload.transactionId)
      return
    }
    if (payload.transactionId) {
      await apiClient.patch(`/criteria-transactions/me/${payload.transactionId}`, { note: payload.note ?? '' })
      return
    }

    const resolvedNote =
      payload.note && payload.note.trim().length > 0
        ? payload.note.trim()
        : 'Sinh viên tự đánh giá đạt tiêu chuẩn'

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
  ): Promise<CriteriaTransaction[]> {
    const res: any = await apiClient.get(
      `/criteria-transactions/me/criterias/${criteriaId}/academic-years/${academicYearId}`
    )
    const list = Array.isArray(res) ? res : res?.data
    if (!Array.isArray(list)) throw new Error('Dữ liệu ghi nhận SV5T không hợp lệ')
    return list.filter((t) => t.isActive !== false)
  },

  async getAllCriteriaTransactions(academicYearId: number): Promise<CriteriaTransaction[]> {
    try {
      const res: any = await apiClient.get(
        `/criteria-transactions/me/academic-years/${academicYearId}`
      )
      const list = Array.isArray(res) ? res : res?.data
      if (!Array.isArray(list)) throw new Error('Dữ liệu ghi nhận SV5T không hợp lệ')
      return list.filter((t) => t.isActive !== false)
    } catch (error) {
      // Older BE versions expose history per criterion only. Other failures must
      // remain visible instead of being treated as an empty history.
      if ((error as { response?: { status?: number } })?.response?.status !== 404) throw error
    }

    const progress: any = await apiClient.get(
      `/criteria-progress/me/academic-years/${academicYearId}`
    )
    const roots = progress?.criteria ?? progress?.criterias
    if (!Array.isArray(roots)) throw new Error('Dữ liệu tiêu chí SV5T không hợp lệ')
    const ids = new Set<number>()
    const collect = (node: any) => {
      if (Array.isArray(node.children) && node.children.length) node.children.forEach(collect)
      else {
        const id = Number(node.criteriaId ?? node.id)
        if (Number.isFinite(id) && id > 0) ids.add(id)
      }
    }
    roots.forEach(collect)
    const criteriaIds = [...ids]
    const records: CriteriaTransaction[] = []
    // Bound concurrent requests for mobile connections.
    for (let index = 0; index < criteriaIds.length; index += 4) {
      const batch = await Promise.all(
        criteriaIds.slice(index, index + 4).map(async (id) => {
          const transactions = await this.getCriteriaTransactions(id, academicYearId)
          return transactions.map((transaction) => ({
            ...transaction,
            criteriaId: transaction.criteriaId ?? id,
          }))
        })
      )
      records.push(...batch.flat())
    }
    return records
  },

  /**
   * Xóa giao dịch / bản ghi sinh viên tự đánh giá tiêu chí SV5T
   * Backend endpoint: DELETE /criteria-transactions/me/{criteriaTransactionId}
   */
  async deleteCriteriaTransaction(criteriaTransactionId: number | string): Promise<void> {
    await apiClient.delete(`/criteria-transactions/me/${criteriaTransactionId}`)
  },
}
