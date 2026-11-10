import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageRightSidebar } from '../FanpageRightSidebar'
import type { FanpageSummary, FanpageActivityStats } from '../../types/fanpageAdmin.types'

const mockFanpage: FanpageSummary = {
  id: '1',
  code: 'CNTT',
  name: 'Đoàn Trường CNTT & TT',
  fullName: 'Đoàn Trường CNTT & TT',
  avatarText: 'CNTT',
  role: 'Admin',
  isVerified: true,
  email: 'doan@ctu.edu.vn',
  phone: '0123456789',
  address: 'Đại học Cần Thơ',
  description: 'Đoàn Khoa CNTT&TT',
  avatarUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120',
  followersCount: 1,
  eventsCount: 5,
}

const mockStats: FanpageActivityStats = {
  periodLabel: 'Tuần này',
  eventsCount: 0,
  interactionsCount: 0,
  newFollowersCount: 0,
  responseRatePercent: 100,
  pendingCommentsCount: 0,
}

describe('FanpageRightSidebar', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  it('renders members with full names, inline Admin badge, Bạn indicator, and refined manage button', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FanpageRightSidebar
          currentFanpage={mockFanpage}
          stats={mockStats}
          onManageMembersClick={vi.fn()}
        />
      </QueryClientProvider>
    )

    // Should display admin full name without truncation
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Minh Anh')).toBeInTheDocument()
    })

    // Other non-admin members should NOT be in the list
    expect(screen.queryByText('Lê Hoàng Anh')).toBeNull()

    // Email strings should NOT be visible in member names
    expect(screen.queryByText('organizer@ctu.edu.vn')).toBeNull()
    expect(screen.queryByText('anhlhb2100123@student.ctu.edu.vn')).toBeNull()

    // Role label: only Admin badge exists, no CTV badge
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.queryByText('CTV')).toBeNull()

    // Current user identifier "Bạn" badge on the right
    expect(screen.getByText('Bạn')).toBeInTheDocument()

    // Manage members button
    expect(screen.getByText('Quản lý tất cả thành viên')).toBeInTheDocument()
  })
})
