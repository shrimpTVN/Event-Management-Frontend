import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { StaffFanpageHub } from '../StaffFanpageHub'

// Mock apiClient
vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared')>()
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn().mockImplementation((url: string) => {
        if (url.includes('invitations')) {
          return Promise.resolve([])
        }
        return Promise.resolve([
          {
            id: '101',
            code: 'TEST',
            name: 'Fanpage Thử Nghiệm API',
            role: 'Quản trị viên',
            permissions: 'Toàn quyền',
          },
        ])
      }),
    },
  }
})

describe('StaffFanpageHub', () => {
  it('renders correctly with fallback or loaded fanpages', async () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <StaffFanpageHub />
        </MemoryRouter>
      </AppProviders>
    )

    expect(screen.getByText(/Chọn fanpage để quản lý sự kiện/i)).toBeInTheDocument()
    expect(screen.getByText(/II. DANH SÁCH FANPAGE ĐÃ THAM GIA/i)).toBeInTheDocument()
    expect(await screen.findByText('Fanpage Thử Nghiệm API')).toBeInTheDocument()
  })
})
