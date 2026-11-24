import { beforeEach, expect, it, vi } from 'vitest'
import {
  getAcademicYearDashboard,
  getAcademicYearAbsentRates,
  getSemesterDashboard,
  monthsBetween,
} from '../academicStatistics'
import { fanpageStatisticsService, type FanpageDashboardData } from '../fanpageStatisticsService'

vi.mock('../fanpageStatisticsService', () => ({
  fanpageStatisticsService: {
    getDashboard: vi.fn(),
    getDemographics: vi.fn(),
    getAbsentRates: vi.fn(),
  },
}))
beforeEach(() => vi.resetAllMocks())

it('builds semester months across the calendar-year boundary without assuming a September start', () => {
  expect(monthsBetween('2026-11-15', '2027-02-03')).toEqual([
    '2026-11',
    '2026-12',
    '2027-01',
    '2027-02',
  ])
  expect(monthsBetween('2027-02-01', '2026-11-01')).toEqual([])
  expect(monthsBetween()).toEqual([])
})

it('includes the following calendar year, clips other months and reads unique demographics for the entire semester', async () => {
  const base: FanpageDashboardData = {
    overview: { totalEvents: 100, totalRegistrations: 200, totalAttendees: 150 },
    monthlyTrends: [],
    eventDistribution: [],
    topEvents: [],
    demographics: { cohorts: [], schools: [], majors: [] },
  }
  vi.mocked(fanpageStatisticsService.getDashboard).mockImplementation(async (_id, year) => ({
    ...base,
    monthlyTrends:
      year === 2026
        ? [
            { month: '2026-11', eventsCount: 2, registrationsCount: 4, attendeesCount: 3 },
            { month: '2026-03', eventsCount: 99, registrationsCount: 99, attendeesCount: 99 },
          ]
        : [{ month: '2027-01', eventsCount: 5, registrationsCount: 8, attendeesCount: 6 }],
  }))
  const demographics = {
    cohorts: [{ label: 'K49', studentCount: 7, percentage: 100 }],
    schools: [],
    majors: [],
  }
  vi.mocked(fanpageStatisticsService.getDemographics).mockResolvedValue(demographics)
  const result = await getSemesterDashboard('7', '9', monthsBetween('2026-11-01', '2027-01-31'))
  expect(fanpageStatisticsService.getDashboard).toHaveBeenCalledWith('7', 2026, '9')
  expect(fanpageStatisticsService.getDashboard).toHaveBeenCalledWith('7', 2027, '9')
  expect(result.monthlyTrends.map((item) => [item.month, item.eventsCount])).toEqual([
    ['2026-11', 2],
    ['2026-12', 0],
    ['2027-01', 5],
  ])
  expect(result.overview.totalEvents).toBe(100)
  expect(fanpageStatisticsService.getDemographics).toHaveBeenCalledWith('7', undefined, '9')
  expect(result.demographics).toEqual(demographics)
})

it('does not display a partial semester when a calendar-year request fails', async () => {
  vi.mocked(fanpageStatisticsService.getDashboard).mockRejectedValue(new Error('Unavailable'))
  vi.mocked(fanpageStatisticsService.getDemographics).mockResolvedValue({
    cohorts: [],
    schools: [],
    majors: [],
  })
  await expect(getSemesterDashboard('7', '9', ['2026-12', '2027-01'])).rejects.toThrow(
    'Unavailable'
  )
})

it('combines all semesters once per month and keeps global totals unchanged', async () => {
  const semesters = [
    { id: 9, number: 1, startDate: '2026-12-01', endDate: '2027-01-15' },
    { id: 10, number: 2, startDate: '2027-01-16', endDate: '2027-02-28' },
  ]
  vi.mocked(fanpageStatisticsService.getDashboard).mockImplementation(
    async (_id, year, semesterId) => ({
      overview: { totalEvents: 100, totalRegistrations: 200, totalAttendees: 150 },
      monthlyTrends: [
        {
          month: `${year}-01`,
          eventsCount: semesterId === '9' ? 2 : 3,
          registrationsCount: 5,
          attendeesCount: 4,
        },
      ],
      eventDistribution: [],
      topEvents: [],
      demographics: { cohorts: [], schools: [], majors: [] },
    })
  )
  const result = await getAcademicYearDashboard('7', semesters, ['2026-12', '2027-01', '2027-02'])
  expect(result.monthlyTrends.map((item) => item.eventsCount)).toEqual([0, 5, 0])
  expect(result.monthlyTrends[1].registrationsCount).toBe(10)
  expect(result.overview.totalEvents).toBe(100)
  expect(fanpageStatisticsService.getDashboard).toHaveBeenCalledTimes(3)
  expect(fanpageStatisticsService.getDemographics).not.toHaveBeenCalled()
})

it('calculates annual absence percentages from combined counts instead of averaging percentages', async () => {
  vi.mocked(fanpageStatisticsService.getAbsentRates).mockImplementation(
    async (_id, _year, semesterId) => [
      {
        month: 1,
        monthName: 'Jan',
        totalRegistrations: semesterId === '9' ? 2 : 8,
        absentCount: semesterId === '9' ? 1 : 0,
        absentRate: semesterId === '9' ? 50 : 0,
      },
    ]
  )
  const result = await getAcademicYearAbsentRates(
    '7',
    [
      { id: 9, number: 1, startDate: '2027-01-01', endDate: '2027-01-15' },
      { id: 10, number: 2, startDate: '2027-01-16', endDate: '2027-02-28' },
    ],
    ['2027-01', '2027-02']
  )
  expect(result[0]).toMatchObject({ totalRegistrations: 10, absentCount: 1, absentRate: 10 })
  expect(result[1]).toMatchObject({ totalRegistrations: 0, absentCount: 0, absentRate: 0 })
})
