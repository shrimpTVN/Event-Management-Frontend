import { describe, expect, it } from 'vitest'
import { resolveEventTypeId } from '../../services/eventService'
import { matchesEventFilters, removeEventFilter } from '../eventFilters'
import {
  isEventMatchingRegistrationStatus,
  resolveAllowedPointCategoryIds,
  resolveCriteriaId,
} from '../../services/eventService'
import type { EventFilterOptions } from '../../services/eventFilterOptionsService'

const now = new Date('2026-11-15T12:00:00')
const event = {
  status: 'PUBLISHED',
  startTime: '2026-11-16T08:00:00',
  endTime: '2026-11-16T10:00:00',
  dateClose: '2026-11-15T18:00:00',
  eventTypeId: 2,
  fanpageId: 3,
  criteriaId: 41,
  semesterId: 9,
  eventPoints: [{ pointCategoryId: 111 }],
}
const options: EventFilterOptions = {
  academicYears: [],
  semesters: [{ id: 9, label: 'HK1', academicYear: '2026 - 2027' }],
  eventTypes: [
    { id: 2, label: 'Workshop' },
    { id: 4, label: 'Hội thảo' },
  ],
  fanpages: [{ id: 3, label: 'Đoàn trường' }],
  criterias: [
    { id: 40, label: 'Tình nguyện tốt', childIds: [40, 41], childNames: ['Hiến máu'] },
    { id: 50, label: 'Hội nhập tốt', childIds: [50, 51], childNames: ['Thi ngoại ngữ'] },
  ],
  pointCategories: [
    { id: 10, label: 'Mục I', level: 0, childIds: [10, 11, 12, 111, 121] },
    { id: 11, label: 'Mục I.a', parentCategoryId: 10, childIds: [11, 111] },
    { id: 12, label: 'Mục I.b', parentCategoryId: 10, childIds: [12, 121] },
  ],
}

describe('registration state filters', () => {
  it('keeps past and ongoing events whose registration window is still open', () => {
    const past = {
      ...event,
      startTime: '2026-11-14T08:00:00',
      endTime: '2026-11-14T10:00:00',
      dateClose: '2026-11-21T22:35:00',
    }
    expect(isEventMatchingRegistrationStatus(past, 'OPEN_REGISTRATION', now)).toBe(true)
    expect(matchesEventFilters(past, { status: 'OPEN_REGISTRATION' }, options, now)).toBe(true)
    expect(
      isEventMatchingRegistrationStatus(
        { ...past, startTime: '2026-11-15T10:00:00', endTime: '2026-11-15T13:00:00' },
        'OPEN_REGISTRATION',
        now
      )
    ).toBe(true)
    expect(
      isEventMatchingRegistrationStatus(
        { ...past, dateClose: '2026-11-15T11:00:00' },
        'CLOSED_REGISTRATION',
        now
      )
    ).toBe(true)
  })
  it.each(['COMPLETED', 'FINISHED', 'CANCELLED', 'CLOSED'])(
    'respects explicit %s status even if the deadline is still in the future',
    (status) => {
      expect(
        isEventMatchingRegistrationStatus({ ...event, status }, 'OPEN_REGISTRATION', now)
      ).toBe(false)
    }
  )
  it('does not confuse the event start with registration opening', () => {
    expect(isEventMatchingRegistrationStatus(event, 'OPEN_REGISTRATION', now)).toBe(true)
    expect(
      isEventMatchingRegistrationStatus(
        { ...event, dateOpen: '2026-11-15T13:00:00' },
        'OPEN_REGISTRATION',
        now
      )
    ).toBe(false)
  })
  it('closes registration at its exact deadline without marking the future event completed', () => {
    const closed = { ...event, dateClose: now.toISOString() }
    expect(isEventMatchingRegistrationStatus(closed, 'OPEN_REGISTRATION', now)).toBe(false)
    expect(isEventMatchingRegistrationStatus(closed, 'CLOSED_REGISTRATION', now)).toBe(true)
    expect(isEventMatchingRegistrationStatus(closed, 'COMPLETED', now)).toBe(false)
    expect(
      isEventMatchingRegistrationStatus({ ...event, status: 'CLOSED' }, 'COMPLETED', now)
    ).toBe(false)
  })
  it('distinguishes ongoing, completed and cancelled events', () => {
    const running = { ...event, startTime: '2026-11-15T10:00:00', endTime: '2026-11-15T13:00:00' }
    expect(isEventMatchingRegistrationStatus(running, 'ONGOING', now)).toBe(true)
    expect(
      isEventMatchingRegistrationStatus(
        { ...running, endTime: '2026-11-15T11:00:00' },
        'COMPLETED',
        now
      )
    ).toBe(true)
    expect(
      isEventMatchingRegistrationStatus({ ...running, status: 'CANCELLED' }, 'ONGOING', now)
    ).toBe(false)
    expect(
      isEventMatchingRegistrationStatus(
        { ...event, status: 'DRAFT', endTime: '2026-01-01' },
        'COMPLETED',
        now
      )
    ).toBe(false)
  })
})

