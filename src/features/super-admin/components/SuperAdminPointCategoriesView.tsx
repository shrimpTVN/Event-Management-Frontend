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
              ? 'bg-blue-50/40 dark:bg-blue-950/20 font-bold'
              : depth === 1
              ? 'bg-slate-50/50 dark:bg-muted/10 font-medium'
              : 'hover:bg-slate-50/60 dark:hover:bg-muted/20 text-muted-foreground'
          }`}
        >
          {/* Name & Indentation */}
          <td className="py-3 px-4">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(cat.id)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-6 shrink-0" />
              )}
              <div className="min-w-0">
                <p className={`text-sm ${depth === 0 ? 'text-primary font-extrabold' : 'text-foreground font-semibold'}`}>
                  {cat.name}
                </p>
                {cat.note && <p className="text-xs text-muted-foreground font-normal mt-0.5">{cat.note}</p>}
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
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                depth === 0
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              Tối đa {cat.maximum} điểm
            </span>
          </td>

          {/* Status */}
          <td className="py-3 px-4 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onToggleActive(cat.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                cat.isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-500 dark:bg-muted dark:text-muted-foreground'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {cat.isActive ? 'Áp dụng' : 'Tạm tắt'}
            </button>
          </td>

          {/* Actions */}
          <td className="py-3 px-4 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1">
              {depth < 3 && (
                <button
                  type="button"
                  onClick={() => onOpenCreateModal(cat)}
                  title="Thêm tiêu chí con"
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenEditModal(cat)}
                title="Chỉnh sửa tiêu chí"
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Recursive Children rendering */}
        {hasChildren && isExpanded && cat.children!.map((child) => renderCategoryRow(child, depth + 1))}
      </React.Fragment>
    )
  }

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Dữ liệu danh mục</span>
            <span>/</span>
            <span className="text-primary font-bold">Điểm rèn luyện</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Khung tiêu chí điểm rèn luyện (ĐRL)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu trúc phân cấp 5 mục chuẩn ĐHCT (Tối đa 100 điểm) theo Quy chế đánh giá rèn luyện.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenCreateModal()}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm mục lớn mới</span>
        </button>
      </div>

      {/* 2. Overview Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-card border border-[#E5E7EB] dark:border-border shadow-2xs flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldCheck className="w-4 h-4 text-[#1B4B8A]" />
            Tổng thang điểm rèn luyện: 100 Điểm
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Phân bổ 5 mục lớn I, II, III, IV, V</span>
        </div>
        <button
          type="button"
          onClick={() => setExpandedIds(expandedIds.length > 0 ? [] : [1, 10, 2, 3, 4, 5])}
          className="text-[#1B4B8A] font-semibold hover:underline cursor-pointer"
        >
          {expandedIds.length > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </button>
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
