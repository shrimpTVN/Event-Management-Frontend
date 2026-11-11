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
              ? 'bg-amber-50/50 dark:bg-amber-950/20 font-bold'
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
                  onClick={() => toggleExpand(crit.id)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-6 shrink-0" />
              )}
              <div className="min-w-0">
                <p className={`text-sm ${depth === 0 ? 'text-amber-950 dark:text-amber-200 font-extrabold' : 'text-foreground font-semibold'}`}>
                  {crit.name}
                </p>
                {crit.note && <p className="text-xs text-muted-foreground font-normal mt-0.5">{crit.note}</p>}
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
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                crit.scope === 'UNIVERSITY'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              }`}
            >
              {crit.scope === 'UNIVERSITY' ? 'Cấp Trường' : 'Cấp Khoa/Đoàn'}
            </span>
          </td>

          {/* Status */}
          <td className="py-3 px-4 whitespace-nowrap">
            <button
              type="button"
              onClick={() => onToggleActive(crit.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                crit.isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-500 dark:bg-muted dark:text-muted-foreground'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${crit.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {crit.isActive ? 'Đang áp dụng' : 'Tạm khóa'}
            </button>
          </td>

          {/* Actions */}
          <td className="py-3 px-4 text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-1">
              {depth < 3 && (
                <button
                  type="button"
                  onClick={() => onOpenCreateModal(crit)}
                  title="Thêm tiêu chuẩn con"
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenEditModal(crit)}
                title="Chỉnh sửa tiêu chí"
                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {/* Children */}
        {hasChildren && isExpanded && crit.children!.map((child) => renderCriteriaRow(child, depth + 1))}
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
            <span className="text-primary font-bold">Tiêu chí SV 5 tốt</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Tiêu chuẩn danh hiệu "Sinh viên 5 Tốt"
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quy định xét chọn danh hiệu SV5T ĐHCT theo Quyết định số 17/QĐ-HSV (Giai đoạn 2025-2028).
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenCreateModal()}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm tiêu chuẩn mới</span>
        </button>
      </div>

      {/* 2. Banner with standard 5 pills */}
      <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs mb-2.5">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
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
              className="px-3 py-1 rounded-lg bg-white dark:bg-card border border-amber-200 text-amber-950 dark:text-amber-200 font-semibold shadow-2xs text-xs"
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
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as 'ALL' | Sv5tScope)}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold bg-[#F9FAFB] dark:bg-muted text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">Tất cả phạm vi</option>
            <option value="UNIVERSITY">Cấp Trường (UNIVERSITY)</option>
            <option value="FACULTY">Cấp Khoa/Đoàn (FACULTY)</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setExpandedIds(expandedIds.length > 0 ? [] : [1, 10, 20, 30, 40, 50])}
          className="text-[#1B4B8A] text-xs font-semibold hover:underline cursor-pointer"
        >
          {expandedIds.length > 0 ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </button>
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
