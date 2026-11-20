import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { eventService } from '../eventService'

afterEach(() => vi.restoreAllMocks())
describe('complete event feed source', () => {
  it('loads subsequent pages and closed events before applying local filters', async () => {
    const get = vi.spyOn(apiClient, 'get').mockImplementation(async (url, config: any) => {
      if (url === '/fanpages?size=100') return [] as any
      const { status, page } = config.params
      if (status === 'PUBLISHED')
        return {
          content: [{ id: page === 0 ? 1 : 2, name: 'Sự kiện', status: 'PUBLISHED' }],
          totalPages: 2,
        } as any
      if (status === 'CLOSED')
        return {
          content: [{ id: 3, name: 'Đã đóng đăng ký', status: 'CLOSED' }],
          totalPages: 1,
        } as any
      return { content: [], totalPages: 0 } as any
    })
    expect((await eventService.getEvents()).map((event) => event.id)).toEqual(['1', '2', '3'])
    expect(get).toHaveBeenCalledWith(
      '/events',
      expect.objectContaining({ params: expect.objectContaining({ page: 1, status: 'PUBLISHED' }) })
    )
  })
  it('keeps autocomplete requests bounded by their explicit size', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockImplementation(async (url) =>
        url.startsWith('/fanpages')
          ? ([] as any)
          : ({ content: [{ id: Math.random(), name: 'Sự kiện' }], totalPages: 20 } as any)
      )
    expect(await eventService.getEvents({ size: 1 })).toHaveLength(1)
    expect(get.mock.calls.filter(([url]) => url === '/events')).toHaveLength(3)
  })
})
