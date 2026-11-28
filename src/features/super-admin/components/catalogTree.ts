import { resolveApiErrorMessage } from '@/shared/utils/apiError'

export function flattenTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.flatMap((item) => [item, ...flattenTree(item.children ?? [])])
}

export function catalogError(error: unknown): string {
  return resolveApiErrorMessage(error, 'Không thể lưu thay đổi. Vui lòng thử lại.')
}
