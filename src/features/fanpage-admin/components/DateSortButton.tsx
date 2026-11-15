import { Tooltip } from '@/components/ui/tooltip'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DateSortDirection } from '../utils/dateSort'

export function DateSortButton({
  label,
  direction,
  onChange,
}: {
  label: string
  direction: DateSortDirection
  onChange: (direction: DateSortDirection) => void
}) {
  return (
    <Tooltip content={direction === 'desc' ? 'Sắp xếp cũ nhất trước' : 'Sắp xếp mới nhất trước'}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
        aria-label={`${label}: ${direction === 'desc' ? 'mới nhất trước' : direction === 'asc' ? 'cũ nhất trước' : 'chưa sắp xếp'}`}
        onClick={() => onChange(direction === 'desc' ? 'asc' : 'desc')}
      >
        {label}
        {direction === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : direction === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5" />
        )}
      </Button>
    </Tooltip>
  )
}
