interface CriteriaNode {
  id: number | string
  name: string
  childrenOrder?: number | null
  parentId?: number | string | null
  children?: CriteriaNode[]
}

export function createSv5tLabelFormatter(
  criterias: CriteriaNode[],
  options?: { compact?: boolean; childOnly?: boolean; codeWithChild?: boolean; shortMajor?: boolean }
) {
  const nodes = new Map<string, { name: string; parentId: string | null; order?: number | null }>()
  const collect = (items: CriteriaNode[], parentId: string | null = null) => {
    items.forEach((item) => {
      nodes.set(String(item.id), {
        name: item.name,
        order: item.childrenOrder,
        parentId: item.parentId != null ? String(item.parentId) : parentId,
      })
      if (item.children) collect(item.children, String(item.id))
    })
  }
  collect(criterias)
  const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
  const names = new Map<string, string[]>()
  nodes.forEach((node, id) => {
    const key = normalizeName(node.name)
    names.set(key, [...(names.get(key) ?? []), id])
  })
  const labelForId = (id: string): string | null => {
    const path: string[] = []
    const orders: (number | null | undefined)[] = []
    const visited = new Set<string>()
    let current: string | null = id
    while (current) {
      if (visited.has(current)) return null
      visited.add(current)
      const node = nodes.get(current)
      if (!node) return null
      path.unshift(node.name)
      orders.unshift(node.order)
      current = node.parentId
    }
    const majorNames = [
      'đạo đức tốt',
      'học tập tốt',
      'thể lực tốt',
      'tình nguyện tốt',
      'hội nhập tốt',
    ]
    const majorIndex = path.findIndex((name) =>
      majorNames.includes(normalizeName(name).replace(/^tiêu chuẩn\s+/, ''))
    )
    const majorName = path[majorIndex >= 0 ? majorIndex : 0]
    const major = options?.shortMajor
      ? majorName.replace(/^tiêu chuẩn\s+(?:\d+\s*[:.]\s*)?/i, '')
      : majorName
    const child = path[path.length - 1]
    const codeParts = orders.slice(majorIndex >= 0 ? majorIndex : 0)
    const hasCode = codeParts.every((order) => Number.isInteger(order) && Number(order) > 0)
    if (options?.codeWithChild && hasCode) {
      const codedChild = `${codeParts.join('.')}. ${child}`
      return options.childOnly || majorName === child ? codedChild : `${major} (${codedChild})`
    }
    if (options?.childOnly) return child
    if (options?.compact && majorName !== child && hasCode) {
      return `${major} (${codeParts.join('.')})`
    }
    return majorName !== child ? `${major} (${child})` : major
  }

  return (name: string, criteriaId?: number | string): string => {
    if (criteriaId != null) {
      const label = labelForId(String(criteriaId))
      if (label) return label
    }
    // Older event responses contain only the child name. Use an exact match;
    // duplicate names must resolve to the same path before showing a parent.
    const matches = names.get(normalizeName(name)) ?? []
    const labels = matches.map(labelForId)
    return labels.length > 0 && labels.every((label) => label && label === labels[0])
      ? labels[0]!
      : name
  }
}
