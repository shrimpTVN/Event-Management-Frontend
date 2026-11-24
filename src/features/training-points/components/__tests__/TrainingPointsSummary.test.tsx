import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { TrainingPointsSummary } from '../TrainingPointsSummary'
afterEach(cleanup)
it('does not classify a failed request as a zero score', () => {
  render(
    <TrainingPointsSummary
      semesterLabel="HK1"
      academicYearLabel="2026 - 2027"
      totalScore={0}
      unavailable
    />
  )
  expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument()
  expect(screen.queryByText('Kém')).not.toBeInTheDocument()
  expect(screen.queryByText('0')).not.toBeInTheDocument()
})
