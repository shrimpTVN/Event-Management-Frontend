import { Tooltip } from './tooltip'
import { cn } from '@/lib/utils'

export function TextTooltip({
  label,
  content,
  className,
}: {
  label: string
  content: string
  className?: string
}) {
  return (
    <Tooltip content={content}>
      <span
        className={cn(
          'cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          className
        )}
      >
        {label}
      </span>
    </Tooltip>
  )
}
