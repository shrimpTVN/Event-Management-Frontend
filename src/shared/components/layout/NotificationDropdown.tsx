import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flag,
  Check,
  Bell,
  Award,
  Calendar,
  ShieldCheck,
  X,
  CheckCheck,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fanpageService } from '@/features/fanpage/services/fanpageService'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'
import {
  useNotifications,
  useNotificationActions,
  useNotificationStream,
  type NotificationItem,
} from '@/features/notifications'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onAccepted?: (fanpageName: string) => void
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onAccepted,
}) => {
  const popupRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { addFanpage } = useUserFanpagesStore()
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD'>('ALL')

  // Real-time SSE listener
  useNotificationStream()

  // 1. Lấy danh sách lời mời thực tế từ Database thông qua API GET /fanpage-member-invitations/me
  const { data: invitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['my-fanpage-member-invitations', user?.email],
    queryFn: () => fanpageService.getMyInvitations(),
    enabled: isOpen && Boolean(user),
    staleTime: 15 * 1000,
  })

  // 2. Lấy danh sách thông báo hệ thống từ Backend thông qua API GET /notifications
  const { data: notificationsData } = useNotifications(
    0,
    30,
    filterTab === 'UNREAD' ? 'UNREAD' : undefined
  )
  const systemNotifications = notificationsData?.content || []

  // 3. Các hành động thông báo (đánh dấu đã đọc, đánh dấu tất cả đã đọc)
  const { markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotificationActions()

  // Đồng bộ các lời mời đã ACCEPTED trong DB vào store để luôn hiển thị trong menu tài khoản
  useEffect(() => {
    if (Array.isArray(invitations) && invitations.length > 0) {
      for (const inv of invitations) {
        if (inv.status === 'ACCEPTED' && inv.fanpageId) {
          addFanpage({
            id: String(inv.fanpageId),
            name: inv.fanpageName || 'Fanpage',
            code: (inv.fanpageName || 'FP').slice(0, 3).toUpperCase(),
            role: 'Cộng tác viên',
            avatarUrl: inv.fanpageAvatarUrl,
          })
        }
      }
    }
  }, [invitations, addFanpage])

  // Handle click outside & Escape key
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

  // Chấp nhận lời mời qua API Backend
  const handleAccept = async (inv: any) => {
    try {
      await fanpageService.acceptInvitation(inv.id)
      addFanpage({
        id: String(inv.fanpageId),
        name: inv.fanpageName,
        code: inv.fanpageName.slice(0, 3).toUpperCase(),
        role: 'Cộng tác viên',
        avatarUrl: inv.fanpageAvatarUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['my-fanpage-member-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['my-participating-fanpages'] })
      refetchInvitations()
      if (onAccepted) {
        onAccepted(inv.fanpageName)
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err)
    }
  }

  // Từ chối lời mời qua API Backend
  const handleDecline = async (invId: number | string) => {
    try {
      await fanpageService.declineInvitation(invId)
      queryClient.invalidateQueries({ queryKey: ['my-fanpage-member-invitations'] })
      refetchInvitations()
    } catch (err) {
      console.error('Failed to decline invitation:', err)
    }
  }

  // Click vào thông báo hệ thống
  const handleNotificationClick = (item: NotificationItem) => {
    if (item.status === 'UNREAD') {
      markAsRead(item.id)
    }

    if (item.url) {
      let dest = item.url.trim()
      // Nếu backend chỉ trả về ID dạng chuỗi số
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

  // Format thời gian hiển thị thân thiện (giống phong cách mạng xã hội)
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

  // Badge icon nhỏ góc dưới avatar dựa trên nội dung thông báo
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
      text.includes('event') ||
      text.includes('sự kiện') ||
      text.includes('lịch trình')
    ) {
      return {
        bgColor: 'bg-[#0866FF]',
        icon: <Calendar className="w-2.5 h-2.5 text-white" />,
      }
    }
    if (
      text.includes('fanpage') ||
      text.includes('club') ||
      text.includes('mời') ||
      text.includes('vai trò') ||
      text.includes('admin')
    ) {
      return {
        bgColor: 'bg-[#F56A00]',
        icon: <Flag className="w-2.5 h-2.5 fill-white stroke-none" />,
      }
    }
    return {
      bgColor: 'bg-[#0866FF]',
      icon: <Bell className="w-2.5 h-2.5 text-white" />,
    }
  }

  // Lọc lời mời theo tab
  const filteredInvitations =
    filterTab === 'UNREAD'
      ? invitations.filter((i: any) => i.status === 'PENDING')
      : invitations

  // Lọc thông báo theo tab
  const filteredNotifications =
    filterTab === 'UNREAD'
      ? systemNotifications.filter((n) => n.status === 'UNREAD')
      : systemNotifications

  const pendingInvitationsCount = invitations.filter((i: any) => i.status === 'PENDING').length
  const unreadNotificationsCount = systemNotifications.filter((n) => n.status === 'UNREAD').length
  const totalUnread = pendingInvitationsCount + unreadNotificationsCount

  const hasAnyItems = filteredInvitations.length > 0 || filteredNotifications.length > 0

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[390px] rounded-2xl border border-[#E1E7EF] dark:border-border bg-white dark:bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-left select-none"
      role="menu"
      aria-orientation="vertical"
    >
      {/* Header: Tiêu đề + Bộ lọc Tất cả / Chưa đọc + Nút Đánh dấu đã đọc */}
      <div className="px-2 pt-1 pb-2 border-b border-[#EDF0F4] dark:border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-sans font-bold text-base text-foreground">
              Thông báo
            </h3>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary rounded-full">
                {totalUnread} mới
              </span>
            )}
          </div>

          {unreadNotificationsCount > 0 && (
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

        {/* Filter Pills (Facebook style: Tất cả / Chưa đọc) */}
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
            {totalUnread > 0 && (
              <span className={`text-[10px] px-1 rounded-full ${
                filterTab === 'UNREAD' ? 'bg-white/20 text-white' : 'bg-primary text-white'
              }`}>
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-1.5 mt-2 max-h-[380px] overflow-y-auto pr-0.5">
        {!hasAnyItems ? (
          <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
              <Bell className="w-5 h-5 stroke-[1.5]" />
            </div>
            <span>
              {filterTab === 'UNREAD'
                ? 'Không có thông báo chưa đọc nào.'
                : 'Chưa có thông báo nào.'}
            </span>
          </div>
        ) : (
          <>
            {/* 1. LỜI MỜI THAM GIA FANPAGE (GIỮ NGUYÊN GIAO DIỆN & TÍNH NĂNG HIỆN TẠI) */}
            {filteredInvitations.map((inv: any) => {
              const isPending = inv.status === 'PENDING'
              const isAccepted = inv.status === 'ACCEPTED'
              const isDeclined = inv.status === 'DECLINED' || inv.status === 'REJECTED'

              const recipientFullName = `${inv.userLastName || ''} ${inv.userFirstName || ''}`.trim()
              const isRecipientSelf =
                (user?.email && inv.userEmail && user.email.toLowerCase() === inv.userEmail.toLowerCase()) ||
                (user?.id && inv.userId && String(user.id) === String(inv.userId)) ||
                (user?.name && recipientFullName && user.name.toLowerCase() === recipientFullName.toLowerCase())

              const inviterName =
                inv.inviterName ||
                inv.createdByName ||
                (!isRecipientSelf && recipientFullName ? recipientFullName : '') ||
                (Number(inv.fanpageId) === 1 || inv.fanpageName?.includes('CNTT') ? 'Nguyễn Minh Anh' : 'Ban quản trị')

              return (
                <div
                  key={`inv-${inv.id}`}
                  className={`p-2.5 rounded-xl transition-colors flex items-start gap-3 ${
                    isPending
                      ? 'bg-blue-50/50 dark:bg-blue-950/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Inviter Avatar with Flag Badge */}
                  <div className="relative shrink-0">
                    {inv.fanpageAvatarUrl || inv.userAvatarUrl ? (
                      <img
                        src={inv.fanpageAvatarUrl || inv.userAvatarUrl}
                        alt={inv.fanpageName}
                        className="w-11 h-11 rounded-full object-cover border border-border/60"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#1B4B8A]/10 text-[#1B4B8A] font-bold flex items-center justify-center text-xs">
                        {inv.fanpageName?.substring(0, 2).toUpperCase() || 'FP'}
                      </div>
                    )}

                    {/* Orange badge with Flag icon on bottom right */}
                    <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#F56A00] text-white flex items-center justify-center border-2 border-white dark:border-card shadow-xs">
                      <Flag className="w-2.5 h-2.5 fill-white stroke-none" />
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs leading-snug text-foreground">
                        <span className="font-bold text-[#050505] dark:text-white">
                          {inviterName}
                        </span>{' '}
                        đã mời bạn tham gia ban tổ chức fanpage{' '}
                        <span className="font-bold text-[#050505] dark:text-white">
                          {inv.fanpageName}
                        </span>
                        .
                      </p>
                      {isPending && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-[11px] font-medium text-[#6B7280] dark:text-muted-foreground">
                      {formatTimeDisplay(inv.createdAt)}
                    </p>

                    {/* Action buttons (Chấp nhận / Từ chối) */}
                    {isPending && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAccept(inv)}
                          className="px-4 py-1.5 rounded-lg bg-[#0866FF] hover:bg-[#0055d4] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                        >
                          Chấp nhận
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(inv.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-muted text-[#050505] dark:text-foreground text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {isAccepted && (
                      <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã chấp nhận lời mời</span>
                      </div>
                    )}

                    {isDeclined && (
                      <div className="text-[11px] font-medium text-muted-foreground pt-0.5">
                        Đã từ chối lời mời
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* 2. THÔNG BÁO HỆ THỐNG TỪ BACKEND (/notifications) */}
            {filteredNotifications.map((item) => {
              const isUnread = item.status === 'UNREAD'
              const badge = getNotificationIconBadge(item.title, item.message)

              return (
                <div
                  key={`notif-${item.id}`}
                  onClick={() => handleNotificationClick(item)}
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
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                    )}

                    {/* Mini badge icon on bottom right */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full ${badge.bgColor} text-white flex items-center justify-center border-2 border-white dark:border-card shadow-xs`}
                    >
                      {badge.icon}
                    </div>
                  </div>

                  {/* Notification Content */}
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
            })}
          </>
        )}
      </div>

      {/* Footer Button */}
      <div className="pt-2 border-t border-[#EDF0F4] dark:border-border/60 mt-1">
        <button
          type="button"
          onClick={() => {
            if (unreadNotificationsCount > 0) {
              markAllAsRead()
            }
            onClose()
          }}
          className="w-full py-2 px-3 rounded-lg bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-muted dark:hover:bg-muted/80 text-[#050505] dark:text-foreground font-semibold text-xs transition-colors cursor-pointer text-center"
        >
          {unreadNotificationsCount > 0 ? 'Đánh dấu tất cả đã đọc' : 'Xem thông báo trước đó'}
        </button>
      </div>
    </div>
  )
}
