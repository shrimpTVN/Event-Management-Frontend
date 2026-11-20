import React, { useState, useMemo, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PointCategoryItem } from '../types/fanpageAdmin.types'

export interface SelectedPointCategory {
  pointCategoryId: number
  pointCategoryName: string
  pointCategoryCode?: string
  point: number
  maximum?: number
}

interface SelectPointCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selected: SelectedPointCategory[]) => void
  initialSelected: SelectedPointCategory[]
  pointCategories: PointCategoryItem[]
}

interface PointCategoryNode extends PointCategoryItem {
  children: PointCategoryNode[]
}

interface FlatCategoryRow {
  node: PointCategoryNode
  code: string
  isLeaf: boolean
  depth: number
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V']

// Build hierarchical tree from flat categories list
function buildCategoryTree(items: PointCategoryItem[]): PointCategoryNode[] {
  const map = new Map<number, PointCategoryNode>()
  const roots: PointCategoryNode[] = []

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })

  items.forEach((item) => {
    const node = map.get(item.id)!
    if (item.parentCategoryId && map.has(item.parentCategoryId)) {
      map.get(item.parentCategoryId)!.children.push(node)
    } else if (item.level === 0 || item.parentCategoryId === null) {
      roots.push(node)
    }
  })

  const sortNodes = (nodes: PointCategoryNode[]) => {
    nodes.sort((a, b) => (a.childrenOrder || a.id) - (b.childrenOrder || b.id))
    nodes.forEach((n) => {
      if (n.children.length > 0) {
        sortNodes(n.children)
      }
    })
  }

  sortNodes(roots)
  return roots
}

// Flatten a root node's children into rows with accurate codes (e.g. I.a, I.a.1, I.a.2.1)
function getSectionRows(rootNode: PointCategoryNode, rootIndex: number): FlatCategoryRow[] {
  const rows: FlatCategoryRow[] = []
  const sectionRoman = ROMAN_NUMERALS[rootIndex] || String(rootIndex + 1)

  function traverse(node: PointCategoryNode, parentCode: string, depth: number) {
    const hasChildren = node.children && node.children.length > 0
    const isLeaf = !hasChildren

    rows.push({
      node,
      code: parentCode,
      isLeaf,
      depth,
    })

    if (hasChildren) {
      node.children.forEach((child, idx) => {
        const childCode =
          depth === 1
            ? `${parentCode}.${String.fromCharCode(97 + idx)}`
            : `${parentCode}.${idx + 1}`
        traverse(child, childCode, depth + 1)
      })
    }
  }

  if (rootNode.children) {
    rootNode.children.forEach((child, idx) => {
      const char = String.fromCharCode(97 + idx)
      traverse(child, `${sectionRoman}.${char}`, 2)
    })
  }

  return rows
}

