import React, { useState, useEffect } from 'react'
import { X, CalendarRange } from 'lucide-react'
import type { SuperAdminSemester } from '../../types/superAdmin.types'

interface SemesterModalProps {
  semester: SuperAdminSemester | null
  isOpen: boolean
  onClose: () => void
  onSave: (semesterData: Partial<SuperAdminSemester>) => void
}

export const SemesterModal: React.FC<SemesterModalProps> = ({
  semester,
  isOpen,
  onClose,
  onSave,
}) => {
  const [academicYear, setAcademicYear] = useState('2025-2026')
  const [number, setNumber] = useState(1)
  const [startDate, setStartDate] = useState('2026-01-05')
  const [endDate, setEndDate] = useState('2026-05-30')
  const [status, setStatus] = useState<SuperAdminSemester['status']>('UPCOMING')
  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    if (semester) {
      setAcademicYear(semester.academicYear)
      setNumber(semester.number)
      setStartDate(semester.startDate)
      setEndDate(semester.endDate)
      setStatus(semester.status)
      setIsCurrent(semester.isCurrent)
    } else {
      setAcademicYear('2025-2026')
      setNumber(1)
      setStartDate('2026-01-05')
      setEndDate('2026-05-30')
      setStatus('UPCOMING')
      setIsCurrent(false)
    }
  }, [semester, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: semester ? semester.id : undefined,
      academicYear,
      number: Number(number),
      startDate,
      endDate,
      status,
      isCurrent,
      isActive: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-k2d font-bold text-foreground">
              {semester ? 'Chỉnh Sửa Học Kỳ Niên Khóa' : 'Thêm Mới Học Kỳ Niên Khóa'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Năm học</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="VD: 2025-2026"
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Học kỳ</label>
              <select
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans cursor-pointer"
              >
                <option value={1}>Học kỳ 1</option>
                <option value={2}>Học kỳ 2</option>
                <option value={3}>Học kỳ hè / phụ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Ngày kết thúc</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Trạng thái tiến trình</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SuperAdminSemester['status'])}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans cursor-pointer"
            >
              <option value="UPCOMING">Sắp diễn ra (UPCOMING)</option>
              <option value="ONGOING">Đang diễn ra (ONGOING)</option>
              <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded-md text-primary focus:ring-primary border-border cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground">
              Đặt làm <strong>Học kỳ hiện hành</strong> của toàn trường
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-card border border-border text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-xs transition-colors cursor-pointer"
            >
              Lưu Thông Tin
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
