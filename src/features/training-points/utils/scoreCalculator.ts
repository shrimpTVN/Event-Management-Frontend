import type { PointCategoryNode } from '../types/trainingPoints.types'

/**
 * Tính tổng điểm rèn luyện của một mục / tiêu chí theo cấu trúc cây phân cấp:
 * - Với node lá (không có con): điểm = min(node.maximum, ghi nhận + tự chấm) (nếu maximum > 0)
 * - Với node cha: điểm = min(node.maximum, tổng điểm các node con) (nếu maximum > 0)
 */
export function computeCategoryScore(
  node: PointCategoryNode,
  recordedMap: Map<number, number>,
  studentScores: Record<number, number>
): number {
  if (!node.children || node.children.length === 0) {
    const rec = recordedMap.get(node.id) || 0
    const self = studentScores[node.id] || 0
    const total = rec + self
    return node.maximum > 0 ? Math.min(node.maximum, total) : total
  }

  const childrenSum = node.children.reduce((acc, child) => {
    return acc + computeCategoryScore(child, recordedMap, studentScores)
  }, 0)

  return node.maximum > 0 ? Math.min(node.maximum, childrenSum) : childrenSum
}

