import type { RegisteredEventItem, HistoryStats, TrendIndicator } from '../types/history.types'
import { normalizeHistoryStatus } from '../types/history.types'

/**
 * Parses event dates from multiple potential formats (ISO string, dd/mm/yyyy, etc.)
 */
export function parseEventDate(event: RegisteredEventItem): Date | null {
  const rawDate = event.dateHappen || event.regDate || event.dateOpen
  if (!rawDate) return null

  // Check standard parseable formats
  const d = new Date(rawDate)
  if (!isNaN(d.getTime())) return d

  // Handle format like "14/09/2026" or "18h30, 16/09/2026"
  const match = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const year = parseInt(match[3], 10)
    const parsed = new Date(year, month, day)
    if (!isNaN(parsed.getTime())) return parsed
  }

  return null
}

/**
 * Determines academic year and semester for a given event date.
 * Quy định học kì tại ĐHCT:
 * - Học kì 1: Tháng 8 đến tháng 12 của năm bắt đầu (Năm học Y - Y+1)
 * - Học kì 2: Tháng 1 đến tháng 5 của năm kết thúc (Năm học Y-1 - Y)
 * - Học kì hè (Kì 3): Tháng 6 và tháng 7 (Năm học Y-1 - Y)
 */
export function getEventTerm(event: RegisteredEventItem): { year: string; semester: string } | null {
  const d = parseEventDate(event)
  if (!d) return null

  const y = d.getFullYear()
  const m = d.getMonth() + 1 // 1 - 12

  if (m >= 8 && m <= 12) {
    return { year: `${y} - ${y + 1}`, semester: '1' }
  }
  if (m >= 1 && m <= 5) {
    return { year: `${y - 1} - ${y}`, semester: '2' }
  }
  return { year: `${y - 1} - ${y}`, semester: '3' }
}

/**
 * Returns the immediate previous term for comparison.
 */
export function getPreviousTerm(year: string, semester: string): { year: string; semester: string } {
  const parts = year.split('-').map((s) => parseInt(s.trim(), 10))
  const startYear = parts[0] || 2026
  const endYear = parts[1] || 2027

  if (semester === '1') {
    return { year: `${startYear - 1} - ${startYear}`, semester: '2' }
  } else if (semester === '2') {
    return { year: `${startYear} - ${endYear}`, semester: '1' }
  } else {
    return { year: `${startYear} - ${endYear}`, semester: '2' }
  }
}

/**
 * Calculates percentage trend based purely on real historical data.
 * Returns empty value (no badge) if:
 * - There is no previous term data to compare (previous === 0)
 * - Both terms have 0 events
 * - The change is 0%
 */
export function computeTrendIndicator(current: number, previous: number): TrendIndicator {
  if (previous <= 0 || (current === 0 && previous === 0)) {
    return {
      value: '',
      isUp: false,
      subText: 'so với kì trước',
    }
  }

  const diff = current - previous
  const percent = Math.round((diff / previous) * 100)

  if (percent === 0) {
    return {
      value: '',
      isUp: false,
      subText: 'so với kì trước',
    }
  }

  const isUp = percent > 0
  const sign = percent > 0 ? `+${percent}%` : `${percent}%`

  return {
    value: sign,
    isUp,
    subText: 'so với kì trước',
  }
}

/**
 * Calculates complete history statistics and trends from actual registration records.
 */
export function calculateRealHistoryStats(
  events: RegisteredEventItem[],
  appliedYear?: string,
  appliedSemester?: string
): HistoryStats {
  const list = Array.isArray(events) ? events : []

  // If user has no events registered at all
  if (list.length === 0) {
    return {
      totalRegistered: 0,
      totalTrend: { value: '', isUp: false, subText: 'so với kì trước' },
      upcoming: 0,
      upcomingTrend: { value: '', isUp: true, subText: 'sắp diễn ra' },
      completed: 0,
      completedTrend: { value: '', isUp: false, subText: 'so với kì trước' },
      absent: 0,
      absentTrend: { value: '', isUp: false, subText: 'so với kì trước' },
    }
  }

  let currentList = list
  let previousList: RegisteredEventItem[] = []

  if (appliedYear && appliedSemester) {
    const prevTerm = getPreviousTerm(appliedYear, appliedSemester)

    const listWithTerms = list.map((e) => ({ event: e, term: getEventTerm(e) }))

    const matchedCurrent = listWithTerms
      .filter((item) => item.term && item.term.year === appliedYear && item.term.semester === appliedSemester)
      .map((item) => item.event)

    const matchedPrev = listWithTerms
      .filter((item) => item.term && item.term.year === prevTerm.year && item.term.semester === prevTerm.semester)
      .map((item) => item.event)

    // Only segment if at least some events have recognized dates
    if (listWithTerms.some((item) => item.term !== null)) {
      currentList = matchedCurrent
      previousList = matchedPrev
    }
  }

  const totalRegistered = currentList.length
  const upcoming = currentList.filter((e) => normalizeHistoryStatus(e.status) === 'UPCOMING').length
  const completed = currentList.filter((e) => normalizeHistoryStatus(e.status) === 'COMPLETED').length
  const absent = currentList.filter((e) => normalizeHistoryStatus(e.status) === 'ABSENT').length

  const prevTotal = previousList.length
  const prevCompleted = previousList.filter((e) => normalizeHistoryStatus(e.status) === 'COMPLETED').length
  const prevAbsent = previousList.filter((e) => normalizeHistoryStatus(e.status) === 'ABSENT').length

  return {
    totalRegistered,
    totalTrend: computeTrendIndicator(totalRegistered, prevTotal),
    upcoming,
    upcomingTrend: { value: '', isUp: true, subText: 'sắp diễn ra' },
    completed,
    completedTrend: computeTrendIndicator(completed, prevCompleted),
    absent,
    absentTrend: computeTrendIndicator(absent, prevAbsent),
  }
}

