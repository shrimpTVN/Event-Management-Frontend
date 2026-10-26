import { apiClient } from '@/shared'
import type {
  AcademicYearOption,
  StudentCriteriaProgressResponse,
  ManualCriteriaProgressRequest,
} from '../types/sv5t.types'

export const sv5tService = {
  /**
   * Lấy danh sách các năm học
   */
  async getAcademicYears(): Promise<AcademicYearOption[]> {
    const res = await apiClient.get<unknown, AcademicYearOption[]>('/academic-years')
    return Array.isArray(res) ? res : []
  },

  /**
   * Lấy cây tiến độ tiêu chuẩn Sinh viên 5 tốt của sinh viên theo năm học
   */
  async getStudentCriteriaProgress(academicYearId?: number): Promise<StudentCriteriaProgressResponse> {
    const params = academicYearId ? { academicYearId } : undefined
    const res = await apiClient.get<unknown, StudentCriteriaProgressResponse>('/student/criteria-progress', { params })
    return res
  },

  /**
   * Cập nhật trạng thái tự đánh giá và minh chứng tiêu chí con của sinh viên
   */
  async toggleManualCriteriaProgress(
    criteriaId: number,
    payload: ManualCriteriaProgressRequest
  ): Promise<void> {
    await apiClient.patch(`/student/criteria/${criteriaId}/progress`, payload)
  },
}
