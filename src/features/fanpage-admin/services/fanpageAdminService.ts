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


const CTU_CRITERIA_CODE_MAP: Record<number, string> = {
  10: 'mục I.a',
  11: 'mục I.b',
  12: 'mục I.c',
  20: 'mục II.a',
  21: 'mục II.b',
  30: 'mục III.a',
  31: 'mục III.b',
  32: 'mục III.c',
  40: 'mục IV.a',
  41: 'mục IV.b',
  50: 'mục V.a',
  51: 'mục V.b',
  52: 'mục V.c',
  511: 'mục V.b',
  512: 'mục V.b',
  311: 'mục III.b',
  312: 'mục III.b',
  301: 'mục III.a',
}

function formatEventPointsReward(ev: any): string {
  if (Array.isArray(ev.eventPoints) && ev.eventPoints.length > 0) {
    const rewards: string[] = []
    const totalPoints = ev.eventPoints.reduce((sum: number, p: any) => sum + (p.point || 0), 0)
    const firstCatId = ev.eventPoints[0]?.pointCategoryId
    const code = CTU_CRITERIA_CODE_MAP[firstCatId] || ev.eventPoints[0]?.pointCategoryCode || ''
    const pointsFormatted = totalPoints < 10 ? `0${totalPoints}` : `${totalPoints}`
    rewards.push(`Cộng ${pointsFormatted} điểm rèn luyện ${code}`.trim())

    if (ev.criteriaName || ev.sv5tCriteriaName) {
      rewards.push(`Tiêu chuẩn SV5T: ${ev.criteriaName || ev.sv5tCriteriaName}`)
    }
    if (ev.hasCertificate) {
      rewards.push('Cấp chứng nhận điện tử')
    }
    return rewards.join(' · ')
  }

  if (ev.trainingPoints && ev.trainingPoints > 0) {
    const pointsFormatted = ev.trainingPoints < 10 ? `0${ev.trainingPoints}` : `${ev.trainingPoints}`
    const code = ev.trainingPointCategoryCode ? `mục ${ev.trainingPointCategoryCode}` : ''
    return `Cộng ${pointsFormatted} điểm rèn luyện ${code}`.trim()
  }

  return ev.pointsReward || ev.benefits || 'Cộng điểm rèn luyện'
}

