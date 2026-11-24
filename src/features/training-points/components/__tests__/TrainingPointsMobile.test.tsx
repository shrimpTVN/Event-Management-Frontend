import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TrainingPointsSummary } from '../TrainingPointsSummary'
import { TrainingPointsNoticeBanner } from '../TrainingPointsNoticeBanner'
import { MobileCriterionCard } from '@/shared/components/MobileCriterionCard'

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

describe('TrainingPoints Mobile & Summary Tests', () => {
  it('correctly renders totalScore = 0 as "0" when available', () => {
    render(
      <TrainingPointsSummary
        semesterLabel="HK1"
        academicYearLabel="2026 - 2027"
        totalScore={0}
        maxScore={100}
        activitiesCount={0}
        unavailable={false}
      />
    )
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('——')).not.toBeInTheDocument()
  })

  it('renders "——" and "Chưa có dữ liệu" when unavailable', () => {
    render(
      <TrainingPointsSummary
        semesterLabel="HK1"
        academicYearLabel="2026 - 2027"
        totalScore={0}
        maxScore={100}
        activitiesCount={0}
        unavailable={true}
      />
    )
    expect(screen.getByText('——')).toBeInTheDocument()
    expect(screen.getByText(/Chưa có dữ liệu/)).toBeInTheDocument()
  })

  it('TrainingPointsNoticeBanner toggles details on click', () => {
    render(<TrainingPointsNoticeBanner />)
    expect(screen.getByText('Kết quả tham khảo')).toBeInTheDocument()

    const toggleBtn = screen.getByRole('button', { name: /Chi tiết|Thu gọn/i })
    expect(toggleBtn).toBeInTheDocument()

    // Expand
    fireEvent.click(toggleBtn)
    expect(screen.getByText(/Bảng điểm chỉ mang tính tham khảo để sinh viên theo dõi/)).toBeInTheDocument()
  })

  it('MobileCriterionCard renders balanced columns and actions', () => {
    const onEval = vi.fn()
    const onDet = vi.fn()

    render(
      <MobileCriterionCard
        code="I.1"
        title="Tham gia hội thảo hướng nghiệp"
        note="Phải tham gia ít nhất 1 buổi"
        result="5/5"
        recorded="5 điểm"
        evaluation="5 điểm"
        evaluated={true}
        onEvaluate={onEval}
        onDetail={onDet}
      />
    )

    expect(screen.getByText('I.1')).toBeInTheDocument()
    expect(screen.getByText(/Tham gia hội thảo hướng nghiệp/)).toBeInTheDocument()
    expect(screen.getByText('Ghi nhận')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sửa đánh giá' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chi tiết' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sửa đánh giá' }))
    expect(onEval).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }))
    expect(onDet).toHaveBeenCalledTimes(1)
  })

  it('MobileCriterionCard hides detail button when onDetail is not provided', () => {
    render(
      <MobileCriterionCard
        code="I.2"
        title="Tiêu chí không có chi tiết"
        recorded="0 điểm"
        evaluation="0 điểm"
        onEvaluate={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: 'Chi tiết' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tự đánh giá' })).toBeInTheDocument()
  })
})
