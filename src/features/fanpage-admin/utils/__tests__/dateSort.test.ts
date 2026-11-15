import { describe, expect, it } from 'vitest'
import { dateTimestamp, sortByDate } from '../dateSort'

describe('date sorting with real and formatted API dates', () => {
  it('reads Vietnamese day/month dates and preserves seconds across display formats', () => {
    expect(dateTimestamp('21:10:28, 13/11/2026')).toBe(Date.parse('2026-11-13T21:10:28+07:00'))
    expect(dateTimestamp('13/11/2026 21:10:28')).toBe(dateTimestamp('21:10:28 13/11/2026'))
    expect(dateTimestamp('11/12/2026')).toBeGreaterThan(dateTimestamp('12/11/2026')!)
    expect(dateTimestamp('31/02/2026')).toBeNull()
    expect(dateTimestamp('Chưa cập nhật')).toBeNull()
  })
  it('keeps missing dates last, tied dates stable, and source order unchanged', () => {
    const input = [
      { id: 1, date: '' },
      { id: 2, date: '11/12/2026' },
      { id: 3, date: '12/11/2026' },
      { id: 4, date: '11/12/2026' },
    ]
    expect(sortByDate(input, 'desc', (row) => row.date).map((row) => row.id)).toEqual([2, 4, 3, 1])
    expect(sortByDate(input, 'asc', (row) => row.date).map((row) => row.id)).toEqual([3, 2, 4, 1])
    expect(input.map((row) => row.id)).toEqual([1, 2, 3, 4])
  })
})
