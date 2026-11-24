import { fanpageStatisticsService } from './fanpageStatisticsService'
import type { Semester } from '@/features/training-points/types/trainingPoints.types'

export function monthsBetween(startDate?: string, endDate?: string): string[] {
  if (
    !startDate ||
    !endDate ||
    !/^\d{4}-\d{2}-\d{2}/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}/.test(endDate)
  )
    return []
  const start = startDate.slice(0, 7)
  const end = endDate.slice(0, 7)
  if (start > end) return []
  const result: string[] = []
  let [year, month] = start.split('-').map(Number)
  const [endYear, endMonth] = end.split('-').map(Number)
  if (
    month < 1 ||
    month > 12 ||
    endMonth < 1 ||
    endMonth > 12 ||
    (endYear - year) * 12 + endMonth - month >= 36
  )
    return []
  while (true) {
    const key = `${year}-${String(month).padStart(2, '0')}`
    if (key > end) break
    result.push(key)
    month++
    if (month > 12) {
      year++
      month = 1
    }
  }
  return result
}

// BE trends are restricted to a calendar year, even when semesterId is supplied.
// Fetch each year touched by the semester without adding duplicate global totals.
export async function getSemesterDashboard(
  fanpageId: string,
  semesterId: string,
  months: string[]
) {
  if (!months.length) throw new Error('Học kỳ chưa có thời gian bắt đầu/kết thúc hợp lệ.')
  const years = [...new Set(months.map((month) => Number(month.slice(0, 4))))]
  const [dashboards, demographics] = await Promise.all([
    Promise.all(
      years.map((year) => fanpageStatisticsService.getDashboard(fanpageId, year, semesterId))
    ),
    fanpageStatisticsService.getDemographics(fanpageId, undefined, semesterId),
  ])
  const trends = new Map(
    dashboards.flatMap((data) => data.monthlyTrends).map((item) => [item.month, item])
  )
  return {
    ...dashboards[0],
    demographics,
    monthlyTrends: months.map(
      (month) =>
        trends.get(month) ?? { month, eventsCount: 0, registrationsCount: 0, attendeesCount: 0 }
    ),
  }
}

export async function getAcademicYearDashboard(
  fanpageId: string,
  semesters: Semester[],
  months: string[]
) {
  if (!semesters.length || !months.length)
    throw new Error('Năm học chưa có học kỳ hoặc thời gian hợp lệ.')
  const results = await Promise.all(
    semesters.map(async (semester) => {
      const semesterMonths = monthsBetween(semester.startDate, semester.endDate).filter((month) =>
        months.includes(month)
      )
      if (!semesterMonths.length) throw new Error('Học kỳ chưa có thời gian hợp lệ trong năm học.')
      const years = [...new Set(semesterMonths.map((month) => Number(month.slice(0, 4))))]
      return Promise.all(
        years.map(async (year) => {
          const dashboard = await fanpageStatisticsService.getDashboard(
            fanpageId,
            year,
            String(semester.id)
          )
          return {
            ...dashboard,
            monthlyTrends: dashboard.monthlyTrends.filter((item) =>
              item.month.startsWith(`${year}-`)
            ),
          }
        })
      )
    })
  )
  const dashboards = results.flat()
  // Every event belongs to one semester. Add monthly counts, never global totals
  // or distinct-student demographic counts (which may overlap across semesters).
  const monthlyTrends = months.map((month) => ({
    month,
    eventsCount: 0,
    registrationsCount: 0,
    attendeesCount: 0,
  }))
  const byMonth = new Map(monthlyTrends.map((item) => [item.month, item]))
  for (const dashboard of dashboards)
    for (const item of dashboard.monthlyTrends) {
      const target = byMonth.get(item.month)
      if (!target) continue
      target.eventsCount += item.eventsCount
      target.registrationsCount += item.registrationsCount
      target.attendeesCount += item.attendeesCount
    }
  return { ...dashboards[0], monthlyTrends, demographics: { cohorts: [], schools: [], majors: [] } }
}

export async function getAcademicYearAbsentRates(
  fanpageId: string,
  semesters: Semester[],
  months: string[]
) {
  const totals = months.map((key) => ({
    key,
    month: Number(key.slice(-2)),
    monthName: `Th.${Number(key.slice(-2))}/${key.slice(0, 4)}`,
    totalRegistrations: 0,
    absentCount: 0,
    absentRate: 0,
  }))
  const byMonth = new Map(totals.map((item) => [item.key, item]))
  const results = await Promise.all(
    semesters.map(async (semester) => {
      const semesterMonths = monthsBetween(semester.startDate, semester.endDate).filter((month) =>
        months.includes(month)
      )
      if (!semesterMonths.length) throw new Error('Học kỳ chưa có thời gian hợp lệ trong năm học.')
      const years = [...new Set(semesterMonths.map((month) => Number(month.slice(0, 4))))]
      return Promise.all(
        years.map(async (year) => ({
          year,
          rows: await fanpageStatisticsService.getAbsentRates(fanpageId, year, String(semester.id)),
        }))
      )
    })
  )
  for (const { year, rows } of results.flat())
    for (const row of rows) {
      const target = byMonth.get(`${year}-${String(row.month).padStart(2, '0')}`)
      if (!target) continue
      target.totalRegistrations += row.totalRegistrations
      target.absentCount += row.absentCount
    }
  return totals.map((item) => ({
    ...item,
    absentRate: item.totalRegistrations ? (item.absentCount / item.totalRegistrations) * 100 : 0,
  }))
}
