import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { extractStudentIdFromEmail } from '../../utils/studentProfileUtils'
import { StudentProfileForm } from '../StudentProfileForm'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

describe('StudentProfileForm UI & Skip feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders skip buttons allowing student to skip profile completion', () => {
    render(
      <MemoryRouter>
        <StudentProfileForm />
      </MemoryRouter>
    )

    // Check presence of skip buttons (top navigation and bottom action button)
    const skipButtons = screen.getAllByRole('button', { name: /Bỏ qua/i })
    expect(skipButtons.length).toBeGreaterThanOrEqual(1)

    // Click bottom "Bỏ qua, cập nhật sau" button
    fireEvent.click(skipButtons[skipButtons.length - 1])
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
