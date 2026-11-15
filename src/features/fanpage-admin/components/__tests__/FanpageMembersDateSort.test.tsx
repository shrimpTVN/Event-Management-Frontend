import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FanpageMembersView } from '../FanpageMembersView'
import type { FanpageSummary } from '../../types/fanpageAdmin.types'

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { id: '2' } }),
}))
vi.mock('../../services/fanpageAdminService', () => ({
  MOCK_FANPAGE_MEMBERS: [],
  fanpageAdminService: {
    getFanpageMembers: vi.fn().mockResolvedValue([
      {
        id: '1',
        userId: '1',
        fullName: 'Ngày cũ',
        email: 'old@example.edu.vn',
        joinedAt: '12/11/2026',
        role: 'COLLABORATOR',
        avatarText: 'C',
        isActive: true,
      },
      {
        id: '2',
        userId: '3',
        fullName: 'Ngày mới',
        email: 'new@example.edu.vn',
        joinedAt: '11/12/2026',
        role: 'COLLABORATOR',
        avatarText: 'M',
        isActive: true,
      },
    ]),
    getFanpageInvitations: vi.fn().mockResolvedValue([
      {
        id: '1',
        email: 'old-invite@example.edu.vn',
        invitedAt: '2026-11-01T01:00:00Z',
        status: 'PENDING',
        role: 'COLLABORATOR',
      },
      {
        id: '2',
        email: 'new-invite@example.edu.vn',
        invitedAt: '2026-11-15T01:00:00Z',
        status: 'PENDING',
        role: 'COLLABORATOR',
      },
    ]),
  },
}))
afterEach(cleanup)

describe('member and invitation date sorting', () => {
  it('sorts both tabs independently by their displayed date columns', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <FanpageMembersView currentFanpage={{ id: '1', role: 'ADMIN' } as FanpageSummary} />
        </QueryClientProvider>
      </MemoryRouter>
    )
    await screen.findByText('Ngày mới')
    const before = (a: string, b: string) =>
      Boolean(
        screen.getAllByText(a)[0].compareDocumentPosition(screen.getAllByText(b)[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    fireEvent.click(screen.getByRole('button', { name: 'Ngày tham gia: chưa sắp xếp' }))
    expect(before('Ngày mới', 'Ngày cũ')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Ngày tham gia: mới nhất trước' }))
    expect(before('Ngày cũ', 'Ngày mới')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Lời mời qua email/ }))
    await screen.findByText('new-invite@example.edu.vn')
    fireEvent.click(screen.getByRole('button', { name: 'Thời gian gửi: chưa sắp xếp' }))
    expect(before('new-invite@example.edu.vn', 'old-invite@example.edu.vn')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Thời gian gửi: mới nhất trước' }))
    expect(before('old-invite@example.edu.vn', 'new-invite@example.edu.vn')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Thành viên/ }))
    expect(screen.getByRole('button', { name: 'Ngày tham gia: cũ nhất trước' })).toBeInTheDocument()
  })
})
