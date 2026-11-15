import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'

let activeTooltip: { id: string; close: () => void } | null = null

interface TriggerProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>
}
export interface TooltipProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'content'> {
  children: ReactElement
  content?: ReactNode
}

export const Tooltip = forwardRef<HTMLElement, TooltipProps>(function Tooltip(
  { children, content, ...forwarded },
  forwardedRef
) {
  const child = children as ReactElement<TriggerProps>
  const props = child.props
  const id = useId()
  const trigger = useRef<HTMLElement>(null)
  const tooltip = useRef<HTMLSpanElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0, arrowLeft: 16, above: true })
  const dismiss = () => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    setOpen(false)
    if (activeTooltip?.id === id) activeTooltip = null
  }
  const show = (delay = 0) => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    if (content === undefined || content === null || content === '') return
    if (activeTooltip?.id !== id) activeTooltip?.close()
    activeTooltip = { id, close: dismiss }
    if (delay) openTimer.current = setTimeout(() => setOpen(true), delay)
    else setOpen(true)
  }
  const hide = () => {
    clearTimeout(closeTimer.current)
    clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(dismiss, 150)
  }

  useEffect(
    () => () => {
      clearTimeout(closeTimer.current)
      clearTimeout(openTimer.current)
      if (activeTooltip?.id === id) activeTooltip = null
    },
    [id]
  )
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      if (!trigger.current || !tooltip.current) return
      const rect = trigger.current.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false)
        return
      }
      // Balancing shortens the text lines without shrinking the containing box.
      // Measure those lines, then fit the box before positioning it and its arrow.
      tooltip.current.style.width = ''
      const text = tooltip.current.querySelector('[data-tooltip-content]')
      if (text && typeof content === 'string') {
        const range = document.createRange()
        range.selectNodeContents(text)
        if (typeof range.getClientRects === 'function') {
          const lineWidth = Math.max(0, ...Array.from(range.getClientRects(), (line) => line.width))
          if (lineWidth > 0) {
            const style = window.getComputedStyle(tooltip.current)
            const inset = [
              'paddingLeft',
              'paddingRight',
              'borderLeftWidth',
              'borderRightWidth',
            ].reduce(
              (sum, property) =>
                sum + (parseFloat(style[property as keyof CSSStyleDeclaration] as string) || 0),
              0
            )
            const naturalWidth = tooltip.current.getBoundingClientRect().width
            tooltip.current.style.width = `${Math.min(naturalWidth, Math.ceil(lineWidth + inset + 2))}px`
          }
        }
      }
      const tip = tooltip.current.getBoundingClientRect()
      const anchorX = pointer.current?.x ?? rect.left + rect.width / 2
      const anchorTop = pointer.current?.y ?? rect.top
      const anchorBottom = pointer.current?.y ?? rect.bottom
      const left = Math.max(
        12,
        Math.min(anchorX - tip.width / 2, window.innerWidth - tip.width - 12)
      )
      const above = anchorTop >= tip.height + 24
      const top = above
        ? anchorTop - tip.height - 12
        : Math.max(12, Math.min(anchorBottom + 12, window.innerHeight - tip.height - 12))
      setPosition({
        left,
        top,
        above,
        arrowLeft: Math.max(12, Math.min(anchorX - left, tip.width - 12)),
      })
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !tooltip.current?.contains(event.target as Node)
      )
        dismiss()
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    document.addEventListener('keydown', escape)
    document.addEventListener('pointerdown', outside)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      document.removeEventListener('keydown', escape)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open, content])

  return (
    <>
      {cloneElement(child, {
        ...forwarded,
        ref: (node: HTMLElement | null) => {
          trigger.current = node
          for (const ref of [props.ref, forwardedRef]) {
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }
        },
        tabIndex: props.tabIndex ?? forwarded.tabIndex ?? (content ? 0 : undefined),
        'aria-describedby':
          [props['aria-describedby'], forwarded['aria-describedby'], open ? id : null]
            .filter(Boolean)
            .join(' ') || undefined,
        onMouseEnter: (event) => {
          props.onMouseEnter?.(event)
          forwarded.onMouseEnter?.(event)
          pointer.current = { x: event.clientX, y: event.clientY }
          show(350)
        },
        onMouseMove: (event) => {
          props.onMouseMove?.(event)
          forwarded.onMouseMove?.(event)
          if (!open) pointer.current = { x: event.clientX, y: event.clientY }
        },
        onMouseLeave: (event) => {
          props.onMouseLeave?.(event)
          forwarded.onMouseLeave?.(event)
          hide()
        },
        onFocus: (event) => {
          props.onFocus?.(event)
          forwarded.onFocus?.(event)
          if (event.target === event.currentTarget) {
            pointer.current = null
            show()
          }
        },
        onBlur: (event) => {
          props.onBlur?.(event)
          forwarded.onBlur?.(event)
          hide()
        },
        onClick: (event) => {
          props.onClick?.(event)
          forwarded.onClick?.(event)
          if (trigger.current?.matches('button, a, input, select, textarea, [role="button"]'))
            dismiss()
          else show()
        },
      })}
      {open &&
        createPortal(
          <span
            ref={tooltip}
            id={id}
            role="tooltip"
            onMouseEnter={() => show()}
            onMouseLeave={hide}
            className="fixed z-[2147483647] w-max max-w-[min(360px,calc(100vw-24px))] rounded-lg border border-border bg-white px-3 py-2.5 text-left font-sans text-[13px] font-normal leading-6 tracking-normal text-foreground shadow-lg dark:bg-card whitespace-pre-line break-words pointer-events-auto"
            style={{ left: position.left, top: position.top }}
          >
            <span data-tooltip-content className="block [text-wrap:balance]">
              {content}
            </span>
            <span
              aria-hidden="true"
              data-tooltip-arrow
              className={`absolute h-2 w-2 rotate-45 bg-white dark:bg-card border-border ${position.above ? '-bottom-[5px] border-r border-b' : '-top-[5px] border-l border-t'}`}
              style={{ left: position.arrowLeft - 4 }}
            />
          </span>,
          document.body
        )}
    </>
  )
})
