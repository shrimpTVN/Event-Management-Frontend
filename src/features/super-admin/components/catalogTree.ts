export function flattenTree<T extends { children?: T[] }>(items: T[]): T[] {
  return items.flatMap((item) => [item, ...flattenTree(item.children ?? [])])
}

export function catalogError(error: unknown): string {
  const response = error as { response?: { data?: { message?: string } } }
  return response?.response?.data?.message || 'Không thể lưu thay đổi. Vui lòng thử lại.'
}
