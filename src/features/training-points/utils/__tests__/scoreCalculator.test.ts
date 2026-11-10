import { describe, it, expect } from 'vitest'
import { computeCategoryScore } from '../scoreCalculator'
import type { PointCategoryNode } from '../../types/trainingPoints.types'

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
})

