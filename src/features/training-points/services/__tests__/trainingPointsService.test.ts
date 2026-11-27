import { describe, it, expect, vi, beforeEach } from 'vitest'
import { trainingPointsService } from '../trainingPointsService'
import { apiClient } from '@/shared'

vi.mock('@/shared', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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
    mockTree.forEach((node) =>
      Object.assign(node, {
        isAtMaximum: false,
        completionPercentage: 90,
        contributesToParent: true,
      })
    )
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

  it('preserves raw server totals for both page and sidebar', async () => {
    const raw = [
      {
        id: 5,
        maximum: 20,
        totalPoint: 24,
        systemPointRecord: 19,
        manualPointRecord: 5,
        items: [
          { id: 51, maximum: 12, totalPoint: 22, systemPointRecord: 19, manualPointRecord: 3 },
        ],
      },
      {
        id: 1,
        maximum: 20,
        totalPoint: 4,
        systemPointRecord: 4,
        manualPointRecord: 0,
        items: [],
      },
    ]
    raw.forEach((node) => {
      Object.assign(node, {
        isAtMaximum: false,
        completionPercentage: 0,
        contributesToParent: true,
      })
      node.items.forEach((item) =>
        Object.assign(item, {
          isAtMaximum: false,
          completionPercentage: 0,
          contributesToParent: true,
        })
      )
    })
    vi.mocked(apiClient.get).mockResolvedValue(raw)
    const result = await trainingPointsService.getSemesterPointGroupedTree(1)
    expect(result[0].totalPoint).toBe(24)
    expect(result[0].items[0]).toMatchObject({
      totalPoint: 22,
      systemPointRecord: 19,
      manualPointRecord: 3,
    })
    expect(result.reduce((sum, section) => sum + section.totalPoint, 0)).toBe(28)
    expect(raw[0].totalPoint).toBe(24)
    expect(raw[0].items[0].totalPoint).toBe(22)
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})

describe('evidence API errors', () => {
  it('propagates a failed request so the modal can offer retry', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('offline'))
    await expect(trainingPointsService.getPointTransactionsByCategory(2, 10)).rejects.toThrow(
      'offline'
    )
  })
})

it('patches the selected manual transaction instead of adding another', async () => {
  vi.mocked(apiClient.patch).mockResolvedValue({})
  await trainingPointsService.updatePointTransaction(42, 5, 'edited')
  expect(apiClient.patch).toHaveBeenCalledWith('/point-transactions/me/42', {
    points: 5,
    description: 'edited',
  })
})
it('rejects an incomplete tree contract', async () => {
  vi.mocked(apiClient.get).mockResolvedValue([{ maximum: 10, totalPoint: 5, items: [] }])
  await expect(trainingPointsService.getSemesterPointGroupedTree(9)).rejects.toThrow()
})
