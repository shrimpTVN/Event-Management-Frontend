import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CatalogDialog({
  open,
  title,
  description,
  busy,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  busy?: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl">
          <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/70 pb-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="font-k2d text-lg font-bold leading-snug">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs leading-relaxed text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              aria-label="Đóng"
              disabled={busy}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
