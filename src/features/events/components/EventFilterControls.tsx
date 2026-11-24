import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { EventFilterModal, type EventFilterFormValues } from './EventFilterModal'
import type { EventFilterOptions } from '../services/eventFilterOptionsService'
import { eventFilterChips, removeEventFilter, type FilterableEvent } from '../utils/eventFilters'

interface FilterProps {
  values: EventFilterFormValues
  onChange: (values: EventFilterFormValues) => void
  options?: EventFilterOptions
}

export function EventFilterButton({
  values,
  onChange,
  options,
  events,
  hideFanpageFilter = false,
  showLabelOnMobile = false,
  className = '',
}: FilterProps & {
  events: FilterableEvent[]
  hideFanpageFilter?: boolean
  showLabelOnMobile?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const count = eventFilterChips(values, options).length
  return (
    <>
      <Tooltip content="Bộ lọc sự kiện">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label="Bộ lọc sự kiện"
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`h-9 shrink-0 gap-1.5 px-2.5 text-xs ${count ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border/70 text-muted-foreground'} ${className}`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span className={showLabelOnMobile ? '' : 'hidden sm:inline'}>Bộ lọc</span>
          {count > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground px-1 text-[10px] font-bold">
              {count}
            </span>
          )}
        </Button>
      </Tooltip>
      <EventFilterModal
        isOpen={open}
        onClose={() => setOpen(false)}
        initialValues={values}
        onApply={onChange}
        events={events}
        hideFanpageFilter={hideFanpageFilter}
        options={options}
      />
    </>
  )
}

export function EventFilterChips({
  values,
  onChange,
  options,
  touchFriendly = false,
}: FilterProps & { touchFriendly?: boolean }) {
  const chips = eventFilterChips(values, options)
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-1" aria-label="Bộ lọc đang áp dụng">
      {chips.map((chip) => (
        <Tooltip content={chip.label} key={chip.key}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`${touchFriendly ? 'h-11' : 'h-8'} max-w-[240px] gap-1.5 rounded-lg border border-primary/10 bg-primary/5 px-2 text-xs font-normal text-primary hover:bg-primary/10`}
            aria-label={`Bỏ lọc: ${chip.label}`}
            onClick={() => onChange(removeEventFilter(values, chip.key))}
          >
            <span className="truncate">{chip.label}</span>
            <X className="h-3 w-3 shrink-0" aria-hidden="true" />
          </Button>
        </Tooltip>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`${touchFriendly ? 'h-11' : 'h-8'} px-2 text-xs font-normal text-muted-foreground`}
        onClick={() => onChange({})}
      >
        {touchFriendly ? 'Xóa lọc' : 'Xóa tất cả'}
      </Button>
    </div>
  )
}
