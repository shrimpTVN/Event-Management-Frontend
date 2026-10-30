import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Search,
  X,
  Trash2,
  Lock,
  Unlock,
  Crown,
  LogOut,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import type {
  FanpageMember,
  FanpageInvitation,
  FanpageSummary,
} from '../types/fanpageAdmin.types'
import {
  MOCK_FANPAGE_MEMBERS,
  MOCK_FANPAGE_INVITATIONS,
  fanpageAdminService,
} from '../services/fanpageAdminService'

interface FanpageMembersViewProps {
  currentFanpage?: FanpageSummary
  members?: FanpageMember[]
}

export const FanpageMembersView: React.FC<FanpageMembersViewProps> = ({
  currentFanpage,
  members: propMembers,
}) => {
  const queryClient = useQueryClient()
  const targetFpId = currentFanpage?.id || '1'
  const loggedInUser = useAuthStore((s) => s.user)

  // Fetch real members from backend/mock
  const { data: serverMembers = [] } = useQuery<FanpageMember[]>({
    queryKey: ['fanpage-members', targetFpId],
    queryFn: () => fanpageAdminService.getFanpageMembers(targetFpId),
    enabled: Boolean(targetFpId),
  })

  const [members, setMembers] = useState<FanpageMember[]>(
    serverMembers.length > 0
      ? serverMembers
      : propMembers && propMembers.length > 0
      ? propMembers
      : MOCK_FANPAGE_MEMBERS
  )
  const [invitations, setInvitations] = useState<FanpageInvitation[]>(MOCK_FANPAGE_INVITATIONS)
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'INVITATIONS'>('MEMBERS')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (serverMembers.length > 0) {
      setMembers(serverMembers)
    } else if (propMembers && propMembers.length > 0) {
      setMembers(propMembers)
    }
  }, [serverMembers, propMembers])

  // Current logged in user resilient detection
  const currentUser =
    (members || []).find(
      (m) =>
        (loggedInUser && (String(m?.userId) === String(loggedInUser.id) || m?.email === loggedInUser.email)) ||
        m?.id === 'mem-2' ||
        m?.id === 'mem-1'
    ) ||
    (members || []).find((m) => m?.role === 'ADMIN') ||
    (members || [])[0]
  const isCurrentUserAdmin = currentUser?.role === 'ADMIN'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [transferTarget, setTransferTarget] = useState<FanpageMember | null>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveWarning, setLeaveWarning] = useState<string | null>(null)

  // Notification feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'warning' | 'error'
    message: string
  } | null>(null)

  const showFeedback = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev))
    }, 4500)
  }

  // 1. Thêm thành viên mới bằng Email (Gửi lời mời)
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = (inviteEmail || '').trim().toLowerCase()
    if (!cleanEmail) return

    // Check if already a member
    const existingMember = (members || []).find(
      (m) => String(m?.email || '').toLowerCase() === cleanEmail
    )
    if (existingMember) {
      showFeedback('error', `Email ${cleanEmail} đã là thành viên trong ban quản trị!`)
      return
    }

    // Check if invitation already pending
    const existingInvite = (invitations || []).find(
      (inv) => String(inv?.email || '').toLowerCase() === cleanEmail && inv?.status === 'PENDING'
    )
    if (existingInvite) {
      showFeedback('warning', `Đã có lời mời đang chờ gửi tới ${cleanEmail}!`)
      return
    }

    const now = new Date()
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')} ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()}`

    const newInvite: FanpageInvitation = {
      id: `inv-${Date.now()}`,
      email: cleanEmail,
      role: 'COLLABORATOR',
      invitedBy: currentUser?.fullName || 'Nguyễn Minh Anh (Admin)',
      invitedAt: timeString,
      status: 'PENDING',
    }

    setInvitations([newInvite, ...invitations])
    setInviteEmail('')
    setIsAddModalOpen(false)
    showFeedback(
      'success',
      `Đã gửi lời mời tham gia tới ${cleanEmail}! Người nhận sẽ được tham gia sau khi nhấn xác nhận.`
    )
  }

  // 2. Chuyển quyền Quản trị viên
  const handleConfirmTransferAdmin = () => {
    if (!transferTarget) return

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === transferTarget.id) {
          return {
            ...m,
            role: 'ADMIN',
            title: 'Quản trị viên (Trưởng ban)',
          }
        }
        if (m.id === currentUser?.id) {
          return {
            ...m,
            role: 'COLLABORATOR',
            title: 'Cộng tác viên ban tổ chức',
          }
        }
        return m
      })
    )

    showFeedback(
      'success',
      `Đã chuyển giao quyền Quản trị viên cho ${transferTarget.fullName}. Bạn hiện là Cộng tác viên của Fanpage.`
    )
    setTransferTarget(null)
  }

  // 3. Tự rời khỏi Fanpage
  const handleOpenLeaveModal = () => {
    if (currentUser?.role === 'ADMIN') {
      const otherMembers = (members || []).filter((m) => m?.id !== currentUser?.id)
      if (otherMembers.length > 0) {
        setLeaveWarning(
          'Bạn đang là Quản trị viên của Fanpage. Bạn không thể tự ý rời khỏi Fanpage trước khi chuyển quyền Quản trị viên cho một Cộng tác viên khác!'
        )
      } else {
        setLeaveWarning(
          'Fanpage hiện chỉ có một mình bạn là Quản trị viên. Hãy thêm thành viên và chuyển quyền trước khi rời khỏi Fanpage.'
        )
      }
      setIsLeaveModalOpen(true)
      return
    }

    setLeaveWarning(null)
    setIsLeaveModalOpen(true)
  }

  const handleConfirmLeaveFanpage = () => {
    setMembers((prev) => prev.filter((m) => m.id !== currentUser?.id))
    setIsLeaveModalOpen(false)
    showFeedback('success', 'Bạn đã tự rời khỏi ban quản trị Fanpage thành công.')
  }

  // 4. Xóa Cộng tác viên khỏi Fanpage
  const handleDeleteMember = (member: FanpageMember) => {
    if (member.role === 'ADMIN') {
      showFeedback('warning', 'Không thể xóa Quản trị viên. Hãy chuyển quyền trước nếu cần thay đổi!')
      return
    }
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${member.fullName} khỏi danh sách thành viên Fanpage?`
      )
    ) {
      try {
        const uId = member.userId || member.id.replace('mem-', '')
        fanpageAdminService.removeFanpageMember(targetFpId, uId).then(() => {
          queryClient.invalidateQueries({ queryKey: ['fanpage-members', targetFpId] })
        })
      } catch (err) {
        console.error('Error removing member', err)
      }
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      showFeedback('success', `Đã xóa ${member.fullName} khỏi Fanpage.`)
    }
  }

  // 5. Khóa / Mở khóa quyền thành viên
  const handleToggleActive = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    )
  }

  // 6. Xử lý Lời mời
  const handleCancelInvite = (invId: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invId))
    showFeedback('warning', 'Đã hủy lời mời tham gia.')
  }

  const handleResendInvite = (email: string) => {
    showFeedback('success', `Đã gửi lại lời mời tham gia tới email ${email}.`)
  }

  const handleSimulateAcceptInvite = (invite: FanpageInvitation) => {
    const rawEmail = invite?.email || 'thanhvien@student.ctu.edu.vn'
    const namePrefix = rawEmail.split('@')[0]
    const formattedName = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1)
    const newMember: FanpageMember = {
      id: `mem-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      staffId: `B24${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: formattedName,
      email: rawEmail,
      avatarText: formattedName.slice(0, 2).toUpperCase(),
      role: 'COLLABORATOR',
      title: 'Cộng tác viên ban tổ chức',
      phone: '0901 000 999',
      joinedAt: new Date().toISOString().split('T')[0],
      isActive: true,
    }

    setMembers((prev) => [newMember, ...prev])
    setInvitations((prev) => prev.filter((i) => i.id !== invite.id))
    showFeedback(
      'success',
      `Thành công: ${rawEmail} đã nhấn xác nhận tham gia và trở thành Cộng tác viên!`
    )
  }

  const searchLower = (searchTerm || '').trim().toLowerCase()

  // Filtered members list
  const filteredMembers = (members || []).filter((m) => {
    if (!m) return false
    const nameMatch = String(m.fullName || '').toLowerCase().includes(searchLower)
    const emailMatch = String(m.email || '').toLowerCase().includes(searchLower)
    const staffIdMatch = String(m.staffId || '').toLowerCase().includes(searchLower)
    return nameMatch || emailMatch || staffIdMatch
  })

  // Filtered invitations list
  const filteredInvitations = (invitations || []).filter((i) => {
    if (!i) return false
    const emailMatch = String(i.email || '').toLowerCase().includes(searchLower)
    const nameMatch = String((i as any).name || i.invitedBy || '').toLowerCase().includes(searchLower)
    return emailMatch || nameMatch
  })

  const adminCount = (members || []).filter((m) => m?.role === 'ADMIN').length
  const collaboratorCount = (members || []).filter((m) => m?.role === 'COLLABORATOR').length
  const pendingInviteCount = (invitations || []).filter((i) => i?.status === 'PENDING').length

  // 4 Cards thống kê chuẩn kích thước và phong cách các trang khác
  const statsCards = [
    {
      id: 'TOTAL_MEMBERS',
      title: 'Tất cả thành viên',
      value: (members || []).length,
      subText: 'Thành viên ban tổ chức',
    },
    {
      id: 'ADMINS',
      title: 'Quản trị viên (Trưởng ban)',
      value: adminCount,
      subText: 'Toàn quyền quản trị fanpage',
    },
    {
      id: 'COLLABORATORS',
      title: 'Cộng tác viên (CTV)',
      value: collaboratorCount,
      subText: 'Hỗ trợ tổ chức sự kiện',
    },
    {
      id: 'INVITATIONS',
      title: 'Lời mời chờ xác nhận',
      value: pendingInviteCount,
      subText: 'Chờ phản hồi qua email',
    },
  ]

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị fanpage</span>
            <span>/</span>
            <span className="text-primary font-bold">Thành viên</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý thành viên ban tổ chức
          </h1>
          <p className="text-xs text-muted-foreground">
            Theo dõi danh sách quản trị viên, cộng tác viên và quản lý lời mời tham gia ban tổ chức.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {currentUser && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenLeaveModal}
              className="h-9 rounded-lg border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Rời khỏi Fanpage</span>
            </Button>
          )}

          {isCurrentUserAdmin && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 rounded-lg gap-2 cursor-pointer shrink-0"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Mời thành viên qua Email</span>
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Thống kê thành viên (4 Cards đồng bộ kích thước chuẩn như trang Sự kiện và Tổng quan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-border/80 text-left hover:shadow-xs transition-shadow"
          >
            <div className="text-xs sm:text-sm font-normal text-[#667085] dark:text-muted-foreground line-clamp-1 mb-2">
              {card.title}
            </div>

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-bold font-k2d text-foreground tracking-tight leading-none">
                {card.value}
              </span>
            </div>

            <div className="text-xs text-[#667085] dark:text-muted-foreground truncate">
              {card.subText}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Danh sách thành viên & Folder Tabs (Chuẩn Folder Tab như trang Sự kiện) */}
      <div className="flex flex-col mt-2">
        {/* Hàng Folder Tab Bar phía trên */}
        <div className="flex items-end gap-1 sm:gap-2 -mb-px relative z-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'MEMBERS', label: 'Danh sách thành viên', count: (members || []).length },
            { id: 'INVITATIONS', label: 'Lời mời qua email', count: pendingInviteCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 text-sm transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white dark:bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-[#E5E7EB] dark:border-border shadow-2xs pb-3'
                    : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-t-lg'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs ${
                    isActive
                      ? 'text-foreground/80 font-normal'
                      : 'text-muted-foreground/70 font-normal'
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Khung chính chứa Toolbar & Bảng sự kiện / thành viên */}
        <div
          className={`bg-white dark:bg-card border border-[#E5E7EB] dark:border-border ${
            activeTab === 'MEMBERS' ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
          } p-4 sm:p-5 flex flex-col gap-4 shadow-2xs`}
        >
          {/* Header trong panel: Tiêu đề bên trái, Search & Toolbar bên phải */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div>
              <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                {activeTab === 'MEMBERS'
                  ? `Danh sách thành viên ban tổ chức (${(members || []).length})`
                  : `Danh sách lời mời qua email (${pendingInviteCount})`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'MEMBERS'
                  ? 'Quản lý, phân quyền quản trị và theo dõi danh sách cộng tác viên của fanpage.'
                  : 'Quản lý các thư mời tham gia ban tổ chức đang chờ sinh viên phản hồi qua email.'}
              </p>
            </div>

            {/* Toolbar góc phải: Search */}
            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto w-full md:w-auto">
              <div className="relative flex-1 sm:w-72 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
                <Input
                  type="text"
                  placeholder={
                    activeTab === 'MEMBERS'
                      ? 'Tìm theo tên, email, MSSV...'
                      : 'Tìm theo email đã gửi lời mời...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs rounded-lg border-border"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bảng danh sách: Dạng Floating Rounded Rows đồng bộ 100% với trang Sự kiện */}
          <div className="p-4 sm:p-5 bg-[#F9FAFB]/50 dark:bg-background/40 overflow-x-auto rounded-xl">
            <div className="min-w-[960px]">
              {/* Tab 1: Danh sách thành viên chính thức */}
              {activeTab === 'MEMBERS' && (
                <>
                  {/* Header hàng cột phẳng, chữ xám nhẹ, không viền gồ ghề */}
                  <div className="grid grid-cols-[2.5fr_2fr_1.4fr_1.3fr_1.2fr_auto] items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
                    <div>Thành viên</div>
                    <div>Liên hệ</div>
                    <div>Vai trò</div>
                    <div>Ngày tham gia</div>
                    <div className="text-center">Trạng thái</div>
                    <div className="text-right min-w-[130px]">Thao tác</div>
                  </div>

                  {/* Danh sách các hàng thành viên dạng Floating Rounded Cards */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {filteredMembers.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                        Không tìm thấy thành viên nào phù hợp với bộ lọc.
                      </div>
                    ) : (
                      filteredMembers.map((mem) => {
                        const isSelf = Boolean(
                          (currentUser && (mem.id === currentUser.id || String(mem.userId) === String(currentUser.userId))) ||
                          (loggedInUser && (String(mem.userId) === String(loggedInUser.id) || mem.email === loggedInUser.email))
                        )
                        const isAdmin = mem.role === 'ADMIN'
                        const displayName =
                          mem.fullName ||
                          `${(mem as any).lastName || ''} ${(mem as any).firstName || ''}`.trim() ||
                          (isSelf ? (loggedInUser?.name || 'Nguyễn Minh Anh') : 'Thành viên')
                        const displayStaffId =
                          mem.staffId ||
                          (mem.userId === '2' || mem.id === 'mem-2' ? 'CB-0104' : `TV-${mem.userId || mem.id.replace('mem-', '')}`)
                        const displayTitle =
                          mem.title ||
                          (isAdmin ? 'Quản trị viên (Trưởng ban)' : 'Cộng tác viên ban tổ chức')
                        const displayJoinedAt =
                          mem.joinedAt ||
                          (mem as any).createdAt?.split('T')[0] ||
                          '2026-08-15'
                        const displayIsActive = mem.isActive !== false

                        return (
                          <div
                            key={mem.id}
                            className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all px-5 py-3.5 grid grid-cols-[2.5fr_2fr_1.4fr_1.3fr_1.2fr_auto] items-center group"
                          >
                            {/* Cột 1: Thành viên */}
                            <div className="flex items-center gap-3 pr-2 min-w-0">
                              {mem.avatarUrl ? (
                                <img
                                  src={mem.avatarUrl}
                                  alt={displayName}
                                  className="h-10 w-10 rounded-full object-cover shrink-0 shadow-xs border border-border/60"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-k2d font-bold text-xs flex items-center justify-center shrink-0">
                                  {mem.avatarText || displayName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-foreground text-xs group-hover:text-primary transition-colors truncate">
                                    {displayName}
                                  </p>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {displayStaffId} · {displayTitle}
                                </p>
                              </div>
                            </div>

                            {/* Cột 2: Liên hệ */}
                            <div className="text-[11px] pr-2 space-y-0.5 min-w-0">
                              <p className="text-foreground font-medium truncate">{mem.email || (isSelf && loggedInUser?.email) || 'organizer@ctu.edu.vn'}</p>
                              <p className="text-muted-foreground">{mem.phone || '0912 345 678'}</p>
                            </div>

                            {/* Cột 3: Vai trò */}
                            <div>
                              {isAdmin ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Quản trị viên</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5">
                                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Cộng tác viên</span>
                                </span>
                              )}
                            </div>

                            {/* Cột 4: Ngày tham gia */}
                            <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {displayJoinedAt}
                            </div>

                            {/* Cột 5: Trạng thái */}
                            <div className="text-center">
                              {displayIsActive ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                                  Tạm khóa
                                </span>
                              )}
                            </div>

                            {/* Cột 6: Thao tác */}
                            <div className="flex items-center justify-end gap-1.5 min-w-[130px]">
                              {isCurrentUserAdmin && !isAdmin && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setTransferTarget(mem)}
                                  className="h-7 px-2 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 gap-1 cursor-pointer shadow-2xs rounded-lg"
                                  title="Chuyển quyền Quản trị viên"
                                >
                                  <Crown className="h-3 w-3 text-amber-600" />
                                  <span>Chuyển</span>
                                </Button>
                              )}

                              {isCurrentUserAdmin && !isAdmin && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  title={mem.isActive ? 'Tạm khóa quyền' : 'Kích hoạt lại'}
                                  onClick={() => handleToggleActive(mem.id)}
                                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  {mem.isActive ? (
                                    <Lock className="h-3.5 w-3.5" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                                  )}
                                </Button>
                              )}

                              {isCurrentUserAdmin && !isAdmin && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  title="Xóa khỏi fanpage"
                                  onClick={() => handleDeleteMember(mem)}
                                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}

                              {isAdmin && (
                                <span className="text-[11px] text-muted-foreground italic px-1 whitespace-nowrap">
                                  Chủ nhiệm hiện tại
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              )}

              {/* Tab 2: Danh sách lời mời qua email */}
              {activeTab === 'INVITATIONS' && (
                <>
                  {/* Header hàng cột phẳng */}
                  <div className="grid grid-cols-[2.4fr_1.8fr_1.2fr_1.4fr_1.4fr_auto] items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
                    <div>Email người nhận</div>
                    <div>Người mời</div>
                    <div>Vai trò</div>
                    <div>Thời gian gửi</div>
                    <div className="text-center">Trạng thái</div>
                    <div className="text-right min-w-[160px]">Thao tác</div>
                  </div>

                  {/* Danh sách các hàng lời mời dạng Floating Rounded Cards */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {filteredInvitations.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                        Không có lời mời nào đang chờ.
                      </div>
                    ) : (
                      filteredInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs transition-all px-5 py-3.5 grid grid-cols-[2.4fr_1.8fr_1.2fr_1.4fr_1.4fr_auto] items-center"
                        >
                          <div className="flex items-center gap-2 font-semibold text-foreground text-xs pr-2 truncate min-w-0">
                            <Mail className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{inv.email || inv.name || 'Thành viên mời'}</span>
                          </div>

                          <div className="text-[11px] text-muted-foreground pr-2 truncate min-w-0">
                            {inv.invitedBy}
                          </div>

                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold whitespace-nowrap">
                              Cộng tác viên
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {inv.invitedAt}
                          </div>

                          <div className="text-center">
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap">
                              <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                              <span>Chờ xác nhận</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 min-w-[160px]">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSimulateAcceptInvite(inv)}
                              className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer shadow-2xs rounded-lg shrink-0 whitespace-nowrap"
                              title="Xác nhận tham gia"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Xác nhận</span>
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvite(inv.email || '')}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                              title="Gửi lại email lời mời"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvite(inv.id)}
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-rose-600 hover:border-rose-200 cursor-pointer shrink-0"
                              title="Hủy lời mời"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL THÊM THÀNH VIÊN QUA EMAIL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-card border border-border p-6 space-y-4 shadow-xl text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    Mời thành viên qua Email
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Gửi lời mời tham gia Ban tổ chức Fanpage
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email sinh viên / cán bộ cần mời <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="VD: sinhvien@student.ctu.edu.vn"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-9 text-xs rounded-lg border-border"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Hệ thống sẽ gửi email chứa liên kết xác nhận tham gia ban tổ chức.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Vai trò mặc định: Cộng tác viên</span>
                </p>
                <p className="text-[11px]">
                  Cộng tác viên có quyền hỗ trợ quản lý sự kiện và điểm danh người tham gia. Bạn có thể chuyển quyền Quản trị viên cho thành viên này sau.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-9 rounded-lg cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 rounded-lg gap-1.5 cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Gửi lời mời</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL CHUYỂN QUYỀN QUẢN TRỊ VIÊN */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-card border border-border p-6 space-y-4 shadow-xl text-left animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Chuyển quyền Quản trị viên
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chuyển vai trò Trưởng ban tổ chức Fanpage
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Lưu ý quan trọng</span>
              </p>
              <p className="leading-relaxed">
                Sau khi chuyển, <strong className="font-bold">{transferTarget.fullName}</strong> sẽ trở thành Quản trị viên cao nhất. Bạn sẽ chuyển về vai trò <strong className="font-bold">Cộng tác viên</strong>.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTransferTarget(null)}
                className="h-9 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmTransferAdmin}
                className="h-9 rounded-lg bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer shadow-xs"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Xác nhận chuyển quyền</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL TỰ RỜI KHỎI FANPAGE */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-card border border-border p-6 space-y-4 shadow-xl text-left animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Rời khỏi ban tổ chức Fanpage
                </h3>
                <p className="text-xs text-muted-foreground">
                  Xác nhận ngừng tham gia quản trị đơn vị này
                </p>
              </div>
            </div>

            {leaveWarning ? (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Không thể thực hiện</span>
                </p>
                <p className="text-[11px] leading-relaxed">{leaveWarning}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bạn có chắc chắn muốn rời khỏi ban quản trị fanpage này? Bạn sẽ không còn quyền xem hoặc chỉnh sửa các sự kiện của đơn vị.
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLeaveModalOpen(false)}
                className="h-9 rounded-lg cursor-pointer"
              >
                Đóng
              </Button>
              {!leaveWarning && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleConfirmLeaveFanpage}
                  className="h-9 rounded-lg cursor-pointer"
                >
                  Xác nhận rời khỏi
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
