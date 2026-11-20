import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DrlScoreGauge } from '../DrlScoreGauge'

describe('DrlScoreGauge (ECharts Gauge Ring)', () => {
  it('renders score and maxScore properly', () => {
    render(<DrlScoreGauge score={75} maxScore={100} classification="Khá" />)

    expect(screen.getByText('75')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
  })

  it('handles low score (Yếu)', () => {
    render(<DrlScoreGauge score={25} maxScore={100} classification="Yếu" />)

    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
  })

  it('handles high score (Xuất sắc)', () => {
    render(<DrlScoreGauge score={95} maxScore={100} classification="Xuất sắc" />)

    expect(screen.getByText('95')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
  })
})
