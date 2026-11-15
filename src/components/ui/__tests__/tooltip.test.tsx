import { createRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Button } from '../button'
import { Tooltip } from '../tooltip'

describe('shared Tooltip', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  it('waits before opening and cancels when the mouse only passes over a trigger', () => {
    render(
      <Tooltip content="Nội dung">
        <span>Thông tin</span>
      </Tooltip>
    )
    const trigger = screen.getByText('Thông tin')
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(349))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseLeave(trigger)
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(trigger)
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip').querySelector('[data-tooltip-arrow]')).toBeInTheDocument()
  })
  it('preserves the original button, ref, accessible label and action', () => {
    const ref = createRef<HTMLButtonElement>()
    const click = vi.fn()
    render(
      <Tooltip content="Thông tin đầy đủ">
        <Button ref={ref} onClick={click} aria-label="Xem chi tiết">
          Xem
        </Button>
      </Tooltip>
    )
    const button = screen.getByRole('button', { name: 'Xem chi tiết' })
    expect(ref.current).toBe(button)
    fireEvent.mouseEnter(button)
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Thông tin đầy đủ')
    fireEvent.click(button)
    expect(click).toHaveBeenCalledOnce()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(button).not.toHaveAttribute('title')
  })

  it('preserves Radix asChild behavior when used inside a dialog trigger', () => {
    render(
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Tooltip content="Xem quyền lợi">
            <Button>Quyền lợi</Button>
          </Tooltip>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Content aria-describedby={undefined}>
            <Dialog.Title>Quyền lợi tham gia</Dialog.Title>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Quyền lợi' }))
    expect(screen.getByRole('dialog', { name: 'Quyền lợi tham gia' })).toBeInTheDocument()
  })

  it('does not add a wrapping element around table cells', () => {
    render(
      <table>
        <tbody>
          <tr>
            <Tooltip content="Tên đầy đủ">
              <td>Tên</td>
            </Tooltip>
          </tr>
        </tbody>
      </table>
    )
    const cell = screen.getByRole('cell')
    expect(cell.parentElement?.tagName).toBe('TR')
    fireEvent.focus(cell)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tên đầy đủ')
  })

  it('shows a single tooltip when the triggers are nested', () => {
    render(
      <Tooltip content="Thông tin nhóm">
        <div>
          <Tooltip content="Thông tin chi tiết">
            <span>Chi tiết</span>
          </Tooltip>
        </div>
      </Tooltip>
    )
    fireEvent.mouseEnter(screen.getByText('Chi tiết'))
    act(() => vi.advanceTimersByTime(350))
    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Thông tin chi tiết')
  })
})
