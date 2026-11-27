import { apiClient } from '@/shared'

export interface FanpageSearchItem {
  id: string
  name: string
  avatarUrl?: string
  description?: string
  orgType?: string
}

async function loadPages(
  path: string,
  keyword?: string,
  size?: number,
  signal?: AbortSignal
): Promise<FanpageSearchItem[]> {
  const items: FanpageSearchItem[] = []
  let page = 0
  while (true) {
    const response: any = await apiClient.get(path, {
      params: { keyword: keyword || undefined, page, size: size || 100 },
      signal,
    })
    const data = response?.data || response
    const rows = Array.isArray(data) ? data : data?.content || []
    items.push(
      ...rows.map((row: any) => ({
        id: String(row.id),
        name: row.orgName || row.fullName || row.name || 'Fanpage',
        avatarUrl: row.avatarUrl,
        description: row.description,
        orgType: row.orgType,
      }))
    )
    const hasMore =
      typeof data?.totalPages === 'number' ? page + 1 < data.totalPages : data?.last === false
    if (size || Array.isArray(data) || !hasMore || !rows.length) break
    page += 1
  }
  return items
}

export const fanpageSearchService = {
  search: (keyword: string, size?: number, signal?: AbortSignal) =>
    loadPages('/fanpages', keyword, size, signal),
  following: (signal?: AbortSignal) =>
    loadPages('/fanpages/following', undefined, undefined, signal),
}
