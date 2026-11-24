import type { AdminDashboardData } from '../../adminStatisticsService'
export const adminDashboard: AdminDashboardData = {
  overview: {
    users: { totalUsers: 42, totalStudents: 35, totalStaff: 7, totalActiveUsers: 40 },
    fanpages: { totalFanpages: 8, activeFanpages: 6, pendingFanpages: 1, bannedFanpages: 1 },
    events: { totalEvents: 12, publishedEvents: 3, completedEvents: 8, cancelledEvents: 1 },
    attendance: { totalRegistrations: 100, totalAttendees: 70, absentCount: 30, attendanceRate: 70, absentRate: 30 },
  },
  monthlyTrends: [], eventDistribution: [], topFanpages: [],
  demographics: { totalRegistrations: 100, cohorts: [], schools: [], majors: [] },
  monthlyAbsentRates: [],
}
