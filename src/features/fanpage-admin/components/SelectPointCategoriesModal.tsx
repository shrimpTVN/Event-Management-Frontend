import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  X,
  Check,
  Award,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
        const accurateCode = categoryCodeMap.get(item.pointCategoryId) || item.pointCategoryCode || ''
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
        const max = current.maximum || 25
        const validPt = Math.max(1, Math.min(max, points))
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-card border border-border flex flex-col max-h-[92vh] shadow-2xl text-left animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4 bg-[#F9FAFB]/80 dark:bg-background/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                Bảng danh mục Điểm rèn luyện (ĐRL)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhấp vào từng Mục quy định (Điều I - V) để mở chi tiết, tích chọn tiêu chí và điều chỉnh số điểm cộng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Search Toolbar */}
        <div className="p-3.5 border-b border-border/80 bg-white dark:bg-card shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo mã tiêu chí hoặc từ khóa (ví dụ: I.a, I.a.2, nghiên cứu, hiến máu, thể thao...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-lg border-border"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Main Accordion Sections Container (Student Training Table Style) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-[#F9FAFB]/40 dark:bg-background/30">
          {categoryTree.map((root, rootIndex) => {
            const isExpanded = searchTerm.trim().length > 0 ? true : Boolean(expandedSections[root.id])
            const rows = getSectionRows(root, rootIndex)

            // Filter rows if search term is active
            const filteredRows = searchTerm.trim()
              ? rows.filter(
                  (r) =>
                    matchesSearch(r.node.name, searchTerm) ||
                    matchesSearch(r.code, searchTerm) ||
                    (r.node.note && matchesSearch(r.node.note, searchTerm))
                )
              : rows

            // Don't render section if searching and no items match
            if (searchTerm.trim() && filteredRows.length === 0) {
              return null
            }

            // Calculate selected count and points under this section
            const sectionSelectedItems = Array.from(selectedMap.values()).filter((item) =>
              rows.some((r) => r.node.id === item.pointCategoryId)
            )
            const sectionSelectedCount = sectionSelectedItems.length
            const sectionSelectedPoints = sectionSelectedItems.reduce((sum, item) => sum + item.point, 0)

            return (
              <div
                key={root.id}
                className="border border-[#E5E7EB] dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card shadow-2xs transition-all"
              >
                {/* Section Accordion Header Bar (Mục I, II, III...) */}
                <button
                  type="button"
                  onClick={() => toggleSection(root.id)}
                  className={`w-full flex items-center justify-between px-3.5 sm:px-4 py-3 transition-colors cursor-pointer text-left select-none ${
                    isExpanded
                      ? 'bg-[#EFF5FC] dark:bg-primary/10 border-b border-[#E5E7EB] dark:border-border'
                      : 'bg-[#F9FAFB] dark:bg-card hover:bg-[#EFF5FC]/60 dark:hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[#1B4B8A] dark:text-primary shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#1B4B8A] dark:text-primary shrink-0" />
                    )}
                    <span className="font-semibold text-xs sm:text-sm text-[#1B4B8A] dark:text-primary truncate font-heading">
                      {root.name}
                    </span>
                  </div>

                  {/* Right: Section Maximum Badge & Selected Counter */}
                  <div className="flex items-center gap-2 shrink-0">
                    {sectionSelectedCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Đã chọn {sectionSelectedCount} mục (+{sectionSelectedPoints}đ)</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-white dark:bg-muted/40 border border-border/60">
                        Tối đa {root.maximum} điểm
                      </span>
                    )}
                  </div>
                </button>

                {/* Section Content Table */}
                {isExpanded && (
                  <div className="w-full flex flex-col divide-y divide-[#E5E7EB] dark:divide-border/60">
                    {/* Table Column Headers */}
                    <div className="bg-[#F0F2F5]/80 dark:bg-muted/60 text-[11px] font-semibold text-muted-foreground flex items-center px-4 py-2 border-b border-[#E5E7EB] dark:border-border select-none">
                      <div className="w-8 shrink-0 text-center">Chọn</div>
                      <div className="w-20 shrink-0 text-center">Mã tiêu chí</div>
                      <div className="flex-1 min-w-[200px] px-2">Nội dung tiêu chí rèn luyện</div>
                      <div className="w-24 shrink-0 text-center">Mức tối đa</div>
                      <div className="w-36 shrink-0 text-center">Điểm cộng sự kiện</div>
                    </div>

                    {/* Table Rows */}
                    {filteredRows.map(({ node, code, isLeaf, depth }) => {
                      const isChecked = selectedMap.has(node.id)
                      const selectedItem = selectedMap.get(node.id)

                      // Group header row (sub-category header e.g. "a. Trách nhiệm...")
                      if (!isLeaf) {
                        return (
                          <div
                            key={node.id}
                            className="bg-[#F9FAFB] dark:bg-muted/40 px-4 py-2.5 flex items-center text-xs font-semibold text-foreground select-none"
                          >
                            <span className="w-8 shrink-0" />
                            <span className="w-20 shrink-0 text-center font-bold text-primary text-[11px]">
                              {code}
                            </span>
                            <div className="flex-1 px-2 font-semibold text-foreground">
                              {node.name}
                              {node.note && (
                                <span className="text-[11px] font-normal text-muted-foreground block mt-0.5">
                                  {node.note}
                                </span>
                              )}
                            </div>
                            <div className="w-24 shrink-0 text-center text-[11px] text-muted-foreground font-medium">
                              {node.maximum ? `Tối đa ${node.maximum}đ` : '—'}
                            </div>
                            <div className="w-36 shrink-0" />
                          </div>
                        )
                      }

                      // Actionable Leaf Criterion Row
                      const indentPadding = depth >= 3 ? 'pl-6' : depth >= 2 ? 'pl-2' : ''
                      const maxPoint = node.maximum || 25

                      return (
                        <div
                          key={node.id}
                          onClick={() => handleToggleRow(node, code)}
                          className={`flex items-center px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10'
                              : 'bg-white dark:bg-card hover:bg-muted/20'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="w-8 shrink-0 flex items-center justify-center">
                            <div
                              className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-primary border-primary text-white'
                                  : 'border-[#D1D5DB] dark:border-border bg-white dark:bg-card'
                              }`}
                            >
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Criterion Code */}
                          <div className="w-20 shrink-0 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] inline-block font-mono">
                              {code}
                            </span>
                          </div>

                          {/* Criterion Name & Note */}
                          <div className={`flex-1 min-w-[200px] px-2 pr-4 ${indentPadding} space-y-0.5`}>
                            <p className={`leading-relaxed ${isChecked ? 'font-semibold text-foreground' : 'text-foreground/90'}`}>
                              {node.name}
                            </p>
                            {node.note && !node.note.startsWith('Mã tiêu chí') && (
                              <p className="text-[11px] text-muted-foreground italic leading-snug">
                                {node.note}
                              </p>
                            )}
                          </div>

                          {/* Maximum points allowed */}
                          <div className="w-24 shrink-0 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {node.maximum ? `${node.maximum}đ` : '—'}
                          </div>

                          {/* Event Points Input when checked */}
                          <div
                            className="w-36 shrink-0 flex items-center justify-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isChecked ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={1}
                                  max={maxPoint}
                                  value={selectedItem?.point ?? 5}
                                  onChange={(e) => handleUpdatePoints(node.id, Number(e.target.value))}
                                  className="w-16 h-8 text-center font-bold text-xs text-primary border-primary/50 shadow-2xs"
                                />
                                <span className="text-xs font-bold text-primary">ĐRL</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/60 italic">
                                Chưa chọn
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 4. Sticky Footer: Summary & Action Buttons */}
        <div className="p-4 border-t border-border bg-[#F9FAFB] dark:bg-background/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Đã chọn: <strong className="text-foreground">{totalCount}</strong> mục
            </span>
            <span className="text-border">•</span>
            <span className="text-muted-foreground">
              Tổng cộng: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+{totalPoints}</strong> ĐRL
            </span>
            {totalCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-muted-foreground hover:text-destructive underline cursor-pointer ml-1 inline-flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Bỏ chọn tất cả</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 rounded-lg cursor-pointer text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-white gap-1.5 cursor-pointer shadow-xs font-semibold text-xs"
            >
              <Check className="h-4 w-4" />
              <span>Xác nhận & Áp dụng ({totalCount})</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
