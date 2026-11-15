import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TextTooltip } from '../text-tooltip'

describe('TextTooltip', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('shows readable wrapped text outside clipping containers on hover and dismisses with Escape', () => {
    render(
      <div className="overflow-hidden">
        <TextTooltip
          label="Tình nguyện tốt (4.3)"
          content="Tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học"
        />
      </div>
    )
    const label = screen.getByText('Tình nguyện tốt (4.3)')
    fireEvent.mouseEnter(label)
    act(() => vi.advanceTimersByTime(350))
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học')
    expect(tip).toHaveClass('whitespace-pre-line', 'leading-6')
    expect(tip.parentElement).toBe(document.body)
    expect(label).toHaveAttribute('aria-describedby', tip.id)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('supports keyboard focus and tap, and closes when tapping outside', () => {
    render(<TextTooltip label="Hội nhập tốt (5.1)" content="Tên mục con" />)
    const label = screen.getByText('Hội nhập tốt (5.1)')
    fireEvent.focus(label)
    fireEvent.click(label)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tên mục con')
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
