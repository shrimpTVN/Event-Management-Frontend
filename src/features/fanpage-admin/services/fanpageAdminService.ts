import { apiClient } from '@/shared'
import type {
  FanpageSummary,
  FanpageActivityStats,
  UpcomingEventReminder,
  FanpageFeedPost,
  FanpageInvitation,
  AdminEvent,
  EventRegistrationItem,
  FanpageMember,
  VolunteerRecruitmentPost,
  VolunteerApplicant,
  PointCategoryItem,
  Sv5tCriteriaItem,
} from '../types/fanpageAdmin.types'

export const EMPTY_ACTIVITY_STATS: FanpageActivityStats = {
  periodLabel: '7 ngày gần nhất',
  eventsCount: 0,
  interactionsCount: 0,
  newFollowersCount: 0,
  responseRatePercent: 100,
  pendingCommentsCount: 0,
}

export const fanpageAdminService = {
  /**
   * Retrieves the current primary fanpage for the logged-in staff member
   */
  getCurrentFanpage: async (): Promise<FanpageSummary | null> => {
    const fanpages = await fanpageAdminService.getAvailableFanpages()
    return fanpages.length > 0 ? fanpages[0] : null
  },

  /**
   * Retrieves all managed fanpages of the authenticated fanpage admin
   */
  getAvailableFanpages: async (): Promise<FanpageSummary[]> => {
    try {
      const res: any = await apiClient.get('/fanpages/fanpage-admin/my-fanpages')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((fp: any) => ({
        id: String(fp.id),
        code:
          fp.code ||
          (fp.name?.includes('CNTT')
            ? 'CNTT'
            : fp.name?.includes('Cần Thơ') || fp.name?.includes('CTU')
              ? 'CTU'
              : 'CLB'),
        name: fp.name,
        fullName: fp.orgName || fp.name,
        avatarText: (fp.code || fp.name || 'FP').substring(0, 3).toUpperCase(),
        avatarUrl: fp.avatarUrl || '',
        role: fp.role || 'Quản trị viên',
        isVerified: fp.status === 'ACTIVE',
        email: fp.helpContact || fp.email || '',
        phone: fp.helpPhone || fp.phone || '',
        address: fp.address || 'Khu II, Đại học Cần Thơ',
        followersCount: fp.followersCount || fp.followerCount || 0,
        eventsCount: fp.eventsCount || fp.eventCount || 0,
        description: fp.description || '',
        parentOrg: fp.parentOrg || 'Đoàn Thanh niên - Hội Sinh viên ĐH Cần Thơ',
      }))
    } catch {
      return []
    }
  },

  /**
   * Fetches real-time activity statistics for a specific fanpage
   */
  getActivityStats: async (fanpageId?: string | number): Promise<FanpageActivityStats> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/activity-stats`)
      return res || EMPTY_ACTIVITY_STATS
    } catch {
      return EMPTY_ACTIVITY_STATS
    }
  },

  /**
   * Fetches the nearest upcoming event reminder for the dashboard
   */
  getUpcomingReminder: async (fanpageId?: string | number): Promise<UpcomingEventReminder | null> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/upcoming-reminder`)
      return res || null
    } catch {
      return null
    }
  },

  /**
   * Fetches feed of events belonging to a fanpage
   */
  getFeedPosts: async (fanpageId?: string | number): Promise<FanpageFeedPost[]> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/events`)
      const list = res?.content || (Array.isArray(res) ? res : [])
      return list.map((ev: any, idx: number) => ({
        id: `post-${ev.id}`,
        eventId: String(ev.id),
        authorName: ev.authorName || ev.fanpageName || 'Ban Tổ Chức',
        authorCode: 'BTC',
        authorAvatarText: (ev.authorName || 'FP').substring(0, 2).toUpperCase(),
        authorAvatarUrl: ev.authorAvatarUrl || ev.organizerAvatarUrl || '',
        timeAgo: ev.timeAgo || `${idx + 1} ngày trước`,
        isPublic: true,
        title: ev.name || ev.title,
        summary: ev.description || '',
        bannerUrl: ev.bannerUrl || '',
        startTime: ev.startTime || ev.dateHappen,
        endTime: ev.endTime,
        location: typeof ev.location === 'string' ? ev.location : (ev.location?.address || 'Khu II, Đại học Cần Thơ'),
        pointsReward: ev.pointsReward || ev.benefits || 'Cộng điểm rèn luyện',
        capacity: ev.capacity,
        quotaText: ev.capacityText || (ev.capacity ? `${ev.capacity} sinh viên` : 'Không giới hạn'),
        likesCount: ev.likesCount ?? 0,
        commentsCount: ev.commentsCount ?? 0,
        sharesCount: ev.sharesCount ?? 0,
        isLiked: Boolean(ev.isLiked),
      }))
    } catch {
      return []
    }
  },

  /**
   * Fetches pending invitations for staff to manage fanpages
   */
  getInvitations: async (): Promise<FanpageInvitation[]> => {
    try {
      const res: any = await apiClient.get('/fanpages/fanpage-admin/invitations')
      return Array.isArray(res) ? res : res?.data || []
    } catch {
      return []
    }
  },

  /**
   * Responds to a fanpage invitation (accept or reject)
   */
  respondInvitation: async (id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<void> => {
    await apiClient.patch(`/fanpages/fanpage-admin/invitations/${id}`, { status })
  },

  /**
   * Fetches full event list for fanpage admin management
   */
  getAdminEvents: async (fanpageId?: string | number): Promise<AdminEvent[]> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/events`)
      const list = res?.content || (Array.isArray(res) ? res : [])
      return list.map((ev: any, idx: number) => {
        const start = ev.startTime || ev.dateHappen || '2026-10-15T08:00:00Z'
        const end = ev.endTime || ev.dateHappen || '2026-10-15T11:30:00Z'
        const startDate = new Date(start)
        const endDate = new Date(end)
        const pad = (n: number) => n.toString().padStart(2, '0')
        const dateStart = !isNaN(startDate.getTime())
          ? `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`
          : '2026-10-15'
        const dateEnd = !isNaN(endDate.getTime())
          ? `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`
          : dateStart
        const timeStart = !isNaN(startDate.getTime())
          ? `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`
          : '08:00'
        const timeEnd = !isNaN(endDate.getTime())
          ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
          : '11:30'

        return {
          id: String(ev.id),
          code: ev.code || `EVT-${String(ev.id || idx).padStart(4, '0')}`,
          name: ev.name || ev.title,
          description: ev.description || '',
          eventTypeId: ev.eventTypeId || 1,
          eventTypeName: ev.eventTypeName || ev.category || 'Học thuật · Công nghệ',
          fanpageId: String(targetId),
          organizerName: ev.authorName || ev.fanpageName || 'Đoàn Trường CNTT & TT',
          dateStart,
          dateEnd,
          timeStart,
          timeEnd,
          format: (ev.location?.type as any) || 'OFFLINE',
          location: typeof ev.location === 'string' ? ev.location : (ev.location?.address || 'Hội trường Lớn Khu II ĐHCT'),
          capacity: ev.capacity || 200,
          registeredCount: ev.registeredCount || 0,
          checkedInCount: ev.checkedInCount || Math.floor((ev.registeredCount || 0) * 0.8),
          status: (ev.status as any) || 'PUBLISHED',
          bannerUrl: ev.bannerUrl || '',
          requiresApproval: Boolean(ev.requiresApproval),
          attendanceMethod: ev.attendanceMethod || 'MANUAL',
          attendanceSessionType: ev.attendanceSessionType || 'BOTH',
          autoEmail: true,
          isPublic: true,
          trainingPoints:
            Array.isArray(ev.eventPoints) && ev.eventPoints.length > 0
              ? ev.eventPoints.reduce((sum: number, p: any) => sum + (p.point || 0), 0)
              : (ev.trainingPoints !== undefined ? ev.trainingPoints : null),
          trainingPointCategoryName:
            ev.eventPoints?.[0]?.pointCategoryName || ev.trainingPointCategoryName || '',
          trainingPointCategoryCode:
            ev.eventPoints?.[0]?.pointCategoryCode || ev.trainingPointCategoryCode || '',
          sv5tCriteriaName: ev.criteriaName || ev.sv5tCriteriaName || null,
          hasCertificate: Boolean(ev.hasCertificate),
          tags: Array.isArray(ev.tags) ? ev.tags : [],
          createdAt: ev.createdAt || '2026-10-01',
        }
      })
    } catch {
      return []
    }
  },

  /**
   * Fetches attendee registration list for a specific event
   */
  getEventAttendees: async (
    fanpageId: string | number,
    eventId: string | number
  ): Promise<EventRegistrationItem[]> => {
    const targetFpId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(
        `/registrations/fanpage-member/fanpages/${targetFpId}/events/${eventId}/attendees`
      )
      const list = Array.isArray(res) ? res : res?.data || res?.content || []
      return list
    } catch (err) {
      console.error('Failed to fetch event attendees', err)
      return []
    }
  },

  /**
   * Finalizes event attendance and syncs to database
   */
  finalizeAttendance: async (
    fanpageId: string | number,
    eventId: string | number,
    attendees: EventRegistrationItem[]
  ): Promise<void> => {
    const targetFpId = fanpageId || '1'
    await apiClient.post(
      `/registrations/fanpage-member/fanpages/${targetFpId}/events/${eventId}/finalize`,
      { attendees }
    )
  },

  /**
   * Publishes a new event to the mock backend API
   */
  createAdminEvent: async (payload: any): Promise<any> => {
    try {
      const res: any = await apiClient.post('/events/fanpage-member', payload)
      return res?.data || res
    } catch (err) {
      console.error('Failed to create event', err)
      return null
    }
  },

  /**
   * Updates an existing event in the mock backend API
   */
  updateAdminEvent: async (id: string | number, payload: any): Promise<any> => {
    try {
      const res: any = await apiClient.put(`/events/fanpage-member/${id}`, payload)
      return res?.data || res
    } catch (err) {
      console.error('Failed to update event', err)
      return null
    }
  },

  /**
   * Retrieves all point categories (hierarchical tree)
   */
  getPointCategories: async (): Promise<PointCategoryItem[]> => {
    try {
      const res: any = await apiClient.get('/point-categories')
      const list = Array.isArray(res) ? res : res?.data || []
      return list
    } catch (err) {
      console.error('Failed to get point categories', err)
      return []
    }
  },

  /**
   * Retrieves all SV5T criteria (hierarchical tree)
   */
  getSv5tCriterias: async (): Promise<Sv5tCriteriaItem[]> => {
    try {
      const res: any = await apiClient.get('/criterias')
      const list = Array.isArray(res) ? res : res?.data || []
      return list
    } catch (err) {
      console.error('Failed to get criterias', err)
      return []
    }
  },

  /**
   * Retrieves fanpage details by ID
   */
  getFanpageDetail: async (fanpageId?: string | number): Promise<FanpageSummary | null> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}`)
      const fp = res?.data || res
      if (!fp || !fp.id) return null
      return {
        id: String(fp.id),
        code:
          fp.code ||
          (fp.name?.includes('CNTT')
            ? 'CNTT'
            : fp.name?.includes('Cần Thơ') || fp.name?.includes('CTU')
              ? 'CTU'
              : 'CLB'),
        name: fp.name,
        fullName: fp.orgName || fp.name,
        avatarText: (fp.code || fp.name || 'FP').substring(0, 3).toUpperCase(),
        avatarUrl: fp.avatarUrl || '',
        role: fp.role || 'Quản trị viên',
        isVerified: fp.status === 'ACTIVE',
        email: fp.helpContact || fp.email || '',
        phone: fp.helpPhone || fp.phone || '',
        address: fp.address || 'Khu II, Đại học Cần Thơ',
        followersCount: fp.followersCount || fp.followerCount || 0,
        eventsCount: fp.eventsCount || fp.eventCount || 0,
        description: fp.description || '',
        parentOrg: fp.parentOrg || 'Đoàn Thanh niên - Hội Sinh viên ĐH Cần Thơ',
        orgType: fp.orgType || 'Đoàn Khoa / Trường',
      }
    } catch (err) {
      console.error('Failed to get fanpage detail', err)
      return null
    }
  },

  /**
   * Updates fanpage information
   */
  updateFanpageProfile: async (
    fanpageId: string | number,
    data: Partial<FanpageSummary>
  ): Promise<FanpageSummary | null> => {
    const targetId = fanpageId || '1'
    try {
      const payload = {
        name: data.name,
        fullName: data.fullName,
        code: data.code,
        description: data.description,
        avatarUrl: data.avatarUrl,
        helpContact: data.email,
        email: data.email,
        helpPhone: data.phone,
        phone: data.phone,
        address: data.address,
        parentOrg: data.parentOrg,
        orgType: data.orgType,
      }
      const res: any = await apiClient.put(`/fanpages/fanpage-admin/${targetId}`, payload)
      return res?.data || res
    } catch (err) {
      console.error('Failed to update fanpage profile', err)
      throw err
    }
  },

  /**
   * Retrieves active members of the fanpage
   */
  getFanpageMembers: async (fanpageId?: string | number): Promise<FanpageMember[]> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/members`)
      const list = Array.isArray(res) ? res : res?.data || []
      return list
    } catch (err) {
      console.error('Failed to get fanpage members', err)
      return []
    }
  },

  /**
   * Adds a member to the fanpage
   */
  addFanpageMember: async (
    fanpageId: string | number,
    userId: string | number,
    role: string = 'COLLABORATOR'
  ): Promise<boolean> => {
    const targetId = fanpageId || '1'
    try {
      await apiClient.post(`/fanpages/fanpage-admin/${targetId}/add-member/${userId}`, { role })
      return true
    } catch (err) {
      console.error('Failed to add fanpage member', err)
      return false
    }
  },

  /**
   * Removes a member from the fanpage
   */
  removeFanpageMember: async (
    fanpageId: string | number,
    userId: string | number
  ): Promise<boolean> => {
    const targetId = fanpageId || '1'
    try {
      await apiClient.post(`/fanpages/fanpage-admin/${targetId}/remove-member/${userId}`)
      return true
    } catch (err) {
      console.error('Failed to remove fanpage member', err)
      return false
    }
  },
}

