import { apiClient } from '@/shared'

export type UserRegistrationMap = Record<string, string>

export const userRegistrationsQueryKey = (
  isAuthenticated: boolean,
  userId?: string | number | null
) => ['registrations', 'me', isAuthenticated, userId ?? null] as const

const readRegistrationList = (res: any): any[] => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.content)) return res.content
  if (Array.isArray(res?.data?.content)) return res.data.content
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.items)) return res.items
  return []
}

async function fetchAllHistoryRegistrations(): Promise<any[]> {
  const all: any[] = []
  let page = 0

  while (true) {
    const res: any = await apiClient.get('/registrations/me/history', {
      params: { page, size: 100 },
    })
    const data = res?.data ?? res
    const rows = readRegistrationList(res)
    all.push(...rows)

    if (Array.isArray(res) || Array.isArray(data) || rows.length === 0) break
    const totalPages =
      typeof res?.totalPages === 'number'
        ? res.totalPages
        : typeof data?.totalPages === 'number'
          ? data.totalPages
          : undefined
    const isLast = typeof res?.last === 'boolean' ? res.last : data?.last
    const hasMore = totalPages !== undefined ? page + 1 < totalPages : isLast === false
    if (!hasMore) break
    page += 1
  }

  return all
}

const getRecordTimestamp = (record: any): number => {
  const raw = record?.updatedAt || record?.regDate || record?.createdAt
  if (!raw) return 0
  const parsed = new Date(raw).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function normalizeUserRegistrationMap(
  historyList: any[],
  upcomingList: any[]
): UserRegistrationMap {
  const latestByEvent = new Map<string, { status: string; ts: number; order: number }>()
  let seq = 0

  for (const item of historyList) {
    const eid = String(item?.eventId ?? item?.eventInfo?.id ?? item?.id ?? '')
    if (!eid) continue
    const status = String(item?.status || 'REGISTERED').toUpperCase()
    const ts = getRecordTimestamp(item)
    const order = seq++
    const prev = latestByEvent.get(eid)
    if (!prev || ts > prev.ts || (ts === prev.ts && order >= prev.order)) {
      latestByEvent.set(eid, { status, ts, order })
    }
  }

  for (const item of upcomingList) {
    const eid = String(item?.eventId ?? item?.eventInfo?.id ?? item?.id ?? '')
    if (!eid) continue
    const status = String(item?.status || 'REGISTERED').toUpperCase()
    if (status === 'CANCELLED') continue
    const ts = getRecordTimestamp(item)
    const order = seq++
    const prev = latestByEvent.get(eid)
    // Upcoming endpoint reflects current active registrations unless history has a strictly newer CANCELLED record.
    if (
      !prev ||
      prev.status !== 'CANCELLED' ||
      ts > prev.ts ||
      (ts === prev.ts && prev.ts === 0)
    ) {
      latestByEvent.set(eid, { status, ts, order })
    }
  }

  const map: UserRegistrationMap = {}
  for (const [eid, entry] of latestByEvent.entries()) {
    if (entry.status !== 'CANCELLED') {
      map[eid] = entry.status
    }
  }
  return map
}

export async function fetchUserRegistrationMap(
  isAuthenticated: boolean
): Promise<UserRegistrationMap> {
  if (!isAuthenticated) return {}

  const [historyList, upcomingRes] = await Promise.all([
    fetchAllHistoryRegistrations(),
    apiClient.get('/registrations/me/upcoming'),
  ])

  const upcomingList = readRegistrationList(upcomingRes)
  return normalizeUserRegistrationMap(historyList, upcomingList)
}

export const userRegistrationsQueryOptions = (
  isAuthenticated: boolean,
  userId?: string | number | null
) => ({
  queryKey: userRegistrationsQueryKey(isAuthenticated, userId),
  queryFn: () => fetchUserRegistrationMap(isAuthenticated),
  enabled: isAuthenticated,
})
