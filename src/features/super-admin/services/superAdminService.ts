import { apiClient } from '@/shared'
import { createSv5tLabelFormatter } from '@/shared/utils/sv5tLabels'
import type {
  SuperAdminUser,
  UserSystemRole,
  UserFanpageMembership,
  SuperAdminFanpage,
  SuperAdminEvent,
  SuperAdminSemester,
  SuperAdminPointCategory,
  SuperAdminSv5tCriteria,
  SuperAdminSchool,
  SuperAdminMajor,
  SuperAdminOverviewStats,
  FanpageStatus,
  AdminEventStatus,
  SemesterStatus,
  Sv5tScope,
} from '../types/superAdmin.types'

// apiClient already unwraps BaseResponse.data. Read every server page before filtering locally.
async function fetchAllPages(url: string, params: Record<string, unknown> = {}): Promise<any[]> {
  const size = 100
  const list: any[] = []
  for (let page = 0; ; page++) {
    const result: any = await apiClient.get(url, { params: { ...params, page, size } })
    const items = Array.isArray(result) ? result : result?.content
    if (!Array.isArray(items)) throw new Error('Dữ liệu API không hợp lệ: ' + url)
    list.push(...items)
    if (
      Array.isArray(result) ||
      result.last === true ||
      (result.totalPages != null && page + 1 >= result.totalPages) ||
      items.length < size
    )
      break
  }
  return list
}

async function fetchAdminRecords(
  url: string,
  statuses: string[],
  params: Record<string, unknown> = {}
) {
  const states = typeof params.isActive === 'boolean' ? [params.isActive] : [true, false]
  const groups = await Promise.all(
    statuses.flatMap((status) =>
      states.map((isActive) => fetchAllPages(url, { ...params, status, isActive }))
    )
  )
  return [...new Map(groups.flat().map((item) => [item.id, item])).values()]
}

export function isValidUserId(value: unknown): boolean {
  return typeof value === 'number'
    ? Number.isSafeInteger(value) && value > 0
    : typeof value === 'string' && /^[1-9]\d*$/.test(value)
}
const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

async function fetchFanpageMembers() {
  const fanpages = await fetchAdminRecords('/fanpages/admin', ['ACTIVE', 'PENDING', 'BANNED'])
  return Promise.allSettled(
    fanpages.map(async (fanpage) => {
      const response: any = await apiClient.get(`/fanpages/${fanpage.id}/members`)
      const members = response?.data ?? response
      if (!Array.isArray(members)) throw new Error('Không tải được thành viên fanpage.')
      return { fanpage, members: members.filter((member: any) => member.isActive !== false) }
    })
  )
}

async function fetchUsersAndProfiles(url: string, isActive?: boolean) {
  const states = isActive == null ? [true, false] : [isActive]
  const lists = await Promise.all(states.map((active) => fetchAllPages(url, { isActive: active })))
  return lists.flat()
}

function paginate<T>(items: T[], page = 0, size = 100) {
  return {
    content: items.slice(page * size, (page + 1) * size),
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  }
}

