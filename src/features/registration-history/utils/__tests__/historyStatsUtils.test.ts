import { describe, it, expect } from 'vitest'
import {
  calculateRealHistoryStats,
  computeTrendIndicator,
  getEventTerm,
  getPreviousTerm,
} from '../historyStatsUtils'
import type { RegisteredEventItem } from '../../types/history.types'

describe('historyStatsUtils', () => {
  it('returns empty trend values (no badges) when student has no events', () => {
    const stats = calculateRealHistoryStats([], '2026 - 2027', '1')

    expect(stats.totalRegistered).toBe(0)
    expect(stats.totalTrend?.value).toBe('')
    expect(stats.upcoming).toBe(0)
    expect(stats.upcomingTrend?.value).toBe('')
    expect(stats.completed).toBe(0)
    expect(stats.completedTrend?.value).toBe('')
    expect(stats.absent).toBe(0)
    expect(stats.absentTrend?.value).toBe('')
  })

  it('correctly maps dates to Vietnamese academic semesters', () => {
    const eventHK1: RegisteredEventItem = {
      id: '1',
      eventId: 1,
      status: 'COMPLETED',
      dateHappen: '2026-10-15T08:00:00Z',
    }
    const eventHK2: RegisteredEventItem = {
      id: '2',
      eventId: 2,
      status: 'UPCOMING',
      dateHappen: '2027-03-20T08:00:00Z',
    }

    expect(getEventTerm(eventHK1)).toEqual({ year: '2026 - 2027', semester: '1' })
    expect(getEventTerm(eventHK2)).toEqual({ year: '2026 - 2027', semester: '2' })
  })

  it('determines previous term correctly', () => {
    expect(getPreviousTerm('2026 - 2027', '1')).toEqual({ year: '2025 - 2026', semester: '2' })
    expect(getPreviousTerm('2026 - 2027', '2')).toEqual({ year: '2026 - 2027', semester: '1' })
  })

  it('returns no badge when previous term has 0 events', () => {
    const indicator = computeTrendIndicator(5, 0)
    expect(indicator.value).toBe('')
  })

  it('calculates real trend percentage when previous data is available', () => {
    // 4 in previous, 6 in current -> +50%
    const indicatorUp = computeTrendIndicator(6, 4)
    expect(indicatorUp.value).toBe('+50%')
    expect(indicatorUp.isUp).toBe(true)

    // 4 in previous, 2 in current -> -50%
    const indicatorDown = computeTrendIndicator(2, 4)
    expect(indicatorDown.value).toBe('-50%')
    expect(indicatorDown.isUp).toBe(false)

    // 4 in previous, 4 in current -> 0% (no badge)
    const indicatorSame = computeTrendIndicator(4, 4)
    expect(indicatorSame.value).toBe('')
  })

  it('calculates stats from real event history segmented by semester', () => {
    const mockEvents: RegisteredEventItem[] = [
      // Previous term: 2025-2026, HK2 (e.g. March 2026)
      { id: '1', eventId: 1, status: 'COMPLETED', dateHappen: '2026-03-10T00:00:00Z' },
      { id: '2', eventId: 2, status: 'COMPLETED', dateHappen: '2026-04-12T00:00:00Z' },

      // Current term: 2026-2027, HK1 (e.g. October 2026)
      { id: '3', eventId: 3, status: 'COMPLETED', dateHappen: '2026-10-01T00:00:00Z' },
      { id: '4', eventId: 4, status: 'COMPLETED', dateHappen: '2026-10-15T00:00:00Z' },
      { id: '5', eventId: 5, status: 'COMPLETED', dateHappen: '2026-11-20T00:00:00Z' },
      { id: '6', eventId: 6, status: 'UPCOMING', dateHappen: '2026-12-05T00:00:00Z' },
    ]

    const stats = calculateRealHistoryStats(mockEvents, '2026 - 2027', '1')

    // Current has 4 events (3 completed, 1 upcoming)
    expect(stats.totalRegistered).toBe(4)
    expect(stats.completed).toBe(3)
    expect(stats.upcoming).toBe(1)

    // Previous had 2 total events, now 4 -> +100%
    expect(stats.totalTrend?.value).toBe('+100%')
    expect(stats.totalTrend?.isUp).toBe(true)

    // Previous had 2 completed, now 3 -> +50%
    expect(stats.completedTrend?.value).toBe('+50%')
    expect(stats.completedTrend?.isUp).toBe(true)
  })
})

