import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  Calendar,
  Award,
  ShieldCheck,
  X,
  Flag,
  Users,
} from 'lucide-react'
import {
  useFanpageNotifications,
  useFanpageUnreadNotificationCount,
  useFanpageNotificationActions,
  type NotificationItem,
} from '@/features/notifications'

interface FanpageNotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  fanpageId: string | number
  fanpageName?: string
}

export const FanpageNotificationDropdown: React.FC<FanpageNotificationDropdownProps> = ({
  isOpen,
  onClose,
  fanpageId,
  fanpageName,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL')

  // 1. Lấy số lượng thông báo chưa đọc của Fanpage
  const { data: unreadCount = 0 } = useFanpageUnreadNotificationCount(fanpageId)

  // 2. Lấy danh sách thông báo của Fanpage
  const { data: notificationsData } = useFanpageNotifications(
    fanpageId,
    0,
    30,
    filterTab === 'UNREAD' ? 'UNREAD' : undefined
  )
  const notifications = notificationsData?.content || []

  // 3. Actions: Đánh dấu đã đọc / Đánh dấu tất cả đã đọc
  const { markAsRead, markAllAsRead, isMarkingAllAsRead } = useFanpageNotificationActions(fanpageId)

  // Click outside & Escape key listener
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Format thời gian hiển thị thân thiện (giống mạng xã hội)
  const formatTimeDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Gần đây'
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      if (isNaN(diffMs) || diffMs < 0) return 'Vừa xong'

      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Vừa xong'
      if (diffMins < 60) return `${diffMins} phút trước`

      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} giờ trước`

      const diffDays = Math.floor(diffHours / 24)
      if (diffDays === 1) return 'Hôm qua'
      if (diffDays < 7) return `${diffDays} ngày trước`

      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
    } catch {
      return 'Gần đây'
    }
  }

  // Mini badge icon ở góc dưới avatar
  const getNotificationIconBadge = (title: string = '', message: string = '') => {
    const text = (title + ' ' + message).toLowerCase()
    if (
      text.includes('point') ||
      text.includes('điểm') ||
      text.includes('khen thưởng') ||
      text.includes('rèn luyện')
    ) {
      return {
        bgColor: 'bg-amber-500',
        icon: <Award className="w-2.5 h-2.5 text-white" />,
      }
    }
    if (
      text.includes('approved') ||
      text.includes('duyệt') ||
      text.includes('chấp thuận')
    ) {
      return {
        bgColor: 'bg-emerald-500',
        icon: <ShieldCheck className="w-2.5 h-2.5 text-white" />,
      }
    }
    if (
      text.includes('rejected') ||
      text.includes('từ chối') ||
      text.includes('suspended')
    ) {
      return {
        bgColor: 'bg-rose-500',
        icon: <X className="w-2.5 h-2.5 text-white" />,
      }
    }
    if (
      text.includes('member') ||
      text.includes('thành viên') ||
      text.includes('tham gia')
    ) {
      return {
        bgColor: 'bg-indigo-500',
        icon: <Users className="w-2.5 h-2.5 text-white" />,
      }
    }
    if (
      text.includes('event') ||
      text.includes('sự kiện') ||
      text.includes('lịch trình')
    ) {
      return {
        bgColor: 'bg-[#0866FF]',
        icon: <Calendar className="w-2.5 h-2.5 text-white" />,
      }
    }
    return {
      bgColor: 'bg-[#F56A00]',
      icon: <Flag className="w-2.5 h-2.5 fill-white stroke-none" />,
    }
  }

  // Xử lý click vào item thông báo
  const handleItemClick = (item: NotificationItem) => {
    if (item.status === 'UNREAD') {
      markAsRead(item.id)
    }

    if (item.url) {
      let dest = item.url.trim()
      if (/^\d+$/.test(dest)) {
        if (
          item.title?.toLowerCase().includes('event') ||
          item.message?.toLowerCase().includes('sự kiện')
        ) {
          dest = `/events/${dest}`
        } else {
          dest = `/fanpage/${dest}`
        }
      }
      navigate(dest)
      onClose()
    }
  }

  const filteredNotifications =
    filterTab === 'UNREAD'
      ? notifications.filter((n) => n.status === 'UNREAD')
      : notifications

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[390px] rounded-2xl border border-[#E1E7EF] dark:border-border bg-white dark:bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-left select-none"
      role="menu"
      aria-orientation="vertical"
    >
      {/* Header: Tiêu đề + Đã đọc tất cả */}
      <div className="px-2 pt-1 pb-2 border-b border-[#EDF0F4] dark:border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-bold text-base text-foreground">
              Thông báo Fanpage
            </h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary rounded-full">
                {unreadCount} mới
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer transition-colors"
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Đã đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Filter Pills: Tất cả / Chưa đọc */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              filterTab === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('UNREAD')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              filterTab === 'UNREAD'
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>Chưa đọc</span>
            {unreadCount > 0 && (
              <span
                className={`text-[10px] px-1 rounded-full ${
                  filterTab === 'UNREAD'
                    ? 'bg-white/20 text-white'
                    : 'bg-primary text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-1.5 mt-2 max-h-[380px] overflow-y-auto pr-0.5">
        {filteredNotifications.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
              <Bell className="w-5 h-5 stroke-[1.5]" />
            </div>
            <span>
              {filterTab === 'UNREAD'
                ? 'Không có thông báo chưa đọc nào.'
                : 'Chưa có thông báo nào cho fanpage.'}
            </span>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isUnread = item.status === 'UNREAD'
            const badge = getNotificationIconBadge(item.title, item.message)

            return (
              <div
                key={`fanpage-notif-${item.id}`}
                onClick={() => handleItemClick(item)}
                className={`p-2.5 rounded-xl transition-colors flex items-start gap-3 cursor-pointer ${
                  isUnread
                    ? 'bg-blue-50/50 dark:bg-blue-950/20'
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Avatar / Icon with mini badge */}
                <div className="relative shrink-0">
                  {item.iconUrl ? (
                    <img
                      src={item.iconUrl}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border border-border/60"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#1B4B8A]/10 text-[#1B4B8A] font-bold flex items-center justify-center text-xs">
                      {fanpageName?.substring(0, 2).toUpperCase() || 'FP'}
                    </div>
                  )}

                  {/* Mini badge icon on bottom right */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full ${badge.bgColor} text-white flex items-center justify-center border-2 border-white dark:border-card shadow-xs`}
                  >
                    {badge.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs leading-snug text-foreground">
                      <span className="font-bold text-[#050505] dark:text-white block">
                        {item.title}
                      </span>
                      <span className="text-[#374151] dark:text-foreground/90 mt-0.5 block line-clamp-2">
                        {item.message}
                      </span>
                    </p>
                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] shrink-0 mt-1" />
                    )}
                  </div>

                  <p className="text-[11px] font-medium text-[#6B7280] dark:text-muted-foreground">
                    {formatTimeDisplay(item.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[#EDF0F4] dark:border-border/60 mt-1">
        <button
          type="button"
          onClick={() => {
            if (unreadCount > 0) {
              markAllAsRead()
            }
            onClose()
          }}
          className="w-full py-2 px-3 rounded-lg bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-muted dark:hover:bg-muted/80 text-[#050505] dark:text-foreground font-semibold text-xs transition-colors cursor-pointer text-center"
        >
          {unreadCount > 0 ? 'Đánh dấu tất cả đã đọc' : 'Đóng'}
        </button>
      </div>
    </div>
  )
}

