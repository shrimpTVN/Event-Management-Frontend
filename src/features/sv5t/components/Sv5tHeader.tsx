import { Button } from '@/components/ui/button'
import React, { useMemo } from 'react'
import { Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MobileFilterSheet } from '@/shared/components/MobileFilterSheet'
import type { AcademicYearOption, EvaluationScope } from '../types/sv5t.types'

interface Sv5tHeaderProps {
  academicYears: AcademicYearOption[]
  selectedYearId: number
  selectedScope: EvaluationScope
  onYearChange: (yearId: number) => void
  onScopeChange: (scope: EvaluationScope) => void
  onSearch: () => void
  onOpenRegulation: () => void
}

export function formatYearLabel(code: string): string {
  if (!code) return ''
  const trimmed = code.trim()
  if (trimmed.includes(' - ')) return trimmed
  if (trimmed.includes('-')) return trimmed.replace('-', ' - ')
  return trimmed
}

export const Sv5tHeader: React.FC<Sv5tHeaderProps> = ({
  academicYears,
  selectedYearId,
  selectedScope,
  onYearChange,
  onScopeChange,
  onSearch,
  onOpenRegulation,
}) => {
  const selectedYear = academicYears.find((y) => y.id === selectedYearId)

  const yearOptions = useMemo(() => {
    return academicYears.map((yr) => ({
      value: String(yr.id),
      label: formatYearLabel(yr.code),
    }))
  }, [academicYears])

  const scopeOptions = useMemo(() => [
    { value: 'UNIVERSITY', label: 'Cấp ĐHCT' },
    { value: 'FACULTY', label: 'Cấp Trường CNTT&TT' },
  ], [])

  return (
    <div className="student-achievement-header flex flex-col gap-2 pb-1 select-none">
      {/* Mobile View (< 768px): 2 bottom sheet triggers in 1 row + subtle regulation link */}
      <div className="flex md:hidden flex-col gap-2 w-full">
        <div className="grid grid-cols-2 items-center gap-2.5 w-full">
          <div className="min-w-0">
            <MobileFilterSheet
              title="Chọn năm học"
              value={selectedYearId ? String(selectedYearId) : ''}
              displayValue={selectedYear ? formatYearLabel(selectedYear.code) : 'Chọn năm học'}
              options={yearOptions}
              onChange={(val) => onYearChange(Number(val))}
              accessibleLabel="Năm học"
            />
          </div>
          <div className="min-w-0">
            <MobileFilterSheet
              title="Chọn cấp xét"
              value={selectedScope}
              displayValue={selectedScope === 'UNIVERSITY' ? 'Cấp ĐHCT' : 'Cấp Trường CNTT&TT'}
              options={scopeOptions}
              onChange={(val) => onScopeChange(val as EvaluationScope)}
              accessibleLabel="Cấp xét"
            />
          </div>
        </div>

        {/* Quy định thời gian xét duyệt text link near filters */}
        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onOpenRegulation}
            aria-label="Quy định thời gian đánh giá"
            className="min-h-11 px-0 py-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-transparent hover:bg-transparent"
          >
            <Info className="h-4 w-4 shrink-0 text-primary" />
            <span>Quy định thời gian xét duyệt</span>
          </Button>
        </div>
      </div>

      {/* Desktop View (>= 768px): Original Heading, Regulations link, Select dropdowns & Tìm button */}
      <div className="hidden md:flex min-w-0 flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
        {/* Page Title */}
        <div className="student-achievement-title flex flex-wrap min-w-0 items-center gap-2">
          <h1 data-mobile-page-heading className="min-w-0 text-xl sm:text-2xl font-bold font-k2d text-foreground tracking-tight">
            Bảng tiêu chuẩn Sinh viên 5 tốt
          </h1>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onOpenRegulation}
            aria-label="Quy định thời gian đánh giá"
            className="student-regulation-button flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1"
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>Quy định thời gian xét duyệt</span>
          </Button>
        </div>

        {/* Filter and Action Group matching TrainingPointsHeader */}
        <div className="student-achievement-filters flex flex-wrap items-center gap-2.5 sm:gap-3.5 self-start sm:self-auto">
          {/* Dropdown Năm học */}
          <Select
            value={selectedYearId ? String(selectedYearId) : ''}
            onValueChange={(val) => onYearChange(Number(val))}
          >
            <SelectTrigger
              aria-label="Năm học"
              className="w-[130px] sm:w-[145px] h-10 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs"
            >
              <SelectValue placeholder="Chọn năm học">
                {selectedYear ? formatYearLabel(selectedYear.code) : 'Chọn năm học'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((yr) => (
                <SelectItem key={yr.id} value={String(yr.id)}>
                  {formatYearLabel(yr.code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Select Cấp xét */}
          <Select
            value={selectedScope}
            onValueChange={(val) => onScopeChange(val as EvaluationScope)}
          >
            <SelectTrigger
              aria-label="Cấp xét"
              className="w-auto min-w-max h-10 text-xs font-medium bg-background border-border text-foreground shadow-2xs gap-2 px-3"
            >
              <SelectValue placeholder="Cấp xét">
                {selectedScope === 'UNIVERSITY' ? 'Cấp ĐHCT' : 'Cấp Trường CNTT&TT'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNIVERSITY">Cấp ĐHCT</SelectItem>
              <SelectItem value="FACULTY">Cấp Trường CNTT&TT</SelectItem>
            </SelectContent>
          </Select>

          {/* Nút Tìm */}
          <Button
            type="button"
            onClick={onSearch}
            className="h-10 px-4 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          >
            Tìm
          </Button>
        </div>
      </div>
    </div>
  )
}
