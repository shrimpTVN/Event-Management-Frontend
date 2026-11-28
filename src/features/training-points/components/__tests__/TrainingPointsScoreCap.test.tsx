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
    systemPointRecord: 25,
    manualPointRecord: 24,
    items: [
      {
        id: 50,
        name: 'V.a',
        note: null,
        maximum: 10,
        level: 1,
        parentCategoryId: 5,
        isActive: true,
        childrenOrder: 1,
        isLeaf: true,
        totalPoint: 10,
        systemPointRecord: 10,
        manualPointRecord: 0,
      },
      {
        id: 51,
        name: 'V.b',
        note: null,
        maximum: 12,
        level: 1,
        parentCategoryId: 5,
        isActive: true,
        childrenOrder: 2,
        isLeaf: true,
        totalPoint: 14,
        systemPointRecord: 9,
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
  expect(footer().children[2]).toHaveTextContent(/^Điểm hệ thống20$/)
  expect(footer().children[3]).toHaveTextContent(/^Tự đánh giá20$/)
  expect(screen.queryByText('24/20 điểm')).not.toBeInTheDocument()

  view.rerender(<TrainingPointsSectionAccordion {...props} studentScores={{ 51: 4 }} />)
  expect(screen.getByText('20/20 điểm')).toBeInTheDocument()
  expect(footer().lastElementChild).toHaveTextContent(/^Tổng20$/)

  view.rerender(<TrainingPointsSectionAccordion {...props} studentScores={{ 51: 0 }} />)
  expect(screen.getByText('20/20 điểm')).toBeInTheDocument()
  expect(footer().lastElementChild).toHaveTextContent(/^Tổng20$/)
  expect(section.totalPoint).toBe(24)
})
