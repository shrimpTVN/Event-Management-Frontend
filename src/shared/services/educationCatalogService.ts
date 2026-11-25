import { apiClient } from '@/shared'

export interface SchoolOption {
  id: number
  name: string
  isActive: boolean
}
export interface MajorOption {
  id: number
  name: string
  code: string
  schoolId: number
  isActive: boolean
}
const unwrap = (response: any) => response?.data ?? response

export const educationCatalogService = {
  async getSchools(): Promise<SchoolOption[]> {
    const result = unwrap(await apiClient.get('/schools'))
    const rows = Array.isArray(result) ? result : result?.content
    if (!Array.isArray(rows)) throw new Error('Không tải được danh sách khoa/trường.')
    return rows.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      isActive: row.isActive !== false,
    }))
  },
  async getMajors(schoolId: number): Promise<MajorOption[]> {
    const school = unwrap(await apiClient.get(`/schools/${schoolId}`))
    if (!school || Number(school.id) !== schoolId || !Array.isArray(school.majors))
      throw new Error('Không tải được ngành thuộc khoa/trường đã chọn.')
    return school.majors.map((row: any) => ({
      id: Number(row.id),
      name: row.name,
      code: row.code || '',
      schoolId,
      isActive: row.isActive !== false && school.isActive !== false,
    }))
  },
  async validateSelection(schoolId: number, majorId: number) {
    if (
      !Number.isSafeInteger(schoolId) ||
      schoolId <= 0 ||
      !Number.isSafeInteger(majorId) ||
      majorId <= 0
    )
      throw new Error('Vui lòng chọn khoa/trường và ngành học.')
    const majors = await educationCatalogService.getMajors(schoolId)
    const major = majors.find((item) => item.id === majorId && item.isActive)
    if (!major)
      throw new Error('Ngành học không còn hoạt động hoặc không thuộc khoa/trường đã chọn.')
    return major
  },
}
