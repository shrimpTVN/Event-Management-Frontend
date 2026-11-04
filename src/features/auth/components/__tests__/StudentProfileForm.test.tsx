import { describe, it, expect } from 'vitest'
import { extractStudentIdFromEmail } from '../../utils/studentProfileUtils'

describe('extractStudentIdFromEmail', () => {
  it('extracts MSSV from CTU student email format (e.g. nghiab2303832@student.ctu.edu.vn)', () => {
    expect(extractStudentIdFromEmail('nghiab2303832@student.ctu.edu.vn')).toBe('B2303832')
  })

  it('extracts MSSV from locb2303827@student.ctu.edu.vn', () => {
    expect(extractStudentIdFromEmail('locb2303827@student.ctu.edu.vn')).toBe('B2303827')
  })

  it('extracts MSSV when username is directly the student code', () => {
    expect(extractStudentIdFromEmail('b2303827@student.ctu.edu.vn')).toBe('B2303827')
  })

  it('extracts MSSV with other prefix letters (e.g. C, M)', () => {
    expect(extractStudentIdFromEmail('hoangm2301234@student.ctu.edu.vn')).toBe('M2301234')
  })

  it('returns empty string for non-student emails without code pattern', () => {
    expect(extractStudentIdFromEmail('admin@ctu.edu.vn')).toBe('')
    expect(extractStudentIdFromEmail('')).toBe('')
  })
})
