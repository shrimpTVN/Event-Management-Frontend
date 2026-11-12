import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sv5tService } from '../sv5tService'
import { apiClient } from '@/shared'

vi.mock('@/shared', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('sv5tService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes criteria transaction via DELETE /criteria-transactions/me/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})

    await sv5tService.deleteCriteriaTransaction(88)

    expect(apiClient.delete).toHaveBeenCalledWith('/criteria-transactions/me/88')
  })

  it('posts manual criteria progress via POST /criteria-transactions/me', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({})

    await sv5tService.toggleManualCriteriaProgress(12, {
      academicYearId: 2,
      completed: true,
      note: 'Đạt giải NCKH',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/criteria-transactions/me', {
      academicYearId: 2,
      criteriaId: 12,
      note: 'Đạt giải NCKH',
    })
  })

  it('deletes manual transactions when student sets completed: false to uncomplete criterion', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { id: 101, criteriaId: 12, completionSource: 'MANUAL' },
      { id: 102, criteriaId: 12, completionSource: 'EVENT_CHECKOUT' },
    ])
    vi.mocked(apiClient.delete).mockResolvedValue({})

    await sv5tService.toggleManualCriteriaProgress(12, {
      academicYearId: 2,
      completed: false,
    })

    expect(apiClient.get).toHaveBeenCalledWith('/criteria-transactions/me/criterias/12/academic-years/2')
    expect(apiClient.delete).toHaveBeenCalledWith('/criteria-transactions/me/101')
    expect(apiClient.delete).not.toHaveBeenCalledWith('/criteria-transactions/me/102')
  })
})

