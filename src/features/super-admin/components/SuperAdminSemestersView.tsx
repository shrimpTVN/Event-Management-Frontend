import React, { useState } from 'react'
import { Plus, Edit2, CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
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
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Dữ liệu danh mục</span>
            <span>/</span>
            <span className="text-primary font-bold">Học kỳ niên khóa</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý học kỳ &amp; niên khóa
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thiết lập thời gian học kỳ, kích hoạt kỳ tính điểm rèn luyện & xét sinh viên 5 tốt toàn trường.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm học kỳ mới</span>
        </button>
      </div>

      {/* 2. Highlight: Current Active Semester Card */}
      {currentSemester && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1B4B8A] to-blue-700 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white flex items-center gap-1">
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
            className="px-4 py-2 rounded-xl bg-white text-[#1B4B8A] text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs cursor-pointer"
          >
            Chỉnh sửa kỳ hiện tại
          </button>
        </div>
      )}

      {/* 3. Panel Container with Rounded Row Cards */}
      <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs">
        {/* Panel Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
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

          <div className="text-xs text-muted-foreground font-normal">
            {filteredSemesters.length} học kỳ
          </div>
        </div>

        {/* Vùng chứa các card học kỳ bo tròn */}
        <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 overflow-x-auto rounded-xl">
          <div className="min-w-[760px]">
            {/* Header hàng cột phẳng */}
            <div className="grid grid-cols-[160px_140px_1fr_130px_140px_80px] items-center px-5 py-2 text-xs font-normal text-muted-foreground">
              <div>Học kỳ</div>
              <div>Năm học</div>
              <div>Thời gian diễn ra</div>
              <div className="text-center">Tiến trình</div>
              <div className="text-center">Trạng thái</div>
              <div className="text-right">Thao tác</div>
            </div>

            {/* Danh sách các card hàng bo tròn */}
            <div className="flex flex-col gap-2.5 mt-1 animate-in fade-in-50 duration-150">
              {filteredSemesters.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                  Không tìm thấy học kỳ nào phù hợp.
                </div>
              ) : (
                filteredSemesters.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid grid-cols-[160px_140px_1fr_130px_140px_80px] items-center shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all',
                      s.isCurrent && 'border-primary/40 bg-blue-50/15'
                    )}
                  >
                    {/* 1. Học kỳ */}
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#1B4B8A] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-foreground">
                        Học kỳ {s.number === 3 ? 'Hè (Kỳ 3)' : s.number}
                      </span>
                    </div>

                    {/* 2. Năm học */}
                    <div className="text-xs font-semibold text-foreground">
                      {s.academicYear}
                    </div>

                    {/* 3. Thời gian */}
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
                      <span>{s.startDate} đến {s.endDate}</span>
                    </div>

                    {/* 4. Tiến trình */}
                    <div className="flex justify-center">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                          s.status === 'ONGOING'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : s.status === 'UPCOMING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground border-slate-200 dark:border-border'
                        )}
                      >
                        {s.status === 'ONGOING'
                          ? 'Đang diễn ra'
                          : s.status === 'UPCOMING'
                          ? 'Sắp diễn ra'
                          : 'Đã kết thúc'}
                      </span>
                    </div>

                    {/* 5. Hiện hành */}
                    <div className="flex justify-center">
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
                    </div>

                    {/* 6. Thao tác */}
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(s)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                        title="Chỉnh sửa học kỳ"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
