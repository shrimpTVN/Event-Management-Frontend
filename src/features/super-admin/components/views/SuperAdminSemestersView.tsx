import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  X,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdminService'
import type { SemesterAdminItem } from '../../types/superAdmin.types'

export const SuperAdminSemestersView: React.FC = () => {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form states
  const [semesterNumber, setSemesterNumber] = useState<number>(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [academicYearId, setAcademicYearId] = useState<number>(2)

  const { data: semesters = [], isLoading, refetch } = useQuery({
    queryKey: ['superadmin-semesters'],
    queryFn: () => superAdminService.getSemesters(),
  })

  const { data: academicYears = [] } = useQuery({
    queryKey: ['superadmin-academic-years'],
    queryFn: () => superAdminService.getAcademicYears(),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: {
      number: number
      startDate: string
      endDate: string
      academicYearId: number
    }) => superAdminService.createSemester(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-semesters'] })
      setIsCreateModalOpen(false)
      setStartDate('')
      setEndDate('')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Tạo học kỳ thất bại!')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.toggleSemesterStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-semesters'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Chuyển trạng thái học kỳ thất bại!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.deleteSemester(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-semesters'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Xóa học kỳ thất bại!')
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      alert('Vui lòng chọn ngày bắt đầu và kết thúc của học kỳ!')
      return
    }
    createMutation.mutate({
      number: Number(semesterNumber),
      startDate,
      endDate,
      academicYearId: Number(academicYearId),
    })
  }

  const handleDelete = (s: SemesterAdminItem) => {
    if (confirm(`Bạn có chắc muốn xóa Học kỳ ${s.number} không?`)) {
      deleteMutation.mutate(s.id)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Quản lý Học kỳ & Năm học
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thiết lập niên khóa đào tạo, thời gian diễn ra học kỳ và kích hoạt học kỳ hiện tại.
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
            <span>Thêm học kỳ mới</span>
          </button>
        </div>
      </div>

      {/* 2. Semesters List */}
      <div className="rounded-2xl bg-white dark:bg-card border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Học kỳ</th>
                <th className="py-3 px-4">Năm học / Niên khóa</th>
                <th className="py-3 px-4">Thời gian bắt đầu - kết thúc</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Đang tải danh sách học kỳ...
                  </td>
                </tr>
              ) : semesters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Chưa có học kỳ nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                semesters.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    {/* Semester number */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0">
                          {s.number}
                        </div>
                        <span className="font-semibold text-foreground">
                          Học kỳ {s.number}
                        </span>
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="py-3 px-4 text-muted-foreground">
                      {s.academicYearName || `Năm học ID ${s.academicYearId}`}
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{s.startDate} → {s.endDate}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {s.status === 'ONGOING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>ĐANG DIỄN RA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          <Clock className="h-3 w-3" />
                          <span>{s.status || 'SẮP TỚI'}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleStatusMutation.mutate(s.id)}
                          disabled={toggleStatusMutation.isPending}
                          className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold cursor-pointer transition-colors"
                          title="Chuyển trạng thái hoạt động"
                        >
                          {s.status === 'ONGOING' ? 'Tắt kích hoạt' : 'Kích hoạt'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                          title="Xóa học kỳ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Semester */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-k2d font-bold text-lg text-foreground">
                Tạo Học kỳ mới
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
                <label className="font-semibold text-foreground">Học kỳ số</label>
                <select
                  value={semesterNumber}
                  onChange={(e) => setSemesterNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={1}>Học kỳ 1</option>
                  <option value={2}>Học kỳ 2</option>
                  <option value={3}>Học kỳ hè (Học kỳ 3)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Niên khóa / Năm học</label>
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {academicYears.length > 0 ? (
                    academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name} ({ay.startDate} - {ay.endDate})
                      </option>
                    ))
                  ) : (
                    <option value={2}>Năm học 2026 - 2027</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
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
                  {createMutation.isPending ? 'Đang tạo...' : 'Lưu học kỳ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
