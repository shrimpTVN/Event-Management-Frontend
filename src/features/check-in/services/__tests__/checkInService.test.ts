import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { checkInService } from '../checkInService'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), patch: vi.fn() } }))
vi.mock('@/shared/services/mediaService', () => ({ mediaService: { uploadImage: vi.fn() } }))
beforeEach(() => vi.clearAllMocks())
describe('self attendance event list', () => {
  it('reads the BE flag from eventInfo and keeps self-checked-in students eligible for checkout', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) =>
      url.includes('upcoming')
        ? ([
            {
              eventId: 1,
              status: 'REGISTERED',
              eventInfo: { id: 1, name: 'Manual', allowSelfCheck: false },
            },
            {
              eventId: 2,
              status: 'REGISTERED',
              eventInfo: { id: 2, name: 'Self', allowSelfCheck: true },
            },
          ] as any)
        : ({
            content: [
              {
                eventId: 2,
                status: 'SELF_CHECKED_IN',
                checkInAt: '2026-11-17T01:00:00Z',
                eventInfo: { id: 2, name: 'Self', allowSelfCheck: true },
              },
              {
                eventId: 3,
                status: 'SPENDING_CONFIRM',
                eventInfo: { id: 3, allowSelfCheck: true },
              },
            ],
          } as any)
    )
    const events = await checkInService.getActiveRegisteredEvents()
    expect(events).toHaveLength(2)
    expect(events.find((item) => item.eventId === 1)).toMatchObject({
      allowSelfCheck: false,
      eventName: 'Manual',
    })
    expect(events.find((item) => item.eventId === 2)).toMatchObject({
      allowSelfCheck: true,
      status: 'SELF_CHECKED_IN',
    })
  })
  it('does not present a request failure as an empty event list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Unavailable'))
    await expect(checkInService.getActiveRegisteredEvents()).rejects.toThrow()
  })
})
