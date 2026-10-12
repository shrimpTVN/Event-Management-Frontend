import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from '../formatDate'
import { formatCurrency } from '../formatCurrency'

describe('Formatting utilities', () => {
  describe('formatDate', () => {
    it('formats ISO dates correctly', () => {
      const result = formatDate('2026-10-15T10:00:00.000Z')
      expect(result).toBe('Oct 15, 2026')
    })

    it('returns empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('')
      expect(formatDate('')).toBe('')
    })
  })

  describe('formatDateTime', () => {
    it('formats date with time correctly', () => {
      const result = formatDateTime('2026-10-15T14:30:00.000Z')
      expect(result).toContain('Oct 15, 2026')
    })
  })

  describe('formatCurrency', () => {
    it('formats zero as Free', () => {
      expect(formatCurrency(0)).toBe('Free')
    })

    it('formats positive numbers as currency', () => {
      expect(formatCurrency(50)).toBe('$50')
      expect(formatCurrency(29.99)).toBe('$29.99')
    })
  })
})
