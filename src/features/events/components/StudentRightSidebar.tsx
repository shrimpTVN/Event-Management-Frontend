import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns'

interface CriteriaItem {
  id: string
  name: string
  current: number
  max: number
  isCompleted?: boolean
}

const CRITERIA_LIST: CriteriaItem[] = [
  { id: '1', name: 'Mục I', current: 12, max: 20 },
  { id: '2', name: 'Mục II', current: 15, max: 25 },
  { id: '3', name: 'Mục III', current: 12, max: 20 },
  { id: '4', name: 'Mục IV', current: 15, max: 15, isCompleted: true },
  { id: '5', name: 'Mục V', current: 5, max: 20 },
]

// Mock dates with events (in 2026-10) matching the Figma mockup
const EVENT_DAY_NUMBERS = [8, 15, 22, 29]

export const StudentRightSidebar: React.FC = () => {
  // Default to Month 10/2026 matching Figma design (day 23 selected)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 9, 1))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 9, 23))

  const currentScore = 65
  const maxScore = 100
  const scorePercentage = (currentScore / maxScore) * 100

  // SVG Circle calculations for circular gauge
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference

  // Compute days in grid (starts on Monday: weekStartsOn = 1)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  return (
    <aside className="w-full flex flex-col gap-6 text-sm">
      {/* 1. TIẾN ĐỘ ĐIỂM RÈN LUYỆN Section (Seamless on #F0F2F5 canvas as in Figma) */}
      <div className="flex flex-col gap-3.5 font-sans">
        <div className="flex items-center gap-2 text-[#111827] dark:text-foreground font-medium text-xs tracking-wide">
          <BarChart3 className="h-4 w-4 text-[#111827] dark:text-foreground" />
          <span>TIẾN ĐỘ ĐIỂM RÈN LUYỆN</span>
        </div>

        {/* Circular Gauge + Classification */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background circle track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-[#D9D9D9] dark:stroke-muted"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-[#008CCC]"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-k2d font-semibold text-[22.4px] text-black dark:text-foreground leading-none">
                {currentScore}
              </span>
              <span className="text-[10.4px] font-medium text-[#6B7280] mt-0.5">/{maxScore}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-[15px] font-normal text-black dark:text-foreground">Xếp loại:</span>
            <span className="font-k2d font-bold text-[18px] text-black dark:text-foreground tracking-tight">Trung Bình</span>
          </div>
        </div>

        <p className="text-[9px] text-[#6B7280] text-center font-medium">
          Cần thêm <span className="font-semibold text-[#285FA4]">5 điểm</span> để xếp loại khá
        </p>

        {/* Breakdown by criteria */}
        <div className="flex flex-col gap-2 pt-1">
          {CRITERIA_LIST.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.current / item.max) * 100))
            const isLast = idx === CRITERIA_LIST.length - 1
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-1 text-xs ${
                  !isLast ? 'border-b border-[#E5E7EB] dark:border-border/60 pb-2' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[9.5px] text-black dark:text-foreground">{item.name}</span>
                  <span className="flex items-center gap-1 font-semibold text-[9.5px] text-black dark:text-foreground">
                    {item.current}/{item.max}
                    {item.isCompleted && <Check className="h-3 w-3 text-[#3B8858] stroke-[3]" />}
                  </span>
                </div>
                {/* Progress bar track */}
                <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] dark:bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isCompleted ? 'bg-[#3B8858]' : 'bg-[#9CA3AF]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Button */}
        <Link
          to="/drl"
          className="w-full inline-flex items-center justify-center rounded-lg bg-[#DCEAF8] py-2 px-3 font-semibold text-[10.5px] text-[#1B406F] hover:bg-[#DCEAF8]/80 transition-colors"
        >
          → Xem chi tiết bảng điểm ĐRL
        </Link>
      </div>

      {/* 2. Interactive Calendar Widget (border #E5E7EB, bg #F0F2F5 as in Figma) */}
      <div className="rounded-2xl border border-[#E5E7EB] dark:border-border bg-[#F0F2F5] dark:bg-card p-2.5 sm:p-3 flex flex-col gap-3 font-sans">
        {/* Header Month & Arrows */}
        <div className="flex items-center justify-between px-1">
          <span className="font-medium text-xs text-[#111827] dark:text-foreground">
            Tháng {format(currentMonth, 'M, yyyy')}
          </span>
          <div className="flex items-center gap-1 text-[#9CA3AF]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center text-[8px] font-semibold text-[#9CA3AF]">
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
          <span>CN</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-[9.5px]">
          {calendarDays.map((dayDate, idx) => {
            const inCurrentMonth = isSameMonth(dayDate, currentMonth)
            const isSelected = isSameDay(dayDate, selectedDate)
            const dayNum = dayDate.getDate()
            const hasEvent =
              inCurrentMonth &&
              currentMonth.getMonth() === 9 &&
              EVENT_DAY_NUMBERS.includes(dayNum)

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedDate(dayDate)
                  if (!inCurrentMonth) {
                    setCurrentMonth(startOfMonth(dayDate))
                  }
                }}
                className={`relative flex flex-col items-center justify-center h-7 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-[#BDD7F0] text-[#1B365D] font-bold shadow-xs'
                    : inCurrentMonth
                    ? 'text-black dark:text-foreground hover:bg-muted/70 font-medium'
                    : 'text-[#9CA3AF]/40'
                }`}
              >
                <span>{dayNum}</span>
                {hasEvent && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#008CCC]" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

