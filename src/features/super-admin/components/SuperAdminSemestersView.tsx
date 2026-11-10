import React, { useState } from 'react'
import { Plus, Edit2, CheckCircle2, Clock } from 'lucide-react'
import type { SuperAdminSemester } from '../types/superAdmin.types'

interface SuperAdminSemestersViewProps {
  semesters: SuperAdminSemester[]
  onOpenCreateModal: () => void
  onOpenEditModal: (semester: SuperAdminSemester) => void
  onSetCurrentSemester: (semesterId: number) => void
}

export const SuperAdminSemestersView: React.FC<SuperAdminSemestersViewProps> = ({
  semesters,
  onOpenCreateModal,
  onOpenEditModal,
  onSetCurrentSemester,
}) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL')

  const academicYears = Array.from(new Set(semesters.map((s) => s.academicYear)))

  const filteredSemesters = semesters.filter(
    (s) => selectedAcademicYear === 'ALL' || s.academicYear === selectedAcademicYear
  )

  const currentSemester = semesters.find((s) => s.isCurrent)

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Dữ liệu danh mục</span>
          <span>/</span>
          <span className="text-primary font-semibold">Học kỳ niên khóa</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-k2d font-bold text-foreground tracking-tight">
              Quản lý học kỳ & niên khóa
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Thiết lập thời gian học kỳ, kích hoạt kỳ tính điểm rèn luyện & xét sinh viên 5 tốt
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm học kỳ mới
          </button>
        </div>
      </div>

      {/* 2. Highlight: Current Active Semester Card */}
      {currentSemester && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-primary text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                HỌC KỲ HIỆN HÀNH TOÀN TRƯỜNG
              </span>
            </div>
            <h3 className="text-xl font-k2d font-bold tracking-tight">
              Học kỳ {currentSemester.number} • Năm học {currentSemester.academicYear}
            </h3>
            <p className="text-xs text-blue-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Thời gian diễn ra: {currentSemester.startDate} đến {currentSemester.endDate}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenEditModal(currentSemester)}
            className="px-4 py-2 rounded-xl bg-white text-primary text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs cursor-pointer"
          >
            Chỉnh sửa kỳ hiện tại
          </button>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Lọc theo năm học:</span>
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold bg-[#F9FAFB] dark:bg-muted text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">Tất cả năm học</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>
                Năm học {year}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground">{filteredSemesters.length} học kỳ</span>
      </div>

      {/* 4. Semesters Table */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB] dark:bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Học Kỳ</th>
                <th className="py-3.5 px-4">Năm Học</th>
                <th className="py-3.5 px-4">Ngày Bắt Đầu</th>
                <th className="py-3.5 px-4">Ngày Kết Thúc</th>
                <th className="py-3.5 px-4">Trạng Thái Tiến Trình</th>
                <th className="py-3.5 px-4">Học Kỳ Hiện Hành</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredSemesters.map((s) => (
                <tr key={s.id} className="hover:bg-[#F9FAFB] dark:hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    Học kỳ {s.number === 3 ? 'Hè (Kỳ 3)' : s.number}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">{s.academicYear}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{s.startDate}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{s.endDate}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === 'ONGOING'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : s.status === 'UPCOMING'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground border border-slate-200 dark:border-border'
                      }`}
                    >
                      {s.status === 'ONGOING'
                        ? 'Đang diễn ra'
                        : s.status === 'UPCOMING'
                        ? 'Sắp diễn ra'
                        : 'Đã kết thúc'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {s.isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hiện hành
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSetCurrentSemester(s.id)}
                        className="text-xs font-medium text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                      >
                        Đặt làm hiện hành
                      </button>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(s)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title="Chỉnh sửa học kỳ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
