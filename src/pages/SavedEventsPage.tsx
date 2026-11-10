import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Sparkles, Loader2 } from 'lucide-react'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  EventFeedCard,
  eventService,
  type Event,
} from '@/features/events'
import { useAuthStore } from '@/features/auth'

export const SavedEventsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  const { data: savedEvents = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events', 'stored', isAuthenticated],
    queryFn: () => eventService.getStoredEvents(),
    enabled: isAuthenticated,
  })

  const showToast = (message: string) => {
    setNotificationMessage(message)
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleSave = async (eventId: string) => {
    // Optimistic remove from saved list
    queryClient.setQueryData(['events', 'stored', isAuthenticated], (old: Event[] = []) =>
      old.filter((evt) => String(evt.id) !== String(eventId))
    )

    try {
      await eventService.unstoreEvent(eventId)
      showToast('Đã bỏ lưu sự kiện')
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'feed'] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
      showToast('Có lỗi xảy ra khi cập nhật trạng thái lưu')
    }
  }

  const handleRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'stored', isAuthenticated], (old: Event[] = []) =>
      old.map((evt) =>
        String(evt.id) === String(eventId)
          ? {
              ...evt,
              isRegistered: true,
              registeredCount: (evt.registeredCount || 0) + 1,
            }
          : evt
      )
    )
    queryClient.invalidateQueries({ queryKey: ['events'] })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    showToast('Đăng ký tham gia sự kiện thành công!')
  }

  const handleCancelRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'stored', isAuthenticated], (old: Event[] = []) =>
      old.map((evt) =>
        String(evt.id) === String(eventId)
          ? {
              ...evt,
              isRegistered: false,
              registeredCount: Math.max(0, (evt.registeredCount || 1) - 1),
            }
          : evt
      )
    )
    queryClient.invalidateQueries({ queryKey: ['events'] })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      {/* Main 3-Column Responsive Container (Matching HomePage & Student layout) */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center Column: Saved Events Feed (No Tabs) */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-3 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-[680px] flex flex-col gap-3.5 pb-28 sm:pb-36">
            {/* Header: Title Banner */}
            <div className="w-full bg-white dark:bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-2xs">
                  <Bookmark className="h-5 w-5 fill-amber-500" />
                </div>
                <div>
                  <h1 className="font-k2d font-bold text-lg sm:text-xl text-foreground">
                    Sự kiện đã lưu
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {savedEvents.length} bài viết đã lưu để theo dõi
                  </p>
                </div>
              </div>

              <Link
                to="/"
                className="text-xs font-semibold text-[#1B4B8A] dark:text-primary hover:underline"
              >
                Khám phá thêm sự kiện
              </Link>
            </div>

            {/* Content: Loading / List / Empty State */}
            {isLoading ? (
              <div className="w-full rounded-2xl border border-border bg-white dark:bg-card p-12 flex flex-col items-center justify-center gap-3 shadow-2xs">
                <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">Đang tải danh sách sự kiện đã lưu...</p>
              </div>
            ) : savedEvents.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {savedEvents.map((event) => (
                  <EventFeedCard
                    key={event.id}
                    event={{ ...event, isSaved: true }}
                    onRegister={handleRegister}
                    onCancelRegister={handleCancelRegister}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white dark:bg-card p-12 text-center flex flex-col items-center justify-center gap-3.5 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center">
                  <Bookmark className="h-7 w-7 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                    Chưa có sự kiện nào được lưu
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                    Nhấn vào biểu tượng bookmark trên các bài viết sự kiện tại Trang chủ để lưu lại và theo dõi tại đây.
                  </p>
                </div>
                <Link
                  to="/"
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B4B8A] hover:bg-[#153a6b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Khám phá sự kiện ngay</span>
                </Link>
              </div>
            )}

            {/* Bottom spacer for generous breathing room when scrolled to the end (đồng bộ với Trang chủ) */}
            <div className="h-28 sm:h-36 w-full shrink-0" aria-hidden="true" />
          </div>
        </main>

        {/* Right Column: Dynamic Right Sidebar */}
        <aside className="hidden lg:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}

