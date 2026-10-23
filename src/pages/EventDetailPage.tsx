import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CalendarDays } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { EventDetailView, StudentLeftSidebar, eventService } from '@/features/events'

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: Boolean(id),
  })

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-4xl flex flex-col gap-6 pb-16">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại danh sách sự kiện</span>
            </Link>

            {isLoading ? (
              <div className="w-full rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải thông tin sự kiện...</p>
              </div>
            ) : event ? (
              <EventDetailView event={event} />
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-2">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold text-foreground text-base">
                  Không tìm thấy sự kiện
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {error
                    ? 'Không thể tải chi tiết sự kiện này hoặc sự kiện đã bị xóa.'
                    : 'Sự kiện không tồn tại hoặc bạn không có quyền xem.'}
                </p>
                <Link
                  to="/events"
                  className="mt-3 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Khám phá sự kiện khác
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
