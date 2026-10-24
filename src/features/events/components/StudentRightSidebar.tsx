import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared'
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

const CATEGORY_MAX_MAP: Record<number, { name: string; max: number }> = {
  1: { name: 'Mục I. Ý thức học tập', max: 20 },
  2: { name: 'Mục II. Chấp hành nội quy', max: 25 },
  3: { name: 'Mục III. Hoạt động CTXH', max: 20 },
  4: { name: 'Mục IV. Quan hệ cộng đồng', max: 15 },
  5: { name: 'Mục V. Hoạt động lớp/đoàn', max: 20 },
}

export const StudentRightSidebar: React.FC = () => {
  // Default to Month 10/2026 matching current semester period
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 9, 1))
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 9, 23))

  // 1. Fetch training semester points
  const { data: semesterPoints } = useQuery<any[]>({
    queryKey: ['student-semester-points', 'current'],
    queryFn: async () => {
      const res: any = await apiClient.get('/student-semester-points/me/semesters/1')
      return Array.isArray(res) ? res : res?.data || []
    },
  })

  // 2. Fetch events to dynamically pinpoint event days on calendar
  const { data: eventsList } = useQuery<any[]>({
    queryKey: ['events', 'calendar'],
    queryFn: async () => {
      const res: any = await apiClient.get('/events', { params: { size: 50 } })
      if (res && Array.isArray(res.content)) return res.content
      if (Array.isArray(res)) return res
      return []
    },
  })

  // Compute criteria items and total points strictly from server response
  const { criteriaList, currentScore, classification, pointsNeeded } = useMemo(() => {
    const pointsArray = Array.isArray(semesterPoints) ? semesterPoints : []

    const list: CriteriaItem[] = [1, 2, 3, 4, 5].map((catId) => {
      const sp = pointsArray.find((p: any) => p.pointCategoryId === catId)
      const current = sp ? sp.totalPoint : 0
      const meta = CATEGORY_MAX_MAP[catId]
      return {
        id: String(catId),
        name: meta.name,
        current,
        max: meta.max,
        isCompleted: current >= meta.max,
      }
    })

    const total = list.reduce((acc, item) => acc + item.current, 0)

    let rank = 'Yếu'
    let needed = 0
    if (total >= 90) {
      rank = 'Xuất sắc'
    } else if (total >= 80) {
      rank = 'Tốt'
      needed = 90 - total
    } else if (total >= 65) {
      rank = 'Khá'
      needed = 80 - total
    } else if (total >= 50) {
      rank = 'Trung Bình'
      needed = 65 - total
    } else {
      rank = 'Yếu'
      needed = 50 - total
    }

    return {
      criteriaList: list,
      currentScore: total,
      classification: rank,
      pointsNeeded: needed,
    }
  }, [semesterPoints])

  // Extract event day numbers in the currently displayed month from server data
  const eventDaysInMonth = useMemo(() => {
    if (!eventsList || !Array.isArray(eventsList)) return []
    const days: number[] = []
    eventsList.forEach((ev: any) => {
      const dStr = ev.dateHappen || ev.startTime
      if (dStr) {
        const d = new Date(dStr)
        if (d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()) {
          days.push(d.getDate())
        }
      }
    })
    return days
  }, [eventsList, currentMonth])

  const maxScore = 100
  const scorePercentage = Math.min(100, (currentScore / maxScore) * 100)

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
      {/* 1. TIẾN ĐỘ ĐIỂM RÈN LUYỆN Section */}
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
            <span className="font-k2d font-bold text-[18px] text-black dark:text-foreground tracking-tight">
              {classification}
            </span>
          </div>
        </div>

        {pointsNeeded > 0 ? (
          <p className="text-[9px] text-[#6B7280] text-center font-medium">
            Cần thêm <span className="font-semibold text-[#285FA4]">{pointsNeeded} điểm</span> để nâng hạng tiếp theo
          </p>
        ) : (
          <p className="text-[9px] text-emerald-600 text-center font-medium">
            Đã đạt mức xếp loại tối đa!
          </p>
        )}

        {/* Breakdown by criteria */}
        <div className="flex flex-col gap-2 pt-1">
          {criteriaList.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.current / item.max) * 100))
            const isLast = idx === criteriaList.length - 1
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-1 text-xs ${
                  !isLast ? 'border-b border-[#E5E7EB] dark:border-border/60 pb-2' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[9.5px] text-black dark:text-foreground truncate max-w-[160px]">
                    {item.name}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[9.5px] text-black dark:text-foreground">
                    {item.current}/{item.max}
                    {item.isCompleted && <Check className="h-3 w-3 text-[#3B8858] stroke-[3]" />}
                  </span>
                </div>
                {/* Progress bar track */}
                <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] dark:bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isCompleted ? 'bg-[#3B8858]' : 'bg-[#008CCC]'
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
          to="/history"
          className="w-full inline-flex items-center justify-center rounded-lg bg-[#DCEAF8] py-2 px-3 font-semibold text-[10.5px] text-[#1B406F] hover:bg-[#DCEAF8]/80 transition-colors"
        >
          → Xem lịch sử hoạt động & ĐRL
        </Link>
      </div>

      {/* 2. Interactive Calendar Widget */}
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
              className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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
            const hasEvent = inCurrentMonth && eventDaysInMonth.includes(dayNum)

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
                className={`relative flex flex-col items-center justify-center h-7 rounded-md transition-colors cursor-pointer ${
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
