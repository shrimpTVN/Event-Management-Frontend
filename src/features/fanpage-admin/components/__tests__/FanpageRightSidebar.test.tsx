import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageRightSidebar } from '../FanpageRightSidebar'
import type { FanpageSummary, FanpageActivityStats } from '../../types/fanpageAdmin.types'

const mockFanpage: FanpageSummary = {
  id: '1',
  name: 'Đoàn Trường CNTT & TT',
  category: 'Đoàn Hội',
  role: 'Admin',
  avatarUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120',
  followersCount: 1,
  eventsCount: 5,
}

const mockStats: FanpageActivityStats = {
  eventsCount: 0,
  engagementCount: 0,
  newFollowersCount: 0,
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

    // Should display full name instead of raw email
    await waitFor(() => {
      expect(screen.getByText('Nguyễn Minh Anh')).toBeInTheDocument()
      expect(screen.getByText('Lê Hoàng Anh')).toBeInTheDocument()
    })

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
