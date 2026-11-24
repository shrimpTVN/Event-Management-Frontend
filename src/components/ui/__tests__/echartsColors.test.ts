import { describe, expect, it } from 'vitest'
import { color } from 'echarts/core'
import { toEChartsHsl } from '../echartsColors'

describe('chart colors used by hover emphasis', () => {
  it('converts CSS theme colors into a format the real ECharts color parser can highlight', () => {
    expect(color.parse('hsl(213 69% 39%)')).toBeUndefined()
    const primary = toEChartsHsl('213 69% 39%', '#1B4B8A')
    expect(color.parse(primary)).toHaveLength(4)
    expect(color.parse(color.lift(primary, -0.1))).toHaveLength(4)
  })
  it('supports dark theme tokens and falls back when no theme token is available', () => {
    expect(color.parse(toEChartsHsl('217 91% 60%', '#1B4B8A'))).toHaveLength(4)
    expect(toEChartsHsl('', '#1B4B8A')).toBe('#1B4B8A')
    expect(toEChartsHsl('invalid', '#1B4B8A')).toBe('#1B4B8A')
  })
})
