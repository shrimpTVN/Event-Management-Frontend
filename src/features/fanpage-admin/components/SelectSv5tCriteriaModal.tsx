import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  X,
  Check,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Sv5tCriteriaItem } from '../types/fanpageAdmin.types'

export interface SelectedSv5tCriteria {
  id: number
  name: string
  code?: string
  standardName?: string
  note?: string | null
}

interface SelectSv5tCriteriaModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selected: SelectedSv5tCriteria | null) => void
  initialSelectedId?: number | null
  criterias: Sv5tCriteriaItem[]
}

interface CriteriaNode extends Sv5tCriteriaItem {
  code: string
  children: CriteriaNode[]
  isLeaf: boolean
  standardName: string
}

// Build hierarchical tree for SV5T
function buildSv5tTree(items: Sv5tCriteriaItem[]): CriteriaNode[] {
  const map = new Map<number, CriteriaNode>()
  const rootNode = items.find((i) => i.level === 0 || !i.parentId)
  const rootParentId = rootNode ? rootNode.id : null

  // 1. Group level 1 standards (parent is root or level === 1)
  const level1Items = items
    .filter((i) => i.level === 1 || (rootParentId && i.parentId === rootParentId))
    .sort((a, b) => (a.childrenOrder || a.id) - (b.childrenOrder || b.id))

  items.forEach((item) => {
    map.set(item.id, {
      ...item,
      code: '',
      children: [],
      isLeaf: true,
      standardName: '',
    })
  })

  // Assign standard names and parent-child relations
  items.forEach((item) => {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!
      parent.children.push(node)
      parent.isLeaf = false
    }
  })

  // Recursively assign codes (e.g., 1, 1.1, 1.3.2)
  const standards: CriteriaNode[] = []

  level1Items.forEach((l1, idx) => {
    const standardIndex = idx + 1
    const standardNode = map.get(l1.id)
    if (!standardNode) return

    standardNode.code = `TC ${standardIndex}`
    standardNode.standardName = standardNode.name

    const assignCodes = (node: CriteriaNode, prefix: string, currentStandard: string) => {
      node.standardName = currentStandard
      node.children.sort((a, b) => (a.childrenOrder || a.id) - (b.childrenOrder || b.id))

      node.children.forEach((child, cIdx) => {
        const childCode = `${prefix}.${cIdx + 1}`
        child.code = childCode
        assignCodes(child, childCode, currentStandard)
      })
    }

    assignCodes(standardNode, `${standardIndex}`, standardNode.name)
    standards.push(standardNode)
  })

  return standards
}

// Flatten tree for list rendering & search
interface FlatCriteriaRow {
  node: CriteriaNode
  code: string
  depth: number
  isLeaf: boolean
  standardName: string
}

function flattenSection(standard: CriteriaNode): FlatCriteriaRow[] {
  const rows: FlatCriteriaRow[] = []

  const traverse = (node: CriteriaNode, depth: number) => {
    const hasChildren = node.children && node.children.length > 0
    rows.push({
      node,
      code: node.code,
      depth,
      isLeaf: !hasChildren,
      standardName: node.standardName,
    })

    if (hasChildren) {
      node.children.forEach((child) => traverse(child, depth + 1))
    }
  }

  // Children of the standard (level 2 & level 3)
  standard.children.forEach((child) => traverse(child, 1))
  return rows
}