export const MOCK_SEMESTERS = [
  { id: 1, name: 'Học kỳ 1 (Năm học 2026 - 2027)' },
  { id: 2, name: 'Học kỳ 2 (Năm học 2026 - 2027)' },
]

export const MOCK_EVENT_TYPES = [
  { id: 1, name: 'Hướng nghiệp · Việc làm' },
  { id: 2, name: 'Học thuật · Nghiên cứu · Công nghệ' },
  { id: 3, name: 'Tình nguyện · Hoạt động xã hội' },
  { id: 4, name: 'Văn hóa · Văn nghệ · Thể thao' },
  { id: 5, name: 'Kỹ năng mềm · Hội thảo' },
]

export const MOCK_POINT_CATEGORIES = [
  { id: 1, name: 'Điều 1: Ý thức tham gia học tập (Tối đa 20đ)' },
  { id: 2, name: 'Điều 2: Ý thức chấp hành nội quy, quy chế (Tối đa 25đ)' },
  { id: 3, name: 'Điều 3: Hoạt động chính trị - xã hội, văn hóa, thể thao (Tối đa 20đ)' },
  { id: 4, name: 'Điều 4: Phẩm chất công dân và quan hệ cộng đồng (Tối đa 25đ)' },
  { id: 5, name: 'Điều 5: Ý thức và trách nhiệm phụ trách tập thể, đoàn thể (Tối đa 10đ)' },
]

