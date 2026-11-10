import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ChevronsUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Sv5tCriteriaItem } from '../types/fanpageAdmin.types'
import { SV5T_CRITERIA_GUIDES, CANONICAL_SV5T_STANDARDS } from '@/features/sv5t/utils/sv5tTreeBuilder'

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

export interface CriteriaTreeNode {
  id: number
  name: string
  note?: string | null
  code: string
  standardId: number
  standardName: string
  isLeaf: boolean
  isGroupBanner?: boolean
  children: CriteriaTreeNode[]
}

export interface FlatCriteriaRow {
  node: CriteriaTreeNode
  code: string
  isLeaf: boolean
  isGroupBanner?: boolean
  standardName: string
  depth: number
}

/**
 * Robust tree builder that converts backend criteria (nested or flat) into a normalized 5-standard tree.
 * If input list is empty or missing, falls back to CANONICAL_SV5T_STANDARDS.
 */
function buildSv5tStandardTree(inputCriterias: Sv5tCriteriaItem[]): CriteriaTreeNode[] {
  // If backend returned nested items with children
  const hasValidNestedItems =
    Array.isArray(inputCriterias) &&
    inputCriterias.length > 0 &&
    inputCriterias.some((c) => c.children && c.children.length > 0)

  // Use provided criterias or fallback to canonical data
  const sourceItems: any[] = hasValidNestedItems
    ? inputCriterias
    : inputCriterias && inputCriterias.length >= 5
    ? inputCriterias
    : CANONICAL_SV5T_STANDARDS

  // Standard index counter (1 to 5)
  const standards: CriteriaTreeNode[] = []

  sourceItems.forEach((stdItem: any, stdIdx: number) => {
    const stdIndex = stdIdx + 1
    const stdCode = `TC ${stdIndex}`
    const stdName = stdItem.name.replace(/^Tiêu chuẩn\s*\d*:\s*/i, '').trim()
    const fullStdName = `Tiêu chuẩn ${stdIndex}: ${stdName}`

    const stdNode: CriteriaTreeNode = {
      id: stdItem.id || stdItem.criteriaId || stdIndex * 10,
      name: fullStdName,
      note: stdItem.note || SV5T_CRITERIA_GUIDES[stdItem.id || stdItem.criteriaId] || null,
      code: stdCode,
      standardId: stdItem.id || stdItem.criteriaId || stdIndex * 10,
      standardName: fullStdName,
      isLeaf: false,
      children: [],
    }

    const rawChildren: any[] = stdItem.children || []

    rawChildren.forEach((childItem: any, cIdx: number) => {
      const childCode = `${stdIndex}.${cIdx + 1}`
      const hasSubChildren = Array.isArray(childItem.children) && childItem.children.length > 0

      const childNode: CriteriaTreeNode = {
        id: childItem.id || childItem.criteriaId,
        name: childItem.name,
        note:
          childItem.note ||
          SV5T_CRITERIA_GUIDES[childItem.id || childItem.criteriaId] ||
          null,
        code: childCode,
        standardId: stdNode.id,
        standardName: fullStdName,
        isLeaf: !hasSubChildren,
        isGroupBanner: hasSubChildren,
        children: [],
      }

      if (hasSubChildren) {
        childItem.children.forEach((subItem: any, sIdx: number) => {
          const subCode = `${childCode}.${sIdx + 1}`
          const subNode: CriteriaTreeNode = {
            id: subItem.id || subItem.criteriaId,
            name: subItem.name,
            note:
              subItem.note ||
              SV5T_CRITERIA_GUIDES[subItem.id || subItem.criteriaId] ||
              null,
            code: subCode,
            standardId: stdNode.id,
            standardName: fullStdName,
            isLeaf: true,
            isGroupBanner: false,
            children: [],
          }
          childNode.children.push(subNode)
        })
      }

      stdNode.children.push(childNode)
    })

    standards.push(stdNode)
  })

  return standards
}

/**
 * Flattens a standard's children into table rows (group banners + leaf criteria).
 */
