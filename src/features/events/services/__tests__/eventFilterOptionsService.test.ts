import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared'
import { eventFilterOptionsService } from '../eventFilterOptionsService'

afterEach(() => vi.restoreAllMocks())
describe('filter metadata', () => {
  it('builds point codes from hierarchy order and preserves a single actual SV5T major', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
      if (url === '/criterias')
        return [
          {
            id: 17,
            name: 'Tiêu chuẩn Tình nguyện tốt',
            level: 1,
            children: [{ id: 20, name: 'Hiến máu' }],
          },
        ] as any
      if (url === '/point-categories')
        return [
          {
            id: 99,
            name: 'Đánh giá học tập',
            childrenOrder: 1,
            children: [
              {
                id: 105,
                name: 'Tham gia đầy đủ hoạt động',
                childrenOrder: 1,
                children: [{ id: 106, name: 'Hoạt động cụ thể', childrenOrder: 1 }],
              },
            ],
          },
          { id: 200, name: 'Chấp hành nội quy', childrenOrder: 2 },
        ] as any
      return [] as any
    })
    const data = await eventFilterOptionsService.getFilterOptions()
    expect(data.criterias[0]).toEqual(expect.objectContaining({ id: 17, childIds: [17, 20] }))
    expect(data.pointCategories.find((item) => item.id === 99)?.label).toContain('Mục I')
    expect(data.pointCategories.find((item) => item.id === 105)?.label).toBe('Mục I.a')
    expect(data.pointCategories.find((item) => item.id === 105)?.childIds).toEqual([105, 106])
  })
  it('does not invent selectable criteria IDs when metadata is unavailable', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('offline'))
    const data = await eventFilterOptionsService.getFilterOptions()
    expect(data.criterias).toEqual([])
    expect(data.eventTypes).toEqual([])
    expect(data.pointCategories).toEqual([])
  })
})
