import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { StudentLeftSidebar } from '@/features/events'
import { notificationPath } from '@/features/notifications/notificationPath'
import { usePersonalNotificationFeed } from '@/features/notifications/hooks/usePersonalNotificationFeed'
import { NotificationFilters, PersonalNotificationList } from '@/features/notifications/components/PersonalNotificationList'
import type { NotificationFeedEntry } from '@/features/notifications/utils/notificationFeed'

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const feed = usePersonalNotificationFeed()
  const openNotification = (entry: NotificationFeedEntry) => {
    if (entry.unread) entry.notificationIds.forEach((id) => feed.markAsRead(id))
    const destination = entry.notification && notificationPath(entry.notification)
    if (destination) navigate(destination)
  }
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-muted/40 dark:bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-6 px-0 lg:px-6">
        <aside className="sidebar-scrollbar hidden h-full w-60 shrink-0 overflow-y-auto py-4 lg:block">
          <StudentLeftSidebar />
        </aside>
        <section aria-labelledby="notifications-heading" data-student-scroll
          className="custom-scrollbar min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-0">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <header className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
              <div data-mobile-page-heading className="flex items-center gap-3">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-foreground md:flex"><Bell className="h-5 w-5" aria-hidden="true" /></div>
                <h1 id="notifications-heading" className="font-k2d text-xl font-semibold text-foreground sm:text-2xl">Thông báo</h1>
                {feed.unreadCount > 0 && <span className="rounded-md bg-brand-subtle px-2 py-1 text-xs font-medium text-brand-subtle-foreground">{feed.unreadCount} chưa đọc</span>}
              </div>
              <NotificationFilters feed={feed} />
            </header>
            <div className="rounded-xl border border-border bg-background">
              <PersonalNotificationList feed={feed} onOpen={openNotification} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
