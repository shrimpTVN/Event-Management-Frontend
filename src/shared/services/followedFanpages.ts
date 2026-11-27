import { apiClient } from '@/shared'

export interface SidebarFanpageItem {
  id: string
  name: string
  fullName?: string
  avatarUrl: string
}

const DEFAULT_PRIMARY_FANPAGE_AVATAR =
  'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
const DEFAULT_FANPAGE_AVATAR =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'

export const normalizeSidebarFanpage = (fp: any): SidebarFanpageItem => {
  const id = String(fp.id)
  const name = fp.orgName || fp.fullName || fp.name || 'Fanpage'
  return {
    id,
    name,
    fullName: fp.orgName || fp.fullName || fp.name,
    avatarUrl:
      fp.avatarUrl || (id === '1' ? DEFAULT_PRIMARY_FANPAGE_AVATAR : DEFAULT_FANPAGE_AVATAR),
  }
}

export const followedFanpagesQueryKey = (isAuthenticated: boolean) =>
  ['fanpages', 'sidebar', isAuthenticated] as const

export async function fetchFollowedFanpages(): Promise<SidebarFanpageItem[]> {
  const items: SidebarFanpageItem[] = []
  let page = 0
  while (true) {
    const res: any = await apiClient.get('/fanpages/following', {
      params: { page, size: 50 },
    })
    const data = res?.data ?? res
    const list = Array.isArray(data) ? data : data?.content || []
    if (!Array.isArray(list)) break
    items.push(...list.map(normalizeSidebarFanpage))
    const hasMore =
      typeof data?.totalPages === 'number' ? page + 1 < data.totalPages : data?.last === false
    if (Array.isArray(data) || !hasMore || list.length === 0) break
    page += 1
  }
  return items
}

export async function fetchPublicSidebarFanpages(): Promise<SidebarFanpageItem[]> {
  const res: any = await apiClient.get('/fanpages', { params: { size: 50 } })
  const data = res?.data ?? res
  const list = Array.isArray(data) ? data : data?.content || []
  return Array.isArray(list) ? list.map(normalizeSidebarFanpage) : []
}
