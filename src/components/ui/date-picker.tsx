import React, { useState, useRef, useEffect } from 'react'
import {
  format,
  parse,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/shared/utils/cn'

export interface DatePickerProps {
  value?: string // format: 'YYYY-MM-DD'
  onChange?: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

// Auto-masking helper: formats raw input into DD/MM/YYYY with automatic slashes
export const maskDateInput = (inputVal: string, previousVal: string): string => {
  // If user is deleting character
  if (inputVal.length < previousVal.length) {
    // If backspaced right at slash, remove the number before slash as well so user does not get stuck
    if (previousVal.endsWith('/') && inputVal === previousVal.slice(0, -1)) {
      const digits = inputVal.replace(/\D/g, '')
      if (digits.length <= 2) return digits.slice(0, -1)
      if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2, -1)}`
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, -1)}`
    }
    return inputVal
  }

  // Handle pasted ISO date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(inputVal.trim())) {
    const parts = inputVal.trim().split('-')
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  // Strip non-digits and cap at 8 digits (DDMMYYYY)
  const digits = inputVal.replace(/\D/g, '').slice(0, 8)
  if (digits.length === 0) return ''
  if (digits.length === 1) return digits
  if (digits.length === 2) return `${digits}/`
  if (digits.length === 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  if (digits.length === 4) return `${digits.slice(0, 2)}/${digits.slice(2)}/`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY (VD: 15/10/2026)',
  className,
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Local text input state for direct keyboard typing
  const [inputText, setInputText] = useState(() => {
    if (!value) return ''
    const d = parseISO(value)
    return isValid(d) ? format(d, 'dd/MM/yyyy') : value
  })

  // Parse initial selected date or current date
  const parsedDate = value ? parseISO(value) : null
  const initialDate = parsedDate && isValid(parsedDate) ? parsedDate : new Date()

  // Current viewing month in calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(initialDate))

  // Sync when prop value changes externally
  useEffect(() => {
    if (value) {
      const d = parseISO(value)
      if (isValid(d)) {
        setInputText(format(d, 'dd/MM/yyyy'))
        setCurrentMonth(startOfMonth(d))
      } else {
        setInputText(value)
      }
    } else {
      setInputText('')
    }
  }, [value])

  // Handle click outside to close calendar popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle typing with smart auto-masking (10 -> 10/, 10/10 -> 10/10/)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const masked = maskDateInput(raw, inputText)
    setInputText(masked)

    if (!masked.trim()) {
      onChange?.('')
      return
    }

    // When full 8 digits (DD/MM/YYYY = 10 chars) are entered, parse and validate
    if (masked.length === 10) {
      const d = parse(masked, 'dd/MM/yyyy', new Date())
      if (isValid(d) && d.getFullYear() >= 1970 && d.getFullYear() <= 2099) {
        const formattedIso = format(d, 'yyyy-MM-dd')
        onChange?.(formattedIso)
        setCurrentMonth(startOfMonth(d))
      }
    }
  }

  // Normalize format on blur
  const handleBlur = () => {
    if (value) {
      const d = parseISO(value)
      if (isValid(d)) {
        setInputText(format(d, 'dd/MM/yyyy'))
      }
    } else if (inputText.length === 10) {
      const d = parse(inputText, 'dd/MM/yyyy', new Date())
      if (isValid(d) && d.getFullYear() >= 1970 && d.getFullYear() <= 2099) {
        onChange?.(format(d, 'yyyy-MM-dd'))
      } else {
        setInputText('')
      }
    }
  }

  // Days in month calculation for calendar popover
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handleSelectDay = (day: Date) => {
    if (disabled) return
    const formattedIso = format(day, 'yyyy-MM-dd')
    const formattedDisplay = format(day, 'dd/MM/yyyy')
    setInputText(formattedDisplay)
    onChange?.(formattedIso)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container allowing BOTH direct typing with auto-masking and calendar button */}
      <div className="relative">
        <Input
          id={id}
          type="text"
          disabled={disabled}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={10}
          className={cn(
            'pr-10 bg-white dark:bg-card text-foreground font-sans',
            className
          )}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors cursor-pointer"
          title="Mở lịch chọn ngày"
          tabIndex={-1}
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Popover Calendar Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-white dark:bg-card p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Month title & Navigation */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-semibold text-xs text-foreground font-sans">
              Tháng {format(currentMonth, 'M, yyyy')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday column headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-muted-foreground mb-1">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((dayDate, idx) => {
              const inCurrentMonth = isSameMonth(dayDate, currentMonth)
              const isSelected = parsedDate && isValid(parsedDate) && isSameDay(dayDate, parsedDate)
              const isToday = isSameDay(dayDate, new Date())

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(dayDate)}
                  className={cn(
                    'h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : inCurrentMonth
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground/30 hover:bg-muted/40',
                    isToday && !isSelected && 'border border-primary/40 font-semibold'
                  )}
                >
                  {dayDate.getDate()}
                </button>
              )
            })}
          </div>

          {/* Quick Action Footer: Hôm nay & Xóa */}
          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => handleSelectDay(new Date())}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Hôm nay
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  setInputText('')
                  onChange?.('')
                  setIsOpen(false)
                }}
                className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