export const MOCK_SV5T_CRITERIAS = [
  { id: 1, name: 'Tiêu chí 1: Đạo đức tốt' },
  { id: 2, name: 'Tiêu chí 2: Học tập tốt' },
  { id: 3, name: 'Tiêu chí 3: Thể lực tốt' },
  { id: 4, name: 'Tiêu chí 4: Tình nguyện tốt' },
  { id: 5, name: 'Tiêu chí 5: Hội nhập tốt' },
]

export const MOCK_ADMIN_EVENTS: AdminEvent[] = []

export const MOCK_EVENT_REGISTRATIONS: EventRegistrationItem[] = [
  {
    id: 'reg-01',
    userId: 'u-101',
    studentId: 'B2100123',
    fullName: 'Lê Hoàng Anh',
    major: 'Kỹ thuật Phần mềm',
    kNumber: 47,
    email: 'anhlhb2100123@student.ctu.edu.vn',
    phone: '0901 234 567',
    registeredAt: '2026-10-02 09:15',
    status: 'COMPLETED',
    entryCheckInTime: '07:45',
    pinCheckInTime: '10:15',
    checkInTime: '2026-10-12 10:15',
  },
  {
    id: 'reg-02',
    userId: 'u-102',
    studentId: 'B2100456',
    fullName: 'Trần Ngọc Bích',
    major: 'Khoa học Máy tính',
    kNumber: 47,
    email: 'bichtnb2100456@student.ctu.edu.vn',
    phone: '0912 345 678',
    registeredAt: '2026-10-02 10:30',
    status: 'ENTRY_CHECKED',
    entryCheckInTime: '07:55',
  },
  {
    id: 'reg-03',
    userId: 'u-103',
    studentId: 'B2200789',
    fullName: 'Nguyễn Văn Minh',
    major: 'Hệ thống Thông tin',
    kNumber: 48,
    email: 'minhnvb2200789@student.ctu.edu.vn',
    phone: '0923 456 789',
    registeredAt: '2026-10-03 14:02',
    status: 'APPROVED',
  },
  {
    id: 'reg-04',
    userId: 'u-104',
    studentId: 'B2200321',
    fullName: 'Phạm Thu Thảo',
    major: 'An toàn Thông tin',
    kNumber: 48,
    email: 'thaoptb2200321@student.ctu.edu.vn',
    phone: '0934 567 890',
    registeredAt: '2026-10-03 16:45',
    status: 'APPROVED',
  },
  {
    id: 'reg-05',
    userId: 'u-105',
    studentId: 'B2300654',
    fullName: 'Võ Quốc Huy',
    major: 'Mạng máy tính & TT',
    kNumber: 49,
    email: 'huyvqb2300654@student.ctu.edu.vn',
    phone: '0945 678 901',
    registeredAt: '2026-10-04 08:20',
    status: 'COMPLETED',
    entryCheckInTime: '08:05',
    pinCheckInTime: '10:18',
    checkInTime: '2026-10-12 10:18',
  },
  {
    id: 'reg-06',
    userId: 'u-106',
    studentId: 'B2109876',
    fullName: 'Đỗ Đăng Khoa',
    major: 'Kỹ thuật Phần mềm',
    kNumber: 47,
    email: 'khoaddb2109876@student.ctu.edu.vn',
    phone: '0956 789 012',
    registeredAt: '2026-10-04 09:12',
    status: 'ABSENTED',
  },
]

