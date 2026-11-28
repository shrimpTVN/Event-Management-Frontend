import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { notificationPath } from '@/features/notifications/notificationPath'
import {
  useFanpageNotifications,
  useFanpageUnreadNotificationCount,
  useFanpageNotificationActions,
} from '@/features/notifications'
import {
  NotificationFilters,
  PersonalNotificationList,
} from '@/features/notifications/components/PersonalNotificationList'
import {
  buildNotificationFeed,
  type NotificationFeedEntry,
} from '@/features/notifications/utils/notificationFeed'
import { useScrollActivity } from '@/shared/hooks/useScrollActivity'

interface FanpageNotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  fanpageId: string | number
  fanpageName?: string
}

export function FanpageNotificationDropdown({
  isOpen,
  onClose,
  fanpageId,
}: FanpageNotificationDropdownProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const handleScroll = useScrollActivity()
  const { data: unreadCount = 0 } = useFanpageUnreadNotificationCount(
    isOpen ? fanpageId : undefined,
    isOpen
  )
  const query = useFanpageNotifications(
    isOpen ? fanpageId : undefined,
    0,
    30,
    filter === 'UNREAD' ? 'UNREAD' : undefined
  )
  const actions = useFanpageNotificationActions(fanpageId)
  const feed = {
    ...actions,
    filter,
    setFilter,
    unreadCount,
    entries: buildNotificationFeed(query.data?.content || [], []).filter(
      (entry) => filter === 'ALL' || entry.unread
    ),
    isLoading: Boolean(query.isLoading),
    isError: Boolean(query.isError),
    retry: () => {
      void query.refetch()
    },
  }

  useEffect(() => {
    if (!isOpen) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  const openNotification = (entry: NotificationFeedEntry) => {
    if (entry.unread) entry.notificationIds.forEach((id) => actions.markAsRead(id))
    const destination = entry.notification && notificationPath(entry.notification)
    if (destination) {
      navigate(destination)
      onClose()
    }
  }

  return (
    <div
      ref={popupRef}
      role="dialog"
      aria-label="Thông báo Fanpage"
      className="fixed inset-x-3 top-20 z-50 flex max-h-[min(640px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-xl border border-border bg-background text-left text-foreground shadow-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[420px]"
    >
      <header className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <h2 className="font-k2d text-xl font-semibold">Thông báo</h2>
          {unreadCount > 0 && (
            <span className="rounded-md bg-brand-subtle px-2 py-1 text-xs text-brand-subtle-foreground">
              {unreadCount} chưa đọc
            </span>
          )}
        </div>
        <NotificationFilters feed={feed} />
      </header>
      <div
        onScroll={handleScroll}
        className="student-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <PersonalNotificationList feed={feed} onOpen={openNotification} compact />
      </div>
      <footer className="shrink-0 border-t border-border p-3">
        <Button variant="ghost" className="h-10 w-full text-primary" onClick={onClose}>
          Đóng
        </Button>
      </footer>
    </div>
  )
}
