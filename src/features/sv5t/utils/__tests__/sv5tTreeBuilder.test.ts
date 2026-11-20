import { describe, it, expect } from 'vitest'
import { ensureSv5tHierarchy } from '../sv5tTreeBuilder'

describe('sv5tTreeBuilder', () => {
  it('returns all 5 standards as uncompleted for a newly registered student with no progress data', () => {
    const standards = ensureSv5tHierarchy(undefined)

    expect(standards).toHaveLength(5)

    // Every standard must be uncompleted (0/5)
    standards.forEach((std) => {
      expect(std.isCompleted).toBe(false)
      expect(std.completedChildren).toBe(0)
    })

    const completedCount = standards.filter((s) => s.isCompleted).length
    expect(completedCount).toBe(0)
  })

  it('keeps criteria uncompleted when criteria array is empty', () => {
    const emptyResponse = {
      academicYearId: 1,
      academicYear: '2026 - 2027',
      completedLeafCriteria: 0,
      totalLeafCriteria: 10,
      completedMainCriteria: 0,
      totalMainCriteria: 5,
      criteria: [],
    }

    const standards = ensureSv5tHierarchy(emptyResponse)

    expect(standards).toHaveLength(5)
    standards.forEach((std) => {
      expect(std.isCompleted).toBe(false)
      expect(std.completedChildren).toBe(0)
    })
  })

  it('correctly applies local optimistic updates and keeps note as official guide rather than student self evaluation note', () => {
    const localCompleted = { 101: true }
    const localNotes = { 101: 'abc' } // Student self evaluation note

    const standards = ensureSv5tHierarchy(undefined, localCompleted, localNotes)
    const daoDucTot = standards[0]
    const tc101 = daoDucTot.children[0]

    expect(daoDucTot.completedChildren).toBe(1)
    expect(daoDucTot.isCompleted).toBe(false)

    // Student self evaluation note must be in selfEvaluationNote, NOT overwriting node.note (official guide)
    expect(tc101.selfEvaluationNote).toBe('abc')
    expect(tc101.note).toBe('SV năm nhất chỉ xét HK1 và HK2')
    expect(tc101.note).not.toBe('abc')
  })

  it('correctly sets criteria to uncompleted (Chưa đạt) and clears selfEvaluationNote when localCompleted is false', () => {
    // API previously had criteria 101 as completed
    const apiResponse = {
      academicYearId: 1,
      academicYear: '2026 - 2027',
      completedLeafCriteria: 1,
      totalLeafCriteria: 10,
      completedMainCriteria: 0,
      totalMainCriteria: 5,
      criteria: [
        {
          criteriaId: 10,
          name: 'Tiêu chuẩn 1',
          level: 1,
          isCompleted: false,
          children: [
            {
              criteriaId: 101,
              name: 'Điểm rèn luyện',
              note: 'SV năm nhất chỉ xét HK1 và HK2',
              level: 2,
              isCompleted: true,
              completionSource: 'MANUAL',
              selfEvaluationNote: 'abc',
              children: [],
            },
          ],
        },
      ],
    }

    // User marks 101 as Chưa đạt (false)
    const standards = ensureSv5tHierarchy(apiResponse as any, { 101: false })
    const criteria101 = standards[0].children[0]

    expect(criteria101.isCompleted).toBe(false)
    expect(criteria101.isSelfEvaluated).toBe(false)
    expect(criteria101.selfEvaluationNote).toBeNull()
    expect(criteria101.note).toBe('SV năm nhất chỉ xét HK1 và HK2')
  })
})