export const MOCK_FANPAGE_MEMBERS: FanpageMember[] = [
  {
    id: 'mem-2',
    userId: '2',
    staffId: 'CB-0104',
    fullName: 'Nguyễn Minh Anh',
    email: 'organizer@ctu.edu.vn',
    avatarText: 'MA',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    role: 'ADMIN',
    title: 'Quản trị viên (Trưởng ban)',
    phone: '0912 345 678',
    joinedAt: '2026-08-15',
    isActive: true,
  },
  {
    id: 'mem-101',
    userId: '101',
    staffId: 'B2100123',
    fullName: 'Lê Hoàng Anh',
    email: 'anhlhb2100123@student.ctu.edu.vn',
    avatarText: 'LA',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    role: 'COLLABORATOR',
    title: 'Cộng tác viên ban tổ chức',
    phone: '0901 234 567',
    joinedAt: '2026-09-05',
    isActive: true,
  },
  {
    id: 'mem-102',
    userId: '102',
    staffId: 'B2100456',
    fullName: 'Trần Ngọc Bích',
    email: 'bichtnb2100456@student.ctu.edu.vn',
    avatarText: 'TB',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    role: 'COLLABORATOR',
    title: 'Cộng tác viên ban tổ chức',
    phone: '0912 345 678',
    joinedAt: '2026-09-12',
    isActive: true,
  },
  {
    id: 'mem-103',
    userId: '103',
    staffId: 'B2200789',
    fullName: 'Nguyễn Văn Minh',
    email: 'minhnvb2200789@student.ctu.edu.vn',
    avatarText: 'NM',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    role: 'COLLABORATOR',
    title: 'Cộng tác viên ban tổ chức',
    phone: '0923 456 789',
    joinedAt: '2026-09-20',
    isActive: true,
  },
]

