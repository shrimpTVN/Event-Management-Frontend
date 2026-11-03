import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountNavigationPopup } from '../AccountNavigationPopup'
import { RoleEnum, type User } from '@/features/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

describe('AccountNavigationPopup', () => {
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
        <MemoryRouter>
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
        <MemoryRouter>
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
  })
})

