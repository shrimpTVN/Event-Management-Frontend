import * as Dialog from '@radix-ui/react-dialog'
import { Award, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SuperAdminEvent } from '../../types/superAdmin.types'

export function EventBenefitsModal({
  event,
  onClose,
}: {
  event: SuperAdminEvent | null
  onClose: () => void
}) {
  return (
    <Dialog.Root open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          <div className="flex shrink-0 flex-col gap-2 border-b border-border p-5 pr-14">
            <Dialog.Title className="font-k2d text-lg font-semibold">
              Quyền lợi tham gia
            </Dialog.Title>
            <Dialog.Description className="break-words text-sm text-muted-foreground">
              {event?.title}
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-3 top-3"
                aria-label="Đóng quyền lợi"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-5">
            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Award className="h-4 w-4 text-muted-foreground" />
                Điểm rèn luyện
              </h3>
              {event?.eventPoints?.length ? (
                <ul className="flex flex-col gap-2">
                  {event.eventPoints.map((point) => (
                    <li
                      key={point.pointCategoryId}
                      className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground"
                    >
                      +{point.point} điểm{point.code ? ` mục ${point.code}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không có điểm rèn luyện được ghi nhận.
                </p>
              )}
            </section>
            <section className="flex flex-col gap-3 border-t border-border pt-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4 text-muted-foreground" />
                Sinh viên 5 tốt
              </h3>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {event?.sv5tCriteriaName || 'Không có tiêu chí được ghi nhận.'}
              </p>
            </section>
          </div>
          <div className="flex shrink-0 justify-end border-t border-border p-4">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
