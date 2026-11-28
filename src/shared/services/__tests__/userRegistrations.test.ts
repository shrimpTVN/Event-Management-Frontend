import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import {
  fetchUserRegistrationMap,
  normalizeUserRegistrationMap,
} from '../userRegistrations'

vi.mock('@/shared', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const get = vi.mocked(apiClient.get)

describe('userRegistrations shared source', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads all pages beyond 100 registrations so later-page events remain marked registered', async () => {
    get.mockImplementation(async (url: string, config?: any) => {
      if (url === '/registrations/me/history') {
        const page = config?.params?.page ?? 0
        if (page === 0) {
          return {
            content: Array.from({ length: 100 }, (_, i) => ({
              eventId: i + 1,
              status: 'COMPLETED',
              regDate: '2026-10-01T00:00:00Z',
            })),
            totalPages: 2,
          } as any
        }
        return {
          content: [{ eventId: 101, status: 'REGISTERED', regDate: '2026-11-01T00:00:00Z' }],
          totalPages: 2,
        } as any
      }
      if (url === '/registrations/me/upcoming') {
        return [] as any
      }
      return [] as any
    })

    const map = await fetchUserRegistrationMap(true)
    expect(map['1']).toBe('COMPLETED')
    expect(map['101']).toBe('REGISTERED')
    expect(
      get.mock.calls.filter(([url]) => url === '/registrations/me/history')
    ).toHaveLength(2)
  })

  it('rejects instead of falsely returning unregistered when one registration endpoint fails', async () => {
    get.mockImplementation(async (url: string) => {
      if (url === '/registrations/me/history') {
        throw new Error('500')
      }
      return [{ eventId: 5, status: 'REGISTERED' }] as any
    })

    await expect(fetchUserRegistrationMap(true)).rejects.toThrow('500')
  })

  it('deduplicates across history and upcoming using latest status priority', () => {
    const map = normalizeUserRegistrationMap(
      [
        { eventId: 10, status: 'REGISTERED', updatedAt: '2026-10-01T08:00:00Z' },
        { eventId: 10, status: 'CANCELLED', updatedAt: '2026-10-02T08:00:00Z' },
        { eventId: 20, status: 'CANCELLED', updatedAt: '2026-10-01T08:00:00Z' },
      ],
      [{ eventId: 20, status: 'REGISTERED', updatedAt: '2026-10-03T08:00:00Z' }]
    )
    expect(map['10']).toBeUndefined()
    expect(map['20']).toBe('REGISTERED')
  })
})
