import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { StudentNavigationDrawer } from '../StudentNavigationDrawer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/features/events', () => ({
  StudentLeftSidebar: ({ showHomeLink }: { showHomeLink?: boolean }) => (
    <>
      {showHomeLink && <Link to="/">Trang chủ</Link>}
      <Link to="/training-points">Điểm rèn luyện</Link>
    </>
  ),
  StudentRightSidebar: () => <p>Lịch hoạt động của bạn</p>,
}))
vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => false) }))
beforeEach(() => vi.mocked(useMediaQuery).mockReturnValue(false))
afterEach(() => vi.useRealTimers())

it('places the personal account and logout inside the phone menu', async () => {
  vi.mocked(useMediaQuery).mockReturnValue(true)
  const onLogout = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StudentNavigationDrawer
          user={{
            id: 'mobile-user',
            name: 'Sinh viên thử',
            email: 'b2300000@student.ctu.edu.vn',
            role: 'STUDENT',
            createdAt: '2026-01-01',
          }}
          onLogout={onLogout}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Mở menu sinh viên' }))
  expect(screen.getByRole('button', { name: 'Xem hồ sơ Sinh viên thử' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Nội dung menu sinh viên' })).not.toContainElement(
    screen.getByRole('button', { name: 'Đăng xuất' })
  )
  expect(screen.queryByRole('menuitem', { name: 'Xem tất cả fanpage' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Chuyển tài khoản hoặc fanpage' }))
  expect(
    screen.getByRole('menuitem', { name: 'Đang dùng tài khoản Sinh viên thử' })
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng bảng chuyển tài khoản' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  expect(onLogout).toHaveBeenCalledOnce()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('keeps phone navigation free of the activity and calendar panel', () => {
  vi.mocked(useMediaQuery).mockReturnValue(true)
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Mở menu sinh viên' }))
  expect(screen.getByRole('link', { name: 'Điểm rèn luyện' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Tiến độ & lịch' })).not.toBeInTheDocument()
  expect(screen.queryByText('Lịch hoạt động của bạn')).not.toBeInTheDocument()
})

it('hides the home link inside the drawer on phones', () => {
  vi.mocked(useMediaQuery).mockReturnValue(true)
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Mở menu sinh viên' }))
  expect(screen.queryByRole('link', { name: 'Trang chủ' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Điểm rèn luyện' })).toBeInTheDocument()
})

it('reveals the phone scrollbar while scrolling and hides it after scrolling stops', () => {
  vi.mocked(useMediaQuery).mockReturnValue(true)
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Mở menu sinh viên' }))
  const content = screen.getByRole('region', { name: 'Nội dung menu sinh viên' })
  expect(content).not.toHaveAttribute('data-scrolling')
  vi.useFakeTimers()
  fireEvent.scroll(content)
  expect(content).toHaveAttribute('data-scrolling', 'true')
  act(() => vi.advanceTimersByTime(600))
  fireEvent.scroll(content)
  act(() => vi.advanceTimersByTime(600))
  expect(content).toHaveAttribute('data-scrolling', 'true')
  act(() => vi.advanceTimersByTime(201))
  expect(content).not.toHaveAttribute('data-scrolling')
})

it('shows the home link inside the drawer on tablet', () => {
  vi.mocked(useMediaQuery).mockReturnValue(false)
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Mở menu sinh viên' }))
  expect(screen.getByRole('link', { name: 'Trang chủ' })).toBeInTheDocument()
})

function Location() {
  return <p data-testid="path">{useLocation().pathname}</p>
}
function show() {
  render(
    <MemoryRouter>
      <StudentNavigationDrawer />
      <Location />
    </MemoryRouter>
  )
}

it('provides navigation from any student page and closes after navigating', async () => {
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Mở menu sinh viên' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('link', { name: 'Điểm rèn luyện' }))
  expect(screen.getByTestId('path')).toHaveTextContent('/training-points')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

it('opens activity without changing route and returns focus to the opener on close', async () => {
  show()
  const opener = screen.getByRole('button', { name: 'Mở tiến độ và lịch' })
  fireEvent.click(opener)
  expect(screen.getByText('Lịch hoạt động của bạn')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Đóng menu sinh viên' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(opener).toHaveFocus())
  expect(screen.getByTestId('path')).toHaveTextContent('/')
})
