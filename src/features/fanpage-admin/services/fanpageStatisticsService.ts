import { apiClient } from '@/shared'
import { z } from 'zod'

export interface FanpageOverview {
  totalEvents: number
  totalFollowers?: number
  totalMembers?: number
  totalRegistrations: number
  totalAttendees: number
  attendanceRate?: number
}

export interface EventOverview {
  capacity: number
  maleQuantity?: number
  femaleQuantity?: number
  totalRegistrations: number
  capacityUtilizationRate?: number
  totalAttended: number
  attendanceRate: number
}

export interface FanpageMonthlyTrend {
  month: string // e.g. "2026-01" or "01"
  eventsCount: number
  registrationsCount: number
  attendeesCount: number
}

export interface FanpageEventDistribution {
  eventTypeName: string
  eventCount: number
  percentage: number
}

export interface FanpageTopEvent {
  eventId: number | string
  eventName: string
  eventDate?: string
  totalRegistrations: number
  totalAttendees: number
  attendanceRate: number
}

export interface DemographicItem {
  label: string
  studentCount: number
  percentage: number
}

export interface FanpageDemographics {
  cohorts: DemographicItem[]
  schools: DemographicItem[]
  majors: DemographicItem[]
}

export interface FanpageDashboardData {
  overview: FanpageOverview
  monthlyTrends: FanpageMonthlyTrend[]
  eventDistribution: FanpageEventDistribution[]
  topEvents: FanpageTopEvent[]
  demographics: FanpageDemographics
}

const count = z.number().int().nonnegative()
const overviewSchema = z.object({
  totalEvents: count,
  totalFollowers: count.optional(),
  totalMembers: count.optional(),
  totalRegistrations: count,
  totalAttendees: count,
  attendanceRate: z.number().nonnegative().optional(),
})
const trendSchema = z
  .object({
    monthYear: z.string(),
    eventCount: count,
    registrationCount: count,
    attendeeCount: count,
  })
  .transform((item) => ({
    month: item.monthYear,
    eventsCount: item.eventCount,
    registrationsCount: item.registrationCount,
    attendeesCount: item.attendeeCount,
  }))
const distributionSchema = z.object({
  eventTypeName: z.string(),
  eventCount: count,
  percentage: z.number().nonnegative(),
})
const topEventSchema = z
  .object({
    eventId: z.union([z.number(), z.string()]),
    eventName: z.string(),
    dateHappen: z.string().nullish(),
    registrationCount: count,
    attendeeCount: count,
    attendanceRate: z.number().nonnegative(),
  })
  .transform((item) => ({
    eventId: item.eventId,
    eventName: item.eventName,
    eventDate: item.dateHappen ?? undefined,
    totalRegistrations: item.registrationCount,
    totalAttendees: item.attendeeCount,
    attendanceRate: item.attendanceRate,
  }))
const demographicItemSchema = z
  .object({
    label: z.string(),
    count,
    percentage: z.number().nonnegative(),
  })
  .transform((item) => ({
    label: item.label === 'UNKNOWN' || item.label === 'Other' ? 'Chưa xác định' : item.label,
    studentCount: item.count,
    percentage: item.percentage,
  }))
const demographicsSchema = z.object({
  cohorts: z.array(demographicItemSchema),
  schools: z.array(demographicItemSchema),
  majors: z.array(demographicItemSchema),
})
const dashboardSchema = z
  .object({
    overview: overviewSchema,
    monthlyTrends: z.array(trendSchema),
    eventsByType: z.array(distributionSchema),
    topEvents: z.array(topEventSchema),
    demographics: demographicsSchema,
  })
  .transform(({ eventsByType, ...data }) => ({ ...data, eventDistribution: eventsByType }))

// apiClient already unwraps BaseResponse.data. Request failures must reach React Query.
export const fanpageStatisticsService = {
  getFanpageOverview: async (fanpageId: string | number): Promise<FanpageOverview> =>
    overviewSchema.parse(await apiClient.get(`/fanpages/${fanpageId}/statistics/overview`)),

  getMonthlyTrends: async (
    fanpageId: string | number,
    year?: number
  ): Promise<FanpageMonthlyTrend[]> =>
    z.array(trendSchema).parse(
      await apiClient.get(`/fanpages/${fanpageId}/statistics/trends`, {
        params: year ? { year } : {},
      })
    ),

  getEventDistribution: async (fanpageId: string | number): Promise<FanpageEventDistribution[]> =>
    z
      .array(distributionSchema)
      .parse(await apiClient.get(`/fanpages/${fanpageId}/statistics/event-distribution`)),

  getTopEvents: async (fanpageId: string | number, limit = 5): Promise<FanpageTopEvent[]> =>
    z.array(topEventSchema).parse(
      await apiClient.get(`/fanpages/${fanpageId}/statistics/top-events`, {
        params: { limit },
      })
    ),

  getDemographics: async (
    fanpageId: string | number,
    year?: number,
    semesterId?: string | number
  ): Promise<FanpageDemographics> =>
    demographicsSchema.parse(
      await apiClient.get(`/fanpages/${fanpageId}/statistics/demographics`, {
        params: { ...(year ? { year } : {}), ...(semesterId ? { semesterId } : {}) },
      })
    ),

  getDashboard: async (
    fanpageId: string | number,
    year?: number,
    semesterId?: string | number
  ): Promise<FanpageDashboardData> =>
    dashboardSchema.parse(
      await apiClient.get(`/fanpages/${fanpageId}/statistics/dashboard`, {
        params: { ...(year ? { year } : {}), ...(semesterId ? { semesterId } : {}) },
      })
    ),

  getEventOverview: async (
    fanpageId: string | number,
    eventId: string | number
  ): Promise<EventOverview> => {
    const res: any = await apiClient.get(
      `/fanpages/${fanpageId}/events/${eventId}/statistics/overview`
    )
    const data = res?.data ?? res
    if (
      !data ||
      typeof data !== 'object' ||
      data.capacity === undefined ||
      data.totalRegistrations === undefined ||
      data.totalAttended === undefined ||
      data.attendanceRate === undefined
    ) {
      throw new Error('Dữ liệu thống kê không hợp lệ')
    }
    const result: EventOverview = {
      capacity: Number(data.capacity),
      totalRegistrations: Number(data.totalRegistrations),
      totalAttended: Number(data.totalAttended),
      attendanceRate: Number(data.attendanceRate),
    }
    if (data.maleQuantity !== undefined) result.maleQuantity = Number(data.maleQuantity)
    if (data.femaleQuantity !== undefined) result.femaleQuantity = Number(data.femaleQuantity)
    if (data.capacityUtilizationRate !== undefined)
      result.capacityUtilizationRate = Number(data.capacityUtilizationRate)
    return result
  },
}
