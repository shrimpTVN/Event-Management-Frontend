import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// Keep position per search URL, including the number of results revealed.
const positions = new Map<string, { top: number; count: number }>()
export function useMobileSearchScroll(
  key: string,
  enabled: boolean,
  ready: boolean,
  resultCount: number
) {
  const ref = useRef<HTMLElement>(null)
  const [page, setPage] = useState(() => ({ key, count: positions.get(key)?.count || 20 }))
  const count = page.key === key ? page.count : positions.get(key)?.count || 20
  const currentCount = useRef(count)
  currentCount.current = count
  const restoredKey = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!enabled || !ready || !ref.current || restoredKey.current === key) return
    ref.current.scrollTop = positions.get(key)?.top || 0
    restoredKey.current = key
  }, [key, enabled, ready, resultCount, count])
  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return
    const save = () => {
      if (positions.size > 30 && !positions.has(key))
        positions.delete(positions.keys().next().value!)
      positions.set(key, { top: node.scrollTop, count: currentCount.current })
    }
    node.addEventListener('scroll', save, { passive: true })
    return () => {
      node.removeEventListener('scroll', save)
    }
  }, [key, enabled])
  return {
    ref,
    count,
    showMore: () => {
      positions.set(key, { top: ref.current?.scrollTop || 0, count: count + 20 })
      setPage({ key, count: count + 20 })
    },
  }
}
