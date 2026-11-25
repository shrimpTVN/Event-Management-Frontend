import { Button } from '@/components/ui/button'
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
import { MobileFilterSheet } from '@/shared/components/MobileFilterSheet'
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

  // Filter semesters based on the selected academic year - strictly no cross-year fallback
  const availableSemesters = useMemo(() => {
    if (!selectedYear) return []

    const cleanYear = selectedYear.replace(/\s+/g, '')
    const matchedYear = academicYears.find(
      (y) => (y.code || '').replace(/\s+/g, '') === cleanYear
    )

    const filtered = semesters.filter((s) => {
      if (matchedYear && s.academicYearId != null) {
        return s.academicYearId === matchedYear.id
      }
      if (s.academicYear) {
        return s.academicYear.replace(/\s+/g, '') === cleanYear
      }
      return false
    })

    return Array.from(new Set(filtered.map((s) => s.number))).sort()
  }, [semesters, academicYears, selectedYear])

  const yearOptions = useMemo(() => {
    return academicYears.map((yr) => ({
      value: yr.code,
      label: formatYearLabel(yr.code),
    }))
  }, [academicYears])

  const semesterOptions = useMemo(() => {
    return availableSemesters.map((num) => ({
      value: String(num),
      label: `Học kì ${num}`,
    }))
  }, [availableSemesters])

  return (
    <div className="student-achievement-header flex flex-col gap-2 pb-1">
      {/* Mobile View (< 768px): 2 bottom sheet triggers in 1 row + subtle regulation link */}
      <div className="flex md:hidden flex-col gap-2 w-full">
        <div className="grid grid-cols-2 items-center gap-2.5 w-full">
          <div className="min-w-0">
            <MobileFilterSheet
              title="Chọn năm học"
              value={selectedYear}
              displayValue={selectedYear ? formatYearLabel(selectedYear) : 'Chọn năm học'}
              options={yearOptions}
              onChange={onYearChange}
              accessibleLabel="Năm học"
            />
          </div>
          <div className="min-w-0">
            <MobileFilterSheet
              title="Chọn học kỳ"
              value={selectedSemester}
              displayValue={
                selectedSemester
                  ? `Học kì ${selectedSemester}`
                  : availableSemesters.length === 0
                    ? 'Không có kỳ'
                    : 'Chọn học kì'
              }
              options={semesterOptions}
              onChange={onSemesterChange}
              accessibleLabel="Học kỳ"
            />
          </div>
        </div>

        {/* Quy định thời gian đánh giá text link near filters */}
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setIsRegulationModalOpen(true)}
            aria-label="Quy định thời gian đánh giá"
            className="min-h-11 px-0 py-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-transparent hover:bg-transparent"
          >
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <span>Quy định thời gian đánh giá</span>
          </Button>
        </div>
      </div>

      {/* Desktop View (>= 768px): Original Heading, Regulations link, Select dropdowns & Tìm button */}
      <div className="hidden md:flex min-w-0 flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
        {/* Title */}
        <div className="student-achievement-title flex flex-wrap min-w-0 items-center gap-2">
          <h1 data-mobile-page-heading className="min-w-0 text-xl sm:text-2xl font-bold font-k2d text-foreground tracking-tight">
            Bảng điểm rèn luyện
          </h1>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setIsRegulationModalOpen(true)}
            aria-label="Quy định thời gian đánh giá"
            className="student-regulation-button flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1"
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Quy định thời gian đánh giá</span>
          </Button>
        </div>

        {/* Filter and Regulations controls */}
        <div className="student-achievement-filters flex flex-wrap items-center gap-2.5 sm:gap-3.5 self-start sm:self-auto">
          {/* Dropdown Năm học */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger
              aria-label="Năm học"
              className="w-[130px] sm:w-[145px] h-10 text-xs font-medium bg-background border-border text-foreground shadow-2xs"
            >
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
            <SelectTrigger
              aria-label="Học kỳ"
              className="w-[105px] sm:w-[115px] h-10 text-xs font-medium bg-background border-border text-foreground shadow-2xs"
            >
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
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onSearch}
            className="h-10 px-4 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            Tìm
          </Button>
        </div>
      </div>

      {/* Regulation Modal */}
      <EvaluationRegulationModal
        isOpen={isRegulationModalOpen}
        onClose={() => setIsRegulationModalOpen(false)}
      />
    </div>
  )
}
