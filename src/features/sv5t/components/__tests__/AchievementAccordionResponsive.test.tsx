import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sv5tSectionAccordion } from '../Sv5tSectionAccordion'
import { TrainingPointsSectionAccordion } from '@/features/training-points/components/TrainingPointsSectionAccordion'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => false) }))
vi.mock('../Sv5tRow', () => ({ Sv5tRow: () => null }))
vi.mock('@/features/training-points/components/TrainingPointsRow', () => ({
  TrainingPointsRow: () => null,
}))

const cases = [
  {
    name: 'SV5T',
    title: 'Tiêu chuẩn Đạo đức tốt',
    score: '3/3 tiêu chí',
    component: (
      <Sv5tSectionAccordion
        standard={{
          criteriaId: 1,
          name: 'Tiêu chuẩn Đạo đức tốt',
          scope: 'UNIVERSITY',
          level: 0,
          childrenOrder: 1,
          requiredChildren: 3,
          completedChildren: 3,
          totalChildren: 3,
          isCompleted: true,
          children: [],
        }}
        standardIndex={1}
        onSaveProgress={vi.fn()}
      />
    ),
  },
  {
    name: 'Điểm rèn luyện',
    title: 'Trách nhiệm với cộng đồng',
    score: '20/20 điểm',
    component: (
      <TrainingPointsSectionAccordion
        section={{
          id: 1,
          name: 'Trách nhiệm với cộng đồng',
          maximum: 20,
          totalPoint: 20,
          note: null,
          level: 0,
          childrenOrder: 1,
          parentCategoryId: null,
        }}
        sectionRoman="I"
        studentScores={{}}
        aggregateScore={20}
        onSaveSelfScore={vi.fn()}
      />
    ),
  },
]

describe.each(cases)('$name responsive section heading', ({ component, title, score }) => {
  it.each([false, true])('uses the correct layout when mobile=%s', (isMobile) => {
    vi.mocked(useMediaQuery).mockReturnValue(isMobile)
    render(component)
    const heading = screen.getByText(title).closest('.achievement-accordion__heading')!
    const summary = screen.getByText(isMobile || score.endsWith('điểm') ? score : `Đã đạt ${score}`)
    // Desktop keeps the score below its title; mobile moves it beside the title.
    expect(heading.contains(summary)).toBe(!isMobile)
    const trigger = heading.closest('button')!
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toHaveAttribute(
      'aria-hidden',
      'false'
    )
  })
})
