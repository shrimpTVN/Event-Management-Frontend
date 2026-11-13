import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trainingPointsService } from '../trainingPointsService'
import { apiClient } from '@/shared'

vi.mock('@/shared', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('trainingPointsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes point transaction for student via DELETE /point-transactions/me/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})

    await trainingPointsService.deletePointTransaction(55)

    expect(apiClient.delete).toHaveBeenCalledWith('/point-transactions/me/55')
  })

  it('saves self evaluation via POST /point-transactions/me', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})

    const payload = {
      semesterId: 1,
      pointCategoryId: 10,
      points: 5,
      description: 'Tham gia hoạt động',
    }
    await trainingPointsService.saveSelfEvaluation(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/point-transactions/me', payload)
  })

  it('fetches grouped tree semester points via GET /student-semester-points/grouped-tree/:semesterId', async () => {
    const mockTree = [
      {
        id: 1,
        name: 'I. Ý thức học tập',
        maximum: 20,
        totalPoint: 18,
        items: [],
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValue(mockTree)

    const result = await trainingPointsService.getSemesterPointGroupedTree(2)

    expect(apiClient.get).toHaveBeenCalledWith('/student-semester-points/grouped-tree/2')
    expect(result).toEqual(mockTree)
  })

  it('fetches standard grouped tree categories via GET /point-categories/grouped-tree', async () => {
    const mockCategories = [
      {
        id: 1,
        name: 'I. Ý thức học tập',
        maximum: 20,
        items: [],
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValue(mockCategories)

    const result = await trainingPointsService.getPointCategoriesGroupedTree()

    expect(apiClient.get).toHaveBeenCalledWith('/point-categories/grouped-tree')
    expect(result).toEqual(mockCategories)
  })
})
