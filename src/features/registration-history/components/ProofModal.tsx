import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { formatEventTitle } from '@/shared'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { RegisteredEventItem } from '../types/history.types'

interface ProofModalProps {
  isOpen: boolean
  onClose: () => void
  event: RegisteredEventItem | null
  onComplaint?: (event: RegisteredEventItem) => void
}

function attendanceTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value
  return `${part('hour')}:${part('minute')} · ${part('day')}/${part('month')}/${part('year')}`
}

export function ProofModal({ isOpen, onClose, event, onComplaint }: ProofModalProps) {
  const user = useAuthStore((state) => state.user)
  if (!isOpen || !event) return null
  const title = formatEventTitle(event.title || event.eventName || 'Sự kiện')
  const isCurrentStudent = user && (event.userId == null || String(event.userId) === user.id)
  const studentName = event.studentInfo?.fullName || (isCurrentStudent ? user.name : '')
  const studentId = event.studentInfo?.mssv || (isCurrentStudent ? user.studentId : '')
  const actorLabel = (actor?: string | number | null) => {
    if (actor == null || String(actor).trim() === '') return 'Chưa có thông tin'
    const str = String(actor).trim()
    if (user && (str === user.id || str === user.name)) return 'Bạn'
    if (/^\d+$/.test(str)) return `Tài khoản #${str}`
    return str
  }
  const entries = [
    {
      label: 'Check-in',
      time: event.checkInAt,
      actor: event.checkInByName || event.checkInBy,
      image: event.checkInEvidenceUrl || event.evidenceUrl,
    },
    {
      label: 'Check-out',
      time: event.checkOutAt,
      actor: event.checkOutByName || event.checkOutBy,
      image: event.checkOutEvidenceUrl,
    },
  ]
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          <div className="flex flex-col gap-1 border-b border-border p-5 pr-12">
            <Dialog.Title className="font-k2d text-lg font-semibold">
              Minh chứng điểm danh
            </Dialog.Title>
            <Dialog.Description className="break-words text-xs text-muted-foreground">
              {title}
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 h-8 w-8"
                aria-label="Đóng minh chứng"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-5">
            {(studentName || studentId) && (
              <p className="text-sm font-medium">
                {[studentName, studentId].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Lượt
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Thời gian
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Người điểm danh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr key={entry.label}>
                      <th scope="row" className="px-3 py-3 font-medium">
                        <div className="flex flex-col items-start gap-1">
                          {entry.label}
                          {entry.image && (
                            <a
                              href={entry.image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-normal text-primary hover:underline"
                              aria-label={`Xem ảnh ${entry.label}`}
                            >
                              Xem ảnh
                            </a>
                          )}
                        </div>
                      </th>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                        {attendanceTime(entry.time)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {entry.time ? actorLabel(entry.actor) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            {onComplaint && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-auto"
                onClick={() => onComplaint(event)}
              >
                Khiếu nại
              </Button>
            )}
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm">
                Đóng
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
