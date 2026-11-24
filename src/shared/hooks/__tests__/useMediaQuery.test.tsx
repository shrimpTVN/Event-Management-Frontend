import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useMediaQuery } from '../useMediaQuery'

afterEach(() => vi.unstubAllGlobals())
it('updates when the viewport crosses a breakpoint and removes the listener on unmount', () => {
  let matches = false
  const listeners = new Set<() => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches
      },
      addEventListener: (_event: string, callback: () => void) => listeners.add(callback),
      removeEventListener: (_event: string, callback: () => void) => listeners.delete(callback),
    }))
  )
  const hook = renderHook(() => useMediaQuery('(max-width: 767px)'))
  expect(hook.result.current).toBe(false)
  act(() => {
    matches = true
    listeners.forEach((notify) => notify())
  })
  expect(hook.result.current).toBe(true)
  hook.unmount()
  expect(listeners.size).toBe(0)
})
