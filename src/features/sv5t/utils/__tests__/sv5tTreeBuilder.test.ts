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
