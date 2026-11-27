import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuperAdminPage } from '../SuperAdminPage'
import { superAdminService } from '@/features/super-admin'

vi.mock('@/features/super-admin/components/AdminStatisticsDashboard', () => ({
  AdminStatisticsDashboard: ({ semesters }: any) => (
    <div data-testid="admin-dashboard">Dashboard ({semesters.length} semesters)</div>
  ),
}))

vi.mock('@/features/super-admin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/super-admin')>()
  return {
    ...actual,
    SuperAdminLayout: ({ children, onSelectTab }: any) => (
      <div>
        <nav>
          <button type="button" onClick={() => onSelectTab('overview')}>Tổng quan</button>
          <button type="button" onClick={() => onSelectTab('users')}>Người dùng</button>
          <button type="button" onClick={() => onSelectTab('fanpages')}>Fanpage</button>
          <button type="button" onClick={() => onSelectTab('events')}>Sự kiện</button>
          <button type="button" onClick={() => onSelectTab('schools')}>Khoa / Trường</button>
        </nav>
        {children}
      </div>
    ),
    superAdminService: {
      ...actual.superAdminService,
      getUsers: vi.fn(),
      getUsersPage: vi.fn(),
      getFanpages: vi.fn(),
      getFanpagesPage: vi.fn(),
      getEvents: vi.fn(),
      getEventsPage: vi.fn(),
      getSemesters: vi.fn(),
      getPointCategories: vi.fn(),
      getCriterias: vi.fn(),
      getSchools: vi.fn(),
      getSchoolsWithMajors: vi.fn(),
      getSchoolsSummary: vi.fn(),
      getSchoolDetail: vi.fn(),
    },
  }
})

