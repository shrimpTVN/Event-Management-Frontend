interface PointCategoryNode {
  id: number
  parentCategoryId?: number | null
  childrenOrder?: number
  children?: PointCategoryNode[]
}

export function buildPointCategoryCodes(items: PointCategoryNode[]) {
  const nodes = new Map<
    number,
    { id: number; parentId: number | null; order: number; children: number[] }
  >()
  const collect = (list: PointCategoryNode[], parentId: number | null = null) => {
    list.forEach((item) => {
      nodes.set(item.id, {
        id: item.id,
        parentId: item.parentCategoryId ?? parentId,
        order: item.childrenOrder ?? item.id,
        children: [],
      })
      if (item.children) collect(item.children, item.id)
    })
  }
  collect(items)
  const roots: number[] = []
  nodes.forEach((node) => {
    const parent = node.parentId != null ? nodes.get(node.parentId) : undefined
    if (parent) parent.children.push(node.id)
    else roots.push(node.id)
  })
  const codes = new Map<number, string>()
  const visit = (ids: number[], parentCode = '', depth = 0) => {
    ids.sort((a, b) => nodes.get(a)!.order - nodes.get(b)!.order)
    ids.forEach((id, index) => {
      const suffix =
        depth === 0
          ? (['I', 'II', 'III', 'IV', 'V'][index] ?? String(index + 1))
          : depth === 1
            ? String.fromCharCode(97 + index)
            : String(index + 1)
      const code = parentCode ? `${parentCode}.${suffix}` : suffix
      codes.set(id, code)
      visit(nodes.get(id)!.children, code, depth + 1)
    })
  }
  visit(roots)
  return codes
}
