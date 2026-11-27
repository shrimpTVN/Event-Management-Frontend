import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SuperAdminTopNav } from '../SuperAdminTopNav'
import { superAdminService } from '../../services/superAdminService'

vi.mock('@/features/auth', () => ({
  useAuthStore: () => ({
    user: { name: 'Admin CTU', email: 'admin@ctu.edu.vn' },
    clearAuth: vi.fn(),
  }),
}))

vi.mock('@/features/notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/notifications')>()
  return {
    ...actual,
    useNotificationStream: vi.fn(),
    useUnreadNotificationCount: () => ({ data: 3 }),
  }
})

vi.mock('@/shared/components/layout/NotificationDropdown', () => ({
  NotificationDropdown: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog" aria-label="Thông báo" /> : null,
}))

vi.mock('@/shared/components/layout/AccountNavigationPopup', () => ({
  AccountNavigationPopup: () => null,
}))

vi.mock('../../services/superAdminService', () => ({
  superAdminService: {
    getUsersPage: vi.fn(),
    getFanpagesPage: vi.fn(),
    getEventsPage: vi.fn(),
  },
}))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SuperAdminTopNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(superAdminService.getUsersPage).mockResolvedValue({
      content: [
        {
          id: '10',
          name: 'Nguyễn Văn A',
          code: 'B230001',
          email: 'a@student.ctu.edu.vn',
          role: 'STUDENT',
          status: 'ACTIVE',
          createdAt: '',
          eventsParticipatedCount: null,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 5,
    })
    vi.mocked(superAdminService.getFanpagesPage).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      page: 0,
      size: 5,
    })
    vi.mocked(superAdminService.getEventsPage).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      page: 0,
      size: 5,
    })
  })

  function renderNav(overrides: Partial<React.ComponentProps<typeof SuperAdminTopNav>> = {}) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const Wrapper = () => {
      const [query, setQuery] = useState('')
      return (
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <SuperAdminTopNav
              isSidebarOpen={false}
              onToggleSidebar={vi.fn()}
              searchQuery={query}
              onSearchChange={setQuery}
              {...overrides}
            />
          </MemoryRouter>
        </QueryClientProvider>
      )
    }
    return render(<Wrapper />)
  }

  it('removes dead filter/chat buttons and opens NotificationDropdown from real unread count', () => {
    renderNav()
    expect(screen.queryByRole('button', { name: 'Bộ lọc' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tin nhắn & Hỗ trợ' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('3 thông báo chưa đọc')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Thông báo hệ thống' }))
    expect(screen.getByRole('dialog', { name: 'Thông báo' })).toBeInTheDocument()
  })

  it('debounces global search with >= 2 characters across users, fanpages, and events', async () => {
    const onSelectUserResult = vi.fn()
    renderNav({ onSelectUserResult })

    const input = screen.getByLabelText('Tìm kiếm người dùng, fanpage, sự kiện')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Ng' } })

    await waitFor(() => {
      expect(superAdminService.getUsersPage).toHaveBeenCalledWith({
        page: 0,
        size: 5,
        keyword: 'Ng',
      })
      expect(superAdminService.getFanpagesPage).toHaveBeenCalledWith({
        page: 0,
        size: 5,
        keyword: 'Ng',
      })
      expect(superAdminService.getEventsPage).toHaveBeenCalledWith({
        page: 0,
        size: 5,
        keyword: 'Ng',
      })
    })

    const userRow = await screen.findByText('Nguyễn Văn A')
    fireEvent.click(userRow.closest('button')!)
    expect(onSelectUserResult).toHaveBeenCalledWith(expect.objectContaining({ id: '10' }))
  })
})
