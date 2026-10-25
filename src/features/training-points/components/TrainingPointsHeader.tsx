import React, { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EvaluationRegulationModal } from './EvaluationRegulationModal'
import type { AcademicYear, Semester } from '../types/trainingPoints.types'

interface TrainingPointsHeaderProps {
  academicYears: AcademicYear[]
  semesters: Semester[]
  selectedYear: string
  selectedSemester: string
  onYearChange: (year: string) => void
  onSemesterChange: (sem: string) => void
  onSearch: () => void
}

/**
 * Format string e.g. "2026-2027" to "2026 - 2027"
 */
export function formatYearLabel(code: string): string {
  if (!code) return ''
  const trimmed = code.trim()
  if (trimmed.includes(' - ')) return trimmed
  if (trimmed.includes('-')) return trimmed.replace('-', ' - ')
  return trimmed
}

export const TrainingPointsHeader: React.FC<TrainingPointsHeaderProps> = ({
  academicYears,
  semesters,
  selectedYear,
  selectedSemester,
  onYearChange,
  onSemesterChange,
  onSearch,
}) => {
  const [isRegulationModalOpen, setIsRegulationModalOpen] = useState(false)

  // Filter semesters based on the selected academic year from mockdata
  const availableSemesters = useMemo(() => {
    if (!semesters || semesters.length === 0) return [1, 2, 3]

    const matchedYear = academicYears.find(
      (y) =>
        y.code === selectedYear ||
        y.code.replace(/\s+/g, '') === selectedYear.replace(/\s+/g, '')
    )

    const yearId = matchedYear?.id
    const filtered = semesters.filter(
      (s) =>
        (yearId && s.academicYearId === yearId) ||
        s.academicYear === selectedYear ||
        s.academicYear === matchedYear?.code
    )

    const semList = filtered.length > 0 ? filtered : semesters
    return Array.from(new Set(semList.map((s) => s.number))).sort()
  }, [semesters, academicYears, selectedYear])

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
        Bảng điểm rèn luyện
      </h1>

      {/* Filter and Regulations controls */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 self-start sm:self-auto">
        {/* Quy định thời gian đánh giá */}
        <button
          type="button"
          onClick={() => setIsRegulationModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1"
        >
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Quy định thời gian đánh giá</span>
        </button>

        {/* Dropdown Năm học */}
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[130px] sm:w-[145px] h-8 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs">
            <SelectValue placeholder="Chọn năm học">
              {selectedYear ? formatYearLabel(selectedYear) : 'Chọn năm học'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((yr) => (
              <SelectItem key={yr.id || yr.code} value={yr.code}>
                {formatYearLabel(yr.code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Dropdown Học kì */}
        <Select value={selectedSemester} onValueChange={onSemesterChange}>
          <SelectTrigger className="w-[105px] sm:w-[115px] h-8 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs">
            <SelectValue placeholder="Chọn học kì">
              {selectedSemester ? `Học kì ${selectedSemester}` : 'Chọn học kì'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableSemesters.map((num) => (
              <SelectItem key={num} value={String(num)}>
                Học kì {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Nút Tìm */}
        <button
          type="button"
          onClick={onSearch}
          className="h-8 px-4 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
        >
          Tìm
        </button>
      </div>

      {/* Regulation Modal */}
      <EvaluationRegulationModal
        isOpen={isRegulationModalOpen}
        onClose={() => setIsRegulationModalOpen(false)}
      />
    </div>
  )
}