export const SelectSv5tCriteriaModal: React.FC<SelectSv5tCriteriaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedId,
  criterias,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStandardTab, setSelectedStandardTab] = useState<number | 'ALL'>('ALL')
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

  // Build tree
  const standards = useMemo(() => {
    return buildSv5tTree(criterias)
  }, [criterias])

  // Flat lookup map
  const criteriaMap = useMemo(() => {
    const map = new Map<number, CriteriaNode>()
    const scan = (nodes: CriteriaNode[]) => {
      nodes.forEach((n) => {
        map.set(n.id, n)
        if (n.children && n.children.length > 0) scan(n.children)
      })
    }
    scan(standards)
    return map
  }, [standards])

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedId(initialSelectedId || null)
      setSearchTerm('')
      setSelectedStandardTab('ALL')

      // Expand all level 1 standards by default, and expand branch holding initialSelectedId
      const initialExpanded: Record<number, boolean> = {}
      standards.forEach((std) => {
        initialExpanded[std.id] = true
        std.children.forEach((c) => {
          if (c.children.length > 0) {
            initialExpanded[c.id] = true
          }
        })
      })
      setExpandedGroups(initialExpanded)
    }
  }, [isOpen, initialSelectedId, standards])

  const toggleGroup = (id: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleSelect = (node: CriteriaNode) => {
    if (selectedId === node.id) {
      setSelectedId(null)
    } else {
      setSelectedId(node.id)
    }
  }

  const handleConfirm = () => {
    if (!selectedId) {
      onConfirm(null)
    } else {
      const item = criteriaMap.get(selectedId)
      if (item) {
        onConfirm({
          id: item.id,
          name: item.name,
          code: item.code,
          standardName: item.standardName,
          note: item.note,
        })
      } else {
        onConfirm(null)
      }
    }
    onClose()
  }

  const selectedNode = selectedId ? criteriaMap.get(selectedId) : null

  if (!isOpen) return null

  // Filter standards by active tab
  const visibleStandards =
    selectedStandardTab === 'ALL'
      ? standards
      : standards.filter((s) => s.id === selectedStandardTab)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-card border border-border flex flex-col max-h-[92vh] shadow-2xl text-left animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4 bg-[#F9FAFB]/80 dark:bg-background/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                Bảng danh mục Tiêu chí Sinh viên 5 Tốt (SV5T)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chọn tiêu chuẩn hoặc tiêu chí SV5T để sinh viên được ghi nhận hoàn thành khi tham gia sự kiện.
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

        {/* 2. Search & Standards Filter Tabs */}
        <div className="p-3.5 border-b border-border/80 bg-white dark:bg-card shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo mã (1.3, 3.2, 5.1...) hoặc từ khóa (tình nguyện, hiến máu, ngoại ngữ, tin học, thể lực...)"
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

          {/* Standard Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedStandardTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStandardTab === 'ALL'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Tất cả 5 Tiêu chuẩn
            </button>
            {standards.map((std, idx) => {
              const isSelected = selectedStandardTab === std.id
              const shortTitle = std.name.replace(/^Tiêu chuẩn\s+/i, '')
              return (
                <button
                  key={std.id}
                  type="button"
                  onClick={() => setSelectedStandardTab(std.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  TC {idx + 1}: {shortTitle}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Main Accordion Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-[#F9FAFB]/40 dark:bg-background/30">
          {visibleStandards.map((std, stdIdx) => {
            const rows = flattenSection(std)

            // Filter rows by search term
            const filteredRows = searchTerm.trim()
              ? rows.filter(
                  (r) =>
                    r.node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (r.node.note && r.node.note.toLowerCase().includes(searchTerm.toLowerCase()))
                )
              : rows

            if (searchTerm.trim() && filteredRows.length === 0) {
              return null
            }

            const hasSelectedInStandard = rows.some((r) => r.node.id === selectedId)

            return (
              <div
                key={std.id}
                className="border border-[#E5E7EB] dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card shadow-2xs transition-all"
              >
                {/* Standard Header */}
                <div className="w-full flex items-center justify-between px-3.5 sm:px-4 py-3 bg-[#EFF5FC] dark:bg-primary/10 border-b border-[#E5E7EB] dark:border-border select-none">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[11px] font-bold shrink-0">
                      Tiêu chuẩn {stdIdx + 1}
                    </span>
                    <span className="font-semibold text-xs sm:text-sm text-[#1B4B8A] dark:text-primary truncate font-heading">
                      {std.name}
                    </span>
                  </div>

                  {hasSelectedInStandard && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold inline-flex items-center gap-1 shadow-2xs shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>Đã chọn tiêu chí</span>
                    </span>
                  )}
                </div>

                {/* Table Header */}
                <div className="bg-[#F0F2F5]/80 dark:bg-muted/60 text-[11px] font-semibold text-muted-foreground flex items-center px-4 py-2 border-b border-[#E5E7EB] dark:border-border select-none">
                  <div className="w-8 shrink-0 text-center">Chọn</div>
                  <div className="w-20 shrink-0 text-center">Mã tiêu chí</div>
                  <div className="flex-1 min-w-[200px] px-2">Nội dung tiêu chí xét duyệt</div>
                  <div className="w-48 sm:w-64 shrink-0 px-2 text-left">Ghi chú / Hướng dẫn xét</div>
                </div>

                {/* Table Rows */}
                <div className="w-full flex flex-col divide-y divide-[#E5E7EB] dark:divide-border/60">
                  {filteredRows.map(({ node, code, depth, isLeaf }) => {
                    const isSelected = selectedId === node.id
                    const isGroupParent = !isLeaf
                    const isGroupExpanded = expandedGroups[node.id] !== false

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleSelect(node)}
                        className={`flex items-start px-4 py-2.5 text-xs transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-primary/5 dark:bg-primary/15'
                            : 'hover:bg-muted/50'
                        } ${depth > 1 ? 'bg-muted/15' : ''}`}
                      >
                        {/* Radio Checkbox */}
                        <div className="w-8 shrink-0 pt-0.5 flex justify-center">
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-white shadow-2xs ring-2 ring-primary/20'
                                : 'border-[#D1D5DB] dark:border-border hover:border-primary/60 bg-white dark:bg-card'
                            }`}
                          >
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Code Badge */}
                        <div className="w-20 shrink-0 pt-0.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {code}
                          </span>
                        </div>

                        {/* Criteria Title */}
                        <div className="flex-1 min-w-[200px] px-2 pr-4 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {isGroupParent && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleGroup(node.id)
                                }}
                                className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer rounded"
                              >
                                {isGroupExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                            <p
                              className={`leading-snug ${
                                isGroupParent
                                  ? 'font-bold text-foreground'
                                  : isSelected
                                  ? 'font-semibold text-primary'
                                  : 'font-medium text-foreground/90'
                              }`}
                            >
                              {node.name}
                            </p>
                          </div>
                        </div>

                        {/* Note / Guidance */}
                        <div className="w-48 sm:w-64 shrink-0 px-2 text-[11px] text-muted-foreground line-clamp-2">
                          {node.note || '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* 4. Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-[#F9FAFB]/80 dark:bg-background/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedNode ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold shrink-0">
                  {selectedNode.code}
                </span>
                <span className="text-xs font-semibold text-foreground truncate max-w-[320px]">
                  {selectedNode.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1 text-muted-foreground hover:text-rose-600 rounded cursor-pointer transition-colors"
                  title="Bỏ chọn"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Chưa chọn tiêu chí nào (Sự kiện sẽ không xét SV5T)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="text-xs h-9 font-semibold bg-primary hover:bg-primary/95 text-white shadow-2xs cursor-pointer"
            >
              <Check className="h-4 w-4 mr-1.5" />
              {selectedId ? 'Xác nhận chọn tiêu chí' : 'Xác nhận (Không xét SV5T)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

