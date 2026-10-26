import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FanpagePublicHeader,
  FanpageAboutCard,
  fanpageService,
  type FanpageDetail,
} from '@/features/fanpage'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  EventFeedCard,
  type Event,
} from '@/features/events'
import { SlidersHorizontal, CheckCircle, AlertCircle, CalendarDays, Loader2 } from 'lucide-react'

export const FanpageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const fanpageId = id || '1'
  const queryClient = useQueryClient()

  const { data: fanpage, isLoading: isLoadingFanpage } = useQuery({
    queryKey: ['fanpage', fanpageId],
    queryFn: () => fanpageService.getFanpageById(fanpageId),
    enabled: Boolean(fanpageId),
  })

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['fanpage', fanpageId, 'events'],
    queryFn: () => fanpageService.getEventsByFanpage(fanpageId),
    enabled: Boolean(fanpageId),
  })

  const [notification, setNotification] = useState<{
    type: 'success' | 'info'
    message: string
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  const handleRegisterSuccess = (eventId: string) => {
    queryClient.setQueryData(
      ['fanpage', fanpageId, 'events'],
      (old: Event[] = []) =>
        old.map((e) =>
          e.id === eventId
            ? {
                ...e,
                isRegistered: true,
                registeredCount: (e.registeredCount || 0) + 1,
              }
            : e
        )
    )
    queryClient.invalidateQueries({ queryKey: ['events'] })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    showToast('Đăng ký tham gia sự kiện thành công!', 'success')
  }

  const handleToggleSave = (eventId: string) => {
    queryClient.setQueryData(
      ['fanpage', fanpageId, 'events'],
      (old: Event[] = []) =>
        old.map((e) => (e.id === eventId ? { ...e, isSaved: !e.isSaved } : e))
    )
    showToast('Đã cập nhật danh sách sự kiện lưu trữ')
  }

  const handleToggleFollow = (organizerId: string) => {
    queryClient.setQueryData(
      ['fanpage', fanpageId, 'events'],
      (old: Event[] = []) =>
        old.map((e) => (e.organizerId === organizerId ? { ...e, isFollowed: !e.isFollowed } : e))
    )
  }

  const handleFollowChange = (isFollowing: boolean) => {
    queryClient.setQueryData(
      ['fanpage', fanpageId],
      (prev?: FanpageDetail) =>
        prev
          ? {
              ...prev,
              isFollowing,
              followerCount: isFollowing ? prev.followerCount + 1 : Math.max(0, prev.followerCount - 1),
            }
          : prev
    )
    showToast(
      isFollowing
        ? `Bạn đã theo dõi trang "${fanpage?.name || ''}".`
        : `Bạn đã hủy theo dõi trang "${fanpage?.name || ''}".`,
      'info'
    )
  }

  const handleMessageClick = () => {
    showToast(
      `Liên hệ trực tiếp với Ban tổ chức qua email: ${fanpage?.email || ''} hoặc hotline: ${fanpage?.phone || '0292.3832663'}`,
      'info'
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs md:text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container Layout: Sidebar flush left, main content centered and scrollable */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 pb-28 sm:pb-36 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content: Fanpage Profile View */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-5xl flex flex-col gap-5 pb-28 sm:pb-36">
            {isLoadingFanpage ? (
              <div className="w-full rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải thông tin fanpage...</p>
              </div>
            ) : fanpage ? (
              <>
                {/* 1. Hero Fanpage Header Card */}
                <FanpagePublicHeader
                  fanpage={fanpage}
                  onMessageClick={handleMessageClick}
                  onFollowChange={handleFollowChange}
                />

                {/* 2. Two-Column Layout (About Column + Event Feed Column) */}
                <div className="w-full flex flex-col lg:flex-row items-start gap-5">
                  {/* Left Column: Giới thiệu (Figma width: 340px) */}
                  <div className="w-full lg:w-[340px] shrink-0">
                    <FanpageAboutCard fanpage={fanpage} />
                  </div>

                  {/* Right Column: Sự kiện (Feed) */}
                  <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
                    {/* Section Header: Title + Bộ lọc button */}
                    <div className="flex items-center justify-between gap-3 px-1">
                      <h2 className="font-k2d font-medium text-lg text-foreground tracking-tight">
                        Sự kiện
                      </h2>

                      <button
                        type="button"
                        onClick={() => showToast('Đang mở bộ lọc sự kiện...', 'info')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#374151] dark:text-foreground bg-white dark:bg-card border border-border/80 rounded-lg hover:bg-muted/60 transition-colors shadow-2xs cursor-pointer"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Bộ lọc</span>
                      </button>
                    </div>

                    {/* Event Feed List */}
                    {isLoadingEvents ? (
                      <div className="flex flex-col gap-4">
                        {[1, 2].map((n) => (
                          <div
                            key={n}
                            className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 animate-pulse"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/3" />
                                <div className="h-3 bg-muted rounded w-1/4" />
                              </div>
                            </div>
                            <div className="h-5 bg-muted rounded w-3/4" />
                            <div className="h-44 bg-muted rounded-xl w-full" />
                          </div>
                        ))}
                      </div>
                    ) : events.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {events.map((event) => (
                          <EventFeedCard
                            key={event.id}
                            event={event}
                            onRegister={handleRegisterSuccess}
                            onToggleSave={handleToggleSave}
                            onToggleFollow={handleToggleFollow}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="w-full bg-white dark:bg-card border border-dashed border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2">
                        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                          <CalendarDays className="h-7 w-7" />
                        </div>
                        <h3 className="font-heading font-semibold text-sm text-foreground">
                          Chưa có sự kiện nào
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Fanpage hiện tại chưa đăng tải sự kiện mới. Hãy theo dõi trang để nhận thông báo sớm nhất!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom spacer for generous breathing room when scrolled to the end */}
                <div className="h-28 sm:h-36 w-full shrink-0" aria-hidden="true" />
              </>
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-2">
                <h3 className="font-semibold text-foreground text-base">
                  Không tìm thấy thông tin Fanpage
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Trang này không tồn tại hoặc đã bị khóa. Vui lòng thử lại sau.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget (Matching HomePage to center the main content) */}
        <aside className="hidden lg:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
