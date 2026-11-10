import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageEventListView } from '../FanpageEventListView'
import type { AdminEvent } from '../../types/fanpageAdmin.types'

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const mockEvents: AdminEvent[] = [
  {
    id: '4',
    code: 'EVT-0004',
    name: 'Workshop: Kỹ năng viết CV và phỏng vấn thành công',
    description: 'Chi tiết workshop',
    eventTypeId: 1,
    eventTypeName: 'Workshop',
    fanpageId: '1',
    organizerName: 'Đoàn Trường CNTT & TT',
    dateStart: '2026-10-08',
    dateEnd: '2026-10-08',
    timeStart: '07:00',
    timeEnd: '11:00',
    format: 'OFFLINE',
    location: 'Phòng Lab 3, Trường CNTT&TT',
    capacity: 80,
    registeredCount: 45,
    checkedInCount: 30,
    status: 'PUBLISHED',
    bannerUrl: '',
    requiresApproval: false,
    attendanceMethod: 'MANUAL',
    attendanceSessionType: 'BOTH',
    autoEmail: true,
    isPublic: true,
    trainingPoints: 3,
    trainingPointCategoryName: 'Đạo đức',
    trainingPointCategoryCode: 'I.a',
    sv5tCriteriaName: 'Tiêu chuẩn Hội nhập tốt',
    hasCertificate: false,
    tags: [],
    createdAt: '2026-10-01',
  },
  {
    id: '2',
    code: 'EVT-0002',
    name: 'Sự kiện chiếu phim gây quỹ',
    description: 'Xem phim gây quỹ',
    eventTypeId: 2,
    eventTypeName: 'Volunteer',
    fanpageId: '1',
    organizerName: 'Đoàn Trường CNTT & TT',
    dateStart: '2026-09-22',
    dateEnd: '2026-09-22',
    timeStart: '18:00',
    timeEnd: '21:00',
    format: 'OFFLINE',
    location: 'Hội trường Rùa',
    capacity: 500,
    registeredCount: 300,
    checkedInCount: 280,
    status: 'CLOSED',
    bannerUrl: '',
    requiresApproval: false,
    attendanceMethod: 'MANUAL',
    attendanceSessionType: 'BOTH',
    autoEmail: true,
    isPublic: true,
    trainingPoints: 3,
    trainingPointCategoryName: 'Tình nguyện',
    trainingPointCategoryCode: 'III.b',
    sv5tCriteriaName: 'Tiêu chuẩn Tình nguyện tốt',
    hasCertificate: false,
    tags: [],
    createdAt: '2026-09-15',
  },
]

describe('FanpageEventListView Redesign', () => {
  it('renders top layout with breadcrumb, header, and create button', () => {
    renderWithQueryClient(<FanpageEventListView events={mockEvents} />)

    // Breadcrumb
    expect(screen.getByText('Quản trị fanpage')).toBeInTheDocument()

    // Title and button
    expect(screen.getByRole('heading', { level: 1, name: 'Quản lý sự kiện' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tạo sự kiện mới/i })).toBeInTheDocument()

    // Status tabs with counts
    expect(screen.getByRole('button', { name: /Tất cả/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sắp diễn ra/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đang mở đăng ký/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đã kết thúc/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bản nháp/i })).toBeInTheDocument()
  })

  it('renders table columns correctly without duplicate headings or Quyền lợi column', () => {
    renderWithQueryClient(<FanpageEventListView events={mockEvents} />)

    // Inner duplicate title should NOT exist
    expect(screen.queryByRole('heading', { level: 2, name: 'Danh sách sự kiện' })).toBeNull()

    // Column headers
    expect(screen.getByText('Tên sự kiện')).toBeInTheDocument()
    expect(screen.getByText('Thời gian & Địa điểm')).toBeInTheDocument()
    expect(screen.getByText('Đăng ký')).toBeInTheDocument()
    expect(screen.getByText('Trạng thái')).toBeInTheDocument()
    expect(screen.getByText('Thao tác')).toBeInTheDocument()

    // "Quyền lợi" column header should be removed
    expect(screen.queryByText('Quyền lợi')).toBeNull()
  })

  it('renders event registration as pure text without progress bar percentage', () => {
    renderWithQueryClient(<FanpageEventListView events={mockEvents} />)

    // Should display text "45 / 80"
    expect(screen.getByText('45 / 80')).toBeInTheDocument()
    // Should NOT display percentage badge like "56%" or "60%"
    expect(screen.queryByText('56%')).toBeNull()
    expect(screen.queryByText('60%')).toBeNull()
  })

  it('hides the Status column header and badges when active tab is "Đã kết thúc"', () => {
    renderWithQueryClient(<FanpageEventListView events={mockEvents} />)

    // Initially on "Tất cả", Status column header is visible
    expect(screen.getByText('Trạng thái')).toBeInTheDocument()

    // Click "Đã kết thúc" tab
    const closedTabBtn = screen.getByRole('button', { name: /Đã kết thúc/i })
    fireEvent.click(closedTabBtn)

    // Status column should be hidden
    expect(screen.queryByText('Trạng thái')).toBeNull()
  })

  it('renders clean empty state when no events match', () => {
    renderWithQueryClient(<FanpageEventListView events={[]} />)

    expect(
      screen.getAllByText('Không tìm thấy sự kiện nào phù hợp với bộ lọc.').length
    ).toBeGreaterThan(0)
  })

  it('renders pagination bar with summary and page button', () => {
    renderWithQueryClient(<FanpageEventListView events={mockEvents} />)

    expect(screen.getByText(/Hiển thị/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trước' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sau' })).toBeInTheDocument()
  })
})
