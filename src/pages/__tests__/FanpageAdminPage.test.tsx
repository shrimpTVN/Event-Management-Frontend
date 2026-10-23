import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { FanpageAdminPage } from '../FanpageAdminPage'

vi.mock('@/features/fanpage-admin', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/fanpage-admin')>()
  return {
    ...actual,
    fanpageAdminService: {
      ...actual.fanpageAdminService,
      getAvailableFanpages: vi.fn().mockResolvedValue([
        {
          id: '10',
          code: 'TEST-ADM',
          name: 'Fanpage Admin Mock Test',
          fullName: 'Fanpage Quản Trị Hệ Thống Mock Test',
          avatarText: 'ADM',
          role: 'Quản trị viên',
          isVerified: true,
          email: 'admin-test@ctu.edu.vn',
          phone: '0292 123 4567',
          address: 'Khu II, Đại học Cần Thơ',
          followersCount: 500,
          eventsCount: 5,
          description: 'Mô tả fanpage mock test',
        },
      ]),
      getFeedPosts: vi.fn().mockResolvedValue([
        {
          id: 'post-10',
          authorName: 'Fanpage Admin Mock Test',
          authorCode: 'ADM',
          authorAvatarText: 'AD',
          timeAgo: '1 ngày',
          isPublic: true,
          title: 'SỰ KIỆN TEST HOÀN CHỈNH',
          summary: 'Tóm tắt bài viết test',
          bannerUrl: '',
          likesCount: 50,
          commentsCount: 5,
          sharesCount: 2,
          isLiked: false,
        },
      ]),
    },
  }
})

describe('FanpageAdminPage', () => {
  it('loads dynamic fanpages and feed posts via fanpageAdminService', async () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/fanpage/admin']}>
          <FanpageAdminPage />
        </MemoryRouter>
      </AppProviders>
    )

    // Check that dynamic fanpage and post are loaded
    expect(await screen.findByText('Fanpage Quản Trị Hệ Thống Mock Test')).toBeInTheDocument()
    expect(await screen.findByText('SỰ KIỆN TEST HOÀN CHỈNH')).toBeInTheDocument()
  })
})