describe('accumulated event criteria', () => {
  it.each([
    [1, false],
    [2, true],
  ])('evaluates %s/2 donations without an optimistic override', (count, passed) => {
    const node = {
      criteriaId: 20,
      name: 'Hiến máu',
      level: 2,
      children: [],
      isCompleted: false,
      requiredOccurrences: 2,
      recordedOccurrences: count,
    }
    const response = {
      criteria: [
        {
          criteriaId: 17,
          name: 'Tình nguyện tốt',
          level: 1,
          requiredChildren: 1,
          children: [node],
        },
      ],
    }
    const result = ensureSv5tHierarchy(response as any, { 20: true }, {}, [
      { criteriaId: 20, eventId: 10, completionSource: 'EVENT_CHECKOUT' },
    ])
    expect(result[0].children[0].isCompleted).toBe(passed)
    expect(result[0].children[0].recordedOccurrences).toBe(count)
    expect(result[0].isCompleted).toBe(passed)
  })
})


describe('independent student self-evaluation', () => {
  it.each([1, 2])('does not self-evaluate when the system records %s donations', (count) => {
    const result = ensureSv5tHierarchy({ criteria: [{
      criteriaId: 403, name: 'Hiến máu', children: [], isCompleted: count === 2,
      requiredOccurrences: 2, recordedOccurrences: count, completionSource: 'EVENT_CHECKOUT',
    }] } as any, {}, {}, [{ criteriaId: 403, eventId: 23, completionSource: 'EVENT_CHECKOUT' }])
    expect(result[0].isCompleted).toBe(count === 2)
    expect(result[0].isSelfEvaluated).toBe(false)
    expect(result[0].selfEvaluationNote).toBeNull()
  })

  it.each([true, false])('preserves system completion when the manual evaluation is %s', (completed) => {
    const result = ensureSv5tHierarchy({ criteria: [{
      criteriaId: 403, name: 'Hiến máu', children: [], isCompleted: true,
      requiredOccurrences: 2, recordedOccurrences: 2, completionSource: 'EVENT_CHECKOUT',
    }] } as any, { 403: completed }, { 403: 'Minh chứng của tôi' }, [
      { criteriaId: 403, eventId: 23, completionSource: 'EVENT_CHECKOUT' },
      { criteriaId: 403, completionSource: 'MANUAL', note: 'Ghi chú cũ' },
    ])
    expect(result[0].isCompleted).toBe(true)
    expect(result[0].isSelfEvaluated).toBe(completed)
    expect(result[0].selfEvaluationNote).toBe(completed ? 'Minh chứng của tôi' : null)
  })

  it.each([false, true])('keeps both sources in the %s fallback tree', (fallback) => {
    const response = fallback ? undefined : { criteria: [{
      criteriaId: 101, name: 'Tiêu chí', children: [], isCompleted: true,
      completionSource: 'EVENT_CHECKOUT',
    }] } as any
    const result = ensureSv5tHierarchy(response, {}, {}, [
      { id: 2, criteriaId: 101, completionSource: 'EVENT_CHECKOUT', eventId: 23, note: 'Sự kiện' },
      { id: 1, criteriaId: 101, completionSource: 'MANUAL', note: 'Tự đánh giá riêng' },
    ])
    const leaf = fallback ? result[0].children[0] : result[0]
    expect(leaf.isSystemRecorded).toBe(true)
    expect(leaf.isSelfEvaluated).toBe(true)
    expect(leaf.selfEvaluationNote).toBe('Tự đánh giá riêng')
  })
})

it('counts two distinct event records for the same criterion while ignoring duplicate deliveries', () => {
  const result = ensureSv5tHierarchy({ criteria: [{ criteriaId: 20, name: 'Hiến máu', children: [], isCompleted: false, requiredOccurrences: 2, recordedOccurrences: 0 }] } as any, {}, {}, [
    { id: 1, criteriaId: 20, eventId: 51, completionSource: 'EVENT_CHECKOUT' },
    { id: 2, criteriaId: 20, eventId: 52, completionSource: 'EVENT_CHECKOUT' },
    { id: 3, criteriaId: 20, eventId: 52, completionSource: 'EVENT_CHECKOUT' },
  ])
  expect(result[0].recordedOccurrences).toBe(2)
  expect(result[0].isSystemRecorded).toBe(true)
  expect(result[0].isCompleted).toBe(true)
  expect(result[0].isSelfEvaluated).toBe(false)
})
