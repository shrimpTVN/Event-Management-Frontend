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
})
