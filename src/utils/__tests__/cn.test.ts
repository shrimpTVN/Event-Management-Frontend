import { describe, it, expect } from 'vitest'
import { cn } from '../cn'

describe('cn utility', () => {
  it('combines class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('handles conditional classes properly', () => {
    const isActive = true
    const isHidden = false
    expect(cn('base-class', isActive && 'is-active', isHidden && 'is-hidden')).toBe(
      'base-class is-active'
    )
  })

  it('resolves conflicting tailwind classes cleanly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('handles null, undefined, and empty strings gracefully', () => {
    expect(cn('btn', null, undefined, '', 'btn-primary')).toBe('btn btn-primary')
  })
})
