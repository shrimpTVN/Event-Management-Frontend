import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AttendanceTick({
  checked,
  disabled,
  label,
  name,
  onChange,
  compact = false,
  indeterminate = false,
}: {
  checked: boolean
  disabled: boolean
  label: string
  name: string
  onChange: () => void
  compact?: boolean
  indeterminate?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={`${label} ${name}`}
      disabled={disabled}
      onClick={onChange}
      className={`h-8 shrink-0 gap-1.5 text-xs font-medium text-foreground disabled:opacity-60 ${compact ? 'w-8 px-0' : 'px-2'}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${checked ? 'border-primary bg-brand-subtle text-brand-subtle-foreground' : 'border-input bg-background'}`}
      >
        {indeterminate ? (
          <span className="h-0.5 w-2 bg-current" />
        ) : (
          checked && <Check className="h-3 w-3" />
        )}
      </span>
      {!compact && label}
    </Button>
  )
}
