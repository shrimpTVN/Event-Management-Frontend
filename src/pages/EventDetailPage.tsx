import React, { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, CalendarDays } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  EventFeedCard,
  StudentLeftSidebar,
  StudentRightSidebar,
  eventService,
  type Event,
} from '@/features/events'

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  const handleGoBack = () => {
    const from = (location.state as { from?: string } | undefined)?.from
    if (from) {
      navigate(from)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: Boolean(id),
  })

  const handleRegister = (_eventId: string) => {
    queryClient.setQueryData(['events', id], (old: Event | undefined) =>
      old ? { ...old, isRegistered: true, registeredCount: (old.registeredCount || 0) + 1 } : old
    )
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    setNotificationMessage('Đăng ký tham gia sự kiện thành công!')
    setTimeout(() => setNotificationMessage(null), 3500)
  }

  const handleCancelRegister = (_eventId: string) => {
    queryClient.setQueryData(['events', id], (old: Event | undefined) =>
      old
        ? {
            ...old,
            isRegistered: false,
            registeredCount: Math.max(0, (old.registeredCount || 1) - 1),
          }
        : old
    )
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
  }

  const handleToggleSave = (_eventId: string) => {
    queryClient.setQueryData(['events', id], (old: Event | undefined) =>
      old ? { ...old, isSaved: !old.isSaved } : old
    )
    setNotificationMessage('Đã cập nhật danh sách sự kiện lưu trữ')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleFollow = (_organizerId: string) => {
    queryClient.setQueryData(['events', id], (old: Event | undefined) =>
      old ? { ...old, isFollowed: !old.isFollowed } : old
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pr-1 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-[680px] flex flex-col gap-4 pb-16">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start cursor-pointer group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Quay lại</span>
            </button>

            {isLoading ? (
              <div className="w-full rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải thông tin sự kiện...</p>
              </div>
            ) : event ? (
              <EventFeedCard
                event={event}
                onRegister={handleRegister}
                onCancelRegister={handleCancelRegister}
                onToggleSave={handleToggleSave}
                onToggleFollow={handleToggleFollow}
              />
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
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget (Matching HomePage & FanpageDetail to center the main content) */}
        <aside className="hidden lg:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}

