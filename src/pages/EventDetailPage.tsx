import { Button } from '@/components/ui/button'
import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, CalendarDays } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fanpageService } from '@/features/fanpage'
import { useAuthStore } from '@/features/auth'
import { apiClient } from '@/shared'
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
  const { isAuthenticated } = useAuthStore()

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

  const {
    data: event,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: Boolean(id),
  })

  // Fetch followed fanpages and stored events to match HomePage follow/save state
  const { data: followedFanpages = [] } = useQuery<any[]>({
    queryKey: ['fanpages', 'sidebar', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        const res: any = await apiClient.get('/fanpages/following', { params: { size: 50 } })
        const list = res?.content || res?.data || (Array.isArray(res) ? res : [])
        return Array.isArray(list) ? list : []
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
  })

  const { data: storedEvents = [] } = useQuery<Event[]>({
    queryKey: ['events', 'stored', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return []
      try {
        return await eventService.getStoredEvents()
      } catch {
        return []
      }
    },
    enabled: isAuthenticated,
  })

  const isEventFollowed = useMemo(() => {
    if (!event) return false
    const orgId = String(event.organizerId || event.fanpageId || '')
    return Boolean(
      event.isFollowed ||
        (orgId && followedFanpages.some((fp: any) => String(fp.id) === orgId))
    )
  }, [event, followedFanpages])

  const isEventSaved = useMemo(() => {
    if (!event) return false
    return Boolean(
      event.isSaved || storedEvents.some((saved) => String(saved.id) === String(event.id))
    )
  }, [event, storedEvents])

  // Fetch registrations to determine registration state accurately
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

  const currentRegistration = useMemo(() => {
    if (!id || !isAuthenticated) return null
    return (
      userRegistrations.find(
        (r: any) =>
          String(r.eventId || r.id) === String(id) &&
          String(r.status || '').toUpperCase() !== 'CANCELLED'
      ) || null
    )
  }, [userRegistrations, id, isAuthenticated])

  const isEventRegistered = Boolean(currentRegistration)
  const currentRegStatus = currentRegistration?.status
    ? String(currentRegistration.status).toUpperCase()
    : undefined

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

  const handleToggleFollow = async (organizerId: string) => {
    const nextState = !event?.isFollowed

    queryClient.setQueryData(['events', id], (old: Event | undefined) =>
      old ? { ...old, isFollowed: nextState } : old
    )

    try {
      if (nextState) {
        await fanpageService.followFanpage(organizerId)
      } else {
        await fanpageService.unfollowFanpage(organizerId)
      }
      queryClient.invalidateQueries({ queryKey: ['fanpages', 'sidebar'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['fanpage', organizerId] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['events', id] })
    }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-0 sm:px-6 gap-4 xl:gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden xl:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main
          data-student-scroll
          className="student-feed-scroll flex-1 min-w-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-4 sm:px-1 flex justify-center custom-scrollbar"
        >
          <div className="w-full max-w-[680px] flex flex-col gap-4 pb-16">
            <Button
              data-mobile-page-heading
              variant="ghost"
              type="button"
              onClick={handleGoBack}
              className="min-h-11 inline-flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start cursor-pointer group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Quay lại</span>
            </Button>

            {isLoading ? (
              <div className="w-full rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải thông tin sự kiện...</p>
              </div>
            ) : event ? (
              <div className="student-post-feed">
                <EventFeedCard
                  event={{
                    ...event,
                    isFollowed: isEventFollowed,
                    isSaved: isEventSaved,
                    isRegistered: isEventRegistered,
                    registrationStatus: currentRegStatus,
                  }}
                  onRegister={handleRegister}
                  onCancelRegister={handleCancelRegister}
                  onToggleSave={handleToggleSave}
                  onToggleFollow={handleToggleFollow}
                />
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-2">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold text-foreground text-base">Không tìm thấy sự kiện</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {error
                    ? 'Không thể tải chi tiết sự kiện này hoặc sự kiện đã bị xóa.'
                    : 'Sự kiện không tồn tại hoặc bạn không có quyền xem.'}
                </p>
                <Button
                  type="button"
                  onClick={handleGoBack}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Quay lại
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget (Matching HomePage & FanpageDetail to center the main content) */}
        <aside className="hidden 2xl:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
