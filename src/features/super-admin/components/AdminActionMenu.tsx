import { useLayoutEffect, useRef, type HTMLAttributes } from 'react'
import { createPortal } from 'react-dom'

interface AdminActionMenuProps extends HTMLAttributes<HTMLDivElement> {
  anchor: HTMLButtonElement | null
  onClose: () => void
}

// Render outside the table's scrolling container so row actions cannot be clipped.
export function AdminActionMenu({ anchor, onClose, style, ...props }: AdminActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!anchor || !menu) return

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const gap = 6
      const below = Math.max(0, window.innerHeight - rect.bottom - gap - margin)
      const above = Math.max(0, rect.top - gap - margin)
      const openAbove = menu.scrollHeight > below && above > below
      menu.style.maxHeight = `${openAbove ? above : below}px`
      menu.style.maxWidth = `${Math.max(0, window.innerWidth - margin * 2)}px`
      const { width, height } = menu.getBoundingClientRect()
      menu.style.left = `${Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin))}px`
      menu.style.top = `${openAbove ? Math.max(margin, rect.top - gap - height) : rect.bottom + gap}px`
    }
    const handleMouseDown = (event: MouseEvent) => {
      if (!menu.contains(event.target as Node) && !anchor.contains(event.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        anchor.focus()
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchor, onClose])

  if (!anchor) return null

  return createPortal(
    <div {...props} ref={menuRef} style={{ ...style, position: 'fixed', overflowY: 'auto' }} />,
    document.body
  )
}