export const MOCK_FANPAGE_INVITATIONS: FanpageInvitation[] = [
  {
    id: 'inv-1',
    email: 'vananb2100111@student.ctu.edu.vn',
    role: 'COLLABORATOR',
    invitedBy: 'Nguyễn Minh Anh (Admin)',
    invitedAt: '2026-10-22 14:30',
    status: 'PENDING',
  },
  {
    id: 'inv-2',
    email: 'minhtrietb2200222@student.ctu.edu.vn',
    role: 'COLLABORATOR',
    invitedBy: 'Nguyễn Minh Anh (Admin)',
    invitedAt: '2026-10-23 09:15',
    status: 'PENDING',
  },
]

export const MOCK_EVENT_VOLUNTEERS = [
  {
    id: 'vol-1',
    studentId: 'B2100888',
    fullName: 'Lê Phương Thảo',
    major: 'Kỹ thuật Phần mềm',
    phone: '0901 112 233',
    role: 'CHECKIN' as const,
    roleName: 'Điểm danh & Đón tiếp',
    taskDescription: 'Trực bàn cổng đón tiếp, xác nhận MSSV cho vào hội trường',
    status: 'COMPLETED' as const,
    trainingPoints: 10,
    sv5tCriteria: 'Tiêu chí 4: Tình nguyện tốt',
    hasCertificate: true,
  },
  {
    id: 'vol-2',
    studentId: 'B2100999',
    fullName: 'Nguyễn Minh Tuấn',
    major: 'Khoa học Máy tính',
    phone: '0902 223 344',
    role: 'CHECKIN' as const,
    roleName: 'Điểm danh & Đón tiếp',
    taskDescription: 'Hỗ trợ kiểm tra danh sách sinh viên và giải quyết khiếu nại',
    status: 'COMPLETED' as const,
    trainingPoints: 10,
    sv5tCriteria: 'Tiêu chí 4: Tình nguyện tốt',
    hasCertificate: true,
  },
  {
    id: 'vol-3',
    studentId: 'B2200111',
    fullName: 'Phạm Văn Hậu',
    major: 'Hệ thống Thông tin',
    phone: '0903 334 455',
    role: 'LOGISTICS' as const,
    roleName: 'Hậu cần & Âm thanh',
    taskDescription: 'Hỗ trợ kỹ thuật màn hình, máy chiếu và micro cho diễn giả',
    status: 'CHECKED_IN' as const,
    trainingPoints: 8,
    sv5tCriteria: 'Tiêu chí 4: Tình nguyện tốt',
    hasCertificate: true,
  },
  {
    id: 'vol-4',
    studentId: 'B2200222',
    fullName: 'Huỳnh Thị Mai',
    major: 'An toàn Thông tin',
    phone: '0904 445 566',
    role: 'LOGISTICS' as const,
    roleName: 'Hậu cần & Âm thanh',
    taskDescription: 'Sắp xếp bàn ghế, nước uống cho doanh nghiệp và quà tặng',
    status: 'CHECKED_IN' as const,
    trainingPoints: 8,
    sv5tCriteria: 'Tiêu chí 4: Tình nguyện tốt',
    hasCertificate: true,
  },
  {
    id: 'vol-5',
    studentId: 'B2300333',
    fullName: 'Vũ Đức Trọng',
    major: 'Mạng máy tính & TT',
    phone: '0905 556 677',
    role: 'RECEPTION' as const,
    roleName: 'Lễ tân & Khách mời',
    taskDescription: 'Đón tiếp đại diện doanh nghiệp, hướng dẫn chỗ ngồi VIP',
    status: 'ASSIGNED' as const,
    trainingPoints: 8,
    sv5tCriteria: 'Tiêu chí 4: Tình nguyện tốt',
    hasCertificate: true,
  },
  {
    id: 'vol-6',
    studentId: 'B2300444',
    fullName: 'Đỗ Quỳnh Anh',
    major: 'Truyền thông Đa phương tiện',
    phone: '0906 667 788',
    role: 'MEDIA' as const,
    roleName: 'Truyền thông & Chụp ảnh',
    taskDescription: 'Chụp hình kỷ niệm toàn cảnh sự kiện và đăng tin fanpage',
    status: 'ASSIGNED' as const,
    trainingPoints: 8,
    sv5tCriteria: 'Tiêu chí 4: Tình nguyện tốt',
    hasCertificate: true,
  },
]

