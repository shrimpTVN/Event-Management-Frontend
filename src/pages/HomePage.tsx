import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  StudentLeftSidebar,
  StudentRightSidebar,
  FeedTabs,
  EventFeedCard,
  EventGridCard,
  eventService,
  type FeedTabType,
  type ViewMode,
  type Event,
} from '@/features/events'

export const HomePage: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<FeedTabType>('DISCOVER')
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)

  // Persist view mode (Option A: FEED vs GRID)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('ctu_event_view_mode')
      return saved === 'GRID' || saved === 'FEED' ? saved : 'FEED'
    } catch {
      return 'FEED'
    }
  })

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('ctu_event_view_mode', mode)
    } catch {
      // ignore
    }
  }

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'feed'],
    queryFn: () => eventService.getEvents(),
  })

  // Filter events by selected feed tab
  const filteredEvents = events.filter((evt) => {
    if (activeTab === 'FOLLOWING') {
      return evt.isFollowed === true
    }
    if (activeTab === 'RECOMMENDED') {
      // Show events with training points benefits
      return Boolean(evt.pointsReward)
    }
    return true
  })

  const handleRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'feed'], (old: Event[] = []) =>
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
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
    setNotificationMessage('Đăng ký tham gia sự kiện thành công!')
    setTimeout(() => setNotificationMessage(null), 3500)
  }

  const handleCancelRegister = (eventId: string) => {
    queryClient.setQueryData(['events', 'feed'], (old: Event[] = []) =>
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
    queryClient.invalidateQueries({ queryKey: ['events'], refetchType: 'none' })
    queryClient.invalidateQueries({ queryKey: ['registrations'] })
  }

  const handleToggleSave = (eventId: string) => {
    queryClient.setQueryData(['events', 'feed'], (old: Event[] = []) =>
      old.map((evt) =>
        String(evt.id) === String(eventId) ? { ...evt, isSaved: !evt.isSaved } : evt
      )
    )
    setNotificationMessage('Đã cập nhật danh sách sự kiện lưu trữ')
    setTimeout(() => setNotificationMessage(null), 3000)
  }

  const handleToggleFollow = (organizerId: string) => {
    queryClient.setQueryData(['events', 'feed'], (old: Event[] = []) =>
      old.map((evt) =>
        evt.organizerId === organizerId ? { ...evt, isFollowed: !evt.isFollowed } : evt
      )
    )
  }

  const [showMobileLeft, setShowMobileLeft] = useState(false)
  const [showMobileRight, setShowMobileRight] = useState(false)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notificationMessage}
        </div>
      )}

      {/* Mobile Toolbar (Visible only on smaller screens where sidebars collapse) */}
      <div className="flex lg:hidden items-center justify-between gap-2 mb-2 pt-3 shrink-0 bg-card border border-border rounded-xl p-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setShowMobileLeft(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors md:hidden"
        >
          <span>📁 Menu & Đã theo dõi</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMobileRight(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-brand-subtle text-primary hover:bg-primary/10 transition-colors"
        >
          <span>📊 Điểm rèn luyện (65/100) & Lịch</span>
        </button>
      </div>

      {/* Mobile Drawer Left */}
      {showMobileLeft && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileLeft(false)}
          />
          <div className="relative w-80 max-w-[85%] bg-card p-5 h-full overflow-y-auto custom-scrollbar shadow-2xl z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-sm text-foreground">Menu & Tổ chức</span>
              <button
                type="button"
                onClick={() => setShowMobileLeft(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <StudentLeftSidebar />
          </div>
        </div>
      )}

      {/* Mobile Drawer Right */}
      {showMobileRight && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileRight(false)}
          />
          <div className="relative w-88 max-w-[90%] bg-card p-5 h-full overflow-y-auto custom-scrollbar shadow-2xl z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="font-bold text-sm text-foreground">Tiến độ ĐRL & Lịch</span>
              <button
                type="button"
                onClick={() => setShowMobileRight(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <StudentRightSidebar />
          </div>
        </div>
      )}

      {/* 3-Column Layout: Left sidebar flush left, Right sidebar flush right, Feed centered */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Organization Navigation & Student Tools (Figma width: 240px, pad: 16px 0 10px 0) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center Column: Feed (Tabs + Event Feed Cards / Grid Cards) */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-2.5 px-1 flex justify-center custom-scrollbar">
          {/* Feed Container: Dynamically scales max-w based on viewMode */}
          <div
            className={`w-full flex flex-col gap-3 pb-28 sm:pb-36 transition-all duration-200 ${
              viewMode === 'GRID' ? 'max-w-[840px]' : 'max-w-[680px]'
            }`}
          >
            {/* Feed Filter Tabs with View Mode Switcher */}
            <FeedTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
            />

            {/* Event List Rendering */}
            <div>
              {isLoading ? (
                viewMode === 'GRID' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 animate-pulse"
                      >
                        <div className="aspect-video bg-muted rounded-xl w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-8 bg-muted rounded-lg w-full mt-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((n) => (
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
                        <div className="h-48 bg-muted rounded-xl w-full" />
                      </div>
                    ))}
                  </div>
                )
              ) : filteredEvents.length > 0 ? (
                viewMode === 'GRID' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in duration-200">
                    {filteredEvents.map((event) => (
                      <EventGridCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegister}
                        onCancelRegister={handleCancelRegister}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                    {filteredEvents.map((event) => (
                      <EventFeedCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegister}
                        onCancelRegister={handleCancelRegister}
                        onToggleSave={handleToggleSave}
                        onToggleFollow={handleToggleFollow}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">🎉</span>
                  <h3 className="font-semibold text-foreground text-base">
                    Chưa có sự kiện trong mục này
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Hãy thử chuyển sang tab "Khám phá" để xem các hoạt động mới nhất từ các Đoàn - Hội và CLB.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom spacer for generous breathing room when scrolled to the end */}
            <div className="h-28 sm:h-36 w-full shrink-0" aria-hidden="true" />
          </div>
        </main>

        {/* Right Column: Training Points Progress & Calendar Widget (Figma width: 240px, pad: 16px 10px 0 10px) */}
        <aside className="hidden lg:block w-[256px] min-w-[256px] max-w-[256px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 pl-3 pr-1 ml-3 sidebar-scrollbar">
          <StudentRightSidebar />
        </aside>
      </div>
    </div>
  )
}
