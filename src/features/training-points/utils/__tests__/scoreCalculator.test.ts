import { describe, it, expect } from 'vitest'
import { computeCategoryScore, computeSectionCategoryScores } from '../scoreCalculator'
import type {
  PointCategoryNode,
  StudentSemesterPointGroupedTree,
} from '../../types/trainingPoints.types'

describe('computeCategoryScore', () => {
  it('correctly caps leaf node score to leaf maximum when rec + self exceeds max', () => {
    const leaf: PointCategoryNode = {
      id: 101,
      name: 'Tham gia hoạt động tuyên truyền',
      note: null,
      maximum: 6,
      level: 3,
      childrenOrder: 1,
      parentCategoryId: 10,
    }

    const recordedMap = new Map<number, number>([[101, 2]])
    const studentScores: Record<number, number> = { 101: 6 }

    // 2 + 6 = 8, but max is 6 -> should be 6
    const score = computeCategoryScore(leaf, recordedMap, studentScores)
    expect(score).toBe(6)
  })

  it('correctly sums leaf node score when rec + self is below max', () => {
    const leaf: PointCategoryNode = {
      id: 101,
      name: 'Tham gia hoạt động',
      note: null,
      maximum: 6,
      level: 3,
      childrenOrder: 1,
      parentCategoryId: 10,
    }

    const recordedMap = new Map<number, number>([[101, 2]])
    const studentScores: Record<number, number> = { 101: 2 }

    const score = computeCategoryScore(leaf, recordedMap, studentScores)
    expect(score).toBe(4)
  })

  it('correctly caps parent and root sections according to hierarchy caps', () => {
    // Root section III (max: 20) -> Sub-section III.c (max: 6) -> Leaf III.c.1 (max: 6)
    const tree: PointCategoryNode = {
      id: 3,
      name: 'Mục III',
      note: null,
      maximum: 20,
      level: 1,
      childrenOrder: 3,
      parentCategoryId: null,
      children: [
        {
          id: 33,
          name: 'Mục III.c',
          note: null,
          maximum: 6,
          level: 2,
          childrenOrder: 3,
          parentCategoryId: 3,
          children: [
            {
              id: 331,
              name: 'Mục III.c.1',
              note: null,
              maximum: 6,
              level: 3,
              childrenOrder: 1,
              parentCategoryId: 33,
            },
          ],
        },
      ],
    }

    const recordedMap = new Map<number, number>([[331, 2]])
    const studentScores: Record<number, number> = { 331: 6 }

    // Despite 2 + 6 = 8, leaf is capped at 6, sub-section capped at 6, section capped at 20 => total must be 6
    const score = computeCategoryScore(tree, recordedMap, studentScores)
    expect(score).toBe(6)
  })

  it('uses max of direct children when isMaxChild is true on PointCategoryNode', () => {
    const group: PointCategoryNode = {
      id: 311,
      name: 'Là lực lượng nòng cốt',
      note: null,
      maximum: 5,
      level: 2,
      childrenOrder: 1,
      parentCategoryId: 31,
      isMaxChild: true,
      children: [
        {
          id: 3111,
          name: 'Cấp Khoa/Chi đoàn',
          note: null,
          maximum: 3,
          level: 3,
          childrenOrder: 1,
          parentCategoryId: 311,
        },
        {
          id: 3112,
          name: 'Cấp ĐHCT',
          note: null,
          maximum: 5,
          level: 3,
          childrenOrder: 2,
          parentCategoryId: 311,
        },
      ],
    }
    expect(computeCategoryScore(group, new Map(), { 3111: 3, 3112: 5 })).toBe(5)
  })
})

