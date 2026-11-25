import type {
  PointCategoryFlattenedItem,
  PointCategoryGroupedTree,
  PointCategoryNode,
  StudentSemesterPointFlattenedItem,
  StudentSemesterPointGroupedTree,
} from '../types/trainingPoints.types'

export interface CategoryScoreSummary {
  recorded: number
  self: number
  total: number
}

type CalculableSection =
  | PointCategoryNode
  | StudentSemesterPointGroupedTree
  | PointCategoryGroupedTree

interface CalculableNode {
  id: number
  maximum: number
  parentCategoryId?: number | null
  isMaxChild?: boolean
  isLeaf?: boolean
  systemPointRecord?: number
  manualPointRecord?: number
  totalPoint?: number
  children?: CalculableNode[]
  items?: (StudentSemesterPointFlattenedItem | PointCategoryFlattenedItem)[]
}

/** Giới hạn điểm được tính; không thay đổi điểm ghi nhận và lịch sử giao dịch. */
export function capTrainingPoints(value: number, maximum: number): number {
  const score = Number.isFinite(value) ? value : 0
  const limit = Number.isFinite(maximum) ? Math.max(0, maximum) : 0
  return Math.min(limit, Math.max(0, score))
}

function capIfBounded(total: number, maximum: number): number {
  return maximum > 0 ? capTrainingPoints(total, maximum) : Math.max(0, total)
}

/**
 * Tính điểm ghi nhận, tự đánh giá và tổng kết (có xét `isMaxChild` và trần `maximum`)
 * cho toàn bộ node trong một mục lớn (cả dạng `items` trải phẳng lẫn cây `children`).
 */
export function computeSectionCategoryScores(
  section: CalculableSection,
  recordedMap: Map<number, number> = new Map(),
  studentScores: Record<number, number> = {}
): Map<number, CategoryScoreSummary> {
  const nodeById = new Map<number, CalculableNode>()
  const childrenByParent = new Map<number, CalculableNode[]>()
  const root = section as CalculableNode
  nodeById.set(root.id, root)

  if (Array.isArray(root.items) && root.items.length > 0) {
    root.items.forEach((item) => {
      nodeById.set(item.id, item)
      const parentId = item.parentCategoryId ?? root.id
      const list = childrenByParent.get(parentId) ?? []
      list.push(item)
      childrenByParent.set(parentId, list)
    })
  } else {
    const collectChildren = (node: CalculableNode) => {
      nodeById.set(node.id, node)
      if (!Array.isArray(node.children) || node.children.length === 0) return
      childrenByParent.set(node.id, node.children)
      node.children.forEach(collectChildren)
    }
    collectChildren(root)
  }

  const results = new Map<number, CategoryScoreSummary>()
  const visiting = new Set<number>()

  const evaluate = (nodeId: number): CategoryScoreSummary => {
    const cached = results.get(nodeId)
    if (cached) return cached
    if (visiting.has(nodeId)) return { recorded: 0, self: 0, total: 0 }

    visiting.add(nodeId)
    const node = nodeById.get(nodeId)
    if (!node) {
      visiting.delete(nodeId)
      return { recorded: 0, self: 0, total: 0 }
    }

    const children = childrenByParent.get(nodeId) ?? []
    let summary: CategoryScoreSummary

    if (children.length === 0) {
      const rawRecorded =
        node.systemPointRecord !== undefined
          ? node.systemPointRecord
          : recordedMap.get(node.id) || 0
      const rawSelf =
        studentScores[node.id] !== undefined
          ? studentScores[node.id]
          : node.manualPointRecord || 0
      const recorded = capIfBounded(rawRecorded, node.maximum)
      const self = capIfBounded(rawSelf, node.maximum)
      summary = {
        recorded,
        self,
        total: capIfBounded(recorded + self, node.maximum),
      }
    } else if (node.isMaxChild) {
      let best: CategoryScoreSummary = { recorded: 0, self: 0, total: 0 }
      let hasBest = false
      for (const child of children) {
        const childScore = evaluate(child.id)
        if (
          !hasBest ||
          childScore.total > best.total ||
          (childScore.total === best.total && childScore.self > best.self)
        ) {
          best = childScore
          hasBest = true
        }
      }
      summary = {
        recorded: capIfBounded(best.recorded, node.maximum),
        self: capIfBounded(best.self, node.maximum),
        total: capIfBounded(best.total, node.maximum),
      }
    } else {
      let rawRecorded = 0
      let rawSelf = 0
      let rawTotal = 0
      for (const child of children) {
        const childScore = evaluate(child.id)
        rawRecorded += childScore.recorded
        rawSelf += childScore.self
        rawTotal += childScore.total
      }
      summary = {
        recorded: capIfBounded(rawRecorded, node.maximum),
        self: capIfBounded(rawSelf, node.maximum),
        total: capIfBounded(rawTotal, node.maximum),
      }
    }

    visiting.delete(nodeId)
    results.set(nodeId, summary)
    return summary
  }

  evaluate(root.id)
  return results
}

/**
 * Tính tổng điểm rèn luyện của một mục / tiêu chí theo cấu trúc cây phân cấp:
 * - Với node lá: điểm = min(node.maximum, ghi nhận + tự chấm) (nếu maximum > 0)
 * - Với node cha có `isMaxChild = true`: lấy điểm cao nhất của các node con trực tiếp (chặn theo `maximum`)
 * - Với node cha thông thường: cộng tổng điểm các node con trực tiếp (chặn theo `maximum`)
 */
export function computeCategoryScore(
  node: PointCategoryNode,
  recordedMap: Map<number, number>,
  studentScores: Record<number, number>
): number {
  return computeSectionCategoryScores(node, recordedMap, studentScores).get(node.id)?.total ?? 0
}
