import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface MobileFilterOption {
  value: string
  label: string
}

export interface MobileFilterSheetProps {
  title: string
  value: string
  displayValue: string
  options: MobileFilterOption[]
  onChange: (value: string) => void
  accessibleLabel: string
  triggerClassName?: string
}

export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  title,
  value,
  displayValue,
  options,
  onChange,
  accessibleLabel,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false)

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          type="button"
          aria-label={accessibleLabel}
          className={cn(
            'flex h-11 min-h-11 w-full items-center justify-between gap-2 rounded-lg border-border bg-background px-3.5 text-sm font-medium text-foreground shadow-none hover:bg-muted/40 cursor-pointer',
            triggerClassName
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        overlayClassName="backdrop-blur-none data-[state=open]:duration-150 data-[state=closed]:duration-150 motion-reduce:animate-none"
        className="rounded-t-2xl px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[80vh] flex flex-col gap-3 will-change-transform data-[state=open]:duration-150 data-[state=closed]:duration-150 motion-reduce:animate-none"
      >
        <SheetHeader className="pb-3 border-b border-border/60 text-left">
          <SheetTitle className="text-base font-semibold font-heading text-foreground">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 py-1 overflow-y-auto custom-scrollbar">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <Button
                variant="ghost"
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'flex h-auto min-h-11 w-full items-center justify-between gap-3 whitespace-normal rounded-lg px-3.5 py-3 text-left text-sm font-medium cursor-pointer',
                  isSelected
                    ? 'text-primary font-semibold bg-primary/10 dark:bg-primary/20'
                    : 'text-foreground hover:bg-muted/60'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
              </Button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