export function normalizeAdminRole(user: {
  role?: string
  roles?: string[]
}): SuperAdminUser['role'] {
  const roles = [user.role, ...(user.roles ?? [])]
    .filter(Boolean)
    .map((r) => r!.replace(/^ROLE_/, '').toUpperCase())
  if (roles.some((r) => ['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(r))) return 'SUPERADMIN'
  if (roles.some((r) => ['STAFF', 'FANPAGE_ADMIN', 'ORGANIZER'].includes(r))) return 'STAFF'
  return 'STUDENT'
}

const realNumber = (value: unknown): number | null =>
  value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value)
const dateLabel = (value?: string) => (value ? new Date(value).toLocaleString('vi-VN') : '')

export function mapAdminFanpage(
  fanpage: any,
  admin?: any,
  profile?: any,
  followersCount: number | null = null
): SuperAdminFanpage {
  const matchingProfile = admin?.email && profile?.email === admin.email ? profile : undefined
  let status: FanpageStatus = 'ACTIVE'
  if (fanpage.status === 'PENDING' || fanpage.status === 'REJECTED') status = fanpage.status
  else if (['BANNED', 'LOCKED'].includes(fanpage.status) || fanpage.isActive === false)
    status = 'LOCKED'
  return {
    id: String(fanpage.id),
    name: fanpage.orgName?.trim() || fanpage.name?.trim() || '',
    representativeName: admin
      ? [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.fullName || ''
      : '',
    representativeCode:
      matchingProfile?.staffId ??
      matchingProfile?.studentId ??
      admin?.staffId ??
      admin?.staffCode ??
      admin?.studentId ??
      '',
    representativeEmail: admin?.email ?? '',
    representativePhone:
      matchingProfile?.phoneNumber ||
      matchingProfile?.phone ||
      admin?.phoneNumber ||
      admin?.phone ||
      '',
    contactEmail: fanpage.helpContact ?? '',
    contactPhone: fanpage.helpPhone ?? '',
    schoolName: fanpage.parentOrg ?? '',
    proofFileUrl: fanpage.proofFileUrl,
    proofFileName: fanpage.proofFileName,
    createdAt: dateLabel(fanpage.createdAt),
    status,
    avatarUrl: fanpage.avatarUrl,
    coverUrl: fanpage.coverUrl,
    description: fanpage.description ?? '',
    rejectionReason: fanpage.rejectionReason,
    eventsCount: realNumber(fanpage.eventsCount),
    followersCount,
  }
}

export function getUserSystemRoles(user: { role?: string; roles?: string[] }): UserSystemRole[] {
  const aliases: Record<string, UserSystemRole> = {
    ADMIN: 'ADMIN',
    SUPERADMIN: 'ADMIN',
    SUPER_ADMIN: 'ADMIN',
    STUDENT: 'STUDENT',
    STAFF: 'FANPAGE_ADMIN',
    FANPAGE_ADMIN: 'FANPAGE_ADMIN',
    ORGANIZER: 'FANPAGE_ADMIN',
  }
  return [
    ...new Set(
      [user.role, ...(user.roles ?? [])]
        .filter(Boolean)
        .map((role) => aliases[role!.toUpperCase().replace(/^ROLE_/, '')])
        .filter(Boolean)
    ),
  ]
}

export function mapAdminUser(user: any, profile?: any): SuperAdminUser {
  const matchingProfile = profile?.email === user.email ? profile : undefined
  const student =
    user.studentProfile ??
    (matchingProfile && !matchingProfile.staffId ? matchingProfile : undefined) ??
    (user.studentId != null ? user : undefined)
  const staff =
    user.staffProfile ??
    (matchingProfile?.staffId != null ? matchingProfile : undefined) ??
    (user.staffId != null ? user : undefined)
  const studentProfile = student
    ? {
        studentId: student.studentId ?? '',
        schoolName: student.schoolName ?? '',
        majorName: student.majorName ?? '',
        kNumber: String(student.kNumber ?? ''),
        associationName: student.associationName ?? '',
      }
    : undefined
  const staffProfile = staff
    ? {
        staffId: staff.staffId ?? '',
        orgName: staff.orgName ?? '',
        title: staff.title ?? '',
        phoneNumber: staff.phoneNumber ?? staff.phone ?? '',
      }
    : undefined
  return {
    id: isValidUserId(user.userId ?? user.id) ? String(user.userId ?? user.id) : '',
    name:
      [user.firstName ?? matchingProfile?.firstName, user.lastName ?? matchingProfile?.lastName]
        .filter(Boolean)
        .join(' ') ||
      user.name ||
      user.email ||
      '',
    code: studentProfile?.studentId || staffProfile?.staffId || '',
    email: user.email ?? '',
    role: normalizeAdminRole(user),
    baseRole: studentProfile
      ? 'STUDENT'
      : staffProfile
        ? 'STAFF'
        : getUserSystemRoles(user).includes('STUDENT')
          ? 'STUDENT'
          : null,
    systemRoles: getUserSystemRoles(user),
    studentProfile,
    staffProfile,
    schoolName: studentProfile?.schoolName || staffProfile?.orgName || '',
    majorName: studentProfile?.majorName ?? '',
    status: user.isActive === false ? 'LOCKED' : 'ACTIVE',
    avatarUrl: user.avatarUrl ?? matchingProfile?.avatarUrl,
    phone: staffProfile?.phoneNumber || user.phoneNumber || user.phone || '',
    createdAt: dateLabel(user.createdAt),
    eventsParticipatedCount: realNumber(user.eventsParticipatedCount),
  }
}

export function getUserDisplayRole(user: SuperAdminUser): SuperAdminUser['role'] | null {
  if (user.systemRoles?.includes('ADMIN') || user.role === 'SUPERADMIN') return 'SUPERADMIN'
  return user.studentProfile ? 'STUDENT' : user.staffProfile ? 'STAFF' : (user.baseRole ?? null)
}

export function getSuperAdminRoles(user: SuperAdminUser, enabled: boolean): UserSystemRole[] {
  const current: UserSystemRole[] = user.systemRoles ?? [
    user.role === 'SUPERADMIN' ? 'ADMIN' : user.role === 'STAFF' ? 'FANPAGE_ADMIN' : 'STUDENT',
  ]
  if (enabled) return [...new Set<UserSystemRole>([...current, 'ADMIN'])]
  const remaining = current.filter((role) => role !== 'ADMIN')
  if (remaining.length) return remaining
  const base =
    user.baseRole ?? (user.studentProfile ? 'STUDENT' : user.staffProfile ? 'STAFF' : null)
  if (!base) throw new Error('Chưa xác định được loại tài khoản gốc.')
  return [base === 'STAFF' ? 'FANPAGE_ADMIN' : 'STUDENT']
}

export function buildAdminBenefitLookups(categories: any[], criterias: any[]) {
  const names = new Map<number, string>()
  const codes = new Map<number, string>()
  const buildTree = (items: any[], parentKey: string) => {
    const nodes = new Map<number, any>()
    const collect = (list: any[], parentId: number | null = null) => {
      list.forEach((item) => {
        nodes.set(item.id, { ...item, parentId: item[parentKey] ?? parentId, children: [] })
        if (Array.isArray(item.children)) collect(item.children, item.id)
      })
    }
    collect(items)
    const roots: any[] = []
    nodes.forEach((node) => {
      const parent = nodes.get(node.parentId)
      if (parent) parent.children.push(node)
      else roots.push(node)
    })
    const sort = (list: any[]) => {
      list.sort((a, b) => (a.childrenOrder ?? a.id) - (b.childrenOrder ?? b.id))
      list.forEach((node) => sort(node.children))
    }
    sort(roots)
    return roots
  }
  const visitCategory = (node: any, code: string, depth: number) => {
    names.set(node.id, node.name)
    codes.set(node.id, code)
    node.children.forEach((child: any, index: number) =>
      visitCategory(
        child,
        `${code}.${depth === 0 ? String.fromCharCode(97 + index) : index + 1}`,
        depth + 1
      )
    )
  }
  buildTree(categories, 'parentCategoryId').forEach((root, index) =>
    visitCategory(root, ['I', 'II', 'III', 'IV', 'V'][index] ?? String(index + 1), 0)
  )
  return { names, codes, formatCriteria: createSv5tLabelFormatter(criterias) }
}

export function mapAdminEvent(
  event: any,
  categories: Map<number, string> = new Map(),
  codes: Map<number, string> = new Map(),
  formatCriteria: (name: string, criteriaId?: number | string) => string = (name) => name
): SuperAdminEvent {
  const points = Array.isArray(event.eventPoints)
    ? event.eventPoints.map((p: any) => ({
        pointCategoryId: p.pointCategoryId,
        name: p.pointCategoryName ?? categories.get(p.pointCategoryId) ?? '',
        code: codes.get(p.pointCategoryId) ?? p.pointCategoryCode?.replace(/^mục\s+/i, ''),
        point: Number(p.point ?? 0),
      }))
    : []
  let status: AdminEventStatus = 'OPEN'
  if (event.isActive === false || event.status === 'HIDDEN') status = 'HIDDEN'
  else if (event.status === 'DRAFT') status = 'DRAFT'
  else if (event.status === 'CANCELLED') status = 'CANCELLED'
  else if (['CLOSED', 'COMPLETED'].includes(event.status)) status = 'COMPLETED'
  else if (['ONGOING', 'HAPPENING'].includes(event.status)) status = 'HAPPENING'
  else if (event.status === 'VIOLATED') status = 'VIOLATED'
  return {
    id: String(event.id),
    title: event.name ?? event.title ?? '',
    fanpageId: String(event.fanpageId ?? ''),
    fanpageName: event.fanpageName ?? '',
    startDateTime: dateLabel(event.dateHappen),
    endDateTime: dateLabel(event.dateClose),
    location: event.location ?? '',
    capacity: realNumber(event.capacity),
    registeredCount: realNumber(event.registeredCount),
    eventPoints: points,
    trainingPoint: points.reduce((sum: number, p: any) => sum + p.point, 0),
    trainingPointCategoryName: points
      .map((p: any) => p.name)
      .filter(Boolean)
      .join(', '),
    sv5tCriteriaName:
      formatCriteria(event.criteriaName ?? event.sv5tCriteriaName ?? '', event.criteriaId) ||
      undefined,
    createdAt: dateLabel(event.createdAt),
    status,
    bannerUrl: event.bannerUrl,
    violationReason: event.violationReason,
    reportCount: realNumber(event.reportCount) ?? undefined,
  }
}

export const superAdminService = {
  getUserFanpages: async (
    userId: string,
    email?: string
  ): Promise<{ items: UserFanpageMembership[]; incomplete: boolean }> => {
    const hasId = isValidUserId(userId)
    const accountEmail = normalizeEmail(email)
    if (!hasId && !accountEmail) throw new Error('Chưa xác định được người dùng.')
    const results = await fetchFanpageMembers()
    return {
      items: results.flatMap((result): UserFanpageMembership[] => {
        if (result.status !== 'fulfilled') return []
        const { fanpage, members } = result.value
        const member = members.find((item: any) =>
          hasId
            ? isValidUserId(item.userId) && String(item.userId) === userId
            : normalizeEmail(item.email) === accountEmail
        )
        return member
          ? [
              {
                id: String(fanpage.id),
                name: fanpage.orgName || fanpage.name || '',
                avatarUrl: fanpage.avatarUrl,
                role: member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
              },
            ]
          : []
      }),
      incomplete: results.some((result) => result.status === 'rejected'),
    }
  },
  getFanpageFollowerCount: async (id: string | number): Promise<number | null> => {
    try {
      const result: any = await apiClient.get(`/fanpages/${id}/followers/count`)
      return realNumber((result?.data ?? result)?.followerCount)
    } catch {
      return null
    }
  },
  // ==========================================
  // 1. OVERVIEW & STATISTICS
  // ==========================================
  getOverviewStats: async (): Promise<SuperAdminOverviewStats> => {
    const [users, fanpages, events] = await Promise.all([
      fetchUsersAndProfiles('/users/admin'),
      fetchAdminRecords('/fanpages/admin', ['ACTIVE', 'PENDING', 'BANNED']),
      fetchAdminRecords('/events/admin', ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']),
    ])
    return {
      totalUsers: users.length,
      totalFanpages: fanpages.length,
      totalEvents: events.length,
      totalParticipations: null,
      pendingFanpagesCount: fanpages.filter((f) => f.status === 'PENDING').length,
      violationReportsCount: events.filter((e) => e.status === 'VIOLATED').length,
      userGrowthRate: null,
      eventGrowthRate: null,
    }
  },

  // ==========================================
  // 2. USER MANAGEMENT
  // ==========================================
  getUsers: async (params?: {
    page?: number
    size?: number
    keyword?: string
    role?: string
    isActive?: boolean
  }) => {
    const [users, profiles] = await Promise.all([
      fetchUsersAndProfiles('/users/admin', params?.isActive),
      fetchUsersAndProfiles('/users/admin/profiles', params?.isActive),
    ])
    const byEmail = new Map(profiles.map((profile) => [profile.email, profile]))
    // Older backend mappers return null userId. Resolve only verified IDs from memberships.
    const resolvedIds = new Map<string, Set<string>>()
    if (users.some((user) => !isValidUserId(user.userId ?? user.id))) {
      try {
        const groups = await fetchFanpageMembers()
        for (const group of groups) {
          if (group.status !== 'fulfilled') continue
          for (const member of group.value.members) {
            const email = normalizeEmail(member.email)
            if (!email || !isValidUserId(member.userId)) continue
            if (!resolvedIds.has(email)) resolvedIds.set(email, new Set())
            resolvedIds.get(email)!.add(String(member.userId))
          }
        }
      } catch {
        /* Keep unresolved IDs empty, never synthesize an account ID. */
      }
    }
    let mapped = users.map((user) => {
      const ids = resolvedIds.get(normalizeEmail(user.email))
      const account =
        !isValidUserId(user.userId ?? user.id) && ids?.size === 1
          ? { ...user, userId: [...ids][0] }
          : user
      return mapAdminUser(account, byEmail.get(user.email))
    })
    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase()
      mapped = mapped.filter((user) =>
        [user.name, user.email, user.code].some((text) => text.toLowerCase().includes(keyword))
      )
    }
    if (params?.role && params.role !== 'ALL')
      mapped = mapped.filter((user) => user.role === params.role)
    return paginate(mapped, params?.page, params?.size)
  },

  toggleUserStatus: async (userId: string | number): Promise<boolean> => {
    try {
      if (!isValidUserId(userId)) throw new Error('Thiếu ID tài khoản hợp lệ.')
      await apiClient.patch(`/users/admin/${userId}/change-status`)
      return true
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      throw err
    }
  },

  changeUserRoles: async (userId: string, roles: UserSystemRole[]): Promise<void> => {
    if (!isValidUserId(userId)) throw new Error('Thiếu ID tài khoản hợp lệ.')
    await apiClient.patch(`/users/admin/${userId}/change-roles`, roles)
  },

  changeUserRole: async (userId: string | number, role: string): Promise<boolean> => {
    try {
      if (!isValidUserId(userId)) throw new Error('Thiếu ID tài khoản hợp lệ.')
      await apiClient.patch(`/users/admin/${userId}/change-role`, null, {
        params: {
          role: role === 'SUPERADMIN' ? 'ADMIN' : role === 'STAFF' ? 'FANPAGE_ADMIN' : 'STUDENT',
        },
      })
      return true
    } catch (err) {
      console.error('Failed to change user role:', err)
      throw err
    }
  },

  // ==========================================
  // 3. FANPAGE MANAGEMENT
  // ==========================================
  getFanpages: async (params?: {
    page?: number
    size?: number
    keyword?: string
    status?: string
    isActive?: boolean
  }) => {
    const list = await fetchAdminRecords(
      '/fanpages/admin',
      params?.status && params.status !== 'ALL' ? [params.status] : ['ACTIVE', 'PENDING', 'BANNED'],
      { keyword: params?.keyword, isActive: params?.isActive }
    )
    const profiles = new Map<string, Promise<any>>()
    const mapped = await Promise.all(
      list.map(async (f): Promise<SuperAdminFanpage> => {
        const followersCount = await superAdminService.getFanpageFollowerCount(f.id)
        let admin: any
        try {
          const members: any = await apiClient.get(`/fanpages/${f.id}/members`)
          if (Array.isArray(members))
            admin = members.find((member) => member.role === 'ADMIN' && member.isActive !== false)
        } catch {
          // The current members endpoint does not return inactive fanpages.
        }
        let profile: any
        if (admin?.userId != null) {
          const key = String(admin.userId)
          if (!profiles.has(key))
            profiles.set(
              key,
              apiClient.get(`/users/admin/${admin.userId}/profile`).catch(() => null)
            )
          profile = await profiles.get(key)
        }
        return mapAdminFanpage(f, admin, profile, followersCount)
      })
    )
    return paginate(mapped, params?.page, params?.size)
  },

  acceptFanpage: async (id: string | number): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/accept-fanpage/${id}`)
      return true
    } catch (err) {
      console.error('Failed to accept fanpage:', err)
      throw err
    }
  },

  rejectFanpage: async (id: string | number, reason?: string): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/reject-fanpage/${id}`, {
        reason: reason?.trim() || 'Hồ sơ chưa đạt yêu cầu theo quy định.',
      })
      return true
    } catch (err) {
      console.error('Failed to reject fanpage:', err)
      throw err
    }
  },

  banFanpage: async (id: string | number): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/ban-fanpage/${id}`)
      return true
    } catch (err) {
      console.error('Failed to ban fanpage:', err)
      throw err
    }
  },

  unbanFanpage: async (id: string | number): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/unban-fanpage/${id}`)
      return true
    } catch (err) {
      console.error('Failed to unban fanpage:', err)
      throw err
    }
  },

  deleteFanpage: async (id: string | number): Promise<boolean> => {
    try {
      await apiClient.delete(`/fanpages/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete fanpage:', err)
      throw err
    }
  },

  // ==========================================
  // 4. EVENT MANAGEMENT
  // ==========================================
  getEvents: async (params?: {
    page?: number
    size?: number
    keyword?: string
    status?: string
  }) => {
    const [events, categories, criterias] = await Promise.all([
      fetchAdminRecords('/events/admin', ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED'], {
        keyword: params?.keyword,
      }),
      apiClient.get('/point-categories').catch(() => []),
      apiClient.get('/criterias').catch(() => []),
    ])
    const { names, codes, formatCriteria } = buildAdminBenefitLookups(
      Array.isArray(categories) ? categories : [],
      Array.isArray(criterias) ? criterias : Array.isArray(criterias?.data) ? criterias.data : []
    )
    const mapped = events
      .map((event) => mapAdminEvent(event, names, codes, formatCriteria))
      .filter(
        (event) => !params?.status || params.status === 'ALL' || event.status === params.status
      )
    return paginate(mapped, params?.page, params?.size)
  },

  deleteEvent: async (id: string | number): Promise<boolean> => {
    try {
      await apiClient.delete(`/events/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete event:', err)
      throw err
    }
  },

  // ==========================================
  // 5. SEMESTERS
  // ==========================================
  getSemesters: async (): Promise<SuperAdminSemester[]> => {
    try {
      const res: any = await apiClient.get('/semesters')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((s: any) => {
        let status: SemesterStatus = 'UPCOMING'
        if (s.status === 'ONGOING' || s.status === 'ACTIVE' || s.isCurrent) status = 'ONGOING'
        else if (s.status === 'COMPLETED' || s.status === 'FINISHED') status = 'COMPLETED'

        return {
          id: s.id,
          number: s.number,
          academicYear:
            typeof s.academicYear === 'string' ? s.academicYear : (s.academicYear?.name ?? ''),
          startDate: s.startDate ? s.startDate.split('T')[0] : '',
          endDate: s.endDate ? s.endDate.split('T')[0] : '',
          status,
          isCurrent: status === 'ONGOING',
          isActive: s.isActive !== false,
        }
      })
    } catch (err) {
      console.error('Failed to get semesters:', err)
      throw err
    }
  },

  createSemester: async (payload: {
    number: number
    startDate: string
    endDate: string
    academicYear: string
  }): Promise<boolean> => {
    try {
      await apiClient.post('/semesters/admin', {
        number: payload.number,
        startDate: payload.startDate,
        endDate: payload.endDate,
        academicYear: payload.academicYear,
      })
      return true
    } catch (err) {
      console.error('Failed to create semester:', err)
      throw err
    }
  },

  updateSemester: async (
    id: number | string,
    payload: {
      number: number
      startDate: string
      endDate: string
      academicYear: string
    }
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/semesters/admin/${id}`, {
        number: payload.number,
        startDate: payload.startDate,
        endDate: payload.endDate,
        academicYear: payload.academicYear,
      })
      return true
    } catch (err) {
      console.error('Failed to update semester:', err)
      throw err
    }
  },

  deleteSemester: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.delete(`/semesters/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete semester:', err)
      throw err
    }
  },

  // ==========================================
  // 6. TRAINING POINT CATEGORIES
  // ==========================================
  getPointCategories: async (): Promise<SuperAdminPointCategory[]> => {
    try {
      const res: any = await apiClient.get('/point-categories')
      const flatList: any[] = Array.isArray(res) ? res : res?.data || []

      const mapItem = (c: any): SuperAdminPointCategory => ({
        id: c.id,
        name: c.name,
        maximum: c.maximum || 0,
        level: c.level || 0,
        note: c.note,
        parentCategoryId: c.parentCategoryId || null,
        childrenOrder: c.childrenOrder || 1,
        isActive: c.isActive !== false,
        children: c.children ? c.children.map(mapItem) : [],
      })

      // If BE returns flat, build tree
      const roots = flatList.filter((c) => !c.parentCategoryId)
      if (roots.length > 0 && (!roots[0].children || roots[0].children.length === 0)) {
        const buildTree = (parentId: number | null): SuperAdminPointCategory[] =>
          flatList
            .filter((c) => (c.parentCategoryId || null) === parentId)
            .map((c) => ({
              ...mapItem(c),
              children: buildTree(c.id),
            }))
        return buildTree(null)
      }

      return flatList.map(mapItem)
    } catch (err) {
      console.error('Failed to get point categories:', err)
      throw err
    }
  },

  createPointCategory: async (payload: {
    name: string
    maximum: number
    level: number
    note?: string
    parentCategoryId?: number | null
    childrenOrder?: number
  }): Promise<boolean> => {
    try {
      await apiClient.post('/point-categories/admin', payload)
      return true
    } catch (err) {
      console.error('Failed to create point category:', err)
      throw err
    }
  },

  updatePointCategory: async (
    id: number | string,
    payload: Partial<SuperAdminPointCategory>
  ): Promise<boolean> => {
    try {
      await apiClient.patch(`/point-categories/admin/${id}`, payload)
      return true
    } catch (err) {
      console.error('Failed to update point category:', err)
      throw err
    }
  },

  deletePointCategory: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.delete(`/point-categories/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete point category:', err)
      throw err
    }
  },

  // ==========================================
  // 7. CRITERIA SV5T
  // ==========================================
  getCriterias: async (): Promise<SuperAdminSv5tCriteria[]> => {
    try {
      const res: any = await apiClient.get('/criterias')
      const flatList: any[] = Array.isArray(res) ? res : res?.data || []

      const mapItem = (c: any): SuperAdminSv5tCriteria => ({
        id: c.id,
        name: c.name,
        note: c.note,
        scope: (c.scope as Sv5tScope) || 'UNIVERSITY',
        level: c.level || 0,
        childrenOrder: c.childrenOrder || 1,
        parentId: c.parentId || null,
        isActive: c.isActive !== false,
        children: c.children ? c.children.map(mapItem) : [],
      })

      const roots = flatList.filter((c) => !c.parentId)
      if (roots.length > 0 && (!roots[0].children || roots[0].children.length === 0)) {
        const buildTree = (parentId: number | null): SuperAdminSv5tCriteria[] =>
          flatList
            .filter((c) => (c.parentId || null) === parentId)
            .map((c) => ({
              ...mapItem(c),
              children: buildTree(c.id),
            }))
        return buildTree(null)
      }

      return flatList.map(mapItem)
    } catch (err) {
      console.error('Failed to get criterias:', err)
      throw err
    }
  },

  createCriteria: async (payload: {
    name: string
    level: number
    parentId?: number | null
    note?: string
    scope?: string
    requiredChildren?: number | null
  }): Promise<boolean> => {
    try {
      await apiClient.post('/criterias/admin', {
        name: payload.name,
        level: payload.level,
        parentId: payload.parentId || null,
        note: payload.note || '',
        scope: payload.scope || 'UNIVERSITY',
        requiredChildren: payload.requiredChildren || null,
      })
      return true
    } catch (err) {
      console.error('Failed to create criteria:', err)
      throw err
    }
  },

  updateCriteria: async (
    id: number | string,
    payload: Partial<SuperAdminSv5tCriteria>
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/criterias/admin/${id}`, payload)
      return true
    } catch (err) {
      console.error('Failed to update criteria:', err)
      throw err
    }
  },

  toggleCriteriaStatus: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.patch(`/criterias/admin/${id}/change-status`)
      return true
    } catch (err) {
      console.error('Failed to toggle criteria status:', err)
      throw err
    }
  },

  deleteCriteria: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.delete(`/criterias/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete criteria:', err)
      throw err
    }
  },

  // ==========================================
  // 8. SCHOOLS & MAJORS
  // ==========================================
  getSchools: async (): Promise<SuperAdminSchool[]> => {
    const schools = await fetchAllPages('/schools')
    return Promise.all(
      schools.map(async (school) => {
        const detail: any = await apiClient.get('/schools/' + school.id)
        const majors: SuperAdminMajor[] = (detail.majors ?? []).map((major: any) => ({
          id: major.id,
          code: major.code ?? '',
          name: major.name,
          schoolId: school.id,
          isActive: major.isActive,
          studentCount: major.studentCount,
        }))
        return {
          id: school.id,
          name: school.name,
          description: school.description,
          isActive: school.isActive,
          majorsCount: majors.length,
          majors,
        }
      })
    )
  },

  createSchool: async (payload: { name: string; description?: string }): Promise<boolean> => {
    try {
      await apiClient.post('/schools/admin', payload)
      return true
    } catch (err) {
      console.error('Failed to create school:', err)
      throw err
    }
  },

  updateSchool: async (
    id: number | string,
    payload: { name: string; description?: string; isActive?: boolean }
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/schools/admin/${id}`, payload)
      return true
    } catch (err) {
      console.error('Failed to update school:', err)
      throw err
    }
  },

  deleteSchool: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.delete(`/schools/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete school:', err)
      throw err
    }
  },

  createMajor: async (payload: {
    code: string
    name: string
    schoolId: number
  }): Promise<boolean> => {
    try {
      await apiClient.post('/majors/admin', payload)
      return true
    } catch (err) {
      console.error('Failed to create major:', err)
      throw err
    }
  },

  updateMajor: async (
    id: number | string,
    payload: { code: string; name: string; schoolId?: number; isActive?: boolean }
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/majors/admin/${id}`, payload)
      return true
    } catch (err) {
      console.error('Failed to update major:', err)
      throw err
    }
  },

  deleteMajor: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.delete(`/majors/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete major:', err)
      throw err
    }
  },
}
