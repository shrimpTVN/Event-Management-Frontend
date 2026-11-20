import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { fanpageStatisticsService } from '../services/fanpageStatisticsService'
import type { FanpageFeedPost } from '../types/fanpageAdmin.types'

interface Props {
  fanpageId: string
  post: FanpageFeedPost
  onClose: () => void
  onOpenRegistrations: (eventId: string) => void
}
export const EventAnalyticsModal = ({ fanpageId, post, onClose, onOpenRegistrations }: Props) => {
  const eventId = post.eventId || post.id
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['event-statistics', fanpageId, eventId],
    queryFn: () => fanpageStatisticsService.getEventOverview(fanpageId, eventId),
    retry: false,
  })
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card p-5 text-left text-foreground shadow-xl focus:outline-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Dialog.Title className="text-xs font-medium text-muted-foreground">
                Số liệu sự kiện
              </Dialog.Title>
              <Dialog.Description className="font-k2d text-base font-semibold leading-snug text-foreground">
                {post.title}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground"
                aria-label="Đóng số liệu"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          {isPending ? (
            <Skeleton className="h-36 w-full" />
          ) : isError || !data ? (
            <div className="flex flex-col items-start gap-2 py-3" role="status">
              <p className="text-sm text-muted-foreground">Chưa tải được số liệu sự kiện.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/30 py-3">
                <div className="flex flex-col gap-1 px-4">
                  <dt className="text-xs text-muted-foreground">Lượt đăng ký</dt>
                  <dd className="text-2xl font-semibold tabular-nums">
                    {data.totalRegistrations.toLocaleString('vi-VN')}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 px-4">
                  <dt className="text-xs text-muted-foreground">Đã điểm danh</dt>
                  <dd className="text-2xl font-semibold tabular-nums">
                    {data.totalAttended.toLocaleString('vi-VN')}
                  </dd>
                </div>
              </dl>
              <dl className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Chỉ tiêu</dt>
                  <dd>
                    {data.capacity > 0
                      ? `${data.capacity.toLocaleString('vi-VN')} sinh viên`
                      : 'Không giới hạn'}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Tỷ lệ điểm danh</dt>
                  <dd className="tabular-nums">
                    {data.totalRegistrations > 0
                      ? `${data.attendanceRate.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Đóng
              </Button>
            </Dialog.Close>
            <Button
              size="sm"
              onClick={() => {
                onClose()
                onOpenRegistrations(eventId)
              }}
            >
              Xem danh sách đăng ký
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
