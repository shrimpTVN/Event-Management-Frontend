import { apiClient } from '@/shared'
import type {
  UserAdminItem,
  FanpageAdminItem,
  EventAdminItem,
  SemesterAdminItem,
  AcademicYearItem,
  PointCategoryAdminItem,
  CriteriaAdminItem,
  SuperAdminOverviewStats,
} from '../types/superAdmin.types'

export const superAdminService = {
  // ==========================================
  // 1. OVERVIEW & STATISTICS
  // ==========================================
  getOverviewStats: async (): Promise<SuperAdminOverviewStats> => {
    try {
      const settled = await Promise.allSettled([
        apiClient.get('/users/admin', { params: { size: 100 } }),
        apiClient.get('/fanpages/admin', { params: { size: 100 } }),
        apiClient.get('/events/admin', { params: { size: 100 } }),
        apiClient.get('/semesters'),
      ])
      const [usersRes, fanpagesRes, eventsRes, semestersRes] = settled.map((r) =>
        r.status === 'fulfilled' ? (r as PromiseFulfilledResult<any>).value : null
      )

      const usersList: any[] = usersRes?.content || (Array.isArray(usersRes) ? usersRes : [])
      const fanpagesList: any[] =
        fanpagesRes?.content || (Array.isArray(fanpagesRes) ? fanpagesRes : [])
      const eventsList: any[] =
        eventsRes?.content || (Array.isArray(eventsRes) ? eventsRes : [])
      const semestersList: any[] = Array.isArray(semestersRes)
        ? semestersRes
        : semestersRes?.data || []

      const totalUsers = usersRes?.totalElements || usersList.length || 0
      const studentCount = usersList.filter(
        (u) => u.role === 'STUDENT' || u.roles?.includes('STUDENT')
      ).length
      const staffCount = usersList.filter(
        (u) => u.role === 'FANPAGE_ADMIN' || u.roles?.includes('FANPAGE_ADMIN')
      ).length
      const adminCount = usersList.filter(
        (u) => u.role === 'ADMIN' || u.roles?.includes('ADMIN')
      ).length

      const totalFanpages = fanpagesRes?.totalElements || fanpagesList.length || 0
      const activeFanpages = fanpagesList.filter((f) => f.status === 'ACTIVE').length
      const pendingFanpages = fanpagesList.filter((f) => f.status === 'PENDING').length

      const totalEvents = eventsRes?.totalElements || eventsList.length || 0
      const publishedEvents = eventsList.filter((e) => e.status === 'PUBLISHED').length
      const draftEvents = eventsList.filter((e) => e.status === 'DRAFT').length
      const closedEvents = eventsList.filter((e) => e.status === 'CLOSED').length

      const ongoingSemester =
        semestersList.find((s) => s.status === 'ONGOING') || semestersList[0] || null

      return {
        totalUsers,
        studentCount,
        staffCount,
        adminCount,
        totalFanpages,
        activeFanpages,
        pendingFanpages,
        totalEvents,
        publishedEvents,
        draftEvents,
        closedEvents,
        ongoingSemester,
      }
    } catch (err) {
      console.error('Failed to load super admin stats:', err)
      return {
        totalUsers: 0,
        studentCount: 0,
        staffCount: 0,
        adminCount: 0,
        totalFanpages: 0,
        activeFanpages: 0,
        pendingFanpages: 0,
        totalEvents: 0,
        publishedEvents: 0,
        draftEvents: 0,
        closedEvents: 0,
        ongoingSemester: null,
      }
    }
  },

  // ==========================================
  // 2. USER MANAGEMENT
  // ==========================================
  getUsers: async (params?: {
    page?: number
    size?: number
    isActive?: boolean
    keyword?: string
    role?: string
  }): Promise<{ content: UserAdminItem[]; totalElements: number; totalPages: number }> => {
    try {
      const res: any = await apiClient.get('/users/admin', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 15,
          isActive: params?.isActive,
          keyword: params?.keyword,
        },
      })

      const rawList = res?.content || (Array.isArray(res) ? res : [])
      const mapped: UserAdminItem[] = rawList.map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName || u.name || u.email?.split('@')[0],
        studentId: u.studentId || u.code || '',
        role: u.role || (u.roles && u.roles[0]) || 'STUDENT',
        roles: u.roles || [u.role || 'STUDENT'],
        isActive: u.isActive !== undefined ? u.isActive : true,
        avatarUrl: u.avatarUrl,
        schoolName: u.schoolName,
        majorName: u.majorName,
        classCode: u.classCode,
        phone: u.phone,
        createdAt: u.createdAt,
      }))

      const filtered = params?.role
        ? mapped.filter((u) => u.role === params.role || u.roles?.includes(params.role!))
        : mapped

      return {
        content: filtered,
        totalElements: res?.totalElements || filtered.length,
        totalPages: res?.totalPages || Math.ceil(filtered.length / (params?.size ?? 15)) || 1,
      }
    } catch (err) {
      console.error('Failed to get users:', err)
      return { content: [], totalElements: 0, totalPages: 0 }
    }
  },

  toggleUserStatus: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.patch(`/users/admin/${id}/change-status`)
      return true
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      throw err
    }
  },

  changeUserRole: async (id: number | string, role: string): Promise<boolean> => {
    try {
      await apiClient.patch(`/users/admin/${id}/change-role`, null, {
        params: { role },
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
  }): Promise<{ content: FanpageAdminItem[]; totalElements: number; totalPages: number }> => {
    try {
      const res: any = await apiClient.get('/fanpages/admin', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 15,
          keyword: params?.keyword,
          status: params?.status,
          isActive: params?.isActive,
        },
      })

      const rawList = res?.content || (Array.isArray(res) ? res : [])
      const mapped: FanpageAdminItem[] = rawList.map((f: any) => ({
        id: f.id,
        code: f.code || `FP-${f.id}`,
        name: f.name,
        orgName: f.orgName || f.parentOrg || 'Đoàn Thanh niên - Hội Sinh viên',
        status: f.status || 'ACTIVE',
        isActive: f.isActive !== undefined ? f.isActive : true,
        followerCount: f.followerCount || f.followersCount || 0,
        eventCount: f.eventCount || f.eventsCount || 0,
        helpContact: f.helpContact || f.email,
        helpPhone: f.helpPhone || f.phone,
        address: f.address,
        avatarUrl: f.avatarUrl,
        description: f.description,
        parentOrg: f.parentOrg,
        createdAt: f.createdAt,
      }))

      return {
        content: mapped,
        totalElements: res?.totalElements || mapped.length,
        totalPages: res?.totalPages || Math.ceil(mapped.length / (params?.size ?? 15)) || 1,
      }
    } catch (err) {
      console.error('Failed to get fanpages:', err)
      return { content: [], totalElements: 0, totalPages: 0 }
    }
  },

  acceptFanpage: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/accept-fanpage/${id}`)
      return true
    } catch (err) {
      console.error('Failed to accept fanpage:', err)
      throw err
    }
  },

  banFanpage: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/ban-fanpage/${id}`)
      return true
    } catch (err) {
      console.error('Failed to ban fanpage:', err)
      throw err
    }
  },

  unbanFanpage: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpages/admin/unban-fanpage/${id}`)
      return true
    } catch (err) {
      console.error('Failed to unban fanpage:', err)
      throw err
    }
  },

  deleteFanpage: async (id: number | string): Promise<boolean> => {
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
    semesterId?: number
    fanpageId?: number
    eventTypeId?: number
  }): Promise<{ content: EventAdminItem[]; totalElements: number; totalPages: number }> => {
    try {
      const res: any = await apiClient.get('/events/admin', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 15,
          keyword: params?.keyword,
          status: params?.status,
          semesterId: params?.semesterId,
          fanpageId: params?.fanpageId,
          eventTypeId: params?.eventTypeId,
        },
      })

      const rawList = res?.content || (Array.isArray(res) ? res : [])
      const mapped: EventAdminItem[] = rawList.map((e: any) => ({
        id: e.id,
        name: e.name,
        description: e.description || '',
        location: e.location || '',
        dateOpen: e.dateOpen || '',
        dateClose: e.dateClose || '',
        dateHappen: e.dateHappen || '',
        capacity: e.capacity || 0,
        registeredCount: e.registeredCount || 0,
        checkedInCount: e.checkedInCount || 0,
        status: e.status || 'PUBLISHED',
        eventTypeId: e.eventTypeId || 1,
        eventTypeName: e.eventTypeName,
        fanpageId: e.fanpageId,
        fanpageName: e.fanpageName || e.organizerName,
        semesterId: e.semesterId,
        semesterName: e.semesterName,
        criteriaId: e.criteriaId,
        criteriaName: e.criteriaName,
        bannerUrl: e.bannerUrl,
        createdAt: e.createdAt,
      }))

      return {
        content: mapped,
        totalElements: res?.totalElements || mapped.length,
        totalPages: res?.totalPages || Math.ceil(mapped.length / (params?.size ?? 15)) || 1,
      }
    } catch (err) {
      console.error('Failed to get admin events:', err)
      return { content: [], totalElements: 0, totalPages: 0 }
    }
  },

  deleteEvent: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.delete(`/events/admin/${id}`)
      return true
    } catch (err) {
      console.error('Failed to delete event:', err)
      throw err
    }
  },

  // ==========================================
  // 5. SEMESTERS & ACADEMIC YEARS
  // ==========================================
  getSemesters: async (): Promise<SemesterAdminItem[]> => {
    try {
      const res: any = await apiClient.get('/semesters')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((s: any) => ({
        id: s.id,
        number: s.number,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status || 'ONGOING',
        academicYearId: s.academicYearId,
        academicYearName: s.academicYear?.name || `Năm học ${s.academicYearId}`,
        isActive: s.isActive !== undefined ? s.isActive : true,
      }))
    } catch (err) {
      console.error('Failed to get semesters:', err)
      return []
    }
  },

  createSemester: async (payload: {
    number: number
    startDate: string
    endDate: string
    academicYearId: number
  }): Promise<boolean> => {
    try {
      await apiClient.post('/semesters/admin', payload)
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
      academicYearId: number
    }
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/semesters/admin/${id}`, payload)
      return true
    } catch (err) {
      console.error('Failed to update semester:', err)
      throw err
    }
  },

  toggleSemesterStatus: async (id: number | string): Promise<boolean> => {
    try {
      await apiClient.patch(`/semesters/admin/${id}/change-status`)
      return true
    } catch (err) {
      console.error('Failed to toggle semester status:', err)
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

  getAcademicYears: async (): Promise<AcademicYearItem[]> => {
    try {
      const res: any = await apiClient.get('/academic-years')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((a: any) => ({
        id: a.id,
        name: a.name || `Năm học ${a.id}`,
        startDate: a.startDate,
        endDate: a.endDate,
        isActive: a.isActive,
      }))
    } catch (err) {
      console.error('Failed to get academic years:', err)
      return []
    }
  },

  // ==========================================
  // 6. TRAINING POINT CATEGORIES
  // ==========================================
  getPointCategories: async (): Promise<PointCategoryAdminItem[]> => {
    try {
      const res: any = await apiClient.get('/point-categories')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((c: any) => ({
        id: c.id,
        name: c.name,
        maximum: c.maximum || 0,
        level: c.level || 0,
        note: c.note,
        parentCategoryId: c.parentCategoryId,
        dateApply: c.dateApply,
        isActive: c.isActive !== undefined ? c.isActive : true,
        childrenOrder: c.childrenOrder,
      }))
    } catch (err) {
      console.error('Failed to get point categories:', err)
      return []
    }
  },

  createPointCategory: async (payload: {
    name: string
    maximum: number
    level: number
    note?: string
    parentCategoryId?: number | null
    dateApply?: string
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
    payload: Partial<{
      name: string
      maximum: number
      level: number
      note: string
      parentCategoryId: number | null
      dateApply: string
    }>
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
  getCriterias: async (): Promise<CriteriaAdminItem[]> => {
    try {
      const res: any = await apiClient.get('/criterias')
      const list = Array.isArray(res) ? res : res?.data || []
      return list
    } catch (err) {
      console.error('Failed to get criterias:', err)
      return []
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
    payload: {
      name: string
      level: number
      parentId?: number | null
      note?: string
      scope?: string
      requiredChildren?: number | null
    }
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
}
