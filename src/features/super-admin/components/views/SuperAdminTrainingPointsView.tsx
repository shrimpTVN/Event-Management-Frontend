import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Award,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdminService'
import type { PointCategoryAdminItem } from '../../types/superAdmin.types'

export const SuperAdminTrainingPointsView: React.FC = () => {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form states
  const [catName, setCatName] = useState('')
  const [catMax, setCatMax] = useState<number>(10)
  const [catLevel, setCatLevel] = useState<number>(1)
  const [catParentId, setCatParentId] = useState<number | ''>('')
  const [catNote, setCatNote] = useState('')

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['superadmin-point-categories'],
    queryFn: () => superAdminService.getPointCategories(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: {
      name: string
      maximum: number
      level: number
      note?: string
      parentCategoryId?: number | null
      dateApply?: string
    }) => superAdminService.createPointCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-point-categories'] })
      setIsCreateModalOpen(false)
      setCatName('')
      setCatMax(10)
      setCatNote('')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Tạo danh mục điểm rèn luyện thất bại!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.deletePointCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-point-categories'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Xóa danh mục điểm rèn luyện thất bại!')
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) {
      alert('Vui lòng nhập tên tiêu chí điểm rèn luyện!')
      return
    }
    createMutation.mutate({
      name: catName.trim(),
      maximum: Number(catMax),
      level: Number(catLevel),
      note: catNote.trim() || undefined,
      parentCategoryId: catParentId !== '' ? Number(catParentId) : null,
      dateApply: new Date().toISOString().split('T')[0],
    })
  }

  const handleDelete = (c: PointCategoryAdminItem) => {
    if (confirm(`Bạn có chắc muốn xóa tiêu chí "${c.name}" không?`)) {
      deleteMutation.mutate(c.id)
    }
  }

  const filteredCategories = keyword.trim()
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(keyword.toLowerCase()) ||
          (c.note && c.note.toLowerCase().includes(keyword.toLowerCase()))
      )
    : categories

  // Filter root categories for parent selection
  const rootCategories = categories.filter((c) => c.level === 0 || !c.parentCategoryId)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Danh mục Điểm Rèn Luyện
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu hình các Điều quy chế rèn luyện ĐH Cần Thơ, định mức điểm trần và liên kết phân cấp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white dark:bg-card hover:bg-muted text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm mục mới</span>
          </button>
        </div>
      </div>

      {/* 2. Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm kiếm mục điểm rèn luyện..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* 3. Categories Table */}
      <div className="rounded-2xl bg-white dark:bg-card border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tên mục / Tiêu chí điểm rèn luyện</th>
                <th className="py-3 px-4">Cấp độ</th>
                <th className="py-3 px-4">Điểm tối đa</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Đang tải danh mục điểm rèn luyện...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy mục nào.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const isRoot = c.level === 0 || !c.parentCategoryId
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isRoot ? 'bg-primary/5 font-semibold text-foreground' : ''
                      }`}
                    >
                      {/* Name with indentation based on level */}
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${c.level * 16}px` }}
                        >
                          {isRoot ? (
                            <Award className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <span className="text-muted-foreground shrink-0">•</span>
                          )}
                          <span className="truncate max-w-[380px]" title={c.name}>
                            {c.name}
                          </span>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-muted text-muted-foreground border border-border">
                          Cấp {c.level}
                        </span>
                      </td>

                      {/* Maximum */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground">
                          {c.maximum} điểm
                        </span>
                      </td>

                      {/* Note */}
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="truncate max-w-[200px]" title={c.note}>
                          {c.note || '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Category */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-k2d font-bold text-lg text-foreground">
                Thêm mục Điểm rèn luyện mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tên mục / Tiêu chí *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ví dụ: Tham gia kỳ thi Olympic Tin học sinh viên..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Điểm tối đa</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={catMax}
                    onChange={(e) => setCatMax(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Cấp độ (Level)</label>
                  <select
                    value={catLevel}
                    onChange={(e) => setCatLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={0}>Cấp 0 (Điều gốc)</option>
                    <option value={1}>Cấp 1 (Khoản a, b, c)</option>
                    <option value={2}>Cấp 2 (Mục chi tiết)</option>
                    <option value={3}>Cấp 3 (Mục con)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Thuộc mục cha</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Không có (Là mục gốc)</option>
                  {rootCategories.map((rc) => (
                    <option key={rc.id} value={rc.id}>
                      {rc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ghi chú / Mã quy chế</label>
                <textarea
                  value={catNote}
                  onChange={(e) => setCatNote(e.target.value)}
                  placeholder="Mã tiêu chí, căn cứ quy định..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Lưu tiêu chí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
