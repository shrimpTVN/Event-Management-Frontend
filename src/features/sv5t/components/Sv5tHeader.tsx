import React from 'react'
import { Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 select-none">
      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
        Bảng tiêu chuẩn Sinh viên 5 tốt
      </h1>

      {/* Filter and Action Group matching TrainingPointsHeader */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 self-start sm:self-auto">
        {/* Info button: Quy định thời gian xét duyệt */}
        <button
          type="button"
          onClick={onOpenRegulation}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1"
        >
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Quy định thời gian xét duyệt</span>
        </button>

        {/* Dropdown Năm học - Kích thước chuẩn như TrainingPointsHeader */}
        <Select
          value={selectedYearId ? String(selectedYearId) : ''}
          onValueChange={(val) => onYearChange(Number(val))}
        >
          <SelectTrigger className="w-[130px] sm:w-[145px] h-8 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs">
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

        {/* Select Cấp xét - Tự động co giãn theo độ dài chữ bên trong */}
        <Select value={selectedScope} onValueChange={(val) => onScopeChange(val as EvaluationScope)}>
          <SelectTrigger className="w-auto min-w-max h-8 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs gap-2 px-3">
            <SelectValue placeholder="Cấp xét">
              {selectedScope === 'UNIVERSITY' ? 'Cấp ĐHCT' : 'Cấp Khoa'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNIVERSITY">Cấp ĐHCT</SelectItem>
            <SelectItem value="FACULTY">Cấp Khoa</SelectItem>
          </SelectContent>
        </Select>

        {/* Nút Tìm - Kích thước chuẩn như TrainingPointsHeader */}
        <button
          type="button"
          onClick={onSearch}
          className="h-8 px-4 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
        >
          Tìm
        </button>
      </div>
    </div>
  )
}
