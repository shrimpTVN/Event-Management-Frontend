import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { apiClient } from '@/shared'
import { eventService } from '@/features/events'
import { registrationService } from '../../services/registrationService'
import { RegistrationForm } from '../RegistrationForm'

vi.mock('@/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared')>()
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    },
  }
})

vi.mock('../../services/registrationService', () => ({
  registrationService: {
    registerForEvent: vi.fn(),
  },
}))

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === '/users/me/profile') {
        return Promise.resolve({
          userId: 1,
          email: 'test@student.ctu.edu.vn',
          firstName: 'Test',
          lastName: 'Sinh viên',
          studentProfile: {
            studentId: 'B2301234',
            majorName: 'Kỹ thuật phần mềm',
          },
        })
      }
      return Promise.resolve({})
    })
  })

  it('uses normalized eventService.getEventById on shared [events, id] cache and shows real event details', async () => {
    const spy = vi.spyOn(eventService, 'getEventById').mockResolvedValue({
      id: '42',
      title: 'Hội thảo Khoa học Dữ liệu',
      description: 'Mô tả',
      category: 'CONFERENCE',
      startTime: '2026-12-01T08:00:00Z',
      dateHappen: '2026-12-01T08:00:00Z',
      endTime: '2026-12-01T11:00:00Z',
      location: { type: 'OFFLINE', address: 'Hội trường Rùa' },
      fanpageId: 1,
      fanpageName: 'Khoa CNTT',
      organizerId: '1',
      organizerName: 'Khoa CNTT',
      pointsReward: '+5 điểm rèn luyện',
      status: 'PUBLISHED',
      registeredCount: 10,
      capacity: 100,
      price: 0,
      isModerationRequired: false,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RegistrationForm eventId="42" />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Hội thảo Khoa học Dữ liệu')).toBeInTheDocument()
    expect(screen.getByText('+5 điểm rèn luyện')).toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith('42')

    // Cache under ['events', '42'] holds normalized Event with title
    const cached = client.getQueryData<any>(['events', '42'])
    expect(cached?.title).toBe('Hội thảo Khoa học Dữ liệu')

    spy.mockRestore()
  })

  it('shows error state without mock fallback and blocks submit when event fetch fails', async () => {
    const spy = vi.spyOn(eventService, 'getEventById').mockRejectedValue(new Error('500'))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RegistrationForm eventId="99" />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(await screen.findByText('Không tải được thông tin sự kiện hợp lệ.')).toBeInTheDocument()
    expect(screen.queryByText('Sự kiện CTU')).not.toBeInTheDocument()
    expect(screen.queryByText('Tháng 10/2026')).not.toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /Xác nhận tham gia sự kiện/i })
    expect(submitBtn).toBeDisabled()
    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(registrationService.registerForEvent).not.toHaveBeenCalled()
    })

    spy.mockRestore()
  })

  it('updates shared event & registration caches on successful submit and does not mutate on error', async () => {
    const spy = vi.spyOn(eventService, 'getEventById').mockResolvedValue({
      id: '77',
      title: 'Sự kiện đồng bộ cache',
      description: 'Mô tả',
      category: 'CONFERENCE',
      startTime: '2026-12-01T08:00:00Z',
      dateHappen: '2026-12-01T08:00:00Z',
      endTime: '2026-12-01T11:00:00Z',
      location: { type: 'OFFLINE', address: 'Hội trường A' },
      fanpageId: 1,
      fanpageName: 'Đoàn Trường',
      organizerId: '1',
      organizerName: 'Đoàn Trường',
      pointsReward: '+4 ĐRL',
      status: 'PUBLISHED',
      registeredCount: 10,
      capacity: 100,
      price: 0,
      isModerationRequired: false,
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(['registrations', 'me', true, 'u1'], { '12': 'COMPLETED' })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    // 1. Failed POST must NOT mark registered or invalidate
    vi.mocked(registrationService.registerForEvent).mockRejectedValueOnce({
      response: { data: { message: 'Hết chỗ' } },
    })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RegistrationForm eventId="77" />
        </MemoryRouter>
      </QueryClientProvider>
    )

    await screen.findByText('Sự kiện đồng bộ cache')
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tham gia sự kiện/i }))

    expect(await screen.findByText('Hết chỗ')).toBeInTheDocument()
    expect(client.getQueryData<any>(['events', '77'])?.isRegistered).toBeFalsy()
    expect(client.getQueryData<Record<string, string>>(['registrations', 'me', true, 'u1'])?.['77']).toBeUndefined()
    expect(invalidateSpy).not.toHaveBeenCalled()

    // 2. Successful POST updates caches and invalidates registrations + events
    vi.mocked(registrationService.registerForEvent).mockResolvedValueOnce({})
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tham gia sự kiện/i }))

    expect(await screen.findByText('Đăng ký sự kiện thành công!')).toBeInTheDocument()
    expect(client.getQueryData<any>(['events', '77'])?.isRegistered).toBe(true)
    expect(client.getQueryData<any>(['events', '77'])?.registeredCount).toBe(11)
    expect(client.getQueryData<Record<string, string>>(['registrations', 'me', true, 'u1'])?.['77']).toBe('REGISTERED')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['registrations'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['events'], refetchType: 'none' })

    spy.mockRestore()
  })
})
