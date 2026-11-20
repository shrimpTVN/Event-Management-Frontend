import { beforeEach, describe, expect, it, vi } from 'vitest'
import { historyService, normalizeRegisteredEvent } from '../historyService'
import { apiClient } from '@/shared'

vi.mock('@/shared', () => ({ apiClient: { get: vi.fn() } }))
const get = vi.mocked(apiClient.get)
beforeEach(() => vi.clearAllMocks())

describe('history fanpage avatars', () => {
  it('resolves real fanpage IDs and fetches each missing fanpage only once', async () => {
    get.mockImplementation(async (url) => {
      if (url === '/registrations/me/history')
        return [
          { eventInfo: { id: 10, fanpageId: 7, fanpageName: 'Đoàn trường' } },
          { eventInfo: { id: 11, fanpageId: 7, fanpageName: 'Đoàn trường' } },
          { eventInfo: { id: 12, fanpageId: 8, fanpageName: 'Câu lạc bộ' } },
        ] as any
      if (url === '/fanpages/7') return { id: 7, avatarUrl: '/fanpage-7.png' } as any
      if (url === '/fanpages/8') return { data: { id: 8, avatarUrl: '/fanpage-8.png' } } as any
      return [] as any
    })
    const events = await historyService.getMyHistory()
    expect(events.map((event) => event.organizer?.avatarUrl)).toEqual([
      '/fanpage-7.png',
      '/fanpage-7.png',
      '/fanpage-8.png',
    ])
    expect(get.mock.calls.filter(([url]) => url === '/fanpages/7')).toHaveLength(1)
    expect(get.mock.calls.filter(([url]) => url === '/fanpages/8')).toHaveLength(1)
  })
  it('keeps an avatar supplied by the registration API without another fetch', async () => {
    get.mockImplementation(async (url) =>
      url === '/registrations/me/history'
        ? ([{ eventInfo: { id: 10, fanpageId: 7, fanpageAvatarUrl: '/actual.png' } }] as any)
        : ([] as any)
    )
    const [event] = await historyService.getMyHistory()
    expect(event.organizer?.avatarUrl).toBe('/actual.png')
    expect(get.mock.calls.some(([url]) => String(url).startsWith('/fanpages/'))).toBe(false)
  })
  it('keeps history when the fanpage request fails and does not invent an avatar', async () => {
    get.mockImplementation(async (url) => {
      if (url === '/fanpages/7') throw new Error('Unavailable')
      return url === '/registrations/me/history'
        ? ([{ eventInfo: { id: 10, fanpageId: 7, fanpageName: 'Đoàn CNTT' } }] as any)
        : ([] as any)
    })
    const events = await historyService.getMyHistory()
    expect(events).toHaveLength(1)
    expect(events[0].organizer).toMatchObject({ name: 'Đoàn CNTT', avatarUrl: undefined })
    expect(
      normalizeRegisteredEvent({ eventInfo: { fanpageName: 'Đoàn CNTT' } }).organizer?.avatarUrl
    ).toBeUndefined()
  })
  it('ignores a fanpage response belonging to another ID', async () => {
    get.mockImplementation(async (url) => {
      if (url === '/fanpages/7') return { id: 8, avatarUrl: '/wrong.png' } as any
      return url === '/registrations/me/history'
        ? ([{ eventInfo: { id: 10, fanpageId: 7 } }] as any)
        : ([] as any)
    })
    expect((await historyService.getMyHistory())[0].organizer?.avatarUrl).toBeUndefined()
  })
})