function getStandardRows(standard: CriteriaTreeNode): FlatCriteriaRow[] {
  const rows: FlatCriteriaRow[] = []

  standard.children.forEach((child) => {
    if (child.isGroupBanner && child.children.length > 0) {
      // 1. Group banner row (e.g. 1.3: Đạt thêm 01 trong 05 tiêu chí...)
      rows.push({
        node: child,
        code: child.code,
        isLeaf: false,
        isGroupBanner: true,
        standardName: standard.standardName,
        depth: 1,
      })

      // 2. Sub-criteria rows
      child.children.forEach((sub) => {
        rows.push({
          node: sub,
          code: sub.code,
          isLeaf: true,
          isGroupBanner: false,
          standardName: standard.standardName,
          depth: 2,
        })
      })
    } else {
      // Direct leaf criteria row
      rows.push({
        node: child,
        code: child.code,
        isLeaf: true,
        isGroupBanner: false,
        standardName: standard.standardName,
        depth: 1,
      })
    }
  })

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
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})

  // 1. Build standardized 5-standards tree
  const standards = useMemo(() => {
    return buildSv5tStandardTree(criterias)
  }, [criterias])

  // 2. Build flat lookup map: criteriaId -> node
  const criteriaMap = useMemo(() => {
    const map = new Map<number, CriteriaTreeNode>()
    standards.forEach((std) => {
      map.set(std.id, std)
      std.children.forEach((child) => {
        map.set(child.id, child)
        child.children.forEach((sub) => {
          map.set(sub.id, sub)
        })
      })
    })
    return map
  }, [standards])

  // 3. Reset state & auto-expand section holding the initial selected criteria
  useEffect(() => {
    if (isOpen) {
      const activeId = initialSelectedId || null
      setSelectedId(activeId)
      setSearchTerm('')

      const initialExpanded: Record<number, boolean> = {}

      standards.forEach((std, idx) => {
        const rows = getStandardRows(std)
        const hasSelected = rows.some((r) => r.node.id === activeId)
        // Auto expand if section contains selected item, or default expand the first section
        if (hasSelected || idx === 0) {
          initialExpanded[std.id] = true
        }
      })

      setExpandedSections(initialExpanded)
    }
  }, [isOpen, initialSelectedId, standards])

  // Toggle single section expand/collapse
  const toggleSection = (standardId: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [standardId]: !prev[standardId],
    }))
  }

  // Toggle all sections expand/collapse
  const areAllExpanded = useMemo(() => {
    if (standards.length === 0) return false
    return standards.every((s) => expandedSections[s.id])
  }, [standards, expandedSections])

  const toggleAllSections = () => {
    const nextState = !areAllExpanded
    const nextExpanded: Record<number, boolean> = {}
    standards.forEach((s) => {
      nextExpanded[s.id] = nextState
    })
    setExpandedSections(nextExpanded)
  }

  // Select / Deselect criterion
  const handleSelect = (node: CriteriaTreeNode) => {
    // Only leaf items are selectable (group banners like 1.3 are category dividers)
    if (!node.isLeaf) return

    if (selectedId === node.id) {
      setSelectedId(null)
    } else {
      setSelectedId(node.id)
    }
  }

  // Confirm selection
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-card border border-border flex flex-col max-h-[92vh] shadow-2xl text-left animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4 bg-[#F9FAFB]/80 dark:bg-background/40 shrink-0">
          <div>
            <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
              Bảng danh mục Tiêu chí Sinh viên 5 Tốt (SV5T)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nhấp vào từng Tiêu chuẩn (TC 1 - TC 5) để mở chi tiết, chọn tiêu chí để sinh viên được ghi nhận khi tham gia sự kiện.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2. Search & Toolbar */}
        <div className="p-3.5 border-b border-border/80 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
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

            <button
              type="button"
              onClick={toggleAllSections}
              className="h-9 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              title={areAllExpanded ? 'Thu gọn tất cả tiêu chuẩn' : 'Mở rộng tất cả tiêu chuẩn'}
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {areAllExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Main Accordion Sections Container (Student SV5T Style) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-[#F9FAFB]/40 dark:bg-background/30">
          {standards.map((std) => {
            const rows = getStandardRows(std)

            // When searching, auto-expand and filter rows
            const isSearching = searchTerm.trim().length > 0
            const filteredRows = isSearching
              ? rows.filter(
                  (r) =>
                    r.node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (r.node.note && r.node.note.toLowerCase().includes(searchTerm.toLowerCase()))
                )
              : rows

            // Don't show section if search has no match
            if (isSearching && filteredRows.length === 0) {
              return null
            }

            const isExpanded = isSearching ? true : Boolean(expandedSections[std.id])
            const selectedItemInStandard = rows.find((r) => r.node.id === selectedId)
            const leafCriteriaCount = rows.filter((r) => r.isLeaf).length

            return (
              <div
                key={std.id}
                className="border border-[#E5E7EB] dark:border-border rounded-xl overflow-hidden bg-white dark:bg-card shadow-2xs transition-all"
              >
                {/* Section Accordion Header Bar */}
                <button
                  type="button"
                  onClick={() => toggleSection(std.id)}
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
                      {std.name}
                    </span>
                  </div>

                  {/* Right: Selected Criterion Indicator or Criteria Count */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedItemInStandard ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Đã chọn tiêu chí: {selectedItemInStandard.code}</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-white dark:bg-muted/40 border border-border/60">
                        {leafCriteriaCount} tiêu chí xét
                      </span>
                    )}
                  </div>
                </button>

                {/* Section Content Table */}
                {isExpanded && (
                  <div className="w-full flex flex-col">
                    {/* Table Column Headers */}
                    <div className="bg-[#F0F2F5]/80 dark:bg-muted/60 text-[11px] font-semibold text-muted-foreground flex items-center px-4 py-2 border-b border-[#E5E7EB] dark:border-border select-none">
                      <div className="w-10 shrink-0 text-center">Chọn</div>
                      <div className="w-20 shrink-0 text-center">Mã TC</div>
                      <div className="flex-1 min-w-[220px] px-3">Nội dung tiêu chí xét duyệt</div>
                      <div className="w-56 sm:w-72 shrink-0 px-2 text-left">Ghi chú / Hướng dẫn xét</div>
                    </div>

                    {/* Table Rows */}
                    <div className="w-full flex flex-col divide-y divide-[#E5E7EB] dark:divide-border/60">
                      {filteredRows.map(({ node, code, isGroupBanner, depth }) => {
                        // 1. Group Banner Row (e.g. 1.3: Đạt thêm 01 trong 05 tiêu chí...)
                        if (isGroupBanner) {
                          return (
                            <div
                              key={node.id}
                              className="flex items-center bg-[#ECFBFF] dark:bg-cyan-950/25 px-4 py-2.5 text-xs min-h-[38px] select-none font-semibold text-[#065C85] dark:text-cyan-300"
                            >
                              <div className="w-10 shrink-0 text-center text-muted-foreground/40 font-mono">
                                —
                              </div>
                              <div className="w-20 shrink-0 text-center font-bold text-[#065C85] dark:text-cyan-400">
                                {code}
                              </div>
                              <div className="flex-1 px-3 font-semibold text-[#065C85] dark:text-cyan-200">
                                {node.name}
                              </div>
                              <div className="w-56 sm:w-72 shrink-0 px-2 text-[11px] text-[#065C85]/80 dark:text-cyan-400/80 italic font-normal">
                                {node.note || 'Nhóm tiêu chí tự chọn'}
                              </div>
                            </div>
                          )
                        }

                        // 2. Actionable Leaf Criteria Row (Single-Select Radio)
                        const isSelected = selectedId === node.id
                        const indentPadding = depth >= 2 ? 'pl-2' : ''

                        return (
                          <div
                            key={node.id}
                            onClick={() => handleSelect(node)}
                            className={`flex items-start px-4 py-2.5 text-xs transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-primary/5 dark:bg-primary/15 border-l-4 border-l-primary font-medium'
                                : 'bg-white dark:bg-card hover:bg-muted/30 border-l-4 border-l-transparent'
                            }`}
                          >
                            {/* Radio Selection Button */}
                            <div className="w-10 shrink-0 pt-0.5 flex justify-center">
                              <div
                                className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white shadow-2xs ring-2 ring-primary/20'
                                    : 'border-[#D1D5DB] dark:border-border hover:border-primary/60 bg-white dark:bg-card'
                                }`}
                              >
                                {isSelected && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </div>
                            </div>

                            {/* Criteria Code Badge */}
                            <div className="w-20 shrink-0 pt-0.5 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[11px] font-bold font-mono inline-block ${
                                  isSelected
                                    ? 'bg-primary text-white shadow-2xs'
                                    : 'bg-primary/10 text-primary'
                                }`}
                              >
                                {code}
                              </span>
                            </div>

                            {/* Criteria Title */}
                            <div className={`flex-1 min-w-[220px] px-3 pr-4 ${indentPadding} space-y-0.5`}>
                              <p
                                className={`leading-relaxed ${
                                  isSelected
                                    ? 'font-semibold text-primary'
                                    : 'text-foreground/90'
                                }`}
                              >
                                {node.name}
                              </p>
                            </div>

                            {/* Guidance / Note */}
                            <div className="w-56 sm:w-72 shrink-0 px-2 text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                              {node.note || '—'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 4. Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-[#F9FAFB]/80 dark:bg-background/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            {selectedNode ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold shrink-0 font-mono">
                  {selectedNode.code}
                </span>
                <span className="text-xs font-semibold text-foreground truncate max-w-[280px] sm:max-w-[400px]">
                  {selectedNode.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1 text-muted-foreground hover:text-rose-600 rounded cursor-pointer transition-colors"
                  title="Bỏ chọn tiêu chí này"
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
