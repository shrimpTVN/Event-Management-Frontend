import { beforeEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageRightSidebar } from '../FanpageRightSidebar'
import { fanpageAdminService, EMPTY_ACTIVITY_STATS } from '../../services/fanpageAdminService'
import type { FanpageSummary, FanpageMember } from '../../types/fanpageAdmin.types'

vi.mock('../../services/fanpageAdminService', () => ({
  fanpageAdminService: { getFanpageMembers: vi.fn() },
  EMPTY_ACTIVITY_STATS: { available: false },
}))
vi.mock('@/features/auth', () => ({
  useAuthStore: () => ({ user: { id: '42', email: 'me@ctu.edu.vn' } }),
}))
const getMembers = vi.mocked(fanpageAdminService.getFanpageMembers)
const member = {
  id: 'membership-1',
  userId: '42',
  fullName: 'Nguyễn Văn An',
  email: 'me@ctu.edu.vn',
  role: 'ADMIN',
  avatarText: 'VA',
} as FanpageMember
function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const manage = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <FanpageRightSidebar
        currentFanpage={{ id: '7' } as FanpageSummary}
        stats={EMPTY_ACTIVITY_STATS}
        onManageMembersClick={manage}
      />
    </QueryClientProvider>
  )
  return manage
}
beforeEach(() => vi.clearAllMocks())
describe('FanpageRightSidebar', () => {
  it('shows real members and identifies the current user by user ID', async () => {
    getMembers.mockResolvedValue([member])
    const manage = show()
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument()
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument()
    expect(screen.getByText('Bạn')).toBeInTheDocument()
    expect(getMembers).toHaveBeenCalledWith('7')
    fireEvent.click(screen.getByRole('button', { name: 'Xem tất cả thành viên' }))
    expect(manage).toHaveBeenCalledOnce()
  })
  it('does not replace an empty response with sample members', async () => {
    getMembers.mockResolvedValue([])
    show()
    expect(await screen.findByText('Chưa có thành viên.')).toBeInTheDocument()
    expect(screen.queryByText('Nguyễn Minh Anh')).not.toBeInTheDocument()
  })
  it('distinguishes loading failure from an empty member list', async () => {
    getMembers.mockRejectedValue(new Error('Unavailable'))
    show()
    expect(await screen.findByText('Chưa tải được thành viên.')).toBeInTheDocument()
    expect(screen.queryByText('Chưa có thành viên.')).not.toBeInTheDocument()
  })
  it('does not identify someone by an unrelated membership ID', async () => {
    getMembers.mockResolvedValue([{ ...member, id: '42', userId: '70', email: 'other@ctu.edu.vn' }])
    show()
    await screen.findByText('Nguyễn Văn An')
    expect(screen.queryByText('Bạn')).not.toBeInTheDocument()
  })
})
