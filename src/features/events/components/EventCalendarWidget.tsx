import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  isToday,
} from 'date-fns'
import {
  type RegisteredEventItem,
  normalizeHistoryStatus,
  parseEventDate,
} from '@/features/registration-history'

export interface EventCalendarWidgetProps {
  registeredEvents?: RegisteredEventItem[]
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
  initialMonth?: Date
  className?: string
}

export const EventCalendarWidget: React.FC<EventCalendarWidgetProps> = ({
  registeredEvents = [],
  selectedDate: propSelectedDate,
  onSelectDate,
  initialMonth,
  className = '',
}) => {
  // Mặc định lấy theo tháng và ngày hiện tại thực tế (today)
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => initialMonth || startOfMonth(new Date())
  )
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(
    () => propSelectedDate || new Date()
  )

  const selectedDate = propSelectedDate || internalSelectedDate

  const handleDateClick = (dayDate: Date, inCurrentMonth: boolean) => {
    setInternalSelectedDate(dayDate)
    onSelectDate?.(dayDate)
    if (!inCurrentMonth) {
      setCurrentMonth(startOfMonth(dayDate))
    }
  }

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))

  // Filter out cancelled events to only count valid registered events
  const validRegistrations = useMemo(() => {
    if (!Array.isArray(registeredEvents)) return []
    return registeredEvents.filter((e) => {
      const status = normalizeHistoryStatus(e.status)
      return status !== 'CANCELLED'
    })
  }, [registeredEvents])

  // Map each day to registered events occurring on that day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, RegisteredEventItem[]>()
    validRegistrations.forEach((event) => {
      const eventDate = parseEventDate(event)
      if (eventDate) {
        const key = format(eventDate, 'yyyy-MM-dd')
        const existing = map.get(key) || []
        existing.push(event)
        map.set(key, existing)
      }
    })
    return map
  }, [validRegistrations])

  // Compute grid days (starts on Monday: weekStartsOn = 1)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div
      className={`rounded-2xl border border-[#E2E8F0] dark:border-border/60 bg-white/60 hover:bg-white/80 dark:bg-card/60 backdrop-blur-xs shadow-xs p-2.5 sm:p-3 flex flex-col gap-3 font-sans select-none transition-all ${className}`}
    >
      {/* Header Month & Navigation Arrows */}
      <div className="flex items-center justify-between px-1">
        <span className="font-semibold text-xs text-[#111827] dark:text-foreground">
          Tháng {format(currentMonth, 'M, yyyy')}
        </span>
        <div className="flex items-center gap-1 text-[#9CA3AF]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Tháng trước"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Tháng sau"
            aria-label="Tháng sau"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Column Headers (T2 đến CN) */}
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
          const isCurrentDay = isToday(dayDate)
          const dayNum = dayDate.getDate()

          const dateKey = format(dayDate, 'yyyy-MM-dd')
          const eventsOnThisDay = eventsByDay.get(dateKey) || []
          const hasRegisteredEvent = inCurrentMonth && eventsOnThisDay.length > 0

          const tooltipText = hasRegisteredEvent
            ? eventsOnThisDay.map((e) => e.title || e.eventName || 'Sự kiện đã đăng ký').join('; ')
            : undefined

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateClick(dayDate, inCurrentMonth)}
              title={tooltipText}
              className={`relative flex flex-col items-center justify-center h-7 rounded-md transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#BDD7F0] text-[#1B365D] font-bold shadow-xs'
                  : inCurrentMonth
                  ? isCurrentDay
                    ? 'text-primary font-bold ring-1 ring-primary/40'
                    : 'text-[#374151] dark:text-foreground hover:bg-muted/70 font-medium'
                  : 'text-[#9CA3AF]/40 hover:text-[#9CA3AF]/70'
              }`}
            >
              <span>{dayNum}</span>
              {/* Only show dot if there are actual registered events on this date */}
              {hasRegisteredEvent && (
                <span
                  data-testid={`event-dot-${dayNum}`}
                  className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#008CCC]"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

