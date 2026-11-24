import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Share2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ShareEventButton({ eventId, title }: { eventId: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const url = new URL(`/events/${encodeURIComponent(eventId)}`, window.location.origin).href
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Đã sao chép liên kết')
    } catch {
      setMessage('Chạm giữ liên kết để sao chép.')
    }
  }
  const share = async () => {
    setMessage('')
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }
    setOpen(true)
  }
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => void share()}
        aria-label="Chia sẻ"
        className="flex h-11 items-center justify-center gap-2 px-2 text-muted-foreground md:w-11 md:px-0"
      >
        <Share2 className="h-5 w-5 md:h-6 md:w-6" />
        <span className="text-xs font-medium md:hidden">Chia sẻ</span>
      </Button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Dialog.Title className="font-semibold">Chia sẻ sự kiện</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" className="h-11 w-11 p-0" aria-label="Đóng">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="text-sm text-muted-foreground break-words">
              {title}
            </Dialog.Description>
            <Input
              aria-label="Liên kết sự kiện"
              readOnly
              value={url}
              onFocus={(event) => event.target.select()}
              className="h-11"
            />
            <p role="status" className="text-xs text-muted-foreground">
              {message}
            </p>
            <Button className="h-11" onClick={() => void copy()}>
              Sao chép liên kết
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
