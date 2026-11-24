import type { EventFilterFormValues } from '../components/EventFilterModal'
import type { EventFilterOptions, FilterOption } from '../services/eventFilterOptionsService'
import {
  isEventMatchingRegistrationStatus,
  resolveAllowedPointCategoryIds,
  ROOT_CRITERIA_CHILDREN,
} from '../services/eventService'

export const filterIds = (value?: string) =>
  (value || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id && id !== 'ALL')
const clean = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
const year = (value?: string) => clean(value).replace(/[–—]/g, '-').replace(/\s/g, '')
export interface FilterableEvent {
  status?: string
  dateOpen?: string
  dateClose?: string
  dateHappen?: string
  startTime?: string
  endTime?: string
  eventTypeId?: string | number
  eventTypeName?: string
  category?: string
  organizerId?: string | number
  fanpageId?: string | number
  criteriaId?: string | number
  criteriaName?: string
  sv5tCriteriaName?: string
  semesterId?: string | number
  academicYear?: string
  semester?: { id?: string | number; academicYear?: string } | null
  eventPoints?: { pointCategoryId?: number | string }[]
  pointCategoryId?: number | string
  isFollowed?: boolean
  pointsReward?: number | string | null
}

function localDay(value?: string) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function matchesEventFilters(
  event: FilterableEvent,
  values: EventFilterFormValues,
  options?: EventFilterOptions,
  now = new Date()
) {
  return createEventFilterMatcher(values, options, now)(event)
}

/** Prepare selected IDs and category descendants once for a whole result set. */
export function createEventFilterMatcher(
  values: EventFilterFormValues,
  options?: EventFilterOptions,
  now = new Date()
) {
  const statuses = filterIds(values.status)
  const types = filterIds(values.eventTypeId)
  const organizers = values.fanpageIds?.length ? values.fanpageIds : filterIds(values.fanpageId)
  const points = filterIds(values.pointCategoryId)
  const allowedPoints = points.length
    ? resolveAllowedPointCategoryIds(points, options?.pointCategories)
    : null
  const criteria = filterIds(values.criteriaId)
  const selectedCriteria = criteria.length
    ? (options?.criterias || []).filter((option) => criteria.includes(String(option.id)))
    : []
  const allowedCriteria = new Set([
    ...criteria,
    ...selectedCriteria.flatMap((option) => (option.childIds || []).map(String)),
  ])
  criteria.forEach((cid) => {
    ROOT_CRITERIA_CHILDREN[Number(cid)]?.forEach((id) => allowedCriteria.add(String(id)))
  })
  const academicYear = values.academicYear ? year(values.academicYear) : ''
  return (event: FilterableEvent) => {
    if (values.feedScope === 'FOLLOWING') {
      if (!Boolean(event.isFollowed)) return false
    }
    if (values.feedScope === 'RECOMMENDED') {
      const hasPoints = Boolean(
        event.pointsReward ||
        (event.eventPoints && event.eventPoints.length > 0) ||
        event.pointCategoryId
      )
      if (!hasPoints) return false
    }

    if (
      statuses.length &&
      !statuses.some((status) => isEventMatchingRegistrationStatus(event, status, now))
    )
      return false
    if (types.length) {
      if (event.eventTypeId != null) {
        if (!types.includes(String(event.eventTypeId))) return false
      } else if (
        !options?.eventTypes.some(
          (type) =>
            types.includes(String(type.id)) &&
            [event.eventTypeName, event.category].some((name) => clean(name) === clean(type.label))
        )
      )
        return false
    }
    if (
      organizers.length &&
      !organizers.includes(String(event.organizerId ?? event.fanpageId ?? ''))
    )
      return false
    if (allowedPoints) {
      if (
        !(event.eventPoints || []).some((point) =>
          allowedPoints.has(Number(point.pointCategoryId))
        ) &&
        !allowedPoints.has(Number(event.pointCategoryId))
      )
        return false
    }
    if (criteria.length) {
      if (event.criteriaId != null) {
        if (!allowedCriteria.has(String(event.criteriaId))) return false
      } else if (
        !selectedCriteria.some((option) =>
          [option.label, ...(option.childNames || [])].some(
            (name) => clean(name) === clean(event.criteriaName || event.sv5tCriteriaName)
          )
        )
      ) {
        return false
      }
    }
    const semesterId = event.semesterId ?? event.semester?.id
    if (
      values.semesterId &&
      values.semesterId !== 'ALL' &&
      String(semesterId ?? '') !== values.semesterId
    )
      return false
    if (values.academicYear && values.academicYear !== 'ALL') {
      const eventYear =
        event.academicYear ||
        event.semester?.academicYear ||
        options?.semesters.find((semester) => String(semester.id) === String(semesterId))
          ?.academicYear
      if (!eventYear || year(eventYear) !== academicYear) return false
    }
    if (values.dateHappenFrom || values.dateHappenTo) {
      const start = localDay(event.startTime || event.dateHappen)
      if (!start) return false
      const end = localDay(event.endTime) || start
      if (values.dateHappenFrom && end < values.dateHappenFrom) return false
      if (values.dateHappenTo && start > values.dateHappenTo) return false
    }
    return true
  }
}

