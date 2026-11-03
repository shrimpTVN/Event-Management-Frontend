import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GraduationCap,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdminService'
import type { CriteriaAdminItem } from '../../types/superAdmin.types'

export const SuperAdminSv5tView: React.FC = () => {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [selectedScope, setSelectedScope] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({})

  // Form states
  const [critName, setCritName] = useState('')
  const [critScope, setCritScope] = useState('UNIVERSITY')
  const [critLevel, setCritLevel] = useState<number>(1)
  const [critParentId, setCritParentId] = useState<number | ''>('')
  const [critRequiredChildren, setCritRequiredChildren] = useState<number | ''>('')
  const [critNote, setCritNote] = useState('')

  const { data: criterias = [], isLoading, refetch } = useQuery({
    queryKey: ['superadmin-criterias'],
    queryFn: () => superAdminService.getCriterias(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string
      level: number
      parentId?: number | null
      note?: string
      scope?: string
      requiredChildren?: number | null
    }) => superAdminService.createCriteria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-criterias'] })
      setIsCreateModalOpen(false)
      setCritName('')
      setCritNote('')
      setCritParentId('')
      setCritRequiredChildren('')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Tạo tiêu chí Sinh viên 5 tốt thất bại!')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.toggleCriteriaStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-criterias'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Cập nhật trạng thái tiêu chí thất bại!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.deleteCriteria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-criterias'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Xóa tiêu chí Sinh viên 5 tốt thất bại!')
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!critName.trim()) {
      alert('Vui lòng nhập tên tiêu chí Sinh viên 5 tốt!')
      return
    }
    createMutation.mutate({
      name: critName.trim(),
      level: Number(critLevel),
      parentId: critParentId !== '' ? Number(critParentId) : null,
      scope: critScope,
      requiredChildren: critRequiredChildren !== '' ? Number(critRequiredChildren) : null,
      note: critNote.trim() || undefined,
    })
  }

  const handleDelete = (c: CriteriaAdminItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tiêu chí "${c.name}" không?`)) {
      deleteMutation.mutate(c.id)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter list
  const filteredList = criterias.filter((c) => {
    const matchesKeyword =
      !keyword.trim() ||
      c.name.toLowerCase().includes(keyword.toLowerCase()) ||
      (c.note && c.note.toLowerCase().includes(keyword.toLowerCase()))

    const matchesScope =
      selectedScope === 'ALL' ||
      c.scope?.toUpperCase() === selectedScope.toUpperCase()

    return matchesKeyword && matchesScope
  })

  // Separate root standards (level 1 or parentId null) vs child criteria
  const rootStandards = filteredList.filter((c) => !c.parentId || c.level === 1)
  const allRootForSelect = criterias.filter((c) => !c.parentId || c.level === 1)

  const getChildrenOf = (parentId: number) => {
    return filteredList.filter((c) => c.parentId === parentId)
  }

  const renderScopeBadge = (scope?: string) => {
    switch (scope?.toUpperCase()) {
      case 'UNIVERSITY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Cấp Trường
          </span>
        )
      case 'FACULTY':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            Cấp Khoa
          </span>
        )
      case 'CENTRAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Cấp Trung Ương
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {scope || 'Tiêu chuẩn'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-[#1B4B8A] dark:text-blue-400" />
            Quản lý Tiêu chí Sinh viên 5 Tốt
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết lập danh mục 5 tiêu chuẩn chuẩn và cây tiêu chí con đánh giá danh hiệu SV5T
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B4B8A] hover:bg-[#153a6b] text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Thêm tiêu chí
          </button>
        </div>
      </div>

      {/* 2. Overview Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Layers className="h-4 w-4 text-[#1B4B8A]" />
            Tổng tiêu chí
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {criterias.length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            Tiêu chuẩn gốc (Level 1)
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {criterias.filter((c) => !c.parentId || c.level === 1).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            Đang kích hoạt
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {criterias.filter((c) => c.isActive !== false).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Filter className="h-4 w-4 text-purple-600" />
            Tiêu chí cấp con
          </div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {criterias.filter((c) => c.parentId && c.level > 1).length}
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm tiêu chí SV5T theo tên hoặc ghi chú..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 focus:border-[#1B4B8A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 cursor-pointer"
          >
            <option value="ALL">Tất cả cấp độ</option>
            <option value="UNIVERSITY">Cấp Trường</option>
            <option value="FACULTY">Cấp Khoa</option>
            <option value="CENTRAL">Cấp Trung Ương</option>
          </select>
        </div>
      </div>

      {/* 4. Criteria Tree / Hierarchical View */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            Đang tải dữ liệu tiêu chí Sinh viên 5 tốt...
          </div>
        ) : rootStandards.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
            Không tìm thấy tiêu chí nào phù hợp với bộ lọc.
          </div>
        ) : (
          rootStandards.map((std, idx) => {
            const children = getChildrenOf(std.id)
            const isExpanded = expandedIds[std.id] ?? true

            return (
              <div
                key={std.id}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-sm transition-all"
              >
                {/* Standard Header (Level 1) */}
                <div className="p-4 flex items-center justify-between gap-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(std.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer shrink-0"
                    >
                      {children.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </button>

                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-[#1B4B8A] dark:text-blue-300 font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {std.name}
                        </span>
                        {renderScopeBadge(std.scope)}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium">
                          Cấp {std.level || 1}
                        </span>
                        {std.requiredChildren && (
                          <span className="text-xs text-muted-foreground">
                            (Yêu cầu đạt {std.requiredChildren} tiêu chí con)
                          </span>
                        )}
                      </div>
                      {std.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {std.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleStatusMutation.mutate(std.id)}
                      title={std.isActive !== false ? 'Đang kích hoạt - Nhấn để vô hiệu hóa' : 'Đã vô hiệu hóa - Nhấn để kích hoạt'}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      {std.isActive !== false ? (
                        <ToggleRight className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(std)}
                      title="Xóa tiêu chí"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-criteria (Children) */}
                {isExpanded && children.length > 0 && (
                  <div className="divide-y divide-border border-t border-border bg-card">
                    {children.map((child, cIdx) => {
                      const grandChildren = getChildrenOf(child.id)
                      const isChildExpanded = expandedIds[child.id] ?? true

                      return (
                        <div key={child.id} className="text-sm">
                          <div className="py-3 px-4 pl-12 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {grandChildren.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(child.id)}
                                  className="p-0.5 rounded text-muted-foreground cursor-pointer shrink-0"
                                >
                                  {isChildExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              )}
                              <span className="font-medium text-foreground text-xs sm:text-sm">
                                {idx + 1}.{cIdx + 1} {child.name}
                              </span>
                              {renderScopeBadge(child.scope)}
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                Cấp {child.level}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleStatusMutation.mutate(child.id)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                {child.isActive !== false ? (
                                  <ToggleRight className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(child)}
                                className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Grandchildren if any */}
                          {isChildExpanded && grandChildren.length > 0 && (
                            <div className="bg-muted/10 divide-y divide-border/60 pl-16 pr-4 py-1">
                              {grandChildren.map((gc, gcIdx) => (
                                <div
                                  key={gc.id}
                                  className="py-2 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-muted-foreground">
                                      {idx + 1}.{cIdx + 1}.{gcIdx + 1}
                                    </span>
                                    <span className="text-foreground">{gc.name}</span>
                                    {renderScopeBadge(gc.scope)}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleStatusMutation.mutate(gc.id)}
                                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                      {gc.isActive !== false ? (
                                        <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(gc)}
                                      className="p-1 text-rose-500 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* 5. Create Criteria Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#1B4B8A]" />
                Thêm Tiêu chí Sinh viên 5 Tốt
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Tên tiêu chí / tiêu chuẩn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đạo đức tốt, Điểm rèn luyện đạt từ 80 điểm trở lên..."
                  value={critName}
                  onChange={(e) => setCritName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 focus:border-[#1B4B8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Cấp độ (Level)
                  </label>
                  <select
                    value={critLevel}
                    onChange={(e) => setCritLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 cursor-pointer"
                  >
                    <option value={1}>Cấp 1 (Tiêu chuẩn gốc)</option>
                    <option value={2}>Cấp 2 (Tiêu chí con)</option>
                    <option value={3}>Cấp 3 (Tiêu chí chi tiết)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Phạm vi áp dụng (Scope)
                  </label>
                  <select
                    value={critScope}
                    onChange={(e) => setCritScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 cursor-pointer"
                  >
                    <option value="UNIVERSITY">Cấp Trường (UNIVERSITY)</option>
                    <option value="FACULTY">Cấp Khoa (FACULTY)</option>
                    <option value="CENTRAL">Cấp Trung Ương (CENTRAL)</option>
                  </select>
                </div>
              </div>

              {critLevel > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tiêu chuẩn cha (Parent)
                  </label>
                  <select
                    value={critParentId}
                    onChange={(e) => setCritParentId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 cursor-pointer"
                  >
                    <option value="">-- Chọn tiêu chí cha --</option>
                    {allRootForSelect.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.scope})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Số tiêu chí con bắt buộc (tùy chọn)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Để trống nếu không yêu cầu số lượng con"
                  value={critRequiredChildren}
                  onChange={(e) =>
                    setCritRequiredChildren(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 focus:border-[#1B4B8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Mô tả / Ghi chú
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú chi tiết về điều kiện đạt tiêu chí..."
                  value={critNote}
                  onChange={(e) => setCritNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1B4B8A]/30 focus:border-[#1B4B8A]"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium text-sm transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-[#1B4B8A] hover:bg-[#153a6b] text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo tiêu chí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