export const SelectPointCategoriesModal: React.FC<SelectPointCategoriesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelected,
  pointCategories,
}) => {
  const [selectedMap, setSelectedMap] = useState<Map<number, SelectedPointCategory>>(new Map())
  const [searchTerm, setSearchTerm] = useState('')
  // Track expanded state for each root Điều section (id -> boolean)
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})

  // Build root trees (Điều I - V)
  const categoryTree = useMemo(() => {
    return buildCategoryTree(pointCategories)
  }, [pointCategories])

  // Lookup map: categoryId -> exact criteria code (identical to student training points table)
  const categoryCodeMap = useMemo(() => {
    const map = new Map<number, string>()
    categoryTree.forEach((root, rootIndex) => {
      const rows = getSectionRows(root, rootIndex)
      rows.forEach((r) => {
        map.set(r.node.id, r.code)
      })
    })
    return map
  }, [categoryTree])

  // Sync initialSelected when modal opens and expand the first section (or sections containing selected items)
  useEffect(() => {
    if (isOpen) {
      const map = new Map<number, SelectedPointCategory>()
      const initialExpanded: Record<number, boolean> = {}

      initialSelected.forEach((item) => {
        const accurateCode =
          categoryCodeMap.get(item.pointCategoryId) || item.pointCategoryCode || ''
        map.set(item.pointCategoryId, {
          ...item,
          pointCategoryCode: accurateCode,
        })
      })

      // Auto-expand sections that have selected items or default to the first section
      categoryTree.forEach((root, idx) => {
        const hasSelected = Array.from(map.keys()).some((catId) => {
          const findInTree = (node: PointCategoryNode): boolean => {
            if (node.id === catId) return true
            return node.children.some(findInTree)
          }
          return findInTree(root)
        })

        if (hasSelected || idx === 0) {
          initialExpanded[root.id] = true
        }
      })

      setSelectedMap(map)
      setExpandedSections(initialExpanded)
      setSearchTerm('')
    }
  }, [isOpen, initialSelected, categoryTree, categoryCodeMap])

  // Toggle accordion expand/collapse
  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // Toggle selection on a leaf row
  const handleToggleRow = (node: PointCategoryNode, code: string) => {
    setSelectedMap((prev) => {
      const next = new Map(prev)
      if (next.has(node.id)) {
        next.delete(node.id)
      } else {
        const defaultPt = node.maximum ? Math.min(node.maximum, 5) : 5
        next.set(node.id, {
          pointCategoryId: node.id,
          pointCategoryName: node.name,
          pointCategoryCode: code,
          point: defaultPt,
          maximum: node.maximum,
        })
      }
      return next
    })
  }

  // Update points for an already selected category
  const handleUpdatePoints = (catId: number, points: number) => {
    setSelectedMap((prev) => {
      const next = new Map(prev)
      const current = next.get(catId)
      if (current) {
        const max =
          pointCategories.find((node) => node.id === catId)?.maximum || current.maximum || 25
        const validPt = Math.max(1, Math.min(max, Number.isFinite(points) ? Math.trunc(points) : 1))
        next.set(catId, { ...current, point: validPt })
      }
      return next
    })
  }

  // Clear all selections
  const handleClearAll = () => {
    setSelectedMap(new Map())
  }

  // Confirm selection and apply to parent form
  const handleConfirm = () => {
    const list = Array.from(selectedMap.values())
    onConfirm(list)
    onClose()
  }

  // Summary counts
  const totalCount = selectedMap.size
  const totalPoints = useMemo(() => {
    let sum = 0
    selectedMap.forEach((item) => {
      sum += item.point || 0
    })
    return sum
  }, [selectedMap])

  // Filter check for search term
  const matchesSearch = (text: string, term: string) => {
    return text.toLowerCase().includes(term.toLowerCase())
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background text-left shadow-xl">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="font-k2d text-lg font-semibold text-foreground">
                Điểm rèn luyện
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Chọn các mục rèn luyện và số điểm cộng cho sự kiện.
              </Dialog.Description>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Đóng" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="point-category-search">Tìm mục rèn luyện</Label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    id="point-category-search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tên hoặc mã tiêu chí"
                    className="pl-9"
                  />
                </div>
              </div>
              {!categoryTree.length && (
                <p role="status" className="text-sm text-muted-foreground">
                  Chưa có danh mục điểm rèn luyện.
                </p>
              )}
              {categoryTree.map((root, rootIndex) => {
                const rows = getSectionRows(root, rootIndex)
                const term = searchTerm.trim()
                const filteredRows =
                  term && !matchesSearch(root.name, term)
                    ? rows.filter(
                        (row) =>
                          matchesSearch(row.node.name, term) ||
                          matchesSearch(row.code, term) ||
                          matchesSearch(row.node.note || '', term)
                      )
                    : rows
                if (term && !filteredRows.length) return null
                const open = !!term || !!expandedSections[root.id]
                const sectionSelectedCount = rows.filter((row) =>
                  selectedMap.has(row.node.id)
                ).length
                return (
                  <div key={root.id} className="overflow-hidden rounded-xl border border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      aria-expanded={open}
                      className="h-auto w-full justify-between gap-3 whitespace-normal rounded-none bg-card p-4 text-left"
                      onClick={() => toggleSection(root.id)}
                    >
                      <span>
                        {root.name}
                        {sectionSelectedCount > 0 && (
                          <span className="ml-2 text-xs text-primary">
                            {sectionSelectedCount} đã chọn
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 ${open ? 'rotate-180' : ''}`}
                      />
                    </Button>
                    {open && (
                      <div className="grid gap-1 border-t border-border p-2">
                        {filteredRows.map(({ node, code, isLeaf }) => {
                          if (!isLeaf)
                            return (
                              <div
                                key={node.id}
                                className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-2 text-xs"
                              >
                                <p className="font-medium text-foreground">
                                  {code}. {node.name}
                                </p>
                                {node.note && <p className="text-muted-foreground">{node.note}</p>}
                              </div>
                            )
                          const selectedItem = selectedMap.get(node.id)
                          const checked = !!selectedItem
                          const maxPoint = node.maximum || 25
                          return (
                            <div
                              key={node.id}
                              className={`flex flex-col gap-2 rounded-lg sm:flex-row sm:items-start ${checked ? 'bg-brand-subtle' : ''}`}
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                role="checkbox"
                                aria-checked={checked}
                                onClick={() => handleToggleRow(node, code)}
                                className={`h-auto min-w-0 flex-1 items-start justify-start gap-3 whitespace-normal p-3 text-left font-normal ${checked ? 'text-brand-subtle-foreground' : ''}`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                                >
                                  {checked && <Check className="h-3 w-3" />}
                                </span>
                                <span className="flex min-w-0 flex-col gap-1">
                                  <span className="text-sm">
                                    {code}. {node.name}
                                  </span>
                                  {node.note && !node.note.startsWith('Mã tiêu chí') && (
                                    <span className="text-xs text-muted-foreground">
                                      {node.note}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    Tối đa {maxPoint} điểm
                                  </span>
                                </span>
                              </Button>
                              {checked && (
                                <div className="flex shrink-0 items-center gap-2 pb-3 pl-10 pr-3 sm:flex-col sm:items-start sm:gap-1 sm:py-3 sm:pl-0">
                                  <Label
                                    htmlFor={`event-points-${node.id}`}
                                    className="text-xs text-muted-foreground"
                                  >
                                    Điểm cộng
                                  </Label>
                                  <Input
                                    id={`event-points-${node.id}`}
                                    aria-label={`Điểm cộng cho ${code}`}
                                    type="number"
                                    min={1}
                                    max={maxPoint}
                                    step={1}
                                    value={selectedItem.point}
                                    onChange={(event) =>
                                      handleUpdatePoints(node.id, Number(event.target.value))
                                    }
                                    className="h-8 w-20 bg-background text-center text-xs font-medium text-primary"
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {!!searchTerm.trim() &&
                !!categoryTree.length &&
                !categoryTree.some(
                  (root, index) =>
                    matchesSearch(root.name, searchTerm.trim()) ||
                    getSectionRows(root, index).some((row) =>
                      matchesSearch(
                        `${row.code} ${row.node.name} ${row.node.note || ''}`,
                        searchTerm.trim()
                      )
                    )
                ) && (
                  <p role="status" className="text-sm text-muted-foreground">
                    Không tìm thấy mục phù hợp.
                  </p>
                )}
              {totalCount > 0 && (
                <div className="grid gap-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">Đã chọn ({totalCount})</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-muted-foreground"
                    >
                      Bỏ chọn tất cả
                    </Button>
                  </div>
                  {Array.from(selectedMap.values()).map((item) => (
                    <div
                      key={item.pointCategoryId}
                      className="flex items-start justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span className="min-w-0 py-2">
                        {item.pointCategoryCode}. {item.pointCategoryName}{' '}
                        <span className="font-medium text-primary">+{item.point} điểm</span>
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Bỏ chọn ${item.pointCategoryName}`}
                        onClick={() =>
                          setSelectedMap((current) => {
                            const next = new Map(current)
                            next.delete(item.pointCategoryId)
                            return next
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Tổng điểm cộng: <span className="font-semibold text-primary">+{totalPoints} ĐRL</span>
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="button" onClick={handleConfirm}>
                Xác nhận{totalCount > 0 ? ` (${totalCount})` : ''}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
