import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProviders } from '@/app/providers'
import { fanpageAdminService } from '@/features/fanpage-admin'
import { FanpageAdminPage } from '../FanpageAdminPage'

const mockAvailableFanpages = [
  {
    id: '10',
    name: 'Fanpage Admin Mock Test',
    fullName: 'Fanpage Quản Trị Hệ Thống Mock Test',
    role: 'Quản trị viên',
    isVerified: true,
    email: 'admin-test@ctu.edu.vn',
    phone: '0292 123 4567',
    address: 'Khu II, Đại học Cần Thơ',
    followersCount: 500,
    eventsCount: 5,
    description: 'Mô tả fanpage mock test',
  },
]

const mockRawEvents = [
  {
    id: 10,
    name: 'SỰ KIỆN TEST HOÀN CHỈNH',
    description: 'Tóm tắt bài viết test',
    bannerUrl: '',
    dateHappen: '2026-10-15T08:00:00Z',
    location: 'Khu II, Đại học Cần Thơ',
    capacity: 100,
    registeredCount: 25,
    status: 'PUBLISHED',
  },
]

vi.mock('@/features/fanpage-admin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/fanpage-admin')>()
  return {
    ...actual,
    fanpageAdminService: {
      ...actual.fanpageAdminService,
      getAvailableFanpages: vi.fn(),
      getFanpageEventsRaw: vi.fn(),
      getFanpageFollowerCount: vi.fn().mockResolvedValue(500),
      getActivityStats: vi.fn().mockResolvedValue({
        available: true,
        eventsCount: 1,
        totalRegistrations: 25,
        totalAttendees: 20,
      }),
      getUpcomingReminder: vi.fn().mockResolvedValue(null),
      getFanpageMembers: vi.fn().mockResolvedValue([]),
      getFanpageInvitations: vi.fn().mockResolvedValue([]),
    },
  }
})

describe('FanpageAdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fanpageAdminService.getAvailableFanpages).mockResolvedValue(mockAvailableFanpages)
    vi.mocked(fanpageAdminService.getFanpageEventsRaw).mockResolvedValue(mockRawEvents)
  })

  it('loads dynamic fanpages and feed posts via shared fanpage-events query', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <FanpageAdminPage />
        </MemoryRouter>
      </AppProviders>
    )

    const matchedNames = await screen.findAllByText('Fanpage Quản Trị Hệ Thống Mock Test')
    expect(matchedNames[0]).toBeInTheDocument()
    expect(await screen.findByText('SỰ KIỆN TEST HOÀN CHỈNH')).toBeInTheDocument()
    expect(fanpageAdminService.getFanpageEventsRaw).toHaveBeenCalledTimes(1)
  })

  it('does not fetch home/events queries when opened on members tab', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/fanpage/admin?tab=members']}>
          <FanpageAdminPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Quản trị fanpage')).toBeInTheDocument()
    expect(fanpageAdminService.getFanpageEventsRaw).not.toHaveBeenCalled()
    expect(fanpageAdminService.getActivityStats).not.toHaveBeenCalled()
    expect(fanpageAdminService.getUpcomingReminder).not.toHaveBeenCalled()
  })

  it('shows error state instead of empty fanpage notice when getAvailableFanpages fails', async () => {
    vi.mocked(fanpageAdminService.getAvailableFanpages).mockRejectedValue(new Error('Network error'))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <FanpageAdminPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Không tải được danh sách Fanpage')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có Fanpage được chỉ định')).not.toBeInTheDocument()
  })
})