describe('SuperAdminPage tab-scoped queries and server pagination (F08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(superAdminService.getSemesters).mockResolvedValue([])
    vi.mocked(superAdminService.getFanpagesPage).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      page: 0,
      size: 20,
    })
    vi.mocked(superAdminService.getEventsPage).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
      page: 0,
      size: 20,
    })
    vi.mocked(superAdminService.getUsersPage).mockImplementation(async (params) => ({
      content: [
        {
          id: String((params?.page ?? 0) * 20 + 1),
          name: `Sinh viên trang ${(params?.page ?? 0) + 1}`,
          code: 'B230001',
          email: `sv${params?.page ?? 0}@student.ctu.edu.vn`,
          role: 'STUDENT',
          status: 'ACTIVE',
          createdAt: '',
          eventsParticipatedCount: null,
          schoolName: 'CNTT',
          majorName: 'KTPM',
        },
      ],
      totalElements: 35,
      totalPages: 2,
      page: params?.page ?? 0,
      size: 20,
    }))
    vi.mocked(superAdminService.getSchoolsWithMajors).mockResolvedValue([
      {
        id: 1,
        name: 'Trường CNTT&TT',
        description: '',
        isActive: true,
        majorsCount: 2,
        majors: [
          { id: 10, code: 'CNTT', name: 'Công nghệ thông tin', schoolId: 1, isActive: true },
          { id: 11, code: 'KTPM', name: 'Kỹ thuật phần mềm', schoolId: 1, isActive: false },
        ],
      },
      {
        id: 2,
        name: 'Khoa Kinh tế',
        description: '',
        isActive: true,
        majorsCount: 1,
        majors: [{ id: 20, code: 'QTKD', name: 'Quản trị kinh doanh', schoolId: 2, isActive: false }],
      },
    ])
    vi.mocked(superAdminService.getSchoolsSummary).mockResolvedValue([
      { id: 1, name: 'Trường CNTT&TT', description: '', isActive: true, majorsCount: 2, majors: [] },
      { id: 2, name: 'Khoa Kinh tế', description: '', isActive: true, majorsCount: 1, majors: [] },
    ])
    vi.mocked(superAdminService.getSchoolDetail).mockImplementation(async (id) => ({
      id,
      name: id === 1 ? 'Trường CNTT&TT' : 'Khoa Kinh tế',
      isActive: true,
      majorsCount: 1,
      majors: [{ id: id * 10, code: `M${id}`, name: `Ngành của ${id}`, schoolId: id, isActive: true }],
    }))
  })

  const renderPage = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <SuperAdminPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('does not fetch users, schools, point-categories, criterias, or full lists when opened on overview', async () => {
    renderPage()

    expect(await screen.findByTestId('admin-dashboard')).toBeInTheDocument()
    expect(superAdminService.getUsers).not.toHaveBeenCalled()
    expect(superAdminService.getUsersPage).not.toHaveBeenCalled()
    expect(superAdminService.getFanpages).not.toHaveBeenCalled()
    expect(superAdminService.getEvents).not.toHaveBeenCalled()
    expect(superAdminService.getSchools).not.toHaveBeenCalled()
    expect(superAdminService.getSchoolsWithMajors).not.toHaveBeenCalled()
    expect(superAdminService.getSchoolsSummary).not.toHaveBeenCalled()
    expect(superAdminService.getPointCategories).not.toHaveBeenCalled()
    expect(superAdminService.getCriterias).not.toHaveBeenCalled()
  })

  it('fetches paginated users only when switching to users tab and supports page 2', async () => {
    renderPage()
    await screen.findByTestId('admin-dashboard')

    fireEvent.click(screen.getByRole('button', { name: 'Người dùng' }))
    expect(await screen.findByText('Sinh viên trang 1')).toBeInTheDocument()
    expect(superAdminService.getUsersPage).toHaveBeenCalledWith({
      page: 0,
      size: 20,
      role: 'ALL',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    expect(await screen.findByText('Sinh viên trang 2')).toBeInTheDocument()
    expect(superAdminService.getUsersPage).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      role: 'ALL',
    })

    // Switching role tab triggers server-side filter and resets page to 0 without local tab counts
    expect(screen.queryByText(/\(35\)|\(1\)/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cán bộ' }))
    await waitFor(() => {
      expect(superAdminService.getUsersPage).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        role: 'STAFF',
      })
    })
  })

  it('triggers server-side filters for fanpage and event tabs without per-tab counts', async () => {
    renderPage()
    await screen.findByTestId('admin-dashboard')

    fireEvent.click(screen.getByRole('button', { name: 'Fanpage' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Bị khóa / Từ chối' }))
    await waitFor(() => {
      expect(superAdminService.getFanpagesPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 20, status: 'LOCKED' })
      )
    })

    fireEvent.click(screen.getByRole('button', { name: 'Sự kiện' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Đang diễn ra' }))
    await waitFor(() => {
      expect(superAdminService.getEventsPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 20, status: 'HAPPENING' })
      )
    })
  })

  it('fetches schools with nested majors in one request and shows active major counts and statuses', async () => {
    renderPage()
    await screen.findByTestId('admin-dashboard')

    fireEvent.click(screen.getByRole('button', { name: 'Khoa / Trường' }))
    expect(await screen.findByText('Công nghệ thông tin')).toBeInTheDocument()
    expect(screen.getByText('1 ngành đang hoạt động')).toBeInTheDocument()
    expect(screen.getByText('0 ngành đang hoạt động')).toBeInTheDocument()
    expect(screen.getByText('Đang đào tạo')).toBeInTheDocument()
    expect(screen.getByText('Ngừng sử dụng')).toBeInTheDocument()

    expect(superAdminService.getSchoolsWithMajors).toHaveBeenCalledTimes(1)
    expect(superAdminService.getSchoolDetail).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Khoa Kinh tế').closest('button')!)
    await waitFor(() => {
      expect(screen.getByText('Quản trị kinh doanh')).toBeInTheDocument()
    })
    expect(superAdminService.getSchoolDetail).not.toHaveBeenCalled()
  })
})
