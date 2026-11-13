import { apiClient } from '@/shared'
import type {
  AcademicYear,
  Semester,
  PointCategory,
  PointCategoryNode,
  StudentSemesterPoint,
  PointTransaction,
  SaveSelfEvaluationPayload,
  StudentSemesterPointGroupedTree,
  PointCategoryGroupedTree,
} from '../types/trainingPoints.types'

export const trainingPointsService = {
  /**
   * [API MỚI] Lấy toàn bộ cây điểm rèn luyện gom nhóm sẵn theo học kỳ
   * Endpoint: GET /student-semester-points/grouped-tree/{semesterId}
   */
  async getSemesterPointGroupedTree(
    semesterId: number
  ): Promise<StudentSemesterPointGroupedTree[]> {
    try {
      const res = await apiClient.get<unknown, StudentSemesterPointGroupedTree[]>(
        `/student-semester-points/grouped-tree/${semesterId}`
      )
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  },

  /**
   * [API MỚI] Lấy danh mục cây điểm rèn luyện chuẩn từ Backend
   * Endpoint: GET /point-categories/grouped-tree
   */
  async getPointCategoriesGroupedTree(): Promise<PointCategoryGroupedTree[]> {
    try {
      const res = await apiClient.get<unknown, PointCategoryGroupedTree[]>(
        `/point-categories/grouped-tree`
      )
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  },
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
   * Lấy danh sách giao dịch điểm cho 1 danh mục cụ thể
   */
  async getPointTransactionsByCategory(
    semesterId: number,
    pointCategoryId: number
  ): Promise<PointTransaction[]> {
    try {
      const res = await apiClient.get<unknown, PointTransaction[]>(
        `/point-transactions/me/semesters/${semesterId}/point-categories/${pointCategoryId}`
      )
      return Array.isArray(res) ? res : []
    } catch {
      return []
    }
  },

  /**
   * Lấy danh sách các giao dịch / điểm ghi nhận của sinh viên trong học kỳ
   */
  async getPointTransactions(semesterId: number, categoryIds?: number[]): Promise<PointTransaction[]> {
    try {
      let targetIds = categoryIds
      if (!targetIds || targetIds.length === 0) {
        const categories = await this.getPointCategories()
        const parentIds = new Set(categories.map((c) => c.parentCategoryId).filter(Boolean))
        targetIds = categories.filter((c) => !parentIds.has(c.id)).map((c) => c.id)
      }
      if (!targetIds || targetIds.length === 0) return []

      const batches = await Promise.all(
        targetIds.map((id) => this.getPointTransactionsByCategory(semesterId, id))
      )
      return batches.flat()
    } catch {
      return []
    }
  },

  /**
   * Lưu điểm sinh viên tự đánh giá
   */
  async saveSelfEvaluation(payload: SaveSelfEvaluationPayload): Promise<void> {
    await apiClient.post('/point-transactions/me', payload)
  },

  /**
   * Xóa bản ghi điểm sinh viên tự đánh giá
   */
  async deletePointTransaction(pointTransactionId: number | string): Promise<void> {
    await apiClient.delete(`/point-transactions/me/${pointTransactionId}`)
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
