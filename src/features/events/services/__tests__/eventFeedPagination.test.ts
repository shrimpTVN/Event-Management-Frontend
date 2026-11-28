import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { eventService, normalizeEvent } from '../eventService'

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
  it('preserves authentic backend fanpageName and loads real fanpage metadata in getEventById', async () => {
    const rawEvent = {
      id: 3,
      name: 'Chiến dịch Chủ nhật Xanh',
      fanpageId: 4,
      fanpageName: 'Đội Công tác Xã hội - Đại học Cần Thơ',
      isFollowFanpage: true,
    }
    expect(normalizeEvent(rawEvent)).toMatchObject({
      organizerId: '4',
      organizerName: 'Đội Công tác Xã hội - Đại học Cần Thơ',
      fanpageName: 'Đội Công tác Xã hội - Đại học Cần Thơ',
      isFollowed: true,
    })

    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/events/3') return rawEvent as any
      if (url === '/fanpages?size=100')
        return {
          content: [
            {
              id: 4,
              name: 'Đội Công tác Xã hội - Đại học Cần Thơ',
              orgName: 'Đội Công tác Xã hội - Đại học Cần Thơ',
              avatarUrl: 'https://example.com/ctxh.jpg',
            },
          ],
        } as any
      return [] as any
    })
    const detail = await eventService.getEventById(3)
    expect(detail).toMatchObject({
      organizerId: '4',
      organizerName: 'Đội Công tác Xã hội - Đại học Cần Thơ',
      organizerAvatarUrl: 'https://example.com/ctxh.jpg',
      isFollowed: true,
    })
  })

  it('rejects when all 3 status requests fail (0/3) and flags partialError when 1/3 succeeds', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/fanpages?size=100') return [] as any
      return Promise.reject(new Error('500'))
    })
    await expect(eventService.getEvents()).rejects.toThrow()

    vi.restoreAllMocks()
    vi.spyOn(apiClient, 'get').mockImplementation(async (url, config: any) => {
      if (url === '/fanpages?size=100') return [] as any
      if (config?.params?.status === 'PUBLISHED') {
        return { content: [{ id: 9, name: 'Chỉ published thành công', status: 'PUBLISHED' }], totalPages: 1 } as any
      }
      return Promise.reject(new Error('503'))
    })

    const partial = await eventService.getEventsWithStatus()
    expect(partial.partialError).toBe(true)
    expect(partial.failedStatuses).toEqual(['COMPLETED', 'CLOSED'])
    expect(partial.events.map((e) => e.id)).toEqual(['9'])
  })
})
