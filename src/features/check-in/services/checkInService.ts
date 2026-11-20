import { apiClient } from '@/shared'
import { normalizeAttendanceConfig } from '@/shared/utils/attendanceConfig'
import { studentAttendanceStep } from '@/shared/utils/attendanceState'
import { mediaService } from '@/shared/services/mediaService'
import type { AttendanceEventItem, AttendanceSessionType } from '../types/checkIn.types'

function normalizeAttendanceEvent(raw: any): AttendanceEventItem {
  const info = raw.eventInfo ?? raw
  return {
    eventId: raw.eventId ?? info.id,
    eventName: info.name ?? raw.eventName ?? '',
    location: info.location ?? raw.location,
    dateHappen: info.dateHappen ?? raw.dateHappen,
    status: raw.status,
    checkInAt: raw.checkInAt,
    checkOutAt: raw.checkOutAt,
    ...normalizeAttendanceConfig({
      allowSelfCheck: info.allowSelfCheck ?? raw.allowSelfCheck,
      attendanceMethod: info.attendanceMethod ?? raw.attendanceMethod,
    }),
  }
}

export const checkInService = {
  /**
   * Upload evidence image to Cloudinary via BE presigned URL
   */
  async uploadEvidence(file: File): Promise<string> {
    return mediaService.uploadImage(file, 'EVIDENCE')
  },

  /**
   * Student self check-in to an event
   */
  async checkIn(eventId: string | number, proofUrl?: string): Promise<void> {
    await apiClient.patch(`/registrations/me/events/${eventId}/check-in`, {
      ...(proofUrl ? { proofUrl } : {}),
    })
  },

  /**
   * Student self check-out of an event (submitting proof)
   */
  async checkOut(eventId: string | number, proofUrl?: string): Promise<void> {
    await apiClient.patch(`/registrations/me/events/${eventId}/check-out`, {
      ...(proofUrl ? { proofUrl } : {}),
    })
  },

  /**
   * Submits attendance based on session type
   */
  async submitAttendance(
    eventId: string | number,
    sessionType: AttendanceSessionType,
    proofUrl?: string
  ): Promise<void> {
    if (sessionType === 'check-in') {
      await this.checkIn(eventId, proofUrl)
    } else {
      await this.checkOut(eventId, proofUrl)
    }
  },

  /**
   * Fetches upcoming registered events
   */
  async getUpcomingEvents(): Promise<AttendanceEventItem[]> {
    try {
      const res: any = await apiClient.get('/registrations/me/upcoming')
      const list = Array.isArray(res) ? res : res?.data || []
      return list
    } catch {
      return []
    }
  },

  /**
   * Fetches both upcoming and history registered events that can be checked in or checked out.
   * This is needed because BE's /registrations/me/upcoming only returns events with status == 'REGISTERED'.
   * Once a student checks in, status becomes 'CHECKED_IN', so it moves to /registrations/me/history.
   */
  async getActiveRegisteredEvents(): Promise<AttendanceEventItem[]> {
    try {
      const [upcomingRes, historyRes] = await Promise.allSettled([
        apiClient.get('/registrations/me/upcoming'),
        apiClient.get('/registrations/me/history', { params: { page: 0, size: 50 } }),
      ])

      const upcomingList: AttendanceEventItem[] =
        upcomingRes.status === 'fulfilled'
          ? Array.isArray(upcomingRes.value)
            ? upcomingRes.value
            : (upcomingRes.value as any)?.data || []
          : []

      if (upcomingRes.status === 'rejected' || historyRes.status === 'rejected') {
        throw new Error('Không tải đủ danh sách sự kiện điểm danh.')
      }
      const historyData: any = historyRes.status === 'fulfilled' ? historyRes.value : null
      const historyList: AttendanceEventItem[] = Array.isArray(historyData)
        ? historyData
        : historyData?.content || historyData?.data?.content || historyData?.data || []

      // Combine both, deduplicate by eventId, keeping most updated status
      const eventMap = new Map<string, AttendanceEventItem>()

      for (const raw of historyList) {
        const item = normalizeAttendanceEvent(raw)
        if (item.eventId) {
          eventMap.set(String(item.eventId), item)
        }
      }

      for (const raw of upcomingList) {
        const item = normalizeAttendanceEvent(raw)
        if (item.eventId && !eventMap.has(String(item.eventId))) {
          eventMap.set(String(item.eventId), item)
        }
      }

      return Array.from(eventMap.values()).filter((item) => studentAttendanceStep(item.status) != null)
    } catch (err) {
      console.error('Failed to fetch active events for check-in:', err)
      throw err
    }
  },
}
