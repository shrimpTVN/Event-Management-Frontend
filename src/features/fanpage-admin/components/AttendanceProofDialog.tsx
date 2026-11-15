import * as Dialog from '@radix-ui/react-dialog'
import { ExternalLink, ImageOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventRegistrationItem } from '../types/fanpageAdmin.types'

export function AttendanceProofDialog({
  item,
  saved,
  isConfirming,
  error,
  disabled,
  onConfirm,
  onClose,
}: {
  item: EventRegistrationItem | null
  saved: boolean
  isConfirming: boolean
  error?: string
  disabled: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const images = [
    { label: 'Ảnh điểm danh đầu giờ', url: item?.startEvidenceUrl || item?.evidenceUrl },
    { label: 'Ảnh điểm danh cuối giờ', url: item?.endEvidenceUrl },
  ]
  const hasImages = images.some((image) => image.url)
  return (
    <Dialog.Root open={item != null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          <div className="flex shrink-0 flex-col gap-1 border-b border-border p-5 pr-14">
            <Dialog.Title className="font-k2d text-lg font-semibold">
              Minh chứng điểm danh
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              {item?.fullName} · {item?.studentId}
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Đóng ảnh minh chứng"
                className="absolute right-3 top-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div
            className={`grid min-h-0 gap-4 overflow-y-auto p-5 ${images.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}
          >
            {images.map((image) => (
              <div key={image.label} className="flex min-w-0 flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">{image.label}</p>
                {image.url ? (
                  <>
                    <img
                      src={image.url}
                      alt={`${image.label} của ${item?.fullName}`}
                      className="max-h-96 w-full rounded-lg border border-border object-contain"
                    />
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Xem ảnh gốc
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                ) : (
                  <div className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-4 text-center text-xs text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                    <span>Chưa có ảnh</span>
                  </div>
                )}
              </div>
            ))}
            {!hasImages && (
              <p className="text-xs text-muted-foreground sm:col-span-2">Chưa có ảnh minh chứng.</p>
            )}
          </div>
          {error && (
            <p role="alert" className="px-5 pb-4 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border p-4">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm">
                Đóng
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              size="sm"
              disabled={disabled || saved || !hasImages}
              onClick={onConfirm}
            >
              {saved ? 'Đã xác nhận' : isConfirming ? 'Đang xác nhận...' : 'Xác nhận'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