export const MOCK_VOLUNTEER_POST: VolunteerRecruitmentPost = {
  id: 'vol-post-01',
  eventId: 'evt-ai-workshop-2026',
  title: 'Tuyển Tình nguyện viên hỗ trợ Workshop AI & Machine Learning 2026',
  description:
    'Ban tổ chức tuyển 10 bạn Tình nguyện viên nhiệt tình, có tinh thần trách nhiệm tham gia hỗ trợ các khâu đón tiếp khách mời, check-in cửa hội trường, kỹ thuật máy chiếu và hậu cần sự kiện.',
  benefits: [
    '+10 Điểm rèn luyện Ban tổ chức',
    'Cộng điểm tiêu chí Tình nguyện tốt (SV5T)',
    'Giấy chứng nhận CTV Ban tổ chức cấp Đoàn trường',
    'Hỗ trợ suất ăn nhẹ và teabreak tại sự kiện',
  ],
  targetCount: 10,
  deadline: '2026-10-10 23:59',
  status: 'OPEN',
  createdAt: '2026-10-01',
  rolesNeeded: [
    {
      role: 'CHECKIN',
      roleName: 'Điểm danh & Đón tiếp',
      targetCount: 4,
      description: 'Hỗ trợ kiểm tra thông tin MSSV tại cửa, hướng dẫn sinh viên ổn định chỗ ngồi',
    },
    {
      role: 'LOGISTICS',
      roleName: 'Hậu cần & Máy chiếu',
      targetCount: 3,
      description: 'Chuẩn bị micro, quản lý máy chiếu trình chiếu mã PIN, sắp xếp teabreak',
    },
    {
      role: 'RECEPTION',
      roleName: 'Lễ tân & Khách mời',
      targetCount: 2,
      description: 'Đón tiếp diễn giả từ doanh nghiệp, trao hoa và quà lưu niệm',
    },
    {
      role: 'MEDIA',
      roleName: 'Truyền thông & Chụp ảnh',
      targetCount: 1,
      description: 'Chụp ảnh sự kiện và hỗ trợ đăng bài recap trên fanpage',
    },
  ],
}