function formatPostTimeAgo(dateInput?: string): string {
  if (!dateInput) return 'Vừa xong'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'Vừa xong'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`

  if (diffMinutes < 1) return 'Vừa xong'
  if (diffMinutes < 60) return `${diffMinutes} phút trước`
  if (diffHours < 24 && now.getDate() === date.getDate()) return `Hôm nay lúc ${timeStr}`
  if (diffDays === 1 || (diffHours < 48 && now.getDate() - date.getDate() === 1)) {
    return `Hôm qua lúc ${timeStr}`
  }
  return dateStr
}

export const fanpageAdminService = {
  /**
   * Fetches real follower count of fanpage
   */
  getFanpageFollowerCount: async (fanpageId?: string | number): Promise<number> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpages/${targetId}/followers/count`)
      return res?.followerCount ?? res?.count ?? 0
    } catch {
      return 0
    }
  },
  /**
   * Retrieves the current primary fanpage for the logged-in staff member
   */
  getCurrentFanpage: async (): Promise<FanpageSummary | null> => {
    const fanpages = await fanpageAdminService.getAvailableFanpages()
    return fanpages.length > 0 ? fanpages[0] : null
  },

  /**
   * Retrieves all managed fanpages of the authenticated user (admin or student collaborator)
   */
  getAvailableFanpages: async (): Promise<FanpageSummary[]> => {
    try {
      let res: any
      try {
        res = await apiClient.get('/fanpages/my-fanpages')
      } catch {
        res = await apiClient.get('/fanpages/fanpage-admin/my-fanpages')
      }
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((fp: any) => {
        const id = String(fp.fanpageId || fp.id)
        const name = fp.fanpageName || fp.name || ''
        const code =
          fp.code ||
          (name.includes('CNTT')
            ? 'CNTT'
            : name.includes('Cần Thơ') || name.includes('CTU')
              ? 'CTU'
              : 'CLB')
        const role =
          fp.role === 'ADMIN'
            ? 'Quản trị viên'
            : fp.role === 'MEMBER'
              ? 'Cộng tác viên'
              : fp.role || 'Quản trị viên'

        return {
          id,
          code,
          name,
          fullName: fp.fanpageOrgName || fp.orgName || name,
          avatarText: (code || name || 'FP').substring(0, 3).toUpperCase(),
          avatarUrl: fp.fanpageAvatarUrl || fp.avatarUrl || '',
          role,
          isVerified: fp.status === 'ACTIVE' || true,
          email: fp.helpContact || fp.email || '',
          phone: fp.helpPhone || fp.phone || '',
          address: fp.address || 'Khu II, Đại học Cần Thơ',
          followersCount: fp.followersCount || fp.followerCount || 0,
          eventsCount: fp.eventsCount || fp.eventCount || 0,
          description: fp.fanpageDescription || fp.description || '',
          parentOrg: fp.parentOrg || 'Đoàn Thanh niên - Hội Sinh viên ĐH Cần Thơ',
        }
      })
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
      const res: any = await apiClient.get(`/events/fanpage/${targetId}?size=100`)
      const list = res?.content || res?.data?.content || res?.data || (Array.isArray(res) ? res : [])
      const isCntt = String(targetId) === '1'
      return list.map((ev: any) => ({
        id: `post-${ev.id}`,
        eventId: String(ev.id),
        authorName: ev.authorName || (isCntt || ev.fanpageName?.includes('CNTT') ? 'Đoàn Trường Công Nghệ Thông Tin và Truyền Thông' : ev.fanpageName) || 'Ban Tổ Chức',
        authorCode: 'BTC',
        authorAvatarText: (ev.authorName || 'FP').substring(0, 2).toUpperCase(),
        authorAvatarUrl: ev.authorAvatarUrl || ev.organizerAvatarUrl || (isCntt || ev.fanpageName?.includes('CNTT') ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg' : ''),
        timeAgo: formatPostTimeAgo(ev.createdAt || ev.updatedAt || ev.dateOpen),
        isPublic: true,
        title: ev.name || ev.title,
        summary: ev.description || '',
        bannerUrl: ev.bannerUrl || '',
        startTime: ev.startTime || ev.dateHappen,
        endTime: ev.endTime,
        location: typeof ev.location === 'string' ? ev.location : (ev.location?.address || 'Khu II, Đại học Cần Thơ'),
        pointsReward: formatEventPointsReward(ev),
        capacity: ev.capacity,
        quotaText: ev.capacityText || (ev.capacity ? `${ev.capacity} sinh viên` : 'Không giới hạn'),
        likesCount: ev.likesCount ?? 0,
        commentsCount: ev.commentsCount ?? 0,
        sharesCount: ev.sharesCount ?? 0,
        isLiked: Boolean(ev.isLiked),
        eventTypeName: ev.eventTypeName || ev.eventType?.name,
        dateOpen: ev.dateOpen,
        dateClose: ev.dateClose,
        status: ev.status,
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
      const res: any = await apiClient.get(`/events/fanpage/${targetId}?size=100`)
      const list = res?.content || res?.data?.content || res?.data || (Array.isArray(res) ? res : [])
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

        const dateOpenStr = ev.dateOpen ? (typeof ev.dateOpen === 'string' ? ev.dateOpen : `${ev.dateOpen}`) : dateStart
        const dateCloseStr = ev.dateClose ? (typeof ev.dateClose === 'string' ? ev.dateClose : `${ev.dateClose}`) : dateEnd
        const dateHappenStr = ev.dateHappen ? (typeof ev.dateHappen === 'string' ? ev.dateHappen : `${ev.dateHappen}`) : dateStart

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
          dateHappen: dateHappenStr,
          dateOpen: dateOpenStr,
          dateClose: dateCloseStr,
          timeStart,
          timeEnd,
          format: (ev.location?.type as any) || 'OFFLINE',
          location: typeof ev.location === 'string' ? ev.location : (ev.location?.address || 'Hội trường Lớn Khu II ĐHCT'),
          capacity: ev.capacity || 200,
          maleQuantity: ev.maleQuantity !== undefined ? ev.maleQuantity : 0,
          femaleQuantity: ev.femaleQuantity !== undefined ? ev.femaleQuantity : 0,
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
          sv5tCriteriaId: ev.criteriaId ? Number(ev.criteriaId) : undefined,
          sv5tCriteriaName: ev.criteriaName || ev.sv5tCriteriaName || null,
          semesterId: ev.semester?.id ? Number(ev.semester.id) : (ev.semesterId ? Number(ev.semesterId) : 1),
          semesterName: ev.semester?.name || ev.semesterName,
          hasCertificate: Boolean(ev.hasCertificate),
          tags: Array.isArray(ev.tags) ? ev.tags : [],
          eventPoints: Array.isArray(ev.eventPoints)
            ? ev.eventPoints.map((p: any) => ({
                pointCategoryId: p.pointCategoryId,
                pointCategoryName: p.pointCategoryName || 'Điểm rèn luyện',
                pointCategoryCode: p.pointCategoryCode || '',
                point: p.point || 5,
              }))
            : [],
          createdAt: ev.createdAt || '2026-10-01',
        }
      })
    } catch {
      return []
    }
  },

  /**
   * Fetches the real-time registered count (excluding CANCELLED) for a specific event.
   * BE chưa lọc CANCELLED nên fetch size=200 rồi đếm ở FE sau khi lọc.
   */
  getEventRegisteredCount: async (
    fanpageId: string | number,
    eventId: string | number
  ): Promise<number> => {
    const targetFpId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(
        `/registrations/fanpage-member/fanpages/${targetFpId}/events/${eventId}/attendees?size=200&page=0`
      )
      const list: any[] = Array.isArray(res)
        ? res
        : res?.data?.content ?? res?.content ?? res?.data ?? []
      // Lọc bỏ CANCELLED trước khi đếm
      return list.filter((item: any) => (item.status ?? '').toUpperCase() !== 'CANCELLED').length
    } catch {
      return 0
    }
  },

  /**
   * Fetches attendee registration list for a specific event.
   * Maps BE response (firstName + lastName, majorName, studentId, kNumber)
   * to the EventRegistrationItem shape expected by the UI.
   * - Lọc bỏ bản ghi CANCELLED (sinh viên đã hủy đăng ký)
   * - Map checkInAt/checkOutAt (Instant) sang giờ hiển thị
   * - studentId/kNumber/major: sẽ có khi BE uncomment trong AttendeeInfoDto
   */
  getEventAttendees: async (
    fanpageId: string | number,
    eventId: string | number
  ): Promise<EventRegistrationItem[]> => {
    const targetFpId = fanpageId || '1'
    try {
      // size=200 để lấy đủ danh sách (BE mặc định chỉ trả 10)
      const res: any = await apiClient.get(
        `/registrations/fanpage-member/fanpages/${targetFpId}/events/${eventId}/attendees?size=200&sortBy=regDate&sortDir=asc`
      )
      // BE có thể trả Array thẳng, hoặc bọc trong data/content (Page object)
      const list: any[] = Array.isArray(res)
        ? res
        : res?.data?.content ?? res?.content ?? res?.data ?? []

      return list
        // ❌ Lọc bỏ sinh viên đã hủy đăng ký — BE (findAllByEventId) trả cả CANCELLED
        .filter((item: any) => {
          const st = (item.status ?? '').toUpperCase()
          return st !== 'CANCELLED'
        })
        .map((item: any): EventRegistrationItem => {
          // BE trả firstName + lastName riêng → ghép fullName (họ trước, tên sau)
          const fullName =
            item.fullName ||
            [item.lastName, item.firstName].filter(Boolean).join(' ') ||
            item.name ||
            `Người dùng #${item.userId ?? item.id ?? '?'}`

          // regDate từ BE (Instant) → format sang chuỗi dễ đọc
          const registeredAt =
            item.registeredAt ||
            (item.regDate ? new Date(item.regDate).toLocaleString('vi-VN') : '')

          // Preserve exact status from BE: REGISTERED | CHECKED_IN | COMPLETED | CANCELLED
          const rawStatus = (item.status ?? '').toUpperCase()
          const status: EventRegistrationItem['status'] =
            (rawStatus as EventRegistrationItem['status']) || 'REGISTERED'

          // checkInAt / checkOutAt từ BE (Instant) → HH:mm
          const toTime = (val?: string | null) => {
            if (!val) return undefined
            const d = new Date(val)
            return isNaN(d.getTime())
              ? undefined
              : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }

          // BE field names: checkInAt, checkOutAt (RegistrationJpaEntity)
          const entryCheckInTime =
            item.entryCheckInTime || toTime(item.checkInAt ?? item.checkInTime)

          const checkOutTime =
            item.checkOutTime || toTime(item.checkOutAt ?? item.checkOutInstant)

          // studentId: sẽ có khi BE join StudentProfile và uncomment trong AttendeeInfoDto
          const studentId =
            item.studentId ?? item.studentCode ?? item.mssv ?? ''

          return {
            id: String(item.id ?? item.registrationId ?? item.userId ?? Math.random()),
            userId: String(item.userId ?? item.id ?? ''),
            studentId,
            fullName,
            major: item.major ?? item.majorName ?? item.nganhHoc ?? '',
            kNumber: Number(item.kNumber ?? item.knumber ?? item.khoaHoc ?? 0),
            email: item.email ?? '',
            phone: item.phone ?? item.phoneNumber ?? '',
            avatarUrl: item.avatarUrl ?? undefined,
            registeredAt,
            status,
            entryCheckInTime,
            checkOutTime,
            pinCheckInTime: item.pinCheckInTime ?? undefined,
            checkInTime: item.checkInAt
              ? new Date(item.checkInAt).toLocaleString('vi-VN')
              : item.checkInTime
              ? new Date(item.checkInTime).toLocaleString('vi-VN')
              : undefined,
            evidenceUrl: item.checkInEvidenceUrl ?? item.evidenceUrl ?? undefined,
            startEvidenceUrl: item.startEvidenceUrl ?? undefined,
            endEvidenceUrl: item.checkOutEvidenceUrl ?? item.endEvidenceUrl ?? undefined,
          }
        })
    } catch (err) {
      console.error('Failed to fetch event attendees', err)
      return []
    }
  },

  /**
   * Organizer Check-in a single student
   * Fallback seamlessly between batch and single endpoints
   */
  checkInAttendee: async (
    eventId: string | number,
    studentUserId: string | number
  ): Promise<void> => {
    const id = Number(studentUserId)
    await apiClient.patch(`/registrations/fanpage-member/events/${eventId}/check-in`, {
      studentUserIds: [id],
    })
  },

  /**
   * Organizer Check-out a single student
   */
  checkOutAttendee: async (
    eventId: string | number,
    studentUserId: string | number
  ): Promise<void> => {
    const id = Number(studentUserId)
    await apiClient.patch(`/registrations/fanpage-member/events/${eventId}/check-out`, {
      studentUserIds: [id],
    })
  },

  /**
   * Organizer Batch Check-in students
   * Endpoint: PATCH /registrations/fanpage-member/events/{eventId}/check-in
   */
  batchCheckInAttendees: async (
    eventId: string | number,
    studentUserIds: (string | number)[]
  ): Promise<void> => {
    const numericIds = studentUserIds.map(Number).filter((id) => !isNaN(id) && id > 0)
    if (numericIds.length === 0) return
    await apiClient.patch(`/registrations/fanpage-member/events/${eventId}/check-in`, {
      studentUserIds: numericIds,
    })
  },

  /**
   * Organizer Batch Check-out students (awards training points & criteria in backend)
   * Endpoint: PATCH /registrations/fanpage-member/events/{eventId}/check-out
   */
  batchCheckOutAttendees: async (
    eventId: string | number,
    studentUserIds: (string | number)[]
  ): Promise<void> => {
    const numericIds = studentUserIds.map(Number).filter((id) => !isNaN(id) && id > 0)
    if (numericIds.length === 0) return
    await apiClient.patch(`/registrations/fanpage-member/events/${eventId}/check-out`, {
      studentUserIds: numericIds,
    })
  },

  /**
   * Finalizes event attendance and syncs to database.
   * BE marks attendance as completed & awards points via check-out endpoint.
   */
  finalizeAttendance: async (
    _fanpageId: string | number,
    eventId: string | number,
    attendees: EventRegistrationItem[]
  ): Promise<void> => {
    // 1. Identify all attendees who should be completed / checked out
    const completedUserIds = attendees
      .filter((a) => a.status === 'COMPLETED' || a.status === 'CHECKED_IN' || a.status === 'ENTRY_CHECKED')
      .map((a) => Number(a.userId || a.id))
      .filter((id) => !isNaN(id) && id > 0)

    if (completedUserIds.length > 0) {
      try {
        await apiClient.patch(`/registrations/fanpage-member/events/${eventId}/check-out`, {
          studentUserIds: completedUserIds,
        })
      } catch (err) {
        console.warn('Batch check-out during finalize failed or partially succeeded:', err)
      }
    }
  },

  /**
   * Publishes a new event to the backend API
   */
  createAdminEvent: async (payload: any): Promise<any> => {
    try {
      const nowMs = Date.now()
      if (payload?.dateOpen) {
        const openMs = new Date(payload.dateOpen).getTime()
        if (openMs <= nowMs + 10 * 1000) {
          payload.dateOpen = new Date(nowMs + 30 * 1000).toISOString()
        }
      }
      if (payload?.dateOpen && payload?.dateClose) {
        const openMs = new Date(payload.dateOpen).getTime()
        let closeMs = new Date(payload.dateClose).getTime()
        if (closeMs < openMs) {
          payload.dateClose = new Date(openMs + 60 * 1000).toISOString()
          closeMs = new Date(payload.dateClose).getTime()
        }
        if (payload?.dateHappen) {
          const happenMs = new Date(payload.dateHappen).getTime()
          if (happenMs < closeMs) {
            payload.dateHappen = new Date(closeMs + 60 * 1000).toISOString()
          }
        }
      }
      const res: any = await apiClient.post('/events/fanpage-member', payload)
      return res?.data || res
    } catch (err) {
      console.error('Failed to create event', err)
      throw err
    }
  },

  /**
   * Updates an existing event in the backend API
   */
  updateAdminEvent: async (id: string | number, payload: any): Promise<any> => {
    try {
      const nowMs = Date.now()
      if (payload?.dateOpen) {
        const openMs = new Date(payload.dateOpen).getTime()
        if (openMs <= nowMs + 10 * 1000) {
          payload.dateOpen = new Date(nowMs + 30 * 1000).toISOString()
        }
      }
      if (payload?.dateOpen && payload?.dateClose) {
        const openMs = new Date(payload.dateOpen).getTime()
        let closeMs = new Date(payload.dateClose).getTime()
        if (closeMs < openMs) {
          payload.dateClose = new Date(openMs + 60 * 1000).toISOString()
          closeMs = new Date(payload.dateClose).getTime()
        }
        if (payload?.dateHappen) {
          const happenMs = new Date(payload.dateHappen).getTime()
          if (happenMs < closeMs) {
            payload.dateHappen = new Date(closeMs + 60 * 1000).toISOString()
          }
        }
      }
      const res: any = await apiClient.put(`/events/fanpage-member/${id}`, payload)
      return res?.data || res
    } catch (err) {
      console.error('Failed to update event', err)
      throw err
    }
  },

  /**
   * Updates the lifecycle status of an event (DRAFT, PUBLISHED, CLOSED, CANCELLED)
   */
  changeEventStatus: async (
    id: string | number,
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED'
  ): Promise<any> => {
    try {
      const res: any = await apiClient.patch(`/events/fanpage-member/${id}/status?status=${status}`)
      return res?.data || res
    } catch (err) {
      console.error('Failed to change event status', err)
      throw err
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
        orgName: data.fullName || data.name,
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
      return list.map((item: any, idx: number) => {
        const fullName =
          item.fullName ||
          [item.lastName, item.firstName].filter(Boolean).join(' ') ||
          item.name ||
          (item.email ? item.email.split('@')[0] : `Thành viên ${idx + 1}`)
        const avatarText = fullName
          .split(' ')
          .filter(Boolean)
          .slice(-2)
          .map((w: string) => w[0])
          .join('')
          .toUpperCase() || 'TV'

        const rawRole = (item.role || 'MEMBER').toUpperCase()
        const role = rawRole === 'ADMIN' ? 'ADMIN' : 'COLLABORATOR'

        return {
          id: String(item.id || item.userId || `mem-${idx + 1}`),
          userId: String(item.userId || item.id || `user-${idx + 1}`),
          fullName,
          email: item.email || '',
          avatarUrl: item.avatarUrl || '',
          avatarText,
          role,
          title: item.title || (role === 'ADMIN' ? 'Quản trị viên' : 'Cộng tác viên'),
          joinedAt: item.joinedAt || item.createdAt || new Date().toISOString(),
          isActive: item.isActive !== false,
        }
      })
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
   * Tìm kiếm danh sách tài khoản người dùng thực tế trong hệ thống để gửi lời mời
   * GET /api/users/search-users?keyword={keyword}
   */
  searchUsersForInvitation: async (keyword: string): Promise<Array<{
    id: string
    email: string
    fullName: string
    studentId?: string
    avatarUrl?: string
  }>> => {
    if (!keyword || !keyword.trim()) return []
    try {
      const res: any = await apiClient.get('/users/search-users', {
        params: { keyword: keyword.trim() },
      })
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((u: any) => {
        const fullName =
          [u.lastName, u.firstName].filter(Boolean).join(' ') ||
          u.fullName ||
          u.email?.split('@')[0] ||
          'Người dùng'
        const studentIdMatch = (u.studentId || u.email || '').match(/([a-zA-Z]\d{7})/i)
        const studentId = u.studentId || (studentIdMatch ? studentIdMatch[1].toUpperCase() : '')
        return {
          id: String(u.userId || u.id || u.email || ''),
          email: u.email || '',
          fullName,
          studentId,
          avatarUrl: u.avatarUrl || '',
        }
      })
    } catch (err) {
      console.error('Failed to search users for invitation', err)
      return []
    }
  },

  /**
   * Gửi lời mời tham gia Ban tổ chức Fanpage qua email
   * POST /api/fanpages/fanpage-admin/{fanpageId}/invite-member?email={email}
   */
  inviteFanpageMember: async (
    fanpageId: string | number,
    email: string
  ): Promise<boolean> => {
    const targetId = fanpageId || '1'
    try {
      await apiClient.post(
        `/fanpages/fanpage-admin/${targetId}/invite-member?email=${encodeURIComponent(email)}`
      )
      return true
    } catch (err) {
      console.error('Failed to invite member to fanpage', err)
      throw err
    }
  },

  /**
   * Xóa thành viên khỏi ban tổ chức Fanpage
   * DELETE /api/fanpages/fanpage-admin/{fanpageId}/remove-member?email={email}
   */
  removeFanpageMember: async (
    fanpageId: string | number,
    userIdOrEmail: string | number,
    email?: string
  ): Promise<boolean> => {
    const targetId = fanpageId || '1'
    const targetEmail = email || (typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@') ? userIdOrEmail : '')
    try {
      if (targetEmail) {
        await apiClient.delete(
          `/fanpages/fanpage-admin/${targetId}/remove-member?email=${encodeURIComponent(targetEmail)}`
        )
      } else {
        await apiClient.delete(
          `/fanpages/fanpage-admin/${targetId}/remove-member/${userIdOrEmail}`
        )
      }
      return true
    } catch (err) {
      console.error('Failed to remove fanpage member', err)
      return false
    }
  },

  /**
   * Thành viên (Cộng tác viên) tự rời khỏi ban tổ chức Fanpage
   * DELETE /api/users/me/out-fanpage-member/{fanpageId}
   */
  leaveFanpage: async (fanpageId: string | number): Promise<boolean> => {
    const targetId = fanpageId || '1'
    try {
      await apiClient.delete(`/users/me/out-fanpage-member/${targetId}`)
      return true
    } catch (err) {
      console.error('Failed to leave fanpage', err)
      return false
    }
  },

  /**
   * Chuyển quyền Quản trị viên Fanpage cho thành viên khác
   * PATCH /api/fanpages/fanpage-admin/{fanpageId}/appoint-fanpage-admin?email={email}
   */
  appointFanpageAdmin: async (
    fanpageId: string | number,
    email: string
  ): Promise<boolean> => {
    const targetId = fanpageId || '1'
    try {
      await apiClient.patch(
        `/fanpages/fanpage-admin/${targetId}/appoint-fanpage-admin?email=${encodeURIComponent(email)}`
      )
      return true
    } catch (err) {
      console.error('Failed to appoint fanpage admin', err)
      throw err
    }
  },

  /**
   * Lấy danh sách lời mời thành viên thực tế của Fanpage từ Backend
   * GET /api/fanpage-member-invitations/fanpage/{fanpageId}?status=PENDING&page=0&size=50
   */
  getFanpageInvitations: async (
    fanpageId: string | number,
    status: string = 'PENDING'
  ): Promise<FanpageInvitation[]> => {
    const targetId = fanpageId || '1'
    try {
      const res: any = await apiClient.get(`/fanpage-member-invitations/fanpage/${targetId}`, {
        params: { status, size: 50, sortDir: 'DESC' },
      })
      const list = Array.isArray(res)
        ? res
        : res?.content || res?.data?.content || res?.data || []

      return list.map((item: any, idx: number) => {
        const fullName =
          item.userName ||
          item.fullName ||
          [item.userLastName, item.userFirstName].filter(Boolean).join(' ') ||
          (item.userEmail ? item.userEmail.split('@')[0] : `Lời mời ${idx + 1}`)

        return {
          id: String(item.id),
          email: item.userEmail || item.email || '',
          fanpageId: item.fanpageId ? Number(item.fanpageId) : Number(targetId),
          name: fullName,
          role: 'COLLABORATOR',
          invitedBy: item.invitedBy || 'Nguyễn Minh Anh (Admin)',
          invitedAt: item.createdAt || new Date().toISOString(),
          status: item.status || 'PENDING',
          avatarUrl: item.userAvatarUrl || '',
        }
      })
    } catch (err) {
      console.warn('Failed to get fanpage invitations', err)
      return []
    }
  },

  /**
   * Hủy lời mời thành viên
   * POST /api/fanpage-member-invitations/{invitationId}/cancel
   */
  cancelFanpageInvitation: async (invitationId: string | number): Promise<boolean> => {
    try {
      await apiClient.post(`/fanpage-member-invitations/${invitationId}/cancel`)
      return true
    } catch (err) {
      console.error('Failed to cancel fanpage invitation', err)
      return false
    }
  },

  /**
   * Fetches real event types from backend API
   */
  getEventTypes: async (): Promise<{ id: number; name: string; description?: string }[]> => {
    try {
      const res = await apiClient.get<any>('/event-types')
      const data = Array.isArray(res) ? res : res?.data || []
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: Number(item.id),
          name: item.name || `Loại ${item.id}`,
          description: item.description,
        }))
      }
      return MOCK_EVENT_TYPES
    } catch {
      return MOCK_EVENT_TYPES
    }
  },
}

