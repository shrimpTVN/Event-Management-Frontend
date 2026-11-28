import { apiClient } from '@/shared'

export interface CatalogAcademicYear {
  id: number
  code: string
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export interface CatalogSemester {
  id: number
  number: number
  academicYearId?: number
  academicYear?: string
  startDate?: string
  endDate?: string
  status?: string
  isCurrent?: boolean
}

export async function fetchAcademicYears(): Promise<CatalogAcademicYear[]> {
  const res: any = await apiClient.get('/academic-years')
  const list = Array.isArray(res) ? res : res?.data || res?.content || []
  return Array.isArray(list) ? list : []
}

export async function fetchSemesters(): Promise<CatalogSemester[]> {
  const res: any = await apiClient.get('/semesters')
  const list = Array.isArray(res) ? res : res?.data || res?.content || []
  return Array.isArray(list) ? list : []
}

export const academicYearsQueryOptions = () => ({
  queryKey: ['academic-years'] as const,
  queryFn: fetchAcademicYears,
})

export const semestersQueryOptions = () => ({
  queryKey: ['semesters'] as const,
  queryFn: fetchSemesters,
})
