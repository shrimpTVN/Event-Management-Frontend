import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProviders } from '@/app/providers'
import { fanpageAdminService } from '@/features/fanpage-admin'
import { fanpageAdminService as memberService } from '@/features/fanpage-admin/services/fanpageAdminService'
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

  it('keeps the selected fanpage when navigation state is replaced by a tab search param', async () => {
    const getMembers = vi.spyOn(memberService, 'getFanpageMembers').mockResolvedValue([])
    vi.spyOn(memberService, 'getFanpageInvitations').mockResolvedValue([])
    vi.mocked(fanpageAdminService.getAvailableFanpages).mockResolvedValue([
      { ...mockAvailableFanpages[0], id: '101', name: 'CLB Trí tuệ nhân tạo', fullName: 'CLB Trí tuệ nhân tạo' },
      { ...mockAvailableFanpages[0], id: '103', name: 'Đoàn Thanh niên', fullName: 'Đoàn Thanh niên' },
    ])
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const LocationSearch = () => {
      const location = useLocation()
      return <output data-testid="location-search">{location.search}</output>
    }

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[{ pathname: '/fanpage/workspace', state: { fanpageId: '103' } }]}>
          <LocationSearch />
          <FanpageAdminPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Thành viên' }))
    await waitFor(() => expect(screen.getByTestId('location-search')).toHaveTextContent('fanpageId=103'))
    expect(screen.getByTestId('location-search')).toHaveTextContent('tab=members')
    await waitFor(() => expect(getMembers).toHaveBeenCalledWith('103'))
    expect(getMembers).not.toHaveBeenCalledWith('101')
  })

  it('clears eventId query param when switching from event-detail to another tab', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const LocationSearch = () => {
      const location = useLocation()
      return <output data-testid="location-search">{location.search}</output>
    }

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/fanpage/admin?fanpageId=10&tab=event-detail&eventId=10']}>
          <LocationSearch />
          <FanpageAdminPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByTestId('location-search')).toHaveTextContent('eventId=10')
    fireEvent.click(await screen.findByRole('button', { name: 'Thành viên' }))
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('tab=members')
      expect(screen.getByTestId('location-search')).not.toHaveTextContent('eventId=')
    })
  })

  it('uses totalElements metadata for eventsCount when present on raw fanpage events', async () => {
    const eventsWithTotal: any = [...mockRawEvents]
    Object.defineProperty(eventsWithTotal, '__totalElements', {
      value: 142,
      enumerable: false,
    })
    vi.mocked(fanpageAdminService.getFanpageEventsRaw).mockResolvedValueOnce(eventsWithTotal)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <FanpageAdminPage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('142')).toBeInTheDocument()
  })
})
