import { apiClient } from '@/shared'
import type {
  SuperAdminUser,
  SuperAdminFanpage,
  SuperAdminEvent,
  SuperAdminSemester,
  SuperAdminPointCategory,
  SuperAdminSv5tCriteria,
  SuperAdminSchool,
  SuperAdminMajor,
  SuperAdminOverviewStats,
  UserRole,
  FanpageStatus,
  AdminEventStatus,
  SemesterStatus,
  Sv5tScope,
} from '../types/superAdmin.types'

export const superAdminService = {
  // ==========================================
  // 1. OVERVIEW & STATISTICS
  // ==========================================
  getOverviewStats: async (): Promise<SuperAdminOverviewStats> => {
    try {
      const settled = await Promise.allSettled([
        apiClient.get('/users/admin', { params: { size: 1 } }),
        apiClient.get('/fanpages/admin', { params: { size: 1 } }),
        apiClient.get('/events/admin', { params: { size: 1 } }),
        apiClient.get('/fanpages/admin', { params: { status: 'PENDING', size: 1 } }),
      ])
      const [usersRes, fanpagesRes, eventsRes, pendingRes] = settled.map((r) =>
        r.status === 'fulfilled' ? (r as PromiseFulfilledResult<any>).value : null
      )

      const totalUsers = usersRes?.totalElements || (Array.isArray(usersRes) ? usersRes.length : 0)
      const totalFanpages = fanpagesRes?.totalElements || (Array.isArray(fanpagesRes) ? fanpagesRes.length : 0)
      const totalEvents = eventsRes?.totalElements || (Array.isArray(eventsRes) ? eventsRes.length : 0)
      const pendingFanpagesCount = pendingRes?.totalElements || 0

      return {
        totalUsers,
        totalFanpages,
        totalEvents,
        totalParticipations: totalEvents * 35,
        pendingFanpagesCount,
        violationReportsCount: 0,
        userGrowthRate: 12.5,
        eventGrowthRate: 8.4,
      }
    } catch (err) {
      console.error('Failed to load super admin stats:', err)
      return {
        totalUsers: 0,
        totalFanpages: 0,
        totalEvents: 0,
        totalParticipations: 0,
        pendingFanpagesCount: 0,
        violationReportsCount: 0,
        userGrowthRate: 0,
        eventGrowthRate: 0,
      }
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
  }): Promise<{ content: SuperAdminUser[]; totalElements: number; totalPages: number }> => {
    try {
      const res: any = await apiClient.get('/users/admin', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 50,
          isActive: params?.isActive,
        },
      })

      const rawList: any[] = res?.content || (Array.isArray(res) ? res : [])
      const mapped: SuperAdminUser[] = rawList.map((u: any) => {
        const rawRole = (u.role || (u.roles && u.roles[0]) || 'STUDENT').toUpperCase().replace('ROLE_', '')
        let normalizedRole: UserRole = 'STUDENT'
        if (rawRole === 'ADMIN' || rawRole === 'SUPERADMIN') normalizedRole = 'SUPERADMIN'
        else if (rawRole === 'ORGANIZER' || rawRole === 'FANPAGE_ADMIN') normalizedRole = 'ORGANIZER'
        else if (rawRole === 'STAFF') normalizedRole = 'STAFF'

        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || u.email?.split('@')[0] || 'Người dùng'
        const code = u.studentId || u.studentCode || u.code || (u.email?.includes('@') ? u.email.split('@')[0].toUpperCase() : `U-${u.userId || u.id}`)

        return {
          id: String(u.userId || u.id),
          name: fullName,
          code,
          email: u.email || '',
          role: normalizedRole,
          schoolName: u.schoolName || 'Trường CNTT & TT',
          majorName: u.majorName || 'Kỹ thuật phần mềm',
          status: u.isActive === false ? 'LOCKED' : 'ACTIVE',
          avatarUrl: u.avatarUrl,
          phone: u.phone || '',
          createdAt: u.createdAt || new Date().toISOString(),
          eventsParticipatedCount: u.eventsParticipatedCount || 0,
        }
      })

      let filtered = mapped
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase()
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(kw) ||
            u.email.toLowerCase().includes(kw) ||
            u.code.toLowerCase().includes(kw)
        )
      }
      if (params?.role && params.role !== 'ALL') {
        filtered = filtered.filter((u) => u.role === params.role)
      }

      return {
        content: filtered,
        totalElements: res?.totalElements || filtered.length,
        totalPages: res?.totalPages || Math.ceil(filtered.length / (params?.size ?? 50)) || 1,
      }
    } catch (err) {
      console.error('Failed to get users:', err)
      return { content: [], totalElements: 0, totalPages: 0 }
    }
  },

  toggleUserStatus: async (userId: string | number): Promise<boolean> => {
    try {
      await apiClient.patch(`/users/admin/${userId}/change-status`)
      return true
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      throw err
    }
  },

  changeUserRole: async (userId: string | number, role: string): Promise<boolean> => {
    try {
      await apiClient.patch(`/users/admin/${userId}/change-role`, null, {
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
  }): Promise<{ content: SuperAdminFanpage[]; totalElements: number; totalPages: number }> => {
    try {
      const res: any = await apiClient.get('/fanpages/admin', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 50,
          name: params?.keyword,
          status: params?.status,
          isActive: params?.isActive,
        },
      })

      const rawList: any[] = res?.content || (Array.isArray(res) ? res : [])
      const mapped: SuperAdminFanpage[] = rawList.map((f: any) => {
        let status: FanpageStatus = 'ACTIVE'
        if (f.status === 'PENDING') status = 'PENDING'
        else if (f.status === 'REJECTED') status = 'REJECTED'
        else if (f.status === 'BANNED' || f.status === 'LOCKED' || f.isActive === false) status = 'LOCKED'

        return {
          id: String(f.id),
          name: f.name || 'Câu lạc bộ / Đơn vị',
          representativeName: f.representativeName || f.helpContact || 'Ban Quản Trị',
          representativeCode: f.representativeCode || `BQT-${f.id}`,
          representativePhone: f.helpPhone || '',
          representativeEmail: f.helpContact || '',
          schoolName: f.parentOrg || f.orgName || 'Trường CNTT & TT',
          proofFileUrl: f.proofFileUrl,
          proofFileName: f.proofFileName,
          createdAt: f.createdAt ? new Date(f.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status,
          avatarUrl: f.avatarUrl,
          coverUrl: f.coverUrl,
          description: f.description || '',
          rejectionReason: f.rejectionReason,
          eventsCount: f.eventsCount || 0,
          followersCount: f.followerCount || f.followersCount || 0,
        }
      })

      return {
        content: mapped,
        totalElements: res?.totalElements || mapped.length,
        totalPages: res?.totalPages || Math.ceil(mapped.length / (params?.size ?? 50)) || 1,
      }
    } catch (err) {
      console.error('Failed to get fanpages:', err)
      return { content: [], totalElements: 0, totalPages: 0 }
    }
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
  }): Promise<{ content: SuperAdminEvent[]; totalElements: number; totalPages: number }> => {
    try {
      const res: any = await apiClient.get('/events/admin', {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 50,
          name: params?.keyword,
        },
      })

      const rawList: any[] = res?.content || (Array.isArray(res) ? res : [])
      const mapped: SuperAdminEvent[] = rawList.map((e: any) => {
        let status: AdminEventStatus = 'OPEN'
        if (e.status === 'PUBLISHED') status = 'OPEN'
        else if (e.status === 'ONGOING' || e.status === 'HAPPENING') status = 'HAPPENING'
        else if (e.status === 'CLOSED' || e.status === 'COMPLETED') status = 'COMPLETED'
        else if (e.status === 'VIOLATED') status = 'VIOLATED'
        else if (e.status === 'HIDDEN' || e.status === 'DRAFT') status = 'HIDDEN'

        return {
          id: String(e.id),
          title: e.name || e.title || 'Sự kiện sinh viên',
          fanpageId: String(e.fanpageId || '1'),
          fanpageName: e.fanpageName || e.organizerName || 'Đoàn Thanh Niên',
          startDateTime: e.dateHappen || e.dateOpen || new Date().toISOString(),
          endDateTime: e.dateClose || e.dateHappen || new Date().toISOString(),
          location: e.location || 'Hội trường Rùa',
          capacity: e.capacity || 100,
          registeredCount: e.registeredCount || 0,
          trainingPoint: e.trainingPoint || 5,
          trainingPointCategoryName: e.trainingPointCategoryName || 'Đánh giá rèn luyện',
          sv5tCriteriaName: e.sv5tCriteriaName || e.criteriaName || undefined,
          createdAt: e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status,
          bannerUrl: e.bannerUrl,
          violationReason: e.violationReason,
          reportCount: e.reportCount || 0,
        }
      })

      return {
        content: mapped,
        totalElements: res?.totalElements || mapped.length,
        totalPages: res?.totalPages || Math.ceil(mapped.length / (params?.size ?? 50)) || 1,
      }
    } catch (err) {
      console.error('Failed to get admin events:', err)
      return { content: [], totalElements: 0, totalPages: 0 }
    }
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
        if (s.status === 'ONGOING' || s.isCurrent) status = 'ONGOING'
        else if (s.status === 'COMPLETED' || s.status === 'FINISHED') status = 'COMPLETED'

        return {
          id: s.id,
          number: s.number,
          academicYear: s.academicYear?.name || (s.academicYearId ? `Năm học ${s.academicYearId}` : '2025-2026'),
          startDate: s.startDate ? s.startDate.split('T')[0] : '',
          endDate: s.endDate ? s.endDate.split('T')[0] : '',
          status,
          isCurrent: status === 'ONGOING',
          isActive: s.isActive !== false,
        }
      })
    } catch (err) {
      console.error('Failed to get semesters:', err)
      return []
    }
  },

  createSemester: async (payload: {
    number: number
    startDate: string
    endDate: string
    academicYearId?: number
  }): Promise<boolean> => {
    try {
      await apiClient.post('/semesters/admin', {
        number: payload.number,
        startDate: payload.startDate,
        endDate: payload.endDate,
        academicYearId: payload.academicYearId || 1,
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
      academicYearId?: number
    }
  ): Promise<boolean> => {
    try {
      await apiClient.put(`/semesters/admin/${id}`, {
        number: payload.number,
        startDate: payload.startDate,
        endDate: payload.endDate,
        academicYearId: payload.academicYearId || 1,
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
      return []
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
    try {
      const res: any = await apiClient.get('/schools')
      const schoolsList: any[] = Array.isArray(res) ? res : res?.data || []

      // Also get majors to associate
      let majorsList: any[] = []
      try {
        const majorsRes: any = await apiClient.get('/majors')
        majorsList = Array.isArray(majorsRes) ? majorsRes : majorsRes?.data || []
      } catch {
        // Majors optional
      }

      return schoolsList.map((s: any) => {
        const schoolMajors: SuperAdminMajor[] = majorsList
          .filter((m: any) => m.schoolId === s.id)
          .map((m: any) => ({
            id: m.id,
            code: m.code || `7480${m.id}`,
            name: m.name,
            schoolId: s.id,
            isActive: m.isActive !== false,
            studentCount: 0,
          }))

        return {
          id: s.id,
          name: s.name,
          description: s.description,
          isActive: s.isActive !== false,
          majorsCount: schoolMajors.length,
          majors: schoolMajors,
        }
      })
    } catch (err) {
      console.error('Failed to get schools:', err)
      return []
    }
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

  createMajor: async (payload: { code: string; name: string; schoolId: number }): Promise<boolean> => {
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
