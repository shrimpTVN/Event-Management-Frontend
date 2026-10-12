import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ChevronLeft, ChevronRight, Check } from 'lucide-react'

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

export const StudentRightSidebar: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(23)
  const currentScore = 65
  const maxScore = 100
  const scorePercentage = (currentScore / maxScore) * 100

  // SVG Circle calculations for circular gauge
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference

  // Calendar dates representation for Month 10/2026 (Mon-Sun: T2 - CN)
  // Matching the design widget layout
  const calendarDays = [
    { day: 28, isCurrentMonth: false, hasEvent: false },
    { day: 29, isCurrentMonth: false, hasEvent: false },
    { day: 30, isCurrentMonth: false, hasEvent: false },
    { day: 1, isCurrentMonth: true, hasEvent: false },
    { day: 2, isCurrentMonth: true, hasEvent: false },
    { day: 3, isCurrentMonth: true, hasEvent: false },
    { day: 4, isCurrentMonth: true, hasEvent: false },

    { day: 5, isCurrentMonth: true, hasEvent: false },
    { day: 6, isCurrentMonth: true, hasEvent: false },
    { day: 7, isCurrentMonth: true, hasEvent: false },
    { day: 8, isCurrentMonth: true, hasEvent: true },
    { day: 9, isCurrentMonth: true, hasEvent: false },
    { day: 10, isCurrentMonth: true, hasEvent: false },
    { day: 11, isCurrentMonth: true, hasEvent: false },

    { day: 12, isCurrentMonth: true, hasEvent: false },
    { day: 13, isCurrentMonth: true, hasEvent: false },
    { day: 14, isCurrentMonth: true, hasEvent: false },
    { day: 15, isCurrentMonth: true, hasEvent: true },
    { day: 16, isCurrentMonth: true, hasEvent: false },
    { day: 17, isCurrentMonth: true, hasEvent: false },
    { day: 18, isCurrentMonth: true, hasEvent: false },

    { day: 19, isCurrentMonth: true, hasEvent: false },
    { day: 20, isCurrentMonth: true, hasEvent: false },
    { day: 21, isCurrentMonth: true, hasEvent: false },
    { day: 22, isCurrentMonth: true, hasEvent: true },
    { day: 23, isCurrentMonth: true, hasEvent: false },
    { day: 24, isCurrentMonth: true, hasEvent: false },
    { day: 25, isCurrentMonth: true, hasEvent: false },

    { day: 26, isCurrentMonth: true, hasEvent: false },
    { day: 27, isCurrentMonth: true, hasEvent: false },
    { day: 28, isCurrentMonth: true, hasEvent: false },
    { day: 29, isCurrentMonth: true, hasEvent: true },
    { day: 30, isCurrentMonth: true, hasEvent: false },
    { day: 31, isCurrentMonth: true, hasEvent: false },
    { day: 1, isCurrentMonth: false, hasEvent: false },
  ]

  return (
    <aside className="w-full flex flex-col gap-6 text-sm">
      {/* 1. TIẾN ĐỘ ĐIỂM RÈN LUYỆN Card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-5">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <BarChart3 className="h-4 w-4" />
          <span>TIẾN ĐỘ ĐIỂM RÈN LUYỆN</span>
        </div>

        {/* Circular Gauge + Classification */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background circle track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-muted"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-primary"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-foreground leading-none">
                {currentScore}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">/{maxScore}</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground/80">Xếp loại:</span>
            <span className="text-xl font-bold text-foreground tracking-tight">Trung Bình</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Cần thêm <strong className="text-primary font-semibold">5 điểm</strong> để xếp loại khá
        </p>

        {/* Breakdown by criteria */}
        <div className="flex flex-col gap-3.5 pt-1">
          {CRITERIA_LIST.map((item) => {
            const pct = Math.min(100, Math.round((item.current / item.max) * 100))
            return (
              <div key={item.id} className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-foreground">{item.name}</span>
                  <span className="flex items-center gap-1 text-foreground">
                    {item.current}/{item.max}
                    {item.isCompleted && <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />}
                  </span>
                </div>
                {/* Progress bar track */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isCompleted ? 'bg-emerald-600' : 'bg-slate-400'
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
          className="w-full inline-flex items-center justify-center rounded-xl bg-brand-subtle py-2.5 px-4 font-semibold text-xs text-primary hover:bg-primary/10 transition-colors"
        >
          → Xem chi tiết bảng điểm ĐRL
        </Link>
      </div>

      {/* 2. Interactive Calendar Widget */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-4">
        {/* Header Month & Arrows */}
        <div className="flex items-center justify-between px-1">
          <span className="font-semibold text-sm text-foreground">Tháng 10, 2026</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground">
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
          <span>CN</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {calendarDays.map((dateObj, idx) => {
            const isSelected = dateObj.isCurrentMonth && dateObj.day === selectedDay
            return (
              <button
                key={idx}
                type="button"
                onClick={() => dateObj.isCurrentMonth && setSelectedDay(dateObj.day)}
                className={`relative flex flex-col items-center justify-center h-8 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-200/80 font-bold text-foreground'
                    : dateObj.isCurrentMonth
                    ? 'text-foreground hover:bg-muted/70'
                    : 'text-muted-foreground/40'
                }`}
              >
                <span>{dateObj.day}</span>
                {dateObj.hasEvent && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