describe('computeSectionCategoryScores', () => {
  it('computes max child for III.b.1 and aggregates self=13, total=16 for section III', () => {
    const sectionIII: StudentSemesterPointGroupedTree = {
      id: 3,
      name: 'III. Hoạt động CT-XH',
      note: null,
      maximum: 20,
      level: 0,
      parentCategoryId: null,
      isActive: true,
      childrenOrder: 3,
      isMaxChild: false,
      totalPoint: 19,
      systemPointRecord: 3,
      manualPointRecord: 16,
      items: [
        {
          id: 30,
          name: 'III.a',
          note: null,
          maximum: 12,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          isMaxChild: false,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 301,
          name: 'III.a.1',
          note: null,
          maximum: 12,
          level: 2,
          parentCategoryId: 30,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 31,
          name: 'III.b',
          note: null,
          maximum: 10,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 2,
          isLeaf: false,
          isMaxChild: false,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 311,
          name: 'III.b.1',
          note: null,
          maximum: 5,
          level: 2,
          parentCategoryId: 31,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          isMaxChild: true,
          totalPoint: 8,
          systemPointRecord: 0,
          manualPointRecord: 8,
        },
        {
          id: 3111,
          name: 'III.b.1.1',
          note: null,
          maximum: 3,
          level: 3,
          parentCategoryId: 311,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 3,
          systemPointRecord: 0,
          manualPointRecord: 3,
        },
        {
          id: 3112,
          name: 'III.b.1.2',
          note: null,
          maximum: 5,
          level: 3,
          parentCategoryId: 311,
          isActive: true,
          childrenOrder: 2,
          isLeaf: true,
          totalPoint: 5,
          systemPointRecord: 0,
          manualPointRecord: 5,
        },
        {
          id: 32,
          name: 'III.c',
          note: null,
          maximum: 6,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 3,
          isLeaf: false,
          totalPoint: 3,
          systemPointRecord: 3,
          manualPointRecord: 0,
        },
        {
          id: 321,
          name: 'III.c.1',
          note: null,
          maximum: 6,
          level: 2,
          parentCategoryId: 32,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 3,
          systemPointRecord: 3,
          manualPointRecord: 0,
        },
      ],
    }

    const scores = computeSectionCategoryScores(sectionIII)
    expect(scores.get(311)).toEqual({ recorded: 0, self: 5, total: 5 })
    expect(scores.get(31)).toEqual({ recorded: 0, self: 5, total: 5 })
    expect(scores.get(3)).toEqual({ recorded: 3, self: 13, total: 16 })

    // Local self-evaluation edit immediately overrides leaf without requiring mutation first
    const edited = computeSectionCategoryScores(sectionIII, new Map(), { 3112: 2 })
    expect(edited.get(311)).toEqual({ recorded: 0, self: 3, total: 3 })
    expect(edited.get(3)).toEqual({ recorded: 3, self: 11, total: 14 })
  })

  it('caps isMaxChild parent total at parent maximum', () => {
    const section: StudentSemesterPointGroupedTree = {
      id: 3,
      name: 'Mục III',
      note: null,
      maximum: 20,
      level: 0,
      parentCategoryId: null,
      isActive: true,
      childrenOrder: 3,
      totalPoint: 0,
      systemPointRecord: 0,
      manualPointRecord: 0,
      items: [
        {
          id: 311,
          name: 'Nhóm max',
          note: null,
          maximum: 4,
          level: 1,
          parentCategoryId: 3,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          isMaxChild: true,
          totalPoint: 0,
          systemPointRecord: 0,
          manualPointRecord: 0,
        },
        {
          id: 3112,
          name: 'Con vượt trần cha',
          note: null,
          maximum: 6,
          level: 2,
          parentCategoryId: 311,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 6,
          systemPointRecord: 0,
          manualPointRecord: 6,
        },
      ],
    }

    const scores = computeSectionCategoryScores(section)
    expect(scores.get(311)?.total).toBe(4)
    expect(scores.get(3)?.total).toBe(4)
  })

  it('caps recorded and self scores by each leaf and parent maximum (e.g. I.a.5 max 2)', () => {
    const sectionI: StudentSemesterPointGroupedTree = {
      id: 1,
      name: 'I. Học tập',
      note: null,
      maximum: 20,
      level: 0,
      parentCategoryId: null,
      isActive: true,
      childrenOrder: 1,
      isMaxChild: false,
      totalPoint: 22,
      systemPointRecord: 4,
      manualPointRecord: 18,
      items: [
        {
          id: 10,
          name: 'I.a',
          note: null,
          maximum: 20,
          level: 1,
          parentCategoryId: 1,
          isActive: true,
          childrenOrder: 1,
          isLeaf: false,
          isMaxChild: false,
          totalPoint: 10,
          systemPointRecord: 4,
          manualPointRecord: 6,
        },
        {
          id: 101,
          name: 'Đi học đầy đủ',
          note: null,
          maximum: 6,
          level: 2,
          parentCategoryId: 10,
          isActive: true,
          childrenOrder: 1,
          isLeaf: true,
          totalPoint: 6,
          systemPointRecord: 0,
          manualPointRecord: 6,
        },
        {
          id: 1045,
          name: 'Tham gia các CLB học thuật',
          note: null,
          maximum: 2,
          level: 2,
          parentCategoryId: 10,
          isActive: true,
          childrenOrder: 5,
          isLeaf: true,
          totalPoint: 4,
          systemPointRecord: 4,
          manualPointRecord: 0,
        },
      ],
    }

    const scores = computeSectionCategoryScores(sectionI)
    expect(scores.get(1045)).toEqual({ recorded: 2, self: 0, total: 2 })
    expect(scores.get(10)).toEqual({ recorded: 2, self: 6, total: 8 })
    expect(scores.get(1)).toEqual({ recorded: 2, self: 6, total: 8 })
  })
})

