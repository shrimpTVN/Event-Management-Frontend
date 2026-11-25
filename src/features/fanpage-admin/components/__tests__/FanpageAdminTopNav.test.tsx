import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoleEnum, useAuthStore } from '@/features/auth'
import { FanpageAdminTopNav } from '../FanpageAdminTopNav'

function renderTopNav(props: React.ComponentProps<typeof FanpageAdminTopNav>) {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <FanpageAdminTopNav {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('FanpageAdminTopNav logo navigation', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: '2',
        email: 'organizer@ctu.edu.vn',
        name: 'Nguyễn Minh Anh',
        role: RoleEnum.FANPAGE_ADMIN,
        createdAt: '2026-01-01T00:00:00Z',
      },
    })
  })

  it('links logo to /fanpage/admin for fanpage admins and invokes onLogoClick', () => {
    const onLogoClick = vi.fn()
    renderTopNav({
      currentFanpageId: '1',
      currentFanpageRole: 'Quản trị viên',
      onLogoClick,
    })

    const logoLink = screen.getByRole('link', { name: 'CTU Event - HTQL Sự Kiện' })
    expect(logoLink).toHaveAttribute('href', '/fanpage/admin')

    fireEvent.click(logoLink)
    expect(onLogoClick).toHaveBeenCalledTimes(1)
  })

  it('links logo to /fanpage/workspace for student collaborators', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: '10',
        email: 'member@student.ctu.edu.vn',
        name: 'Sinh viên CTV',
        role: RoleEnum.STUDENT,
        createdAt: '2026-01-01T00:00:00Z',
      },
    })

    renderTopNav({
      currentFanpageId: '7',
      currentFanpageRole: 'Cộng tác viên',
    })

    const logoLink = screen.getByRole('link', { name: 'CTU Event - HTQL Sự Kiện' })
    expect(logoLink).toHaveAttribute('href', '/fanpage/workspace')
  })
})
