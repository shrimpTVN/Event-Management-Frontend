import * as React from 'react'
import { cn } from '@/shared/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

    const variants = {
      default: 'bg-[#1B4B8A] text-white hover:bg-[#1E40AF] active:scale-[0.99] shadow-xs',
      outline:
        'border border-[#D1D5DB] dark:border-border bg-white dark:bg-background text-foreground hover:bg-[#F9FAFB] dark:hover:bg-muted active:scale-[0.99]',
      ghost: 'hover:bg-muted hover:text-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    }

    const sizes = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-6 text-base',
      icon: 'h-9 w-9',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
