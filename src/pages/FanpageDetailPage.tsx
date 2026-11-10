import React, { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth'
import { apiClient } from '@/shared'
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
  eventService,
  type Event,
} from '@/features/events'
import { SlidersHorizontal, CheckCircle, AlertCircle, CalendarDays } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

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

  const { isAuthenticated } = useAuthStore()

  // Fetch registered events for the user to accurately mark isRegistered and registrationStatus state
  const { data: userRegistrations = [] } = useQuery<any[]>({
    queryKey: ['registrations', 'me', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        const [historyRes, upcomingRes] = await Promise.allSettled([
          apiClient.get('/registrations/me/history', { params: { size: 100 } }),
          apiClient.get('/registrations/me/upcoming'),
        ])
        const historyVal = historyRes.status === 'fulfilled' ? (historyRes.value as any) : null
        const upcomingVal = upcomingRes.status === 'fulfilled' ? (upcomingRes.value as any) : null

        const historyList =
          historyVal?.content || historyVal?.data?.content || historyVal?.data || []
        const upcomingList =
          upcomingVal?.content || upcomingVal?.data?.content || upcomingVal?.data || []

        return [
          ...(Array.isArray(historyList) ? historyList : []),
          ...(Array.isArray(upcomingList) ? upcomingList : []),
        ]
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
  })

  // Map eventId -> registration status (REGISTERED, CHECKED_IN, COMPLETED...)
  const registeredEventMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of userRegistrations) {
      const eid = String(r.eventId || r.id)
      const st = String(r.status || 'REGISTERED').toUpperCase()
      if (st !== 'CANCELLED') {
        map.set(eid, st)
      }
    }
    return map
  }, [userRegistrations])

  const eventsWithRegisteredState = useMemo(() => {
    return events.map((event) => {
      const regStatus = registeredEventMap.get(String(event.id))
      return {
        ...event,
        isRegistered: Boolean(regStatus) || Boolean(event.isRegistered),
        registrationStatus: regStatus || (event.isRegistered ? 'REGISTERED' : undefined),
      }
    })
  }, [events, registeredEventMap])

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
          String(e.id) === String(eventId)
            ? {
                ...e,
                isRegistered: true,
                registeredCount: (e.registeredCount || 0) + 1,
              }
            : e
        )
    )
    queryClient.setQueryData(['registrations', 'me', isAuthenticated], (old: any[] = []) => [
      ...(Array.isArray(old) ? old : []),
      { eventId: Number(eventId), status: 'REGISTERED' },
    ])
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    showToast('Đăng ký tham gia sự kiện thành công!', 'success')
  }

  const handleCancelRegister = (eventId: string) => {
    queryClient.setQueryData(
      ['fanpage', fanpageId, 'events'],
      (old: Event[] = []) =>
        old.map((e) =>
          String(e.id) === String(eventId)
            ? {
                ...e,
                isRegistered: false,
                registeredCount: Math.max(0, (e.registeredCount || 1) - 1),
              }
            : e
        )
    )
    queryClient.setQueryData(['registrations', 'me', isAuthenticated], (old: any[] = []) =>
      (Array.isArray(old) ? old : []).filter((r: any) => String(r.eventId || r.id) !== String(eventId))
    )
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    showToast('Đã hủy đăng ký sự kiện thành công.', 'info')
  }

  const handleToggleSave = async (eventId: string) => {
    const target = events.find((e) => String(e.id) === String(eventId))
    const nextSavedState = !target?.isSaved

    queryClient.setQueryData(
      ['fanpage', fanpageId, 'events'],
      (old: Event[] = []) =>
        old.map((e) => (String(e.id) === String(eventId) ? { ...e, isSaved: nextSavedState } : e))
    )

    try {
      if (nextSavedState) {
        await eventService.storeEvent(eventId)
        showToast('Đã lưu sự kiện vào danh sách đã lưu')
      } else {
        await eventService.unstoreEvent(eventId)
        showToast('Đã bỏ lưu sự kiện')
      }
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['fanpage', fanpageId, 'events'] })
      queryClient.invalidateQueries({ queryKey: ['events', 'stored'] })
    }
  }

  const handleToggleFollow = async (organizerId: string) => {
    const target = events.find((e) => e.organizerId === organizerId)
    const nextState = !target?.isFollowed

    queryClient.setQueryData(
      ['fanpage', fanpageId, 'events'],
      (old: Event[] = []) =>
        old.map((e) => (e.organizerId === organizerId ? { ...e, isFollowed: nextState } : e))
    )

    try {
      if (nextState) {
        await fanpageService.followFanpage(organizerId)
      } else {
        await fanpageService.unfollowFanpage(organizerId)
      }
      queryClient.invalidateQueries({ queryKey: ['fanpages', 'sidebar'] })
      queryClient.invalidateQueries({ queryKey: ['fanpage', fanpageId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['fanpage', fanpageId, 'events'] })
    }
  }

  const handleFollowChange = async (nextState: boolean) => {
    queryClient.setQueryData(
      ['fanpage', fanpageId],
      (prev?: FanpageDetail) =>
        prev
          ? {
              ...prev,
              isFollowing: nextState,
              followerCount: nextState ? prev.followerCount + 1 : Math.max(0, prev.followerCount - 1),
            }
          : prev
    )

    try {
      if (nextState) {
        await fanpageService.followFanpage(fanpageId)
        showToast(`Bạn đã theo dõi trang "${fanpage?.name || ''}".`, 'info')
      } else {
        await fanpageService.unfollowFanpage(fanpageId)
        showToast(`Bạn đã hủy theo dõi trang "${fanpage?.name || ''}".`, 'info')
      }
      queryClient.invalidateQueries({ queryKey: ['fanpages', 'sidebar'] })
      queryClient.invalidateQueries({ queryKey: ['fanpage', fanpageId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ['fanpage', fanpageId] })
      showToast(err?.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác!', 'info')
    }
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
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content: Fanpage Profile View */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto pt-4 pb-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-5xl flex flex-col gap-3.5 pb-28 sm:pb-36">
            {isLoadingFanpage ? (
              <div className="w-full flex flex-col gap-3.5 animate-pulse">
                {/* 1. Hero Header Card Skeleton */}
                <div className="w-full bg-white dark:bg-card border border-border/50 dark:border-border/60 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 min-w-0">
                    <Skeleton className="h-24 w-24 rounded-full shrink-0" />
                    <div className="space-y-2 text-center sm:text-left">
                      <Skeleton className="h-7 w-64 sm:w-80 rounded" />
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                  </div>
                </div>

                {/* 2. Two-Column Layout Skeleton */}
                <div className="w-full flex flex-col lg:flex-row items-start gap-4">
                  {/* Left Column: About Card Skeleton */}
                  <div className="w-full lg:w-[340px] shrink-0">
                    <div className="w-full bg-white dark:bg-card border border-border/50 rounded-xl p-5 space-y-4">
                      <Skeleton className="h-5 w-24 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-full rounded" />
                        <Skeleton className="h-3.5 w-5/6 rounded" />
                        <Skeleton className="h-3.5 w-4/6 rounded" />
                      </div>
                      <div className="pt-3 border-t border-border/60 space-y-2.5">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-4 w-2/3 rounded" />
                        <Skeleton className="h-4 w-1/2 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Events Feed Skeleton */}
                  <div className="flex-1 min-w-0 w-full flex flex-col gap-3.5">
                    <div className="flex items-center justify-between px-1">
                      <Skeleton className="h-6 w-28 rounded" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                    <div className="flex flex-col gap-3.5">
                      {[1, 2].map((n) => (
                        <div key={n} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-1/3 rounded" />
                              <Skeleton className="h-3 w-1/4 rounded" />
                            </div>
                          </div>
                          <Skeleton className="h-5 w-3/4 rounded" />
                          <Skeleton className="h-44 w-full rounded-xl" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : fanpage ? (
              <>
                {/* 1. Hero Fanpage Header Card */}
                <FanpagePublicHeader
                  fanpage={{
                    ...fanpage,
                    eventCount: fanpage.eventCount || events.length,
                  }}
                  onMessageClick={handleMessageClick}
                  onFollowChange={handleFollowChange}
                />

                {/* 2. Two-Column Layout (About Column + Event Feed Column) */}
                <div className="w-full flex flex-col lg:flex-row items-start gap-4">
                  {/* Left Column: Giới thiệu (Figma width: 340px) - Sticky on scroll, aligned horizontally with sidebars */}
                  <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-0 self-start">
                    <FanpageAboutCard fanpage={fanpage} />
                  </div>

                  {/* Right Column: Sự kiện (Feed) */}
                  <div className="flex-1 min-w-0 w-full flex flex-col gap-3.5">
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
                    ) : eventsWithRegisteredState.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {eventsWithRegisteredState.map((event) => (
                          <EventFeedCard
                            key={event.id}
                            event={event}
                            onRegister={handleRegisterSuccess}
                            onCancelRegister={handleCancelRegister}
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
