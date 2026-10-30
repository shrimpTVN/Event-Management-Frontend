import * as React from 'react'
import { cn } from '@/shared/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[90px] w-full rounded-lg border border-[#D1D5DB] dark:border-border bg-white dark:bg-background px-3.5 py-2.5 text-sm text-foreground shadow-2xs transition-colors placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
