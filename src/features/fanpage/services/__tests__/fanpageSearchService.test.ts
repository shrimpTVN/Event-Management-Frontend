import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { fanpageSearchService } from '../fanpageSearchService'

vi.mock('@/shared', () => ({ apiClient: { get: vi.fn() } }))
beforeEach(() => vi.clearAllMocks())

describe('fanpage search pagination', () => {
  it('loads every page before filtering and normalizes response envelopes', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { content: [{ id: 1, orgName: 'CLB AI' }], totalPages: 2 } })
      .mockResolvedValueOnce({ content: [{ id: 2, name: 'Đoàn AI' }], totalPages: 2 })
    const results = await fanpageSearchService.search('AI')
    expect(results.map((item) => item.name)).toEqual(['CLB AI', 'Đoàn AI'])
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/fanpages', {
      params: { keyword: 'AI', size: 100, page: 1 },
    })
  })

  it('only requests the first three matches for autocomplete', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ content: [{ id: 1, name: 'AI' }], last: false })
    await fanpageSearchService.search('AI', 3)
    expect(apiClient.get).toHaveBeenCalledTimes(1)
    expect(apiClient.get).toHaveBeenCalledWith('/fanpages', {
      params: { keyword: 'AI', size: 3, page: 0 },
    })
  })

  it('loads following state past the first page', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ content: [{ id: 1 }], last: false })
      .mockResolvedValueOnce({ content: [{ id: 2 }], last: true })
    expect((await fanpageSearchService.following()).map((item) => item.id)).toEqual(['1', '2'])
  })

  it('propagates network errors to the retry UI', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('offline'))
    await expect(fanpageSearchService.search('AI')).rejects.toThrow('offline')
  })
})
