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

  it('preserves root level and accumulated counts from the progress API', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      academicYearId: 7,
      criterias: [
        {
          id: 1,
          level: 0,
          children: [
            {
              id: 20,
              level: 2,
              isCompleted: false,
              requiredOccurrences: 2,
              recordedOccurrences: 1,
            },
          ],
        },
      ],
    })
    const result = await sv5tService.getStudentCriteriaProgress(7)
    expect(result.criteria[0].level).toBe(0)
    expect(result.criteria[0].children[0]).toMatchObject({
      criteriaId: 20,
      requiredOccurrences: 2,
      recordedOccurrences: 1,
      isCompleted: false,
    })
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

    expect(apiClient.get).toHaveBeenCalledWith(
      '/criteria-transactions/me/criterias/12/academic-years/2'
    )
    expect(apiClient.delete).toHaveBeenCalledWith('/criteria-transactions/me/101')
    expect(apiClient.delete).not.toHaveBeenCalledWith('/criteria-transactions/me/102')
  })
})

it('loads all records for the selected academic year and preserves both distinct events', async () => {
  vi.mocked(apiClient.get).mockResolvedValue([
    { id: 1, criteriaId: 20, eventId: 51 },
    { id: 2, criteriaId: 20, eventId: 52 },
  ])
  expect(await sv5tService.getAllCriteriaTransactions(7)).toHaveLength(2)
  expect(apiClient.get).toHaveBeenLastCalledWith('/criteria-transactions/me/academic-years/7')
})
it('propagates transaction request failures instead of silently returning empty records', async () => {
  vi.mocked(apiClient.get).mockRejectedValue(new Error('Unavailable'))
  await expect(sv5tService.getAllCriteriaTransactions(7)).rejects.toThrow('Unavailable')
  await expect(sv5tService.getCriteriaTransactions(20, 7)).rejects.toThrow('Unavailable')
})

it('uses supported per-criterion history when the year endpoint is missing', async () => {
  vi.mocked(apiClient.get).mockReset()
  vi.mocked(apiClient.get).mockImplementation(async (url) => {
    if (url === '/criteria-transactions/me/academic-years/7') throw { response: { status: 404 } }
    if (url === '/criteria-progress/me/academic-years/7')
      return {
        criterias: [{ id: 40, children: [{ id: 402 }, { criteriaId: 403 }] }],
      }
    if (url === '/criteria-transactions/me/criterias/402/academic-years/7')
      return [
        { id: 1, eventId: 51 },
        { id: 2, eventId: 52 },
        { id: 3, isActive: false },
      ]
    if (url === '/criteria-transactions/me/criterias/403/academic-years/7')
      return [{ id: 4, criteriaId: 403, completionSource: 'MANUAL' }]
    throw new Error(`Unexpected URL: ${url}`)
  })
  expect(await sv5tService.getAllCriteriaTransactions(7)).toEqual([
    { id: 1, eventId: 51, criteriaId: 402 },
    { id: 2, eventId: 52, criteriaId: 402 },
    { id: 4, criteriaId: 403, completionSource: 'MANUAL' },
  ])
})

it('does not conceal a failed per-criterion history request', async () => {
  vi.mocked(apiClient.get).mockReset()
  vi.mocked(apiClient.get)
    .mockRejectedValueOnce({ response: { status: 404 } })
    .mockResolvedValueOnce({ criteria: [{ criteriaId: 402 }] })
    .mockRejectedValueOnce(new Error('History unavailable'))
  await expect(sv5tService.getAllCriteriaTransactions(7)).rejects.toThrow('History unavailable')
})
