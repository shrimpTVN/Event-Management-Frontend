import { afterEach, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeToggle } from '../ThemeToggle'

afterEach(() => {
  localStorage.removeItem('student-theme')
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
})

it('switches the actual page theme and restores the choice after remounting', () => {
  const view = render(<ThemeToggle />)
  fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang chế độ tối' }))
  expect(document.documentElement).toHaveClass('dark')
  expect(localStorage.getItem('student-theme')).toBe('dark')
  view.unmount()
  render(<ThemeToggle />)
  fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang chế độ sáng' }))
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('student-theme')).toBe('light')
})
