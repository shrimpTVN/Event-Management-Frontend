import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { FanpageHomeView } from '../FanpageHomeView'
import type {
  FanpageSummary,
  FanpageActivityStats,
  FanpageFeedPost,
} from '../../types/fanpageAdmin.types'
import { useAuthStore } from '@/features/auth'

vi.mock('../FanpageProfileHeader', () => ({ FanpageProfileHeader: () => null }))
vi.mock('../FanpageQuickCreateCard', () => ({ FanpageQuickCreateCard: () => null }))
vi.mock('../FanpageAboutCard', () => ({ FanpageAboutCard: () => null }))
vi.mock('../FanpageActivityStatsCard', () => ({ FanpageActivityStatsCard: () => null }))
vi.mock('../FanpageEventFeedCard', () => ({
  FanpageEventFeedCard: ({ post }: { post: FanpageFeedPost }) => <article>{post.title}</article>,
}))

describe('fanpage home filtering', () => {
  it('uses the posted events for preview and keeps the applied results consistent', () => {
    useAuthStore.setState({ isAuthenticated: false, user: null })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    client.setQueryData(['event-filter-options'], {
      academicYears: [],
      semesters: [],
      eventTypes: [],
      fanpages: [],
      criterias: [],
      pointCategories: [],
    })
    const posts = [
      {
        id: '1',
        title: 'Sự kiện đang tuyển',
        status: 'PUBLISHED',
        startTime: '2030-11-20T08:00:00',
      },
      {
        id: '2',
        title: 'Sự kiện đã kết thúc',
        status: 'COMPLETED',
        startTime: '2025-11-20T08:00:00',
      },
    ] as FanpageFeedPost[]
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <FanpageHomeView
            currentFanpage={{ id: '3', name: 'Đoàn trường' } as FanpageSummary}
            stats={{} as FanpageActivityStats}
            posts={posts}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đang mở đăng ký' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem 1 sự kiện' }))
    expect(screen.getByText('Sự kiện đang tuyển')).toBeInTheDocument()
    expect(screen.queryByText('Sự kiện đã kết thúc')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lọc: Đang mở đăng ký' }))
    expect(screen.getByText('Sự kiện đã kết thúc')).toBeInTheDocument()
  })
})
