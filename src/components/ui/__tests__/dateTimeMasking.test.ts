import { describe, it, expect } from 'vitest'
import { maskDateInput } from '../date-picker'
import { maskTimeInput } from '../time-select'

describe('maskDateInput', () => {
  it('adds slash after 2 digits (day)', () => {
    expect(maskDateInput('1', '')).toBe('1')
    expect(maskDateInput('10', '')).toBe('10/')
    expect(maskDateInput('15', '')).toBe('15/')
  })

  it('adds second slash after 4 digits (day + month)', () => {
    expect(maskDateInput('10/1', '10/')).toBe('10/1')
    expect(maskDateInput('10/10', '10/1')).toBe('10/10/')
  })

  it('formats full 8 digits as DD/MM/YYYY', () => {
    expect(maskDateInput('15102026', '')).toBe('15/10/2026')
    expect(maskDateInput('15/10/2026', '15/10/202')).toBe('15/10/2026')
  })

  it('handles backspacing cleanly', () => {
    expect(maskDateInput('10', '10/')).toBe('1')
    expect(maskDateInput('10/10', '10/10/')).toBe('10/1')
  })

  it('handles pasted ISO dates', () => {
    expect(maskDateInput('2026-10-15', '')).toBe('15/10/2026')
  })
})

describe('maskTimeInput', () => {
  it('adds colon after 2 digits (hour)', () => {
    expect(maskTimeInput('0', '')).toBe('0')
    expect(maskTimeInput('02', '')).toBe('02:')
    expect(maskTimeInput('14', '')).toBe('14:')
  })

  it('automatically adds 0 and colon if first digit >= 3', () => {
    expect(maskTimeInput('8', '')).toBe('08:')
    expect(maskTimeInput('9', '')).toBe('09:')
  })

  it('formats full 4 digits as HH:mm', () => {
    expect(maskTimeInput('0830', '')).toBe('08:30')
    expect(maskTimeInput('1445', '')).toBe('14:45')
  })

  it('clamps invalid hours and minutes', () => {
    expect(maskTimeInput('2500', '')).toBe('23:00')
    expect(maskTimeInput('0890', '')).toBe('08:59')
  })

  it('handles backspacing cleanly over colon', () => {
    expect(maskTimeInput('08', '08:')).toBe('0')
  })
})
