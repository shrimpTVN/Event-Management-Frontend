import { useEffect, useState } from 'react'

// Refresh at the boundary and on returning to the tab, including after device sleep.
export function useTimeBoundary(date?: string | null) {
  const [, refresh] = useState(0)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (timer) clearTimeout(timer)
      refresh((value) => value + 1)
      const boundary = date ? Date.parse(date) : NaN
      const delay = boundary - Date.now() + 1
      if (delay > 0) timer = setTimeout(schedule, Math.min(delay, 2_147_483_647))
    }
    schedule()
    window.addEventListener('focus', schedule)
    document.addEventListener('visibilitychange', schedule)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('focus', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [date])
  return Date.now()
}
