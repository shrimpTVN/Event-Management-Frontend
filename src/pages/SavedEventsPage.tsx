import React, { useEffect, useRef, useState } from 'react'
import './SavedEventsPage.css'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  EventFeedCard,
  eventService,
  type Event,
} from '@/features/events'
import { useAuthStore } from '@/features/auth'
import {
  matchesPageSearch,
  useMobilePageSearch,
} from '@/shared/components/layout/MobileSubpageHeader'

export const SavedEventsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const mobileSearch = useMobilePageSearch()
  const [desktopQuery, setDesktopQuery] = useState('')
  const query = mobileSearch.active ? mobileSearch.query : desktopQuery
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimers = useRef(new Map<HTMLElement, ReturnType<typeof setTimeout>>())
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.classList.contains('saved-scrollbar')) return
    const previousTimer = scrollTimers.current.get(target)
    if (previousTimer) clearTimeout(previousTimer)
    target.dataset.scrolling = 'true'
    scrollTimers.current.set(
      target,
      setTimeout(() => {
        delete target.dataset.scrolling
        scrollTimers.current.delete(target)
      }, 800)
    )
  }
  useEffect(() => {
    const timers = scrollTimers.current
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      timers.forEach((timer, target) => {
        clearTimeout(timer)
        delete target.dataset.scrolling
      })
      timers.clear()
    }
  }, [])

  const {
    data: savedEvents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Event[]>({
    queryKey: ['events', 'stored', isAuthenticated],
    queryFn: () => eventService.getStoredEvents(),
    enabled: isAuthenticated,
  })

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setNotificationMessage(message)
    toastTimer.current = setTimeout(() => setNotificationMessage(null), 3000)
  }
  const visibleEvents = savedEvents.filter((event) =>
    matchesPageSearch(
      query,
      event.title,
      event.description,
      event.organizerName,
      event.location?.address
    )
  )
  const clearSearch = () => {
    setDesktopQuery('')
    mobileSearch.setQuery?.('')
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
    <div
      onScrollCapture={handleScroll}
      className="saved-events-page flex h-full w-full flex-col overflow-hidden bg-muted/40 dark:bg-background"
    >
      {/* Toast Notification */}
      {notificationMessage && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-lg sm:inset-x-auto sm:right-6 sm:max-w-sm"
        >
          {notificationMessage}
        </div>
      )}

      {/* Main 3-Column Responsive Container (Matching HomePage & Student layout) */}
      <div className="flex min-h-0 w-full flex-1 justify-between gap-4 overflow-hidden px-0 md:px-6 xl:gap-6">
        {/* Left Column: Fixed Navigation Sidebar */}
        <aside className="saved-scrollbar sidebar-scrollbar hidden h-full w-60 shrink-0 overflow-y-auto py-4 xl:block">
          <StudentLeftSidebar />
        </aside>

        {/* Center Column: Saved Events Feed (No Tabs) */}
        <main
          data-student-scroll
          aria-label="Danh sách sự kiện đã lưu"
          className="saved-scrollbar student-feed-scroll custom-scrollbar h-full min-w-0 flex-1 overflow-y-auto px-4 py-4 md:px-1"
        >
          <div className="mx-auto flex w-full min-w-0 max-w-[680px] flex-col gap-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            {/* Header: Title Banner */}
            <header data-mobile-page-heading className="flex flex-col gap-4 px-1 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="font-k2d text-xl font-semibold text-foreground sm:text-2xl">
                    Đã lưu
                  </h1>
                  {!isLoading && !isError && savedEvents.length > 0 && (
                    <span className="rounded-md bg-brand-subtle px-2 py-1 text-xs font-medium tabular-nums text-brand-subtle-foreground">
                      {savedEvents.length}
                    </span>
                  )}
                </div>
              </div>
              {savedEvents.length > 0 && (
                <div className="relative" role="search" aria-label="Tìm trong sự kiện đã lưu">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={desktopQuery}
                    onChange={(event) => setDesktopQuery(event.target.value)}
                    aria-label="Tìm sự kiện đã lưu"
                    placeholder="Tìm tên sự kiện, đơn vị tổ chức, địa điểm…"
                    className="h-10 bg-muted/40 pl-10 pr-11 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  {desktopQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10"
                      aria-label="Xóa tìm kiếm"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </header>
            {!isLoading && !isError && savedEvents.length > 0 && (
              <p role="status" className="text-xs leading-5 text-muted-foreground">
                {query.trim()
                  ? `${visibleEvents.length} / ${savedEvents.length} sự kiện phù hợp`
                  : `${savedEvents.length} sự kiện đã lưu`}
              </p>
            )}

            {/* Content: Loading / List / Empty State */}
            {isLoading ? (
              <div
                role="status"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background px-5 py-12"
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Đang tải danh sách sự kiện đã lưu...
                </p>
              </div>
            ) : isError ? (
              <div
                role="alert"
                className="flex flex-col items-center gap-4 rounded-xl border border-border bg-background px-5 py-10 text-center"
              >
                <p className="text-sm text-foreground">Không thể tải sự kiện đã lưu.</p>
                <Button variant="outline" onClick={() => void refetch()} className="h-10 gap-2">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Thử lại
                </Button>
              </div>
            ) : visibleEvents.length > 0 ? (
              <div className="student-post-feed flex min-w-0 flex-col gap-4">
                {visibleEvents.map((event) => (
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
              <div
                role="status"
                className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-background px-5 py-8 text-center sm:px-8"
              >
                <div className="flex max-w-sm flex-col gap-2">
                  <h2 className="font-k2d text-base font-semibold text-foreground sm:text-lg">
                    {query.trim()
                      ? 'Không tìm thấy sự kiện đã lưu'
                      : 'Chưa có sự kiện nào được lưu'}
                  </h2>
                  {query.trim() && (
                    <p className="text-sm leading-6 text-muted-foreground">
                      Thử từ khóa khác hoặc xóa từ khóa tìm kiếm.
                    </p>
                  )}
                </div>
                {query.trim() ? (
                  <Button variant="outline" className="h-10" onClick={clearSearch}>
                    Xóa tìm kiếm
                  </Button>
                ) : (
                  <Link
                    to="/events"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Khám phá sự kiện
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Dynamic Right Sidebar */}
        <aside className="saved-scrollbar sidebar-scrollbar hidden h-full w-64 shrink-0 overflow-y-auto py-4 2xl:block">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
