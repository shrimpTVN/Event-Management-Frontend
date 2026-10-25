import { apiClient } from '@/shared'
import type {
  AcademicYear,
  Semester,
  PointCategory,
  PointCategoryNode,
  StudentSemesterPoint,
  PointTransaction,
  SaveSelfEvaluationPayload,
} from '../types/trainingPoints.types'

export const trainingPointsService = {
  /**
   * Lấy danh sách tất cả năm học đang hoạt động
   */
  async getAcademicYears(): Promise<AcademicYear[]> {
    const res = await apiClient.get<unknown, AcademicYear[]>('/academic-years')
    return Array.isArray(res) ? res : []
  },

  /**
   * Lấy danh sách học kỳ
   */
  async getSemesters(): Promise<Semester[]> {
    const res = await apiClient.get<unknown, Semester[]>('/semesters')
    return Array.isArray(res) ? res : []
  },

  /**
   * Lấy danh mục và tiêu chí điểm rèn luyện
   */
  async getPointCategories(): Promise<PointCategory[]> {
    const res = await apiClient.get<unknown, PointCategory[]>('/point-categories')
    return Array.isArray(res) ? res : []
  },

  /**
   * Lấy tổng kết điểm rèn luyện của sinh viên theo các mục lớn trong học kỳ
   */
  async getStudentSemesterPoints(semesterId: number): Promise<StudentSemesterPoint[]> {
    const res = await apiClient.get<unknown, StudentSemesterPoint[]>(
      `/student-semester-points/me/semesters/${semesterId}`
    )
    return Array.isArray(res) ? res : []
  },

  /**
   * Lấy danh sách các giao dịch / điểm ghi nhận của sinh viên trong học kỳ
   */
  async getPointTransactions(semesterId: number): Promise<PointTransaction[]> {
    const res = await apiClient.get<unknown, PointTransaction[]>(
      `/point-transactions/me/semesters/${semesterId}`
    )
    return Array.isArray(res) ? res : []
  },

  /**
   * Lưu điểm sinh viên tự đánh giá
   */
  async saveSelfEvaluation(payload: SaveSelfEvaluationPayload): Promise<void> {
    await apiClient.post('/point-transactions/me', payload)
  },
}

/**
 * Hàm tiện ích biến đổi danh sách phẳng PointCategory thành cấu trúc cây phân cấp
 */
export function buildPointCategoryTree(categories: PointCategory[]): PointCategoryNode[] {
  const map = new Map<number, PointCategoryNode>()
  const roots: PointCategoryNode[] = []

  // Khởi tạo map
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  // Liên kết cha - con theo parentCategoryId
  categories.forEach((cat) => {
    const node = map.get(cat.id)!
    if (cat.parentCategoryId && map.has(cat.parentCategoryId)) {
      map.get(cat.parentCategoryId)!.children!.push(node)
    } else if (cat.level === 0 || !cat.parentCategoryId) {
      roots.push(node)
    }
  })

  // Sắp xếp các node theo thứ tự childrenOrder
  const sortTree = (nodes: PointCategoryNode[]) => {
    nodes.sort((a, b) => a.childrenOrder - b.childrenOrder)
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        sortTree(n.children)
      }
    })
  }

  sortTree(roots)
  return roots
}
