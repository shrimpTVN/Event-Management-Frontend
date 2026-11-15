import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared'
import { createSv5tLabelFormatter } from '@/shared/utils/sv5tLabels'
import { buildPointCategoryCodes } from '@/shared/utils/pointCategoryCodes'

interface PointCategory {
  id: number
  name: string
  parentCategoryId?: number | null
  childrenOrder?: number
  children?: PointCategory[]
}

interface EventPoint {
  pointCategoryId: number
  pointCategoryName?: string
  pointCategoryCode?: string
}

export function useEventBenefitLines(
  pointsReward?: string,
  criteriaId?: number | string,
  criteriaName?: string,
  eventPoints: EventPoint[] = []
) {
  const { data: pointCategories = [] } = useQuery<PointCategory[]>({
    queryKey: ['pointCategories'],
    queryFn: async () => {
      const response: any = await apiClient.get('/point-categories')
      return Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
    },
    enabled: Boolean(eventPoints.length || /mục\s*[IVX]/i.test(pointsReward || '')),
    staleTime: 5 * 60_000,
  })
  const pointNames = useMemo(() => {
    const names = new Map<number, string>()
    const collect = (items: PointCategory[]) =>
      items.forEach((item) => {
        names.set(item.id, item.name)
        if (item.children) collect(item.children)
      })
    collect(pointCategories)
    return names
  }, [pointCategories])
  const pointCodes = useMemo(() => buildPointCategoryCodes(pointCategories), [pointCategories])
  const { data: criterias = [] } = useQuery({
    queryKey: ['sv5tCriterias'],
    queryFn: async () => {
      const response: any = await apiClient.get('/criterias')
      return Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
    },
    enabled: Boolean(criteriaId || criteriaName || /SV5T/i.test(pointsReward || '')),
    staleTime: 5 * 60_000,
  })
  const formatCriteria = useMemo(
    () => createSv5tLabelFormatter(criterias, { childOnly: true }),
    [criterias]
  )
  const formatCompactCriteria = useMemo(
    () => createSv5tLabelFormatter(criterias, { compact: true }),
    [criterias]
  )
  const criterionLine = (name: string) => ({
    label: `Xét ${formatCompactCriteria(name, criteriaId).replace(/^(?:Tiêu chuẩn|Xét)\s+/i, '')}`,
    title: formatCriteria(name, criteriaId).replace(/^Tiêu chuẩn\s+/i, ''),
  })
  const lines = (pointsReward || 'Cộng điểm rèn luyện').split(' · ')
  let hasCriteria = false
  const formatted = lines.map((line) => {
    const name = line.replace(/^Tiêu (?:chuẩn|chí) SV5T:\s*/i, '')
    if (name !== line || (criteriaName && line === criteriaName)) {
      hasCriteria = true
      return criterionLine(name)
    }
    if (/điểm rèn luyện|ĐRL/i.test(line)) {
      const codes = eventPoints.map((point) => {
        const code = pointCodes.get(Number(point.pointCategoryId)) || point.pointCategoryCode
        return code
          ?.replace(/^mục\s*/i, '')
          .split('.')
          .slice(0, 2)
          .join('.')
      })
      const label =
        codes.length && codes.every(Boolean)
          ? `${line.replace(/\s+mục\s+.*$/i, '').replace(/\s+[IVX]+[a-z]?(?:\.[a-z0-9]+)*$/i, '')} mục ${[...new Set(codes)].join(', ')}`
          : line
      const names = eventPoints
        .map((point) => pointNames.get(Number(point.pointCategoryId)) || point.pointCategoryName)
        .filter(Boolean)
      if (!names.length) {
        const match = line.match(/mục\s*([IVX]+)[.\s]*([a-z])(?:[.\s]*(\d+))?/i)
        const code = match
          ? [match[1].toUpperCase(), match[2].toLowerCase(), match[3]].filter(Boolean).join('.')
          : null
        const id = code ? [...pointCodes].find(([, value]) => value === code)?.[0] : undefined
        const name = id !== undefined ? pointNames.get(id) : undefined
        if (name) names.push(name)
      }
      return { label, title: names.length ? [...new Set(names)].join('\n') : label }
    }
    return { label: line, title: line }
  })
  if (!hasCriteria && (criteriaName || criteriaId)) {
    const line = criterionLine(criteriaName || '')
    if (line.label && !formatted.some((item) => item.title === line.title)) formatted.push(line)
  }
  return formatted
}
