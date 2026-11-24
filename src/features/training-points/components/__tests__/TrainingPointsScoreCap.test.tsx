import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TrainingPointsSectionAccordion } from '../TrainingPointsSectionAccordion'
import type { StudentSemesterPointGroupedTree } from '../../types/trainingPoints.types'

vi.mock('../TrainingPointsRow', () => ({ TrainingPointsRow: () => null }))

it('caps an over-limit backend section in its heading and footer, including after local edits', () => {
  const section: StudentSemesterPointGroupedTree = {
    id: 5,
    name: 'Mục V',
    note: null,
    maximum: 20,
    level: 0,
    parentCategoryId: null,
    isActive: true,
    childrenOrder: 5,
    totalPoint: 24,
    systemPointRecord: 19,
    manualPointRecord: 5,
    items: [
      {
        id: 51,
        name: 'V.b',
        note: null,
        maximum: 12,
        level: 1,
        parentCategoryId: 5,
        isActive: true,
        childrenOrder: 1,
        isLeaf: true,
        totalPoint: 24,
        systemPointRecord: 19,
        manualPointRecord: 5,
      },
    ],
  }
  const props = {
    section,
    sectionRoman: 'V',
    studentScores: {},
    onSaveSelfScore: vi.fn(),
    defaultExpanded: true,
  }
  const view = render(<TrainingPointsSectionAccordion {...props} />)
  expect(screen.getByText('20/20 điểm')).toBeInTheDocument()
  const footer = () => screen.getByText('Cộng điểm mục V').parentElement!
  expect(footer().lastElementChild).toHaveTextContent(/^Tổng20$/)
  expect(screen.queryByText('24/20 điểm')).not.toBeInTheDocument()

  view.rerender(<TrainingPointsSectionAccordion {...props} studentScores={{ 51: 4 }} />)
  expect(screen.getByText('20/20 điểm')).toBeInTheDocument()
  expect(footer().lastElementChild).toHaveTextContent(/^Tổng20$/)

  view.rerender(<TrainingPointsSectionAccordion {...props} studentScores={{ 51: 0 }} />)
  expect(screen.getByText('19/20 điểm')).toBeInTheDocument()
  expect(footer().lastElementChild).toHaveTextContent(/^Tổng19$/)
  expect(section.totalPoint).toBe(24)
})
