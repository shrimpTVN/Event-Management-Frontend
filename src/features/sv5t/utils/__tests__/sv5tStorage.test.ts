import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getStoredEvaluations, setStoredEvaluations } from '../sv5tStorage'

describe('sv5tStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns empty maps when no data is stored in localStorage', () => {
    const data = getStoredEvaluations(136, 2)
    expect(data.completedMap).toEqual({})
    expect(data.noteMap).toEqual({})
  })

  it('stores and retrieves self-evaluation choices correctly for an academic year', () => {
    setStoredEvaluations(136, 2, {
      completedMap: { 101: false, 102: true },
      noteMap: { 102: 'Minh chứng NCKH' },
    })

    const data = getStoredEvaluations(136, 2)
    expect(data.completedMap).toEqual({ 101: false, 102: true })
    expect(data.noteMap).toEqual({ 102: 'Minh chứng NCKH' })
  })

  it('isolates storage across different users and academic years', () => {
    setStoredEvaluations(136, 2, {
      completedMap: { 101: false },
      noteMap: {},
    })

    setStoredEvaluations(137, 2, {
      completedMap: { 101: true },
      noteMap: { 101: 'Ghi chú user khác' },
    })

    setStoredEvaluations(136, 3, {
      completedMap: { 101: true },
      noteMap: {},
    })

    expect(getStoredEvaluations(136, 2).completedMap[101]).toBe(false)
    expect(getStoredEvaluations(137, 2).completedMap[101]).toBe(true)
    expect(getStoredEvaluations(136, 3).completedMap[101]).toBe(true)
  })

  it('handles invalid JSON gracefully without throwing', () => {
    localStorage.setItem('sv5t_self_eval_136_2', 'invalid json {{{')
    const data = getStoredEvaluations(136, 2)
    expect(data.completedMap).toEqual({})
    expect(data.noteMap).toEqual({})
  })
})
