import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  FanpagePublicHeader,
  FanpageAboutCard,
  FanpageEventFeedCard,
  mockFanpageDetail,
  mockFanpageEvents,
  type FanpagePublicEventPost,
} from '@/features/fanpage'
import { StudentLeftSidebar } from '@/features/events'
import { SlidersHorizontal, CheckCircle, AlertCircle, CalendarDays } from 'lucide-react'

export const FanpageDetailPage: React.FC = () => {
  const { id: _id } = useParams<{ id: string }>()
  const [fanpage, setFanpage] = useState(mockFanpageDetail)
  const [events, setEvents] = useState<FanpagePublicEventPost[]>(mockFanpageEvents)
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

  const handleShare = (post: FanpagePublicEventPost) => {
    const url = `${window.location.origin}/events/${post.eventId}`
    navigator.clipboard?.writeText(url)
    showToast(`Đã sao chép liên kết sự kiện: "${post.title}"`, 'success')
  }

  const handleToggleSave = (post: FanpagePublicEventPost) => {
    const nextSaved = !post.isSaved
    setEvents((prev) =>
      prev.map((e) => (e.id === post.id ? { ...e, isSaved: nextSaved } : e))
    )
    showToast(
      nextSaved
        ? `Đã lưu sự kiện "${post.title}" vào danh sách quan tâm!`
        : `Đã bỏ lưu sự kiện "${post.title}".`,
      'info'
    )
  }

  const handleFollowChange = (isFollowing: boolean) => {
    setFanpage((prev) => ({
      ...prev,
      isFollowing,
      followerCount: isFollowing ? prev.followerCount + 1 : prev.followerCount - 1,
    }))
    showToast(
      isFollowing
        ? `Bạn đã theo dõi trang "${fanpage.name}".`
        : `Bạn đã hủy theo dõi trang "${fanpage.name}".`,
      'info'
    )
  }

  const handleMessageClick = () => {
    showToast(
      `Liên hệ trực tiếp với Ban tổ chức qua email: ${fanpage.email} hoặc hotline: ${fanpage.phone || '0292.3832663'}`,
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
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar followedOrgs={[]} />
        </aside>

        {/* Center / Main Content: Fanpage Profile View */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-5xl flex flex-col gap-5 pb-16">
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
                {events.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {events.map((post) => (
                      <FanpageEventFeedCard
                        key={post.id}
                        post={post}
                        onShare={handleShare}
                        onToggleSave={handleToggleSave}
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
          </div>
        </main>
      </div>
    </div>
  )
}
