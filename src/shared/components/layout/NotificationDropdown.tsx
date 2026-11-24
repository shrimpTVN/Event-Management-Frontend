import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { notificationPath } from '@/features/notifications/notificationPath'
import { usePersonalNotificationFeed } from '@/features/notifications/hooks/usePersonalNotificationFeed'
import { NotificationFilters, PersonalNotificationList } from '@/features/notifications/components/PersonalNotificationList'
import type { NotificationFeedEntry } from '@/features/notifications/utils/notificationFeed'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onAccepted?: (fanpageName: string) => void
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, onAccepted }) => {
  const popupRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const feed = usePersonalNotificationFeed(isOpen)
  useEffect(() => {
    if (!isOpen) return
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
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
    if (entry.unread) entry.notificationIds.forEach((id) => feed.markAsRead(id))
    const destination = entry.notification && notificationPath(entry.notification)
    if (destination) { navigate(destination); onClose() }
  }
  return <div ref={popupRef} role="dialog" aria-label="Thông báo"
    className="student-notification-popover absolute right-0 top-full z-50 mt-2 flex max-h-[min(640px,calc(100dvh-6rem))] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-border bg-background text-left text-foreground shadow-xl">
    <header className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
      <div className="flex items-center gap-2">
        <h2 className="font-k2d text-xl font-semibold">Thông báo</h2>
        {feed.unreadCount > 0 && <span className="rounded-md bg-brand-subtle px-2 py-1 text-xs text-brand-subtle-foreground">{feed.unreadCount} chưa đọc</span>}
      </div>
      <NotificationFilters feed={feed} />
    </header>
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <PersonalNotificationList feed={feed} onOpen={openNotification} onAccepted={onAccepted} compact />
    </div>
    <footer className="shrink-0 border-t border-border p-3">
      <Button variant="ghost" className="h-10 w-full text-primary" onClick={() => { onClose(); navigate('/notifications') }}>Xem tất cả thông báo</Button>
    </footer>
  </div>
}
