import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { EChartsReact } from '../EChartsReact'

const chart = vi.hoisted(() => ({
  setOption: vi.fn(),
  resize: vi.fn(),
  hideLoading: vi.fn(),
  showLoading: vi.fn(),
  dispose: vi.fn(),
  isDisposed: () => false,
}))
vi.mock('echarts/core', () => ({ init: () => chart, use: vi.fn() }))

let onVisibility: IntersectionObserverCallback
let onResize: ResizeObserverCallback
const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts')

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        onVisibility = callback
      }
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        onResize = callback
      }
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false }))
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts)
  else Reflect.deleteProperty(document, 'fonts')
})

it('waits for visibility and fonts, then draws once without interrupting the entrance', async () => {
  let finishFonts!: () => void
  const ready = new Promise<void>((resolve) => {
    finishFonts = resolve
  })
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { status: 'loading', ready },
  })
  const option = { animation: true, animationDuration: 1000 }
  const view = render(<EChartsReact option={option} animateOnView />)
  act(() =>
    onVisibility(
      [{ isIntersecting: true }] as IntersectionObserverEntry[],
      {} as IntersectionObserver
    )
  )
  expect(chart.setOption).not.toHaveBeenCalled()
  await act(async () => {
    finishFonts()
    await ready
  })
  expect(chart.setOption).toHaveBeenCalledExactlyOnceWith(option, true)
  act(() => onResize([], {} as ResizeObserver))
  expect(chart.resize).not.toHaveBeenCalled()
  expect(chart.setOption).toHaveBeenCalledTimes(1)
  view.unmount()
})

it('shows the final chart immediately when reduced motion is enabled', () => {
  Object.defineProperty(document, 'fonts', { configurable: true, value: undefined })
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  )
  const view = render(<EChartsReact option={{ animation: true }} />)
  expect(chart.setOption).toHaveBeenCalledExactlyOnceWith({ animation: false }, true)
  view.unmount()
})
