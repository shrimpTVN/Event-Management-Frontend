import { useCallback, useEffect, useRef, type UIEvent } from 'react'

/** Reveal only the scrollbar belonging to the pane being scrolled. */
export function useScrollActivity(enabled = true) {
  const timers = useRef(new Map<HTMLElement, ReturnType<typeof setTimeout>>())
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer, element) => {
        clearTimeout(timer)
        delete element.dataset.scrolling
      })
      pending.clear()
    }
  }, [enabled])
  return useCallback(
    (event: UIEvent<HTMLElement>) => {
      if (!enabled) return
      const element = event.currentTarget
      const previous = timers.current.get(element)
      if (previous) clearTimeout(previous)
      element.dataset.scrolling = 'true'
      timers.current.set(
        element,
        setTimeout(() => {
          delete element.dataset.scrolling
          timers.current.delete(element)
        }, 800)
      )
    },
    [enabled]
  )
}
