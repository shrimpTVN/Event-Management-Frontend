import { describe, expect, it } from 'vitest'
import { getPosterColor } from '../PosterBackdrop'

describe('poster background color', () => {
  it('uses the dominant poster tone with reduced brightness instead of a pale blend', () => {
    const pixels = new Uint8ClampedArray([20, 80, 180, 255, 24, 84, 184, 255, 255, 255, 255, 255])
    expect(getPosterColor(pixels)).toBe('rgb(18, 66, 146)')
  })
  it('ignores transparent pixels and falls back when no opaque color is available', () => {
    expect(getPosterColor(new Uint8ClampedArray([255, 255, 255, 0]))).toBeNull()
  })
})
