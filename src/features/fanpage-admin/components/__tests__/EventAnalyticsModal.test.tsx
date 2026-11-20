import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EventAnalyticsModal } from '../EventAnalyticsModal'
import { fanpageStatisticsService } from '../../services/fanpageStatisticsService'
import type { FanpageFeedPost } from '../../types/fanpageAdmin.types'

vi.mock('../../services/fanpageStatisticsService', () => ({
  fanpageStatisticsService: { getEventOverview: vi.fn() },
}))
const fetchStats = vi.mocked(fanpageStatisticsService.getEventOverview)
function show() {
  const onClose = vi.fn(),
    onOpenRegistrations = vi.fn()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <EventAnalyticsModal
        fanpageId="7"
        post={{ id: 'post-1', eventId: '81', title: 'Ngày hội sinh viên' } as FanpageFeedPost}
        onClose={onClose}
        onOpenRegistrations={onOpenRegistrations}
      />
    </QueryClientProvider>
  )
  return { onClose, onOpenRegistrations }
}
beforeEach(() => vi.clearAllMocks())
describe('EventAnalyticsModal', () => {
  it('fetches the selected event and shows actual registration and attendance numbers', async () => {
    fetchStats.mockResolvedValue({
      capacity: 120,
      totalRegistrations: 32,
      totalAttended: 8,
      attendanceRate: 25,
    })
    const { onClose, onOpenRegistrations } = show()
    expect(await screen.findByText('32')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(fetchStats).toHaveBeenCalledWith('7', '81')
    expect(screen.queryByText('Lượt tiếp cận')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem danh sách đăng ký' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(onOpenRegistrations).toHaveBeenCalledWith('81')
  })
  it('keeps genuine zero counts and omits an undefined attendance ratio', async () => {
    fetchStats.mockResolvedValue({
      capacity: 0,
      totalRegistrations: 0,
      totalAttended: 0,
      attendanceRate: 0,
    })
    show()
    expect(await screen.findByText('Không giới hạn')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
  it('shows a retry state instead of fabricated numbers on failure', async () => {
    fetchStats
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce({
        capacity: 40,
        totalRegistrations: 3,
        totalAttended: 1,
        attendanceRate: 33.3,
      })
    show()
    expect(await screen.findByText('Chưa tải được số liệu sự kiện.')).toBeInTheDocument()
    expect(screen.queryByText('Lượt đăng ký')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('33,3%')).toBeInTheDocument()
  })
  it('closes on Escape', async () => {
    fetchStats.mockResolvedValue({
      capacity: 0,
      totalRegistrations: 0,
      totalAttended: 0,
      attendanceRate: 0,
    })
    const { onClose } = show()
    await screen.findByText('Không giới hạn')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
