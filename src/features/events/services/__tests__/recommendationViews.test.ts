import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { eventService } from '../eventService'
import {
  flushPendingEventViews,
  getPendingEventViewBatch,
  queueRecommendedEventViews,
} from '../../utils/recommendationViewQueue'

describe('recommendation views service & queue', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('maps item.viewed from GET /events/recommendations into isViewed', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/fanpages?size=100') return [] as any
      if (url === '/events/recommendations') {
        return {
          content: [
            {
              event: { id: 42, name: 'Sự kiện chưa xem', status: 'PUBLISHED' },
              explain: 'Bổ sung 3 điểm rèn luyện',
              viewed: false,
              effectiveScore: 80,
              fulfillsCriteria: false,
            },
            {
              event: { id: 57, name: 'Sự kiện đã xem', status: 'PUBLISHED' },
              explain: 'Phù hợp tiêu chí Đạo đức tốt',
              viewed: true,
              effectiveScore: 70,
              fulfillsCriteria: true,
            },
          ],
        } as any
      }
      return [] as any
    })

    const list = await eventService.getRecommendations({ page: 0, size: 10 })
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ id: '42', isRecommended: true, isViewed: false })
    expect(list[1]).toMatchObject({ id: '57', isRecommended: true, isViewed: true })
  })

  it('posts deduplicated positive IDs with batchId to POST /events/views and skips empty', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined as any)

    await eventService.recordEventViews({ batchId: 'batch-1', eventIds: [0, -5] })
    expect(post).not.toHaveBeenCalled()

    await eventService.recordEventViews({
      batchId: 'batch-1',
      eventIds: [42, 57, 42, -1],
    })
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/events/views', {
      batchId: 'batch-1',
      eventIds: [42, 57],
    })
  })

  it('preserves exact batchId across failed flush retries and clears after acknowledgment', async () => {
    const first = queueRecommendedEventViews('student-1', ['42', 57, '42'])
    expect(first).not.toBeNull()
    expect(first!.eventIds).toEqual([42, 57])
    expect(first!.batchId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )

    const sender = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined)

    const failed = await flushPendingEventViews('student-1', sender)
    expect(failed).toEqual({ ok: false, sentCount: 0 })
    expect(getPendingEventViewBatch('student-1')).toEqual(first)

    const retried = await flushPendingEventViews('student-1', sender)
    expect(retried).toEqual({ ok: true, sentCount: 2 })
    expect(sender).toHaveBeenCalledTimes(2)
    expect(sender.mock.calls[0][0]).toEqual(first)
    expect(sender.mock.calls[1][0]).toEqual(first)
    expect(getPendingEventViewBatch('student-1')).toBeNull()
  })

  it('retains IDs queued mid-flight under a new batchId after previous batch succeeds', async () => {
    const initial = queueRecommendedEventViews('student-2', [10])!
    let resolvePost!: () => void
    const sender = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePost = resolve
        })
    )

    const flushing = flushPendingEventViews('student-2', sender)
    queueRecommendedEventViews('student-2', [20])
    resolvePost()

    expect(await flushing).toEqual({ ok: true, sentCount: 1 })
    const remaining = getPendingEventViewBatch('student-2')
    expect(remaining).not.toBeNull()
    expect(remaining!.eventIds).toEqual([20])
    expect(remaining!.batchId).not.toBe(initial.batchId)
  })
})