export function eventFilterChips(values: EventFilterFormValues, options?: EventFilterOptions) {
  const chips: { key: keyof EventFilterFormValues; label: string }[] = []
  const addOptions = (
    key: 'eventTypeId' | 'criteriaId' | 'pointCategoryId',
    items?: FilterOption[]
  ) => {
    const ids = filterIds(values[key])
    if (!ids.length) return
    const labels = ids.map((id) => items?.find((item) => String(item.id) === id)?.label || id)
    chips.push({ key, label: labels.join(', ') })
  }
  if (values.feedScope && values.feedScope !== 'ALL') {
    chips.push({
      key: 'feedScope',
      label: values.feedScope === 'FOLLOWING' ? 'Đang theo dõi' : 'Gợi ý (Có ĐRL)',
    })
  }
  if (values.status)
    chips.push({
      key: 'status',
      label: filterIds(values.status)
        .map(
          (status) =>
            ({
              OPEN_REGISTRATION: 'Đang mở đăng ký',
              CLOSED_REGISTRATION: 'Đã đóng đăng ký',
              PUBLISHED: 'Sắp diễn ra',
              ONGOING: 'Đang diễn ra',
              COMPLETED: 'Đã kết thúc',
            })[status] || status
        )
        .join(', '),
    })
  addOptions('eventTypeId', options?.eventTypes)
  addOptions('pointCategoryId', options?.pointCategories)
  addOptions('criteriaId', options?.criterias)
  const fanpages = values.fanpageIds?.length ? values.fanpageIds : filterIds(values.fanpageId)
  if (fanpages.length)
    chips.push({
      key: 'fanpageIds',
      label: fanpages
        .map((id) => options?.fanpages.find((item) => String(item.id) === id)?.label || id)
        .join(', '),
    })
  if (values.academicYear && values.academicYear !== 'ALL')
    chips.push({ key: 'academicYear', label: values.academicYear })
  if (values.semesterId && values.semesterId !== 'ALL')
    chips.push({
      key: 'semesterId',
      label:
        options?.semesters.find((item) => String(item.id) === values.semesterId)?.label ||
        `Học kỳ ${values.semesterId}`,
    })
  if (values.dateHappenFrom || values.dateHappenTo)
    chips.push({
      key: 'dateHappenFrom',
      label: `${values.dateHappenFrom || '…'} → ${values.dateHappenTo || '…'}`,
    })
  return chips
}

export function removeEventFilter(values: EventFilterFormValues, key: keyof EventFilterFormValues) {
  const next = { ...values }
  delete next[key]
  if (key === 'feedScope') delete next.feedScope
  if (key === 'criteriaId') delete next.childCriteriaIds
  if (key === 'pointCategoryId') delete next.childCategoryIds
  if (key === 'fanpageIds') delete next.fanpageId
  if (key === 'academicYear') delete next.semesterId
  if (key === 'dateHappenFrom') delete next.dateHappenTo
  return next
}