export const MOCK_VOLUNTEER_APPLICANTS: VolunteerApplicant[] = [
  {
    id: 'app-01',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2100888',
    fullName: 'Trần Bảo Ngọc',
    major: 'Kỹ thuật Phần mềm',
    kNumber: 47,
    email: 'ngoctbb2100888@student.ctu.edu.vn',
    phone: '0901 112 233',
    appliedRole: 'CHECKIN',
    assignedRole: 'CHECKIN',
    reason: 'Đã có kinh nghiệm làm lễ tân và check-in cho 2 hội thảo cấp trường năm 2025.',
    appliedAt: '2026-10-02 14:20',
    status: 'APPROVED',
  },
  {
    id: 'app-02',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2100999',
    fullName: 'Nguyễn Minh Tuấn',
    major: 'Khoa học Máy tính',
    kNumber: 47,
    email: 'tuannmb2100999@student.ctu.edu.vn',
    phone: '0902 223 344',
    appliedRole: 'CHECKIN',
    assignedRole: 'CHECKIN',
    reason: 'Muốn rèn luyện kỹ năng giao tiếp và đóng góp cho hoạt động phong trào Đoàn trường.',
    appliedAt: '2026-10-02 15:10',
    status: 'APPROVED',
  },
  {
    id: 'app-03',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2200111',
    fullName: 'Phạm Văn Hậu',
    major: 'Hệ thống Thông tin',
    kNumber: 48,
    email: 'haupvb2200111@student.ctu.edu.vn',
    phone: '0903 334 455',
    appliedRole: 'LOGISTICS',
    assignedRole: 'LOGISTICS',
    reason: 'Rành kỹ thuật âm thanh, máy chiếu và setup thiết bị hội trường.',
    appliedAt: '2026-10-03 08:30',
    status: 'APPROVED',
  },
  {
    id: 'app-04',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2200222',
    fullName: 'Huỳnh Thị Mai',
    major: 'An toàn Thông tin',
    kNumber: 48,
    email: 'maihtb2200222@student.ctu.edu.vn',
    phone: '0904 445 566',
    appliedRole: 'LOGISTICS',
    assignedRole: 'LOGISTICS',
    reason: 'Nhiệt tình, chu đáo, có thể hỗ trợ chuẩn bị quà tặng và nước uống.',
    appliedAt: '2026-10-03 10:15',
    status: 'APPROVED',
  },
  {
    id: 'app-05',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2300333',
    fullName: 'Vũ Đức Trọng',
    major: 'Mạng máy tính & TT',
    kNumber: 49,
    email: 'trongvdb2300333@student.ctu.edu.vn',
    phone: '0905 556 677',
    appliedRole: 'RECEPTION',
    assignedRole: 'RECEPTION',
    reason: 'Giao tiếp tốt, tự tin đón tiếp khách mời và đại biểu doanh nghiệp.',
    appliedAt: '2026-10-04 11:45',
    status: 'APPROVED',
  },
  {
    id: 'app-06',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2300444',
    fullName: 'Đỗ Quỳnh Anh',
    major: 'Truyền thông Đa phương tiện',
    kNumber: 49,
    email: 'anhdqb2300444@student.ctu.edu.vn',
    phone: '0906 667 788',
    appliedRole: 'MEDIA',
    assignedRole: 'MEDIA',
    reason: 'Có máy ảnh cá nhân Sony A6400, kinh nghiệm chụp ảnh sự kiện CLB.',
    appliedAt: '2026-10-04 16:20',
    status: 'APPROVED',
  },
  {
    id: 'app-07',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2200555',
    fullName: 'Lê Quốc Huy',
    major: 'Khoa học Máy tính',
    kNumber: 48,
    email: 'huylqb2200555@student.ctu.edu.vn',
    phone: '0907 778 899',
    appliedRole: 'CHECKIN',
    reason: 'Em muốn thử sức phụ trách quét mã và điểm danh tại bàn tiếp đón sinh viên.',
    appliedAt: '2026-10-05 09:00',
    status: 'PENDING',
  },
  {
    id: 'app-08',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2300666',
    fullName: 'Võ Thảo My',
    major: 'Kỹ thuật Phần mềm',
    kNumber: 49,
    email: 'myvtb2300666@student.ctu.edu.vn',
    phone: '0908 889 900',
    appliedRole: 'RECEPTION',
    reason: 'Em từng tham gia đội tân sinh viên, mong muốn hỗ trợ công tác khánh tiết.',
    appliedAt: '2026-10-05 13:40',
    status: 'PENDING',
  },
  {
    id: 'app-09',
    recruitmentId: 'vol-post-01',
    eventId: 'evt-ai-workshop-2026',
    studentId: 'B2100777',
    fullName: 'Ngô Thanh Sơn',
    major: 'Hệ thống Thông tin',
    kNumber: 47,
    email: 'sonntb2100777@student.ctu.edu.vn',
    phone: '0909 990 011',
    appliedRole: 'LOGISTICS',
    reason: 'Thời gian đăng ký bị trùng giờ học nhưng em có thể đến trễ 30 phút.',
    appliedAt: '2026-10-06 08:15',
    status: 'REJECTED',
  },
]
