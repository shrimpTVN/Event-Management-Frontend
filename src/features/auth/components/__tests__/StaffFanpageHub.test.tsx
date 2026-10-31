import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StaffFanpageHub } from '../StaffFanpageHub'

const mockGet = vi.fn()

// Mock apiClient
vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared')>()
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: (...args: any[]) => mockGet(...args),
    },
  }
})

describe('StaffFanpageHub', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    mockGet.mockReset()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  it('renders correctly with loaded fanpages', async () => {
    mockGet.mockImplementation((url: string) => {
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
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StaffFanpageHub />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(screen.getByText(/Chọn fanpage để quản lý sự kiện/i)).toBeInTheDocument()
    expect(await screen.findByText('Fanpage Thử Nghiệm API')).toBeInTheDocument()
    expect(screen.getByText(/Fanpage đang quản trị \(1\)/i)).toBeInTheDocument()
  })

  it('renders empty state when staff has no fanpages yet', async () => {
    mockGet.mockImplementation(() => Promise.resolve([]))

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StaffFanpageHub />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText(/Hiện tại bạn chưa có fanpage nào/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Tài khoản cán bộ của bạn hiện chưa tham gia hoặc sở hữu fanpage nào/i
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đăng ký tạo fanpage ngay/i })).toBeInTheDocument()
  })
})
