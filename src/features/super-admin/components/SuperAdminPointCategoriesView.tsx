import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Edit2, ShieldCheck } from 'lucide-react'
import type { SuperAdminPointCategory } from '../types/superAdmin.types'

interface SuperAdminPointCategoriesViewProps {
  categories: SuperAdminPointCategory[]
  onOpenCreateModal: (parent?: SuperAdminPointCategory) => void
  onOpenEditModal: (category: SuperAdminPointCategory) => void
  onToggleActive: (categoryId: number) => void
}

export const SuperAdminPointCategoriesView: React.FC<SuperAdminPointCategoriesViewProps> = ({
  categories,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleActive,
}) => {
  const [expandedIds, setExpandedIds] = useState<number[]>([1, 10, 2, 3])

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const renderCategoryRow = (cat: SuperAdminPointCategory, depth = 0) => {
    const hasChildren = cat.children && cat.children.length > 0
    const isExpanded = expandedIds.includes(cat.id)

    return (
      <React.Fragment key={cat.id}>
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
                  onClick={() => toggleExpand(cat.id)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-slate-200 transition-colors shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              ) : (
                <span className="w-6 shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm ${depth === 0 ? 'text-foreground font-semibold' : 'text-foreground font-medium'}`}
                >
                  {cat.name}
                </p>
                {cat.note && (
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">{cat.note}</p>
                )}
              </div>
            </div>
          </td>

          {/* Level */}
          <td className="py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            Cấp {cat.level}
          </td>

          {/* Max Score */}
          <td className="py-3 px-4 whitespace-nowrap">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${
                depth === 0 ? 'bg-muted/40 text-foreground' : 'bg-muted/40 text-foreground'
              }`}
            >
              Tối đa {cat.maximum} điểm
            </span>
          </td>

          {/* Status */}
          <td className="py-3 px-4 whitespace-nowrap">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => onToggleActive(cat.id)}
              className="inline-flex items-center justify-start gap-1.5 rounded-lg bg-transparent px-0 text-xs font-medium text-foreground hover:bg-transparent hover:underline"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
              {cat.isActive ? 'Áp dụng' : 'Tạm tắt'}
            </Button>
          </td>

          {/* Actions */}
          <td className="py-3 px-4 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1">
              {depth < 3 && (
                <Tooltip content="Thêm tiêu chí con">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onOpenCreateModal(cat)}
                    aria-label="Thêm tiêu chí con"
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
                  onClick={() => onOpenEditModal(cat)}
                  aria-label="Chỉnh sửa tiêu chí"
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </td>
        </tr>

        {/* Recursive Children rendering */}
        {hasChildren &&
          isExpanded &&
          cat.children!.map((child) => renderCategoryRow(child, depth + 1))}
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
            <span className="text-foreground font-semibold">Điểm rèn luyện</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Khung tiêu chí điểm rèn luyện (ĐRL)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu trúc phân cấp 5 mục chuẩn ĐHCT (Tối đa 100 điểm) theo Quy chế đánh giá rèn luyện.
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
          <span>Thêm mục lớn mới</span>
        </Button>
      </div>

      {/* 2. Overview Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-2xs flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Tổng thang điểm rèn luyện: 100 Điểm
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Phân bổ 5 mục lớn I, II, III, IV, V</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => setExpandedIds(expandedIds.length > 0 ? [] : [1, 10, 2, 3, 4, 5])}
          className="text-primary font-semibold hover:underline cursor-pointer"
        >
          {expandedIds.length > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </Button>
      </div>

      {/* 3. Tree Table */}
      <div className="bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB] dark:bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Tên Tiêu Chí / Nội Dung Đánh Giá</th>
                <th className="py-3.5 px-4">Cấp Bậc</th>
                <th className="py-3.5 px-4">Điểm Tối Đa</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {categories.map((rootCategory) => renderCategoryRow(rootCategory, 0))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
