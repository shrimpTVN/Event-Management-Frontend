import { z } from 'zod'
import { apiClient } from '@/shared'

const count = z.number().int().nonnegative()
const rate = z.number().nonnegative()
const demographic = z.object({ label: z.string(), count, percentage: rate })
export const adminDashboardSchema = z.object({
  overview: z.object({
    users: z.object({
      totalUsers: count,
      totalStudents: count,
      totalStaff: count,
      totalActiveUsers: count,
    }),
    fanpages: z.object({
      totalFanpages: count,
      activeFanpages: count,
      pendingFanpages: count,
      bannedFanpages: count,
    }),
    events: z.object({
      totalEvents: count,
      publishedEvents: count,
      completedEvents: count,
      cancelledEvents: count,
    }),
    attendance: z.object({
      totalRegistrations: count,
      totalAttendees: count,
      absentCount: count,
      attendanceRate: rate,
      absentRate: rate,
    }),
  }),
  monthlyTrends: z.array(
    z.object({
      monthYear: z.string(),
      eventCount: count,
      registrationCount: count,
      attendeeCount: count,
      absentCount: count,
      absentRate: rate,
    })
  ),
  eventDistribution: z.array(
    z.object({
      eventTypeId: z.number().nullable(),
      eventTypeName: z.string(),
      eventCount: count,
      percentage: rate,
    })
  ),
  topFanpages: z.array(
    z.object({
      fanpageId: z.number(),
      fanpageName: z.string(),
      avatarUrl: z.string().nullish(),
      eventCount: count,
      followerCount: count,
      attendeeCount: count,
    })
  ),
  demographics: z.object({
    totalRegistrations: count,
    cohorts: z.array(demographic),
    schools: z.array(demographic),
    majors: z.array(demographic),
  }),
  monthlyAbsentRates: z.array(
    z.object({
      month: z.number().int().min(1).max(12),
      monthName: z.string(),
      totalRegistrations: count,
      absentCount: count,
      absentRate: rate,
    })
  ),
})
export type AdminDashboardData = z.infer<typeof adminDashboardSchema>
export const adminStatisticsService = {
  async getAcademicYears() {
    const response: any = await apiClient.get('/academic-years')
    const data = response?.data ?? response
    return z
      .array(
        z.object({
          id: z.number().int().positive(),
          code: z.string().trim().min(1),
          startDate: z.string().nullable().optional(),
          endDate: z.string().nullable().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .parse(Array.isArray(data) ? data : data?.content)
      .sort((a, b) => b.code.localeCompare(a.code, undefined, { numeric: true }))
  },
  async getDashboard(year: number | string, semesterId?: string) {
    return adminDashboardSchema.parse(
      await apiClient.get('/admin/statistics/dashboard', {
        params: {
          ...(typeof year === 'string' ? { academicYear: year } : { year }),
          ...(semesterId ? { semesterId } : {}),
        },
      })
    )
  },
}
