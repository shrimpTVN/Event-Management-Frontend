import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AdminActionMenu } from '../AdminActionMenu'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

function renderMenu(top: number) {
  const container = document.createElement('div')
  container.style.overflow = 'auto'
  const anchor = document.createElement('button')
  container.append(anchor)
  const mount = document.createElement('div')
  container.append(mount)
  document.body.append(container)
  let anchorTop = top
  vi.spyOn(anchor, 'getBoundingClientRect').mockImplementation(
    () => ({ top: anchorTop, bottom: anchorTop + 32, right: 300 }) as DOMRect
  )
  vi.spyOn(HTMLDivElement.prototype, 'scrollHeight', 'get').mockReturnValue(180)
  vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 208,
    height: 180,
  } as DOMRect)
  const onClose = vi.fn()
  const onAction = vi.fn()
  render(
    <AdminActionMenu anchor={anchor} onClose={onClose} data-testid="actions">
      <button onClick={onAction}>View details</button>
    </AdminActionMenu>,
    { container: mount }
  )
  return {
    anchor,
    container,
    onClose,
    onAction,
    moveAnchor: (top: number) => {
      anchorTop = top
    },
  }
}

describe('admin table action menu', () => {
  it('escapes the scrolling table and opens above the last row', () => {
    renderMenu(window.innerHeight - 48)
    const menu = screen.getByTestId('actions')
    expect(menu.parentElement).toBe(document.body)
    expect(menu).toHaveStyle({ position: 'fixed', top: `${window.innerHeight - 234}px` })
  })

  it('tracks table scrolling and viewport resizing', () => {
    const { container, moveAnchor } = renderMenu(100)
    const menu = screen.getByTestId('actions')
    expect(menu).toHaveStyle({ top: '138px', left: '92px' })
    moveAnchor(window.innerHeight - 48)
    fireEvent.scroll(container)
    expect(menu).toHaveStyle({ top: `${window.innerHeight - 234}px` })
    moveAnchor(50)
    fireEvent.resize(window)
    expect(menu).toHaveStyle({ top: '88px' })
  })

  it('preserves actions and closes outside or on Escape without closing on the trigger', () => {
    const { anchor, onClose, onAction } = renderMenu(100)
    fireEvent.mouseDown(anchor)
    fireEvent.mouseDown(screen.getByText('View details'))
    fireEvent.click(screen.getByText('View details'))
    expect(onAction).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalledOnce()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(anchor).toHaveFocus()
  })
})