export const MOCK_SEMESTERS = [
  { id: 1, name: 'Học kỳ 1 (Năm học 2026 - 2027)' },
  { id: 2, name: 'Học kỳ 2 (Năm học 2026 - 2027)' },
]

export const MOCK_EVENT_TYPES = [
  { id: 1, name: 'Workshop - Tập huấn kỹ năng' },
  { id: 2, name: 'Networking - Kết nối & Giao lưu' },
  { id: 3, name: 'Thể dục - Thể thao & Hội thao' },
  { id: 4, name: 'Tình nguyện & Hoạt động cộng đồng' },
  { id: 5, name: 'Học thuật & Nghiên cứu khoa học' },
  { id: 6, name: 'Tọa đàm chuyên đề (Seminar)' },
  { id: 7, name: 'Cuộc thi học thuật & Hackathon' },
  { id: 8, name: 'Ngày hội việc làm & Hướng nghiệp (Job Fair)' },
  { id: 9, name: 'Văn hóa - Văn nghệ & Âm nhạc' },
  { id: 10, name: 'Lễ tuyên dương & Trao giải thưởng' },
  { id: 11, name: 'Chào đón tân sinh viên & Đầu khóa' },
  { id: 12, name: 'Hoạt động Đoàn - Hội & Cán bộ sinh viên' },
  { id: 13, name: 'Kỹ năng mềm & Phát triển bản thân' },
  { id: 14, name: 'Giao lưu quốc tế & Hội nhập ngoại ngữ' },
  { id: 15, name: 'Hiến máu tình nguyện & Y tế học đường' },
  { id: 16, name: 'Môi trường xanh & Ngày Chủ nhật xanh' },
  { id: 17, name: 'Triển lãm & Trình diễn công nghệ (Tech Expo)' },
  { id: 18, name: 'Diễn đàn đối thoại sinh viên' },
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
]

export const MOCK_FANPAGE_INVITATIONS: FanpageInvitation[] = []

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