describe('shared event matching', () => {
  it('matches alternatives within a group and intersects different groups', () => {
    expect(
      matchesEventFilters(event, { eventTypeId: '2,4', fanpageIds: ['3', '6'] }, options, now)
    ).toBe(true)
    expect(
      matchesEventFilters(event, { eventTypeId: '2,4', fanpageIds: ['6'] }, options, now)
    ).toBe(false)
  })
  it('uses actual event type IDs rather than title text or an empty type name', () => {
    expect(resolveEventTypeId({ eventTypeName: 'Workshop' })).toBeUndefined()
    expect(
      matchesEventFilters(
        { ...event, eventTypeId: 4, eventTypeName: 'Workshop' },
        { eventTypeId: '2' },
        options
      )
    ).toBe(false)
    expect(matchesEventFilters({ eventTypeName: '' }, { eventTypeId: '2' }, options)).toBe(false)
    expect(matchesEventFilters({ eventTypeName: 'Workshop' }, { eventTypeId: '2' }, options)).toBe(
      true
    )
  })
  it('includes descendants of a root and excludes unselected sibling categories', () => {
    expect(matchesEventFilters(event, { pointCategoryId: '10' }, options)).toBe(true)
    expect(matchesEventFilters(event, { pointCategoryId: '10,11' }, options)).toBe(true)
    expect(
      matchesEventFilters(
        { ...event, eventPoints: [{ pointCategoryId: 121 }] },
        { pointCategoryId: '10,11' },
        options
      )
    ).toBe(false)
    expect(
      [...resolveAllowedPointCategoryIds(['10', '11', '12'], options.pointCategories)].sort()
    ).toEqual([11, 111, 12, 121].sort())
  })
  it('matches the actual SV5T hierarchy and avoids keyword guesses', () => {
    expect(matchesEventFilters(event, { criteriaId: '40' }, options)).toBe(true)
    expect(
      matchesEventFilters(
        { ...event, criteriaId: 51, criteriaName: 'Hiến máu' },
        { criteriaId: '40' },
        options
      )
    ).toBe(false)
    expect(matchesEventFilters({ criteriaName: 'Hiến máu' }, { criteriaId: '40' }, options)).toBe(
      true
    )
    expect(
      matchesEventFilters(
        { criteriaName: 'Tuyên truyền về hiến máu' },
        { criteriaId: '40' },
        options
      )
    ).toBe(false)
    expect(resolveCriteriaId({ criteriaName: 'Hiến máu' })).toBeUndefined()
  })
  it('checks semesters and normalized academic years, rejecting missing metadata', () => {
    expect(
      matchesEventFilters(event, { academicYear: '2026–2027', semesterId: '9' }, options)
    ).toBe(true)
    expect(matchesEventFilters(event, { semesterId: '10' }, options)).toBe(false)
    expect(matchesEventFilters({}, { academicYear: '2026 - 2027' }, options)).toBe(false)
    expect(matchesEventFilters({}, { semesterId: '9' }, options)).toBe(false)
  })
  it('includes events overlapping the chosen dates and rejects missing dates', () => {
    const days = { dateHappenFrom: '2026-11-15', dateHappenTo: '2026-11-15' }
    expect(
      matchesEventFilters(
        { startTime: '2026-11-14T08:00:00', endTime: '2026-11-16T10:00:00' },
        days
      )
    ).toBe(true)
    expect(matchesEventFilters(event, days)).toBe(false)
    expect(matchesEventFilters({}, days)).toBe(false)
  })
  it('clears dependent values together when removing filter chips', () => {
    expect(removeEventFilter({ fanpageIds: ['3'], fanpageId: '3' }, 'fanpageIds')).toEqual({})
    expect(removeEventFilter({ criteriaId: '40', childCriteriaIds: ['41'] }, 'criteriaId')).toEqual(
      {}
    )
    expect(removeEventFilter({ academicYear: '2026', semesterId: '9' }, 'academicYear')).toEqual({})
    expect(
      removeEventFilter(
        { dateHappenFrom: '2026-11-15', dateHappenTo: '2026-11-20' },
        'dateHappenFrom'
      )
    ).toEqual({})
  })
})
