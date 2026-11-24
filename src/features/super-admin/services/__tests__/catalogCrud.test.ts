import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))
import { apiClient } from '@/shared'
import { superAdminService } from '../superAdminService'

beforeEach(() => vi.clearAllMocks())

it('uses existing level endpoints and keeps inactive descendants available for restoration', async () => {
  vi.mocked(apiClient.get).mockImplementation(async (_url, config) => {
    const params = config?.params as { level?: number } | undefined
    if (params?.level === 0)
      return [{ id: 9, name: 'Mục gốc', childrenOrder: 1, isActive: true }]
    if (params?.level === 1)
      return [
        {
          id: 72,
          name: 'Tiêu chí tắt',
          parentCategoryId: 9,
          parentId: 9,
          childrenOrder: 2,
          isActive: false,
        },
      ]
    return []
  })
  const points = await superAdminService.getPointCategories()
  const criteria = await superAdminService.getCriterias()
  expect(apiClient.get).toHaveBeenCalledWith('/point-categories/level', { params: { level: 0 } })
  expect(apiClient.get).toHaveBeenCalledWith('/criterias/level', { params: { level: 1 } })
  expect(apiClient.get).toHaveBeenCalledTimes(6)
  expect(points[0].children?.[0].isActive).toBe(false)
  expect(criteria[0].children?.[0].isActive).toBe(false)
})

it('stops with an error if the server repeats a level instead of looping forever', async () => {
  vi.mocked(apiClient.get).mockResolvedValue([{ id: 9, name: 'Repeated item' }])
  await expect(superAdminService.getPointCategories()).rejects.toThrow(
    'API trả về cấp tiêu chí không hợp lệ.'
  )
  expect(apiClient.get).toHaveBeenCalledTimes(2)
})

it('sends the mandatory date and order for new categories and criteria', async () => {
  const point = {
    name: 'Mục mới',
    note: '',
    maximum: 20,
    dateApply: '2026-11-20',
    level: 0,
    childrenOrder: 3,
    parentCategoryId: null,
  }
  await superAdminService.createPointCategory(point)
  expect(apiClient.post).toHaveBeenCalledWith('/point-categories/admin', point)
  await superAdminService.createCriteria({
    name: 'Tiêu chí mới',
    level: 1,
    parentId: 9,
    childrenOrder: 4,
    scope: 'FACULTY',
    requiredOccurrences: 2,
  })
  expect(apiClient.post).toHaveBeenCalledWith(
    '/criterias/admin',
    expect.objectContaining({
      childrenOrder: 4,
      parentId: 9,
      scope: 'FACULTY',
      requiredOccurrences: 2,
    })
  )
})

it('sends child status and content updates without sending the nested tree', async () => {
  await superAdminService.updatePointCategory(9, {
    name: 'Tiêu chí con',
    parentCategoryId: 8,
    isActive: false,
    children: [],
  })
  expect(apiClient.patch).toHaveBeenCalledWith(
    '/point-categories/admin/9',
    expect.objectContaining({ parentCategoryId: 8, isActive: false })
  )
  expect(vi.mocked(apiClient.patch).mock.calls[0][1]).not.toHaveProperty('children')
  await superAdminService.updateCriteria(72, {
    name: 'Tiêu chí',
    childrenOrder: 2,
    isActive: false,
    requiredOccurrences: 3,
    children: [],
  })
  expect(vi.mocked(apiClient.put).mock.calls[0][1]).not.toHaveProperty('isActive')
  expect(vi.mocked(apiClient.put).mock.calls[0][1]).toMatchObject({
    childrenOrder: 2,
    requiredOccurrences: 3,
  })
})

it('uses the backend delete and status endpoints', async () => {
  await superAdminService.deletePointCategory(9)
  await superAdminService.deleteCriteria(72)
  await superAdminService.toggleCriteriaStatus(72)
  expect(apiClient.delete).toHaveBeenCalledWith('/point-categories/admin/9')
  expect(apiClient.delete).toHaveBeenCalledWith('/criterias/admin/72')
  expect(apiClient.patch).toHaveBeenCalledWith('/criterias/admin/72/change-status')
})
