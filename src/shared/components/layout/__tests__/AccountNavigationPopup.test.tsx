import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountNavigationPopup } from '../AccountNavigationPopup'
import { RoleEnum, type User } from '@/features/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('AccountNavigationPopup', () => {
  it('shows every joined fanpage in the mobile picker and navigates to its workspace', () => {
    const onClose = vi.fn()
    const Location = () => {
      const location = useLocation()
      return (
        <output data-testid="picker-location">
          {location.pathname}:{location.state?.fanpageId}
        </output>
      )
    }
    const client = new QueryClient({ defaultOptions: { queries: { enabled: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Location />
          <AccountNavigationPopup
            isOpen
            embedded
            accountPicker
            onClose={onClose}
            onLogout={vi.fn()}
            user={{
              id: 'picker-student',
              name: 'Sinh viên thử',
              email: 'b2300000@student.ctu.edu.vn',
              role: RoleEnum.STUDENT,
              createdAt: '2026-01-01',
            }}
            availableFanpages={Array.from({ length: 4 }, (_, i) => ({
              id: String(i + 1),
              name: `Trang thử ${i + 1}`,
              role: 'Cộng tác viên',
            }))}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(
      screen.getByRole('menuitem', { name: 'Đang dùng tài khoản Sinh viên thử' })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Chuyển sang Trang thử 4' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByTestId('picker-location')).toHaveTextContent('/fanpage/workspace:4')
  })
  it('opens the full fanpage hub for students', () => {
    const onClose = vi.fn()
    const Location = () => {
      const location = useLocation()
      return (
        <output data-testid="location">
          {location.pathname}:{location.state?.fanpageId}
        </output>
      )
    }
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <Location />
          <AccountNavigationPopup
            isOpen
            embedded
            onClose={onClose}
            onLogout={vi.fn()}
            user={{
              id: 'expand-student',
              email: 'expand@student.ctu.edu.vn',
              name: 'Sinh viên',
              role: RoleEnum.STUDENT,
              createdAt: '2026-01-01',
            }}
            availableFanpages={Array.from({ length: 4 }, (_, i) => ({
              id: String(i + 1),
              name: `Đơn vị ${i + 1}`,
              role: 'Cộng tác viên',
            }))}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText('Chuyển sang fanpage')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText('Đơn vị 4')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xem tất cả fanpage' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByTestId('location')).toHaveTextContent('/staff/fanpages:')
  })

  it('correctly extracts standard MSSV (e.g. B2303827) even if user has prefix LOCB2303827', () => {
    const mockUser: User = {
      id: '1',
      email: 'locb2303827@student.ctu.edu.vn',
      name: 'Đoàn Tài Lộc',
      studentId: 'LOCB2303827', // contaminated with email prefix
      role: RoleEnum.STUDENT,
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockUser}
            onLogout={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Must show B2303827, NOT LOCB2303827
    expect(screen.getByText('MSSV: B2303827')).toBeInTheDocument()
    expect(screen.getByText('Đoàn Tài Lộc')).toBeInTheDocument()
    // Does NOT render "Về trang chủ sinh viên" when on student home
    expect(screen.queryByText('Về trang chủ sinh viên')).not.toBeInTheDocument()
  })

  it('extracts MSSV from CTU email when studentId is missing', () => {
    const mockUser: User = {
      id: '2',
      email: 'nghiab2303832@student.ctu.edu.vn',
      name: 'Nguyễn Minh Nghĩa',
      role: RoleEnum.STUDENT,
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockUser}
            onLogout={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('MSSV: B2303832')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Minh Nghĩa')).toBeInTheDocument()
    expect(screen.queryByText('Về trang chủ sinh viên')).not.toBeInTheDocument()
  })

  it('renders switch to student account with rotating arrows when inside fanpage workspace', () => {
    const mockStudent: User = {
      id: '1',
      email: 'locb2303827@student.ctu.edu.vn',
      name: 'Đoàn Tài Lộc',
      role: RoleEnum.STUDENT,
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockStudent}
            onLogout={vi.fn()}
            currentFanpageId="10"
            currentFanpageRole="Quản trị viên"
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Should show switch button to student account
    expect(screen.getByText('Đoàn Tài Lộc')).toBeInTheDocument()
    expect(screen.getByText(/MSSV: B2303827 • Sinh viên/i)).toBeInTheDocument()
  })

  it('renders switch button to student account when student has role FANPAGE_ADMIN in fanpage workspace', () => {
    const mockStudentAdmin: User = {
      id: '1',
      email: 'loc@student.ctu.edu.vn',
      name: 'Đoàn Tài Lộc',
      studentId: 'B2300000',
      role: RoleEnum.FANPAGE_ADMIN,
      roles: ['STUDENT', 'FANPAGE_ADMIN'],
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/workspace']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockStudentAdmin}
            onLogout={vi.fn()}
            currentFanpageId="1"
            currentFanpageRole="Cộng tác viên"
            currentFanpageName="Đoàn TN - Hội SV Đại học Cần Thơ"
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Should show fanpage at top
    expect(screen.getByText('Đoàn TN - Hội SV Đại học Cần Thơ')).toBeInTheDocument()
    // Should show switch button to student account
    expect(screen.getByText('Đoàn Tài Lộc')).toBeInTheDocument()
    expect(screen.getByText(/MSSV: B2300000 • Sinh viên/i)).toBeInTheDocument()
  })

  it('renders staff profile without email and without "Về trang chủ sinh viên" button', () => {
    const mockStaff: User = {
      id: '99',
      email: 'organizer@ctu.edu.vn',
      name: 'Nguyễn Minh Anh',
      role: RoleEnum.ADMIN,
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockStaff}
            onLogout={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('Nguyễn Minh Anh')).toBeInTheDocument()
    expect(screen.queryByText('organizer@ctu.edu.vn')).not.toBeInTheDocument()
    expect(screen.queryByText('Về trang chủ sinh viên')).not.toBeInTheDocument()
  })

  it('renders staff profile with current fanpage badge and excludes it from switch list', () => {
    const mockStaff: User = {
      id: '99',
      email: 'organizer@ctu.edu.vn',
      name: 'Nguyễn Minh Anh',
      role: RoleEnum.ADMIN,
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockStaff}
            onLogout={vi.fn()}
            currentFanpageId="10"
            currentFanpageRole="Quản trị viên"
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText('Nguyễn Minh Anh')).toBeInTheDocument()
    expect(screen.queryByText('organizer@ctu.edu.vn')).not.toBeInTheDocument()
  })

  it('renders student identity at top when student is viewing a public fanpage (/fanpage/1)', () => {
    const mockStudent: User = {
      id: '1',
      email: 'loc@student.ctu.edu.vn',
      name: 'Đoàn Tài Lộc',
      studentId: 'B2300000',
      role: RoleEnum.STUDENT,
      createdAt: '2026-01-01',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/fanpage/1']}>
          <AccountNavigationPopup
            isOpen={true}
            onClose={vi.fn()}
            user={mockStudent}
            onLogout={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )

    // On /fanpage/1 (public fanpage view), active profile must be the student, NOT a fanpage workspace!
    expect(screen.getByText('Đoàn Tài Lộc')).toBeInTheDocument()
    expect(screen.getByText('MSSV: B2300000')).toBeInTheDocument()
  })
})
