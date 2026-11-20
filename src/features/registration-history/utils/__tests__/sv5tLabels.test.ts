import { describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn() } }))
import { apiClient } from '@/shared'
import { createSv5tLabelFormatter } from '@/shared/utils/sv5tLabels'
import { historyService, normalizeRegisteredEvent } from '../../services/historyService'

const criterias = [
  { id: 1, name: 'Tình nguyện tốt', children: [{ id: 2, name: 'Tham gia hiến máu', parentId: 1 }] },
]

describe('history SV5T labels', () => {
  it('displays the short standard name and child code in participation history', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) =>
      url === '/criterias'
        ? [{
            id: 1, name: 'Danh hiệu SV5T', children: [{
              id: 17, name: 'Tiêu chuẩn Tình nguyện tốt', childrenOrder: 4,
              children: [{ id: 403, name: 'Tham gia ít nhất 02 lần hiến máu', childrenOrder: 3 }],
            }],
          }]
        : ([{ eventInfo: { id: 23, criteriaId: 403, criteriaName: 'Tham gia ít nhất 02 lần hiến máu' } }] as any)
    )
    const event = (await historyService.getMyHistory())[0]
    expect(event.criteriaSv5t).toBe('Tình nguyện tốt (4.3)')
    expect(event.criteriaSv5tDetail).toBe('Tình nguyện tốt (4.3. Tham gia ít nhất 02 lần hiến máu)')
    expect(event.benefits).toEqual(['Tiêu chuẩn SV5T: Tình nguyện tốt (4.3)'])
  })

  it('keeps only the root and selected child, omitting intermediate requirements', () => {
    const format = createSv5tLabelFormatter([
      { id: 1, name: 'Tiêu chuẩn Đạo đức tốt' },
      { id: 2, name: 'Đạt thêm 01 trong 05 tiêu chí về tư tưởng, đạo đức, lối sống', parentId: 1 },
      {
        id: 3,
        name: 'Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên',
        parentId: 2,
      },
    ])
    expect(format('Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên')).toBe(
      'Tiêu chuẩn Đạo đức tốt (Tham gia hoạt động giáo dục đạo đức, lối sống văn hóa cho sinh viên)'
    )
  })

  it('resolves the parent from the exact child name when the event has no criteria ID', () => {
    const format = createSv5tLabelFormatter(criterias)
    const event = normalizeRegisteredEvent(
      {
        eventInfo: {
          id: 10,
          criteriaName: 'Tham gia hiến máu',
          eventPoints: [{ pointCategoryId: 41, point: 10 }],
        },
      },
      format
    )
    expect(event.criteriaSv5t).toBe('Tình nguyện tốt (Tham gia hiến máu)')
    expect(event.benefits).toEqual([
      '+10 ĐRL mục IV.b',
      'Tiêu chuẩn SV5T: Tình nguyện tốt (Tham gia hiến máu)',
    ])
  })

  it('supports flat trees and prefers an explicit ID when names are ambiguous', () => {
    const format = createSv5tLabelFormatter([
      { id: 1, name: 'Tình nguyện tốt' },
      { id: 2, name: 'Tham gia hoạt động', parentId: 1 },
      { id: 3, name: 'Đạo đức tốt' },
      { id: 4, name: 'Tham gia hoạt động', parentId: 3 },
    ])
    expect(format('Tham gia hoạt động')).toBe('Tham gia hoạt động')
    expect(format('Tham gia hoạt động', 2)).toBe('Tình nguyện tốt (Tham gia hoạt động)')
    expect(format('Không có trong cây')).toBe('Không có trong cây')
  })

  it('fetches the criteria tree once for the history list and tolerates unavailable criteria', async () => {
    const get = vi.mocked(apiClient.get)
    get.mockImplementation(async (url) =>
      url === '/criterias'
        ? criterias
        : ([{ eventInfo: { id: 10, criteriaName: 'Tham gia hiến máu' } }] as any)
    )
    expect((await historyService.getMyHistory())[0].criteriaSv5t).toBe(
      'Tình nguyện tốt (Tham gia hiến máu)'
    )
    get.mockImplementation(async (url) => {
      if (url === '/criterias') throw new Error('offline')
      return [{ eventInfo: { id: 10, criteriaName: 'Tham gia hiến máu' } }] as any
    })
    expect((await historyService.getMyHistory())[0].criteriaSv5t).toBe('Tham gia hiến máu')
  })
})
