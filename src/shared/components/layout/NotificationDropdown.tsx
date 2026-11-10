import React, { useEffect, useRef } from 'react'
import { Flag, Check } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fanpageService } from '@/features/fanpage/services/fanpageService'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'

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
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { addFanpage } = useUserFanpagesStore()

  // Lấy danh sách lời mời thực tế từ Database thông qua API GET /fanpage-member-invitations/me
  const { data: invitations = [], refetch } = useQuery({
    queryKey: ['my-fanpage-member-invitations', user?.email],
    queryFn: () => fanpageService.getMyInvitations(),
    enabled: isOpen && Boolean(user),
    staleTime: 15 * 1000,
  })

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

  // Chấp nhận lời mời thực tế qua API Backend
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
      refetch()
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
      refetch()
    } catch (err) {
      console.error('Failed to decline invitation:', err)
    }
  }

  // Format ngày hiển thị
  const formatTimeDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Gần đây'
    try {
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
      }
    } catch {}
    return 'Gần đây'
  }

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] rounded-2xl border border-[#E1E7EF] dark:border-border bg-white dark:bg-card p-3 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 text-left select-none"
      role="menu"
      aria-orientation="vertical"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-[#EDF0F4] dark:border-border/60">
        <h3 className="font-sans font-bold text-base text-foreground">
          Lời mời tham gia Fanpage
        </h3>
        <span className="text-xs text-muted-foreground">
          {invitations.filter((i: any) => i.status === 'PENDING').length} mới
        </span>
      </div>

      {/* Notifications list: Hiển thị lời mời tham gia fanpage thực tế */}
      <div className="space-y-2 mt-2 max-h-[360px] overflow-y-auto">
        {invitations.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Chưa có lời mời tham gia fanpage nào.
          </div>
        ) : (
          invitations.map((inv: any) => {
            const isPending = inv.status === 'PENDING'
            const isAccepted = inv.status === 'ACCEPTED'
            const isDeclined = inv.status === 'DECLINED' || inv.status === 'REJECTED'

            // Xác định tên người gửi lời mời:
            // Chú ý: Backend FanpageMemberInvitationResponseDto hiện trả về userFirstName / userLastName là của người NHẬN lời mời (recipient).
            // Nếu các trường này trùng với người dùng hiện tại (người đang nhận thông báo), tuyệt đối không dùng làm người mời!
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
                key={inv.id}
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
          })
        )}
      </div>

      {/* Footer Button: Xem thông báo trước đó */}
      <div className="pt-2 border-t border-[#EDF0F4] dark:border-border/60 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 px-3 rounded-lg bg-[#E4E6EB] hover:bg-[#D8DADF] dark:bg-muted dark:hover:bg-muted/80 text-[#050505] dark:text-foreground font-semibold text-xs transition-colors cursor-pointer text-center"
        >
          Xem thông báo trước đó
        </button>
      </div>
    </div>
  )
}
