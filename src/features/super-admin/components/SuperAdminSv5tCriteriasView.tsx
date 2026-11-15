import { Tooltip } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { Star, ChevronDown, ChevronRight, Plus, Edit2 } from 'lucide-react'
import type { SuperAdminSv5tCriteria, Sv5tScope } from '../types/superAdmin.types'

interface SuperAdminSv5tCriteriasViewProps {
  criterias: SuperAdminSv5tCriteria[]
  onOpenCreateModal: (parent?: SuperAdminSv5tCriteria) => void
  onOpenEditModal: (criteria: SuperAdminSv5tCriteria) => void
  onToggleActive: (criteriaId: number) => void
}

export const SuperAdminSv5tCriteriasView: React.FC<SuperAdminSv5tCriteriasViewProps> = ({
  criterias,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleActive,
}) => {
  const [scopeFilter, setScopeFilter] = useState<'ALL' | Sv5tScope>('ALL')
  const [expandedIds, setExpandedIds] = useState<number[]>([1, 10, 20])

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const renderCriteriaRow = (crit: SuperAdminSv5tCriteria, depth = 0) => {
    const hasChildren = crit.children && crit.children.length > 0
    const isExpanded = expandedIds.includes(crit.id)

    return (
      <React.Fragment key={crit.id}>
        <tr
          className={`border-b border-border/60 transition-colors ${
            depth === 0
              ? 'bg-muted/40 dark:bg-muted/40 font-bold'
              : depth === 1
                ? 'bg-slate-50/50 dark:bg-muted/10 font-medium'
                : 'hover:bg-slate-50/60 dark:hover:bg-muted/20 text-muted-foreground'
          }`}
        >
          {/* Name & Indentation */}
          <td className="py-3 px-4">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => toggleExpand(crit.id)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-slate-200 transition-colors shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              ) : (
                <span className="w-6 shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm ${depth === 0 ? 'text-muted-foreground dark:text-muted-foreground font-extrabold' : 'text-foreground font-semibold'}`}
                >
                  {crit.name}
                </p>
                {crit.note && (
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">{crit.note}</p>
                )}
              </div>
            </div>
          </td>

          {/* Level */}
          <td className="py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Cấp {crit.level}
          </td>

          {/* Scope */}
          <td className="py-3 px-4 whitespace-nowrap">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
                crit.scope === 'UNIVERSITY'
                  ? 'bg-muted/40 text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground'
                  : 'bg-muted/40 text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground'
              }`}
            >
              {crit.scope === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa/Đoàn'}
            </span>
          </td>

          {/* Status */}
          <td className="py-3 px-4 whitespace-nowrap">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => onToggleActive(crit.id)}
              className="inline-flex items-center justify-start gap-1.5 rounded-lg bg-transparent px-0 text-xs font-medium text-foreground hover:bg-transparent hover:underline"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${crit.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
              {crit.isActive ? 'Đang áp dụng' : 'Tạm khóa'}
            </Button>
          </td>

          {/* Actions */}
          <td className="py-3 px-4 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1">
              {depth < 3 && (
                <Tooltip content="Thêm tiêu chuẩn con">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onOpenCreateModal(crit)}
                    aria-label="Thêm tiêu chuẩn con"
                    className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              <Tooltip content="Chỉnh sửa tiêu chí">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => onOpenEditModal(crit)}
                  aria-label="Chỉnh sửa tiêu chí"
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </td>
        </tr>

        {/* Children */}
        {hasChildren &&
          isExpanded &&
          crit.children!.map((child) => renderCriteriaRow(child, depth + 1))}
      </React.Fragment>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Dữ liệu danh mục</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Tiêu chí SV 5 tốt</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Tiêu chuẩn danh hiệu "Sinh viên 5 Tốt"
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quy định xét chọn danh hiệu SV5T ĐHCT theo Quyết định số 17/QĐ-HSV (Giai đoạn
            2025-2028).
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => onOpenCreateModal()}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm tiêu chuẩn mới</span>
        </Button>
      </div>

      {/* 2. Banner with standard 5 pills */}
      <div className="p-4 rounded-xl bg-muted/40 dark:bg-muted/40 border border-border dark:border-border shadow-2xs">
        <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground font-bold text-xs mb-2.5">
          <Star className="w-4 h-4 fill-none text-muted-foreground" />
          <span>5 Tiêu chuẩn cốt lõi bắt buộc:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            '1. Đạo đức tốt',
            '2. Học tập tốt',
            '3. Thể lực tốt',
            '4. Tình nguyện tốt',
            '5. Hội nhập tốt',
          ].map((title, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-lg bg-white dark:bg-card border border-border text-muted-foreground dark:text-muted-foreground font-semibold shadow-2xs text-xs"
            >
              {title}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-card p-4 rounded-xl border border-[#E5E7EB] dark:border-border shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Phạm vi xét chọn:</span>
          <Select
            value={scopeFilter}
            onValueChange={(value) => setScopeFilter(value as 'ALL' | Sv5tScope)}
          >
            <SelectTrigger aria-label="Phạm vi xét chọn" className="h-10 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phạm vi</SelectItem>
              <SelectItem value="UNIVERSITY">Cấp Trường</SelectItem>
              <SelectItem value="FACULTY">Cấp Khoa / Đoàn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setExpandedIds(expandedIds.length > 0 ? [] : [1, 10, 20, 30, 40, 50])}
          className="text-primary text-xs font-semibold hover:underline cursor-pointer"
        >
          {expandedIds.length > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </Button>
      </div>

      {/* 4. Tree Table */}
      <div className="bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB] dark:bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Tên Tiêu Chuẩn / Tiêu Chí Xét Chọn</th>
                <th className="py-3.5 px-4">Cấp Bậc</th>
                <th className="py-3.5 px-4">Phạm Vi</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {criterias.map((rootCrit) => renderCriteriaRow(rootCrit, 0))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
