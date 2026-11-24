import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sv5tSummary } from '../Sv5tSummary'
import { Sv5tNoticeBanner } from '../Sv5tNoticeBanner'

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes('767px'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterEach(cleanup)

describe('Sv5t Mobile & Summary Tests', () => {
  it('correctly renders completed standards count and scope', () => {
    render(
      <Sv5tSummary
        academicYearLabel="2026 - 2027"
        completedStandardsCount={3}
        totalStandardsCount={5}
        scope="UNIVERSITY"
        unavailable={false}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('/ 5 tiêu chuẩn')).toBeInTheDocument()
    expect(screen.getByText('Cấp ĐHCT')).toBeInTheDocument()
  })

  it('renders "——" when unavailable in Sv5tSummary', () => {
    render(
      <Sv5tSummary
        academicYearLabel="2026 - 2027"
        completedStandardsCount={0}
        totalStandardsCount={5}
        scope="FACULTY"
        unavailable={true}
      />
    )
    expect(screen.getByText('——')).toBeInTheDocument()
    expect(screen.getByText('Cấp Khoa')).toBeInTheDocument()
  })

  it('Sv5tNoticeBanner toggles details on click', () => {
    render(<Sv5tNoticeBanner />)
    expect(screen.getByText('Kết quả tham khảo')).toBeInTheDocument()

    const toggleBtn = screen.getByRole('button', { name: /Chi tiết|Thu gọn/i })
    expect(toggleBtn).toBeInTheDocument()

    // Expand
    fireEvent.click(toggleBtn)
    expect(
      screen.getByText(/Bảng tiêu chuẩn chỉ mang tính chất lưu lại các hoạt động và để sinh viên tự đánh giá/)
    ).toBeInTheDocument()
  })
})
