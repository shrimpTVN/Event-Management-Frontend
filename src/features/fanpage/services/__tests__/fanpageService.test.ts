import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fanpageService } from '../fanpageService'
import { apiClient } from '@/shared'

vi.mock('@/shared', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('fanpageService real-time following status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches real followerCount and isFollowing=false when user has not followed', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/fanpages/1') {
        return {
          id: 1,
          name: 'Đoàn Trường CNTT & TT',
          description: 'Mô tả fanpage',
        }
      }
      if (url === '/fanpages/1/followers/count') {
        return {
          fanpageId: 1,
          followerCount: 0,
          isFollowing: false,
        }
      }
      return {}
    })

    const result = await fanpageService.getFanpageById('1')
    expect(result.id).toBe('1')
    expect(result.name).toBe('Đoàn Trường CNTT & TT')
    expect(result.isFollowing).toBe(false)
    expect(result.followerCount).toBe(0)
  })

  it('fetches isFollowing=true when user has followed the fanpage', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/fanpages/2') {
        return {
          id: 2,
          name: 'CLB Tin học',
        }
      }
      if (url === '/fanpages/2/followers/count') {
        return {
          fanpageId: 2,
          followerCount: 42,
          isFollowing: true,
        }
      }
      return {}
    })

    const result = await fanpageService.getFanpageById('2')
    expect(result.isFollowing).toBe(true)
    expect(result.followerCount).toBe(42)
  })

  it('calls follow and unfollow endpoints correctly', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true })
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ success: true })

    await fanpageService.followFanpage('1')
    expect(apiClient.post).toHaveBeenCalledWith('/fanpages/1/follow')

    await fanpageService.unfollowFanpage('1')
    expect(apiClient.delete).toHaveBeenCalledWith('/fanpages/1/follow')
  })
})
