import type { ViewedEventsBatchPayload } from '../types/event.types'

const STORAGE_KEY_PREFIX = 'event_recommendation_view_queue_'
const MAX_BATCH_SIZE = 1000

export interface FlushEventViewsResult {
  ok: boolean
  sentCount: number
}

const inFlightFlushes = new Map<string, Promise<FlushEventViewsResult>>()

export function hasInFlightEventViewFlush(userKey: string | null | undefined): boolean {
  return Boolean(userKey && inFlightFlushes.has(userKey))
}

function getQueueKey(userKey: string): string {
  return `${STORAGE_KEY_PREFIX}${userKey}`
}

export function generateViewBatchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function normalizePositiveIds(ids: (number | string)[]): number[] {
  const seen = new Set<number>()
  for (const raw of ids) {
    const parsed = Number(raw)
    if (Number.isInteger(parsed) && parsed > 0) {
      seen.add(parsed)
    }
  }
  return Array.from(seen)
}

export function getPendingEventViewBatch(userKey: string | null | undefined): ViewedEventsBatchPayload | null {
  if (!userKey || typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getQueueKey(userKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ViewedEventsBatchPayload>
    if (!parsed || typeof parsed.batchId !== 'string' || !parsed.batchId) return null
    const eventIds = Array.isArray(parsed.eventIds) ? normalizePositiveIds(parsed.eventIds) : []
    if (eventIds.length === 0) {
      localStorage.removeItem(getQueueKey(userKey))
      return null
    }
    return { batchId: parsed.batchId, eventIds }
  } catch {
    return null
  }
}

function savePendingEventViewBatch(
  userKey: string,
  batch: ViewedEventsBatchPayload | null
): void {
  if (typeof window === 'undefined') return
  try {
    const key = getQueueKey(userKey)
    if (!batch || batch.eventIds.length === 0) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, JSON.stringify(batch))
  } catch {
    /* Storage quota or privacy mode should never break browsing. */
  }
}

/**
 * Adds newly viewed recommended event IDs into the user's pending batch while
 * preserving the existing UUID `batchId` until the backend acknowledges it.
 */
export function queueRecommendedEventViews(
  userKey: string | null | undefined,
  ids: (number | string)[]
): ViewedEventsBatchPayload | null {
  if (!userKey) return null
  const normalized = normalizePositiveIds(ids)
  if (normalized.length === 0) return getPendingEventViewBatch(userKey)

  const current = getPendingEventViewBatch(userKey)
  const mergedIds = current
    ? Array.from(new Set([...current.eventIds, ...normalized]))
    : normalized

  const next: ViewedEventsBatchPayload = {
    batchId: current?.batchId ?? generateViewBatchId(),
    eventIds: mergedIds,
  }
  savePendingEventViewBatch(userKey, next)
  return next
}

function clearSentIdsFromQueue(userKey: string, sentIds: number[]): void {
  const latest = getPendingEventViewBatch(userKey)
  if (!latest) return
  const sentSet = new Set(sentIds)
  const remaining = latest.eventIds.filter((id) => !sentSet.has(id))
  if (remaining.length === 0) {
    savePendingEventViewBatch(userKey, null)
    return
  }
  // Start a new batchId for any IDs that arrived after the previous batch was acknowledged.
  savePendingEventViewBatch(userKey, {
    batchId: generateViewBatchId(),
    eventIds: remaining,
  })
}

/**
 * Flushes pending viewed event IDs with the exact stored `batchId` so transport retries
 * remain idempotent on the backend. Keeps the batch in storage if sending fails.
 */
export async function flushPendingEventViews(
  userKey: string | null | undefined,
  sender: (batch: ViewedEventsBatchPayload) => Promise<void>
): Promise<FlushEventViewsResult> {
  if (!userKey) return { ok: true, sentCount: 0 }
  const existingFlush = inFlightFlushes.get(userKey)
  if (existingFlush) return existingFlush

  const promise = (async (): Promise<FlushEventViewsResult> => {
    let sentCount = 0
    try {
      while (true) {
        const current = getPendingEventViewBatch(userKey)
        if (!current) return { ok: true, sentCount }
        const batchToSend: ViewedEventsBatchPayload = {
          batchId: current.batchId,
          eventIds: current.eventIds.slice(0, MAX_BATCH_SIZE),
        }
        await sender(batchToSend)
        sentCount += batchToSend.eventIds.length
        clearSentIdsFromQueue(userKey, batchToSend.eventIds)
        if (current.eventIds.length <= MAX_BATCH_SIZE) {
          return { ok: true, sentCount }
        }
      }
    } catch {
      return { ok: false, sentCount }
    } finally {
      inFlightFlushes.delete(userKey)
    }
  })()

  inFlightFlushes.set(userKey, promise)
  return promise
}

/**
 * Best-effort keepalive flush for page unload (`pagehide`). Leaves pending IDs intact
 * in localStorage if the request cannot be acknowledged in time so the next visit retries
 * with the same `batchId`.
 */
export function flushPendingEventViewsKeepalive(
  userKey: string | null | undefined,
  token?: string | null
): void {
  if (!userKey || typeof window === 'undefined' || typeof fetch !== 'function') return
  if (inFlightFlushes.has(userKey)) return

  const current = getPendingEventViewBatch(userKey)
  if (!current) return

  const batchToSend: ViewedEventsBatchPayload = {
    batchId: current.batchId,
    eventIds: current.eventIds.slice(0, MAX_BATCH_SIZE),
  }
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token && !token.startsWith('eyJhbGciOiJSUzI1Ni') && !token.startsWith('mock-')) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    void fetch(`${baseUrl}/events/views`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batchToSend),
      credentials: 'include',
      keepalive: true,
    })
      .then((res) => {
        if (res.ok) {
          clearSentIdsFromQueue(userKey, batchToSend.eventIds)
        }
      })
      .catch(() => {
        /* Leave pending batch in storage for retry on next Home visit. */
      })
  } catch {
    /* Ignore unload errors; retry handles it cleanly. */
  }
}
