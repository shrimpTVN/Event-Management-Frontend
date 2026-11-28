import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth'
import type { Event } from '@/features/events'
import { HomePage } from '../HomePage'

vi.mock('@/features/events/components/StudentLeftSidebar', () => ({
  StudentLeftSidebar: () => null,
}))
vi.mock('@/features/events/components/StudentRightSidebar', () => ({
  StudentRightSidebar: () => null,
}))

// Mock useMediaQuery to simulate mobile (< 768px)
let mockIsMobile = true
vi.mock('@/shared/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => mockIsMobile),
}))

const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Hội thảo Công nghệ Web 2026',
    description: 'Tìm hiểu về AI và React',
    category: 'WORKSHOP',
    eventTypeId: 2,
    status: 'PUBLISHED',
    startTime: '2027-01-15T08:00:00',
    endTime: '2027-01-15T10:00:00',
    location: { type: 'OFFLINE', address: 'Hội trường A' },
    capacity: 100,
    registeredCount: 20,
    price: 0,
    organizerId: '10',
    organizerName: 'CLB Tin học',
    isFollowed: true,
    pointsReward: '+5 ĐRL',
    isModerationRequired: false,
    createdAt: '2026-11-15T08:00:00',
    updatedAt: '2026-11-15T08:00:00',
  },
  {
    id: '2',
    title: 'Giải Bóng đá Sinh viên',
    description: 'Hoạt động thể thao thường niên',
    category: 'SPORTS',
    eventTypeId: 5,
    status: 'PUBLISHED',
    startTime: '2027-02-10T08:00:00',
    endTime: '2027-02-10T11:00:00',
    location: { type: 'OFFLINE', address: 'Sân vận động' },
    capacity: 200,
    registeredCount: 50,
    price: 0,
    organizerId: '20',
    organizerName: 'Đoàn Thanh niên',
    isFollowed: false,
    pointsReward: undefined,
    isModerationRequired: false,
    createdAt: '2026-11-15T08:00:00',
    updatedAt: '2026-11-15T08:00:00',
  },
]

function renderMobileHome() {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } })
  client.setQueryData(['event-filter-options'], {
    academicYears: [],
    semesters: [],
    eventTypes: [
      { id: 2, label: 'Workshop' },
      { id: 5, label: 'Thể thao' },
    ],
    fanpages: [],
    criterias: [],
    pointCategories: [],
  })
  client.setQueryData(['events', 'feed', 'PUBLISHED'], sampleEvents)
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('HomePage on Mobile (< 768px)', () => {
  beforeEach(() => {
    mockIsMobile = true
    localStorage.removeItem('student-home-view')
    useAuthStore.setState({ isAuthenticated: false, user: null })
  })

  afterEach(() => {
    localStorage.removeItem('student-home-view')
  })

  it('hides feed tabs and view mode switcher, renders search bar and filter button next to each other', () => {
    renderMobileHome()

    // Feed tabs (Khám phá / Gợi ý / Đang theo dõi) should NOT exist in the DOM on mobile
    expect(screen.queryByRole('group', { name: 'Nguồn bài viết' })).not.toBeInTheDocument()

    // View mode switcher (Bài viết / Danh sách) should NOT exist on mobile
    expect(screen.queryByRole('group', { name: 'Kiểu hiển thị sự kiện' })).not.toBeInTheDocument()

    // Mobile search input should be visible with placeholder
    const searchInput = screen.getByPlaceholderText('Tìm kiếm sự kiện, CLB...')
    expect(searchInput).toBeInTheDocument()

    // Filter button is right next to search input and shows label on mobile
    const filterBtn = screen.getByRole('button', { name: 'Bộ lọc sự kiện' })
    expect(filterBtn).toBeInTheDocument()
    expect(filterBtn).toHaveTextContent('Bộ lọc')
  })

  it('always renders post cards on mobile even when localStorage has "list" mode', () => {
    localStorage.setItem('student-home-view', 'list')
    renderMobileHome()

    // In post card mode, full descriptions are rendered
    expect(screen.getByText('Hội thảo Công nghệ Web 2026')).toBeInTheDocument()
    expect(screen.getByText('Tìm hiểu về AI và React')).toBeInTheDocument()
    expect(screen.getByText('Giải Bóng đá Sinh viên')).toBeInTheDocument()
    expect(screen.getByText('Hoạt động thể thao thường niên')).toBeInTheDocument()
  })

  it('filters events when searching query and clears query properly', () => {
    renderMobileHome()

    const searchInput = screen.getByPlaceholderText('Tìm kiếm sự kiện, CLB...')
    fireEvent.change(searchInput, { target: { value: 'Bóng đá' } })

    expect(screen.getByText('Giải Bóng đá Sinh viên')).toBeInTheDocument()
    expect(screen.queryByText('Hội thảo Công nghệ Web 2026')).not.toBeInTheDocument()

    // Clear search with X button
    const clearBtn = screen.getByLabelText('Xóa tìm kiếm')
    fireEvent.click(clearBtn)

    expect(screen.getByText('Hội thảo Công nghệ Web 2026')).toBeInTheDocument()
    expect(screen.getByText('Giải Bóng đá Sinh viên')).toBeInTheDocument()
  })

  it('opens bottom sheet filter and applies feedScope conditions (Gợi ý/Theo dõi) without losing functionality', () => {
    renderMobileHome()

    const filterBtn = screen.getByRole('button', { name: 'Bộ lọc sự kiện' })
    fireEvent.click(filterBtn)

    // Check feedScope classification chip "Đang theo dõi"
    const followingChip = screen.getByRole('button', { name: 'Đang theo dõi' })
    expect(followingChip).toBeInTheDocument()
    fireEvent.click(followingChip)

    // Click Apply button on mobile (shows "Áp dụng (1)")
    const applyBtn = screen.getByRole('button', { name: /Áp dụng/ })
    fireEvent.click(applyBtn)

    // Only followed event should be visible
    expect(screen.getByText('Hội thảo Công nghệ Web 2026')).toBeInTheDocument()
    expect(screen.queryByText('Giải Bóng đá Sinh viên')).not.toBeInTheDocument()

    // Active filter badge count on filter button
    expect(filterBtn).toHaveTextContent('1')
  })

  it('combines search and filter conditions, displays empty state and clear buttons when nothing matches', () => {
    renderMobileHome()

    const searchInput = screen.getByPlaceholderText('Tìm kiếm sự kiện, CLB...')
    fireEvent.change(searchInput, { target: { value: 'Từ khóa không tồn tại' } })

    expect(screen.getByText('Không có sự kiện phù hợp')).toBeInTheDocument()
    const clearQueryBtn = screen.getByRole('button', { name: 'Xóa từ khóa' })
    expect(clearQueryBtn).toBeInTheDocument()

    fireEvent.click(clearQueryBtn)
    expect(screen.getByText('Hội thảo Công nghệ Web 2026')).toBeInTheDocument()
  })
})
