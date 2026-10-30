import React, { useState, useRef, useEffect } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/shared/utils/cn'

export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

export interface TimeSelectProps {
  value?: string
  onChange?: (val: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
}

// Auto-masking helper: formats raw input into HH:mm with automatic colon (e.g. 02 -> 02:)
export const maskTimeInput = (inputVal: string, previousVal: string): string => {
  // If user is deleting
  if (inputVal.length < previousVal.length) {
    if (previousVal.endsWith(':') && inputVal === previousVal.slice(0, -1)) {
      const digits = inputVal.replace(/\D/g, '')
      return digits.slice(0, 1)
    }
    return inputVal
  }

  // Strip non-digits and cap at 4 digits (HHmm)
  const digits = inputVal.replace(/\D/g, '').slice(0, 4)
  if (digits.length === 0) return ''
  if (digits.length === 1) {
    // If first digit is > 2 (e.g. 3, 4.. 9), automatically treat as 03:, 08:
    const num = Number(digits)
    if (num >= 3 && num <= 9) {
      return `0${digits}:`
    }
    return digits
  }
  if (digits.length === 2) {
    let hh = Number(digits)
    if (hh > 23) hh = 23
    return `${String(hh).padStart(2, '0')}:`
  }
  if (digits.length === 3) {
    let hh = Number(digits.slice(0, 2))
    if (hh > 23) hh = 23
    return `${String(hh).padStart(2, '0')}:${digits.slice(2)}`
  }
  // 4 digits: HH:mm
  let hh = Number(digits.slice(0, 2))
  let mm = Number(digits.slice(2, 4))
  if (hh > 23) hh = 23
  if (mm > 59) mm = 59
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value = '',
  onChange,
  placeholder = 'HH:mm (VD: 08:00)',
  className,
  disabled = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)

  // Sync when prop value changes externally
  useEffect(() => {
    setInputText(value || '')
  }, [value])

  // Split current value into hour and minute
  const [currentHour, currentMinute] = React.useMemo(() => {
    if (value && value.includes(':')) {
      const parts = value.split(':')
      return [parts[0] || '08', parts[1] || '00']
    }
    return ['08', '00']
  }, [value])

  // Auto-scroll selected hour & minute into view when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourListRef.current) {
          const selectedHourEl = hourListRef.current.querySelector('[data-selected="true"]')
          selectedHourEl?.scrollIntoView({ block: 'center' })
        }
        if (minuteListRef.current) {
          const selectedMinuteEl = minuteListRef.current.querySelector('[data-selected="true"]')
          selectedMinuteEl?.scrollIntoView({ block: 'center' })
        }
      }, 50)
    }
  }, [isOpen])

  // Handle click outside to close dropdown
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

  // Direct typing with auto-masking (e.g. 02 -> 02:)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const masked = maskTimeInput(raw, inputText)
    setInputText(masked)

    if (!masked.trim()) {
      onChange?.('')
      return
    }

    // When full 5 chars (HH:mm) are formed, validate and trigger onChange
    if (masked.length === 5) {
      const parts = masked.split(':')
      const hh = Number(parts[0])
      const mm = Number(parts[1])
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        onChange?.(masked)
      }
    }
  }

  // Handle blur
  const handleBlur = () => {
    if (inputText.length === 5) {
      const parts = inputText.split(':')
      const hh = Number(parts[0])
      const mm = Number(parts[1])
      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        onChange?.(inputText)
        return
      }
    }
    // If incomplete on blur, revert to valid value or clear
    if (value) {
      setInputText(value)
    } else {
      setInputText('')
      onChange?.('')
    }
  }

  // Handle Hour Click
  const handleSelectHour = (newHour: string) => {
    const minute = currentMinute || '00'
    const formatted = `${newHour}:${minute}`
    setInputText(formatted)
    onChange?.(formatted)
  }

  // Handle Minute Click
  const handleSelectMinute = (newMinute: string) => {
    const hour = currentHour || '08'
    const formatted = `${hour}:${newMinute}`
    setInputText(formatted)
    onChange?.(formatted)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          id={id}
          type="text"
          disabled={disabled}
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={5}
          className={cn(
            'pl-9 pr-8 bg-white dark:bg-card text-foreground font-sans',
            className
          )}
        />
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Chọn giờ và phút"
          tabIndex={-1}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Dropdown 2 Columns: Giờ (00-23) & Phút (00-59) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-border bg-white dark:bg-card p-2.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="grid grid-cols-2 text-center text-xs font-semibold text-muted-foreground pb-1.5 mb-1.5 border-b border-border">
            <span>Giờ</span>
            <span>Phút</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 h-48">
            {/* Cột chọn Giờ (00-23) */}
            <div
              ref={hourListRef}
              className="overflow-y-auto pr-1 space-y-0.5 scrollbar-thin max-h-48"
            >
              {HOURS.map((h) => {
                const isSelected = currentHour === h
                return (
                  <button
                    key={h}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelectHour(h)}
                    className={cn(
                      'w-full py-1 rounded-md text-xs font-medium text-center transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary text-white font-bold shadow-2xs'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {h}
                  </button>
                )
              })}
            </div>

            {/* Cột chọn Phút (00-59) */}
            <div
              ref={minuteListRef}
              className="overflow-y-auto pl-1 space-y-0.5 border-l border-border/60 scrollbar-thin max-h-48"
            >
              {MINUTES.map((m) => {
                const isSelected = currentMinute === m
                return (
                  <button
                    key={m}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => handleSelectMinute(m)}
                    className={cn(
                      'w-full py-1 rounded-md text-xs font-medium text-center transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary text-white font-bold shadow-2xs'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Action Footer: Nút Giờ hiện tại & Xong */}
          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                const hh = String(now.getHours()).padStart(2, '0')
                const mm = String(now.getMinutes()).padStart(2, '0')
                const time = `${hh}:${mm}`
                setInputText(time)
                onChange?.(time)
                setIsOpen(false)
              }}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Hiện tại
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer px-2 py-0.5 rounded hover:bg-muted transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
