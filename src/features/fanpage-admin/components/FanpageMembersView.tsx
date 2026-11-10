import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/shared/utils/cn'
import {
  Search,
  X,
  Trash2,
  Lock,
  Unlock,
  Crown,
  LogOut,
  Mail,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  RotateCcw,
  UserCheck,
  Eye,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'
import { apiClient } from '@/shared'
import type {
  FanpageMember,
  FanpageInvitation,
  FanpageSummary,
} from '../types/fanpageAdmin.types'
import {
  MOCK_FANPAGE_MEMBERS,
  fanpageAdminService,
} from '../services/fanpageAdminService'

interface FanpageMembersViewProps {
  currentFanpage?: FanpageSummary
  members?: FanpageMember[]
}

interface SystemUserSuggestion {
  id: string
  email: string
  fullName: string
  studentId?: string
}

const DEFAULT_SYSTEM_USERS: SystemUserSuggestion[] = [
  { id: '1', email: 'loc@student.ctu.edu.vn', fullName: 'Đoàn Tài Lộc', studentId: 'B2300000' },
  { id: '2', email: 'organizer@ctu.edu.vn', fullName: 'Nguyễn Minh Anh', studentId: 'CB-0104' },
  { id: '3', email: 'admin@ctu.edu.vn', fullName: 'Quản Trị Hệ Thống' },
  { id: '101', email: 'anhlhb2100123@student.ctu.edu.vn', fullName: 'Lê Hoàng Anh', studentId: 'B2100123' },
  { id: '102', email: 'bichtnb2100456@student.ctu.edu.vn', fullName: 'Trần Ngọc Bích', studentId: 'B2100456' },
  { id: '103', email: 'minhnvb2200789@student.ctu.edu.vn', fullName: 'Nguyễn Văn Minh', studentId: 'B2200789' },
  { id: '104', email: 'thaoptb2200321@student.ctu.edu.vn', fullName: 'Phạm Thu Thảo', studentId: 'B2200321' },
  { id: '105', email: 'huyvqb2300654@student.ctu.edu.vn', fullName: 'Võ Quốc Huy', studentId: 'B2300654' },
  { id: '106', email: 'khoaddb2109876@student.ctu.edu.vn', fullName: 'Đỗ Đăng Khoa', studentId: 'B2109876' },
  { id: '117', email: 'test@ctu.edu.vn', fullName: 'Nguyễn Văn A' },
  { id: '120', email: 'namnhb2301001@student.ctu.edu.vn', fullName: 'Nguyễn Hoài Nam', studentId: 'B2301001' },
  { id: '121', email: 'linhttb2301002@student.ctu.edu.vn', fullName: 'Trần Trúc Linh', studentId: 'B2301002' },
  { id: '122', email: 'duyptb2301003@student.ctu.edu.vn', fullName: 'Phan Thanh Duy', studentId: 'B2301003' },
  { id: '123', email: 'nhilpb2301004@student.ctu.edu.vn', fullName: 'Lê Phương Nhi', studentId: 'B2301004' },
  { id: '124', email: 'quangvvb2301005@student.ctu.edu.vn', fullName: 'Vũ Văn Quang', studentId: 'B2301005' },
  { id: '125', email: 'maihnb2201006@student.ctu.edu.vn', fullName: 'Huỳnh Ngọc Mai', studentId: 'B2201006' },
  { id: '126', email: 'phatdnb2201007@student.ctu.edu.vn', fullName: 'Đặng Tấn Phát', studentId: 'B2201007' },
  { id: '127', email: 'tramntb2201008@student.ctu.edu.vn', fullName: 'Nguyễn Thùy Trâm', studentId: 'B2201008' },
  { id: '128', email: 'trungldb2201009@student.ctu.edu.vn', fullName: 'Lâm Đức Trung', studentId: 'B2201009' },
  { id: '129', email: 'anhntb2201010@student.ctu.edu.vn', fullName: 'Ngô Tuấn Anh', studentId: 'B2201010' },
  { id: '130', email: 'hienttb2101011@student.ctu.edu.vn', fullName: 'Trịnh Thu Hiền', studentId: 'B2101011' },
  { id: '131', email: 'hoangtmb2101012@student.ctu.edu.vn', fullName: 'Tạ Minh Hoàng', studentId: 'B2101012' },
  { id: '132', email: 'vyntb2101013@student.ctu.edu.vn', fullName: 'Nguyễn Tường Vy', studentId: 'B2101013' },
  { id: '133', email: 'sonptb2101014@student.ctu.edu.vn', fullName: 'Phạm Thái Sơn', studentId: 'B2101014' },
  { id: '134', email: 'ngadtb2101015@student.ctu.edu.vn', fullName: 'Đỗ Thanh Nga', studentId: 'B2101015' },
]

// Hàm format ngày hiển thị chuẩn Việt Nam dd/MM/yyyy
const formatDateDisplay = (dateStr?: string): string => {
  if (!dateStr) return '05/11/2026'
  const trimmed = dateStr.trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`
  }
  try {
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }
  } catch {}
  return trimmed
}

export const FanpageMembersView: React.FC<FanpageMembersViewProps> = ({
  currentFanpage,
  members: propMembers,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const targetFpId = currentFanpage?.id || '1'
  const loggedInUser = useAuthStore((s) => s.user)

  // Fetch real members from backend/mock
  const { data: serverMembers = [], isLoading: isLoadingMembers } = useQuery<FanpageMember[]>({
    queryKey: ['fanpage-members', targetFpId],
    queryFn: () => fanpageAdminService.getFanpageMembers(targetFpId),
    enabled: Boolean(targetFpId),
  })

  // Xác định người dùng hiện tại có phải là Quản trị viên của Fanpage hay không
  const isCurrentUserAdmin = Boolean(
    currentFanpage?.role === 'Quản trị viên' ||
    currentFanpage?.role === 'ADMIN' ||
    serverMembers.some(
      (m) =>
        (m.role === 'ADMIN' || m.title === 'Quản trị viên') &&
        ((loggedInUser?.id && String(m.userId) === String(loggedInUser.id)) ||
          (loggedInUser?.email && m.email && m.email.toLowerCase() === loggedInUser.email.toLowerCase()))
    )
  )

  // Fetch real invitations from backend (CHỈ DÀNH CHO QUẢN TRỊ VIÊN)
  // Lưu ý: Backend cấm sinh viên/cộng tác viên gọi API /fanpage-member-invitations/fanpage/{id} (trả về 401 AuthException)
  const { data: serverInvitations = [], isLoading: isLoadingInvitations } = useQuery<FanpageInvitation[]>({
    queryKey: ['fanpage-invitations', targetFpId],
    queryFn: () => fanpageAdminService.getFanpageInvitations(targetFpId),
    enabled: Boolean(targetFpId) && isCurrentUserAdmin,
  })

  const [members, setMembers] = useState<FanpageMember[]>(
    serverMembers.length > 0
      ? serverMembers
      : propMembers && propMembers.length > 0
      ? propMembers
      : MOCK_FANPAGE_MEMBERS
  )
  const [invitations, setInvitations] = useState<FanpageInvitation[]>(serverInvitations)
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'INVITATIONS'>('MEMBERS')
  const [searchTerm, setSearchTerm] = useState('')

  // Popover menus state
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const headerMenuRef = useRef<HTMLDivElement>(null)
  const actionMenuRef = useRef<HTMLDivElement>(null)

  // System users for email autocomplete
  const [inviteEmail, setInviteEmail] = useState('')
  const [systemUsers, setSystemUsers] = useState<SystemUserSuggestion[]>(DEFAULT_SYSTEM_USERS)
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const emailInputContainerRef = useRef<HTMLDivElement>(null)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)

  // Live search users for invitation via backend API: GET /api/users/search-users?keyword=...
  useEffect(() => {
    const term = inviteEmail.trim()
    if (!term) {
      setSystemUsers(DEFAULT_SYSTEM_USERS)
      return
    }

    let isMounted = true
    setIsSearchingUsers(true)
    const timer = setTimeout(async () => {
      try {
        const results = await fanpageAdminService.searchUsersForInvitation(term)
        if (isMounted) {
          if (results && results.length > 0) {
            setSystemUsers(results)
          } else {
            setSystemUsers(DEFAULT_SYSTEM_USERS)
          }
        }
      } catch (err) {
        console.warn('Search users error:', err)
      } finally {
        if (isMounted) setIsSearchingUsers(false)
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [inviteEmail])

  useEffect(() => {
    if (serverMembers.length > 0) {
      setMembers(serverMembers)
    } else if (propMembers && propMembers.length > 0) {
      setMembers(propMembers)
    }
  }, [serverMembers, propMembers])

  useEffect(() => {
    if (serverInvitations) {
      setInvitations(serverInvitations)
    }
  }, [serverInvitations])

  // Handle click outside for dropdowns & email suggestions
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(event.target as Node)
      ) {
        setIsHeaderMenuOpen(false)
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionMenuId(null)
      }
      if (
        emailInputContainerRef.current &&
        !emailInputContainerRef.current.contains(event.target as Node)
      ) {
        setShowEmailSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [])

  // Current logged in user detection
  const currentUser =
    (members || []).find(
      (m) =>
        (loggedInUser && (String(m?.userId) === String(loggedInUser.id) || m?.email === loggedInUser.email)) ||
        (loggedInUser?.email && m?.email && m.email.toLowerCase() === loggedInUser.email.toLowerCase())
    ) ||
    (members || []).find((m) => m?.role === 'ADMIN') ||
    (members || [])[0]

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<FanpageMember | null>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveWarning, setLeaveWarning] = useState<string | null>(null)
  const [viewingMember, setViewingMember] = useState<FanpageMember | null>(null)

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

  // Lọc danh sách email gợi ý
  const matchingSuggestions = systemUsers.filter((u) => {
    if (!inviteEmail.trim()) return false
    const term = inviteEmail.trim().toLowerCase()
    return (
      u.email.toLowerCase().includes(term) ||
      u.fullName.toLowerCase().includes(term) ||
      (u.studentId && u.studentId.toLowerCase().includes(term))
    )
  })

  // Kiểm tra email đã nhập có thuộc hệ thống không
  const isEmailValidInSystem = systemUsers.some(
    (u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase()
  )

  // 1. Thêm thành viên mới bằng Email (Gửi lời mời & kết nối API)
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = (inviteEmail || '').trim().toLowerCase()
    if (!cleanEmail) return

    // Kiểm tra định dạng email hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      showFeedback(
        'error',
        'Địa chỉ email không đúng định dạng! Vui lòng nhập email hợp lệ (ví dụ: student@ctu.edu.vn).'
      )
      return
    }

    // Kiểm tra đã là thành viên chưa
    const existingMember = (members || []).find(
      (m) => String(m?.email || '').toLowerCase() === cleanEmail
    )
    if (existingMember) {
      showFeedback('error', `Email ${cleanEmail} đã là thành viên trong ban quản trị!`)
      return
    }

    // Kiểm tra đã có lời mời chờ chưa
    const existingInvite = (invitations || []).find(
      (inv) => String(inv?.email || '').toLowerCase() === cleanEmail && inv?.status === 'PENDING'
    )
    if (existingInvite) {
      showFeedback('warning', `Đã có lời mời đang chờ gửi tới ${cleanEmail}!`)
      return
    }

    setIsSendingInvite(true)
    try {
      // Gọi API Backend: POST /api/fanpages/fanpage-admin/{targetFpId}/invite-member?email={cleanEmail}
      await fanpageAdminService.inviteFanpageMember(targetFpId, cleanEmail)
      await queryClient.invalidateQueries({ queryKey: ['fanpage-invitations', targetFpId] })
      await queryClient.invalidateQueries({ queryKey: ['fanpage-members', targetFpId] })
      setInviteEmail('')
      setIsAddModalOpen(false)
      showFeedback(
        'success',
        `Đã gửi lời mời tham gia tới ${cleanEmail} thành công!`
      )
    } catch (err: any) {
      console.warn('Backend invite-member call error', err)
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi lời mời'
      showFeedback('error', msg)
    } finally {
      setIsSendingInvite(false)
    }
  }

  // 2. Chuyển quyền Quản trị viên
  const handleConfirmTransferAdmin = async () => {
    if (!transferTarget || !transferTarget.email) return

    try {
      await fanpageAdminService.appointFanpageAdmin(targetFpId, transferTarget.email)
      showFeedback(
        'success',
        `Đã chuyển giao quyền Quản trị viên cho ${transferTarget.fullName}. Bạn hiện là Cộng tác viên của Fanpage.`
      )
      queryClient.invalidateQueries({ queryKey: ['fanpage-members', targetFpId] })
      queryClient.invalidateQueries({ queryKey: ['admin-available-fanpages'] })
      queryClient.invalidateQueries({ queryKey: ['my-participating-fanpages'] })

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
    } catch (err: any) {
      console.error('Failed to appoint fanpage admin', err)
      const msg = err?.response?.data?.message || err?.message || 'Không thể chuyển quyền Quản trị viên!'
      showFeedback('error', msg)
    }

    setTransferTarget(null)
  }

  // 3. Tự rời khỏi Fanpage
  const handleOpenLeaveModal = () => {
    if (isCurrentUserAdmin || currentUser?.role === 'ADMIN') {
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

  const handleConfirmLeaveFanpage = async () => {
    try {
      await fanpageAdminService.leaveFanpage(targetFpId)
    } catch (e) {
      console.warn('Backend call to leave fanpage returned:', e)
    }

    try {
      useUserFanpagesStore.getState().removeFanpage(targetFpId)
    } catch {}

    queryClient.invalidateQueries({ queryKey: ['fanpage-members', targetFpId] })
    queryClient.invalidateQueries({ queryKey: ['admin-available-fanpages'] })
    queryClient.invalidateQueries({ queryKey: ['my-fanpages'] })
    queryClient.invalidateQueries({ queryKey: ['my-participating-fanpages'] })

    setMembers((prev) =>
      prev.filter(
        (m) =>
          m.id !== currentUser?.id &&
          String(m.userId) !== String(loggedInUser?.id) &&
          m.email?.toLowerCase() !== loggedInUser?.email?.toLowerCase()
      )
    )
    setIsLeaveModalOpen(false)
    showFeedback('success', 'Bạn đã tự rời khỏi ban tổ chức Fanpage thành công.')

    setTimeout(() => {
      navigate('/')
    }, 400)
  }

  // 4. Xóa Cộng tác viên khỏi Fanpage
  const handleDeleteMember = async (member: FanpageMember) => {
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
        const ok = await fanpageAdminService.removeFanpageMember(targetFpId, member.id, member.email)
        if (ok) {
          queryClient.invalidateQueries({ queryKey: ['fanpage-members', targetFpId] })
          queryClient.invalidateQueries({ queryKey: ['admin-available-fanpages'] })
          queryClient.invalidateQueries({ queryKey: ['my-participating-fanpages'] })
          setMembers((prev) => prev.filter((m) => m.id !== member.id))
          showFeedback('success', `Đã xóa ${member.fullName} khỏi Fanpage.`)
        } else {
          showFeedback('error', `Không thể xóa thành viên ${member.fullName}.`)
        }
      } catch (err) {
        console.error('Error removing member', err)
        showFeedback('error', `Có lỗi xảy ra khi xóa thành viên.`)
      }
    }
  }

  // 5. Khóa / Mở khóa quyền thành viên
  const handleToggleActive = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    )
  }

  // 6. Xử lý Lời mời
  const handleCancelInvite = async (invId: string) => {
    try {
      const ok = await fanpageAdminService.cancelFanpageInvitation(invId)
      if (ok) {
        showFeedback('warning', 'Đã hủy lời mời tham gia thành công.')
        queryClient.invalidateQueries({ queryKey: ['fanpage-invitations', targetFpId] })
      } else {
        showFeedback('error', 'Không thể hủy lời mời. Vui lòng thử lại.')
      }
    } catch {
      showFeedback('error', 'Có lỗi khi hủy lời mời.')
    }
    setInvitations((prev) => prev.filter((i) => i.id !== invId))
  }

  const handleResendInvite = async (email: string) => {
    try {
      await apiClient.post(
        `/fanpages/fanpage-admin/${targetFpId}/invite-member?email=${encodeURIComponent(email)}`
      )
      queryClient.invalidateQueries({ queryKey: ['fanpage-invitations', targetFpId] })
      showFeedback('success', `Đã gửi lại lời mời tham gia tới email ${email}.`)
    } catch (err: any) {
      console.error('Error resending invite', err)
      const msg = err?.response?.data?.message || `Không thể gửi lại lời mời tới ${email}.`
      showFeedback('error', msg)
    }
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

  const adminCount = (members || []).filter((m) => (m?.role || '').toUpperCase() === 'ADMIN').length
  const collaboratorCount = (members || []).filter((m) => (m?.role || '').toUpperCase() !== 'ADMIN').length

  return (
    <div className="w-full text-left animate-in fade-in duration-200">
      {/* 1. Header & Actions */}
      <div className="space-y-1 pb-4">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <span>Quản trị fanpage</span>
          <span>/</span>
          <span className="text-primary font-semibold">Thành viên</span>
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              Quản lý thành viên ban tổ chức
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Theo dõi danh sách quản trị viên, cộng tác viên và quản lý lời mời tham gia ban tổ chức.
            </p>
          </div>

          {/* Action Buttons: Navy Mail button & ⋯ dropdown */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {isCurrentUserAdmin && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs shrink-0"
              >
                <Mail className="h-4 w-4" />
                <span>Mời thành viên qua email</span>
              </button>
            )}

            {/* Button ⋯ with dropdown containing "Rời khỏi Fanpage" */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Tùy chọn khác"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

            {isHeaderMenuOpen && (
              <div
                ref={headerMenuRef}
                className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card p-1.5 shadow-xl z-50 text-left animate-in fade-in-0 zoom-in-95 select-none"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderMenuOpen(false)
                    handleOpenLeaveModal()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-[#DC2626] hover:bg-[#FEE2E2]/50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
                  <span>Rời khỏi Fanpage</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between gap-2 mb-4 animate-in fade-in ${
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

      {/* 2. Layout Bảng Trắng với Folder Tabs bo tròn khi active */}
      <div className="flex flex-col mt-2">
        {/* Hàng Folder Tab bo tròn khi active */}
        <div className="flex items-end gap-1.5 -mb-px relative z-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'MEMBERS', label: 'Thành viên', count: filteredMembers.length },
            ...(isCurrentUserAdmin
              ? [{ id: 'INVITATIONS', label: 'Lời mời qua email', count: invitations.length }]
              : []),
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-4 sm:px-5 py-2.5 text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5',
                  isActive
                    ? 'bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-border/80 shadow-2xs pb-3'
                    : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-muted/50 rounded-t-lg'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-xs font-normal',
                    isActive ? 'text-foreground/80 font-normal' : 'text-muted-foreground/70'
                  )}
                >
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Khung chính Bảng Trắng chứa Toolbar & Các Card thành viên */}
        <div
          className={`bg-white dark:bg-card border border-[#E5E7EB] dark:border-border ${
            activeTab === 'MEMBERS' ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-2xl'
          } p-4 sm:p-5 flex flex-col gap-4 shadow-2xs`}
        >
          {/* Header trong panel: Ô tìm kiếm và dòng chữ thống kê cạnh nhau */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="relative w-full sm:w-80">
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
                className="pl-9 pr-8 h-9 text-xs rounded-xl border-[#E5E7EB] dark:border-border bg-transparent focus-visible:ring-1 focus-visible:ring-[#1B4B8A]"
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

            {/* Dòng tóm tắt thay cho 4 thẻ thống kê */}
            <div className="text-xs text-[#6B7280] dark:text-muted-foreground font-normal">
              {adminCount} quản trị viên · {collaboratorCount} cộng tác viên
            </div>
          </div>

          {/* 3. Vùng chứa các Card thành viên bo tròn, cách nhau */}
          <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 overflow-x-auto rounded-xl min-h-[420px] pb-52">
            <div className="min-w-[760px]">
              {/* Tab 1: Thành viên */}
              {activeTab === 'MEMBERS' && (
                <>
                  {/* Header hàng cột phẳng */}
                  <div className="grid grid-cols-[2.5fr_2.2fr_1.6fr_1.4fr_auto] items-center px-5 py-2 text-xs font-normal text-[#6B7280] dark:text-muted-foreground">
                    <div>Thành viên</div>
                    <div>Liên hệ</div>
                    <div>Vai trò</div>
                    <div>Ngày tham gia</div>
                    <div className="text-right min-w-[120px]">Thao tác</div>
                  </div>

                  {/* Danh sách các card thành viên bo tròn cách nhau (gap-2.5) */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {isLoadingMembers && members.length === 0 ? (
                      <div className="flex flex-col gap-2.5 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3 grid grid-cols-[2.5fr_2.2fr_1.6fr_1.4fr_auto] items-center shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <Skeleton className="h-4 w-32 rounded" />
                                <Skeleton className="h-3 w-20 rounded" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Skeleton className="h-3.5 w-36 rounded" />
                              <Skeleton className="h-3 w-24 rounded" />
                            </div>
                            <div>
                              <Skeleton className="h-5 w-24 rounded-full" />
                            </div>
                            <div>
                              <Skeleton className="h-3.5 w-20 rounded" />
                            </div>
                            <div className="flex justify-end">
                              <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
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
                        
                        // Định dạng ngày chuẩn dd/MM/yyyy
                        const displayJoinedAt = formatDateDisplay(
                          mem.joinedAt || (mem as any).createdAt
                        )
                        const displayIsActive = mem.isActive !== false

                        return (
                          <div
                            key={mem.id}
                            className={`bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs transition-all px-5 py-3 grid grid-cols-[2.5fr_2.2fr_1.6fr_1.4fr_auto] items-center group relative ${
                              openActionMenuId === mem.id ? 'z-50' : 'z-10'
                            }`}
                          >
                            {/* Cột 1: Thành viên */}
                            <div className="flex items-center gap-3 pr-2 min-w-0">
                              {mem.avatarUrl ? (
                                <img
                                  src={mem.avatarUrl}
                                  alt={displayName}
                                  className="h-10 w-10 rounded-full object-cover shrink-0 border border-border/60"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-[#F3F4F6] dark:bg-slate-800 text-[#4B5563] dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {mem.avatarText || displayName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground text-xs truncate">
                                    {displayName}
                                  </span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#F3F4F6] dark:bg-muted text-[#4B5563] dark:text-muted-foreground text-[10px] font-medium shrink-0">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground mt-0.5">
                                  {displayStaffId}
                                </p>
                              </div>
                            </div>

                            {/* Cột 2: Liên hệ */}
                            <div className="space-y-0.5 text-xs pr-2 min-w-0">
                              <p className="text-foreground font-medium truncate">
                                {mem.email || (isSelf && loggedInUser?.email) || 'organizer@ctu.edu.vn'}
                              </p>
                              <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground">
                                {mem.phone || '0912 345 678'}
                              </p>
                            </div>

                            {/* Cột 3: Vai trò (Chữ thường, không pill, icon navy) */}
                            <div className="flex items-center gap-1.5">
                              {isAdmin ? (
                                <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
                                  <Crown className="h-3.5 w-3.5 text-[#1B4B8A] dark:text-blue-400 shrink-0" />
                                  <span>Quản trị viên</span>
                                </div>
                              ) : (
                                <span className="text-xs text-[#4B5563] dark:text-muted-foreground font-normal">
                                  Cộng tác viên
                                </span>
                              )}

                              {!displayIsActive && (
                                <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                                  Bị khóa
                                </span>
                              )}
                            </div>

                            {/* Cột 4: Ngày tham gia (Định dạng dd/MM/yyyy) */}
                            <div className="text-xs text-[#6B7280] dark:text-muted-foreground whitespace-nowrap">
                              {displayJoinedAt}
                            </div>

                            {/* Cột 5: Thao tác (Popup mở thông minh: trên hoặc dưới để tránh lỗi tràn) */}
                            <div className="text-right min-w-[120px] relative">
                              {isAdmin ? (
                                <span className="text-xs text-[#6B7280] dark:text-muted-foreground italic">
                                  Chủ nhiệm hiện tại
                                </span>
                              ) : (
                                <div className="inline-block relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionMenuId(
                                        openActionMenuId === mem.id ? null : mem.id
                                      )
                                    }
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                                    title="Tùy chọn thao tác"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>

                                  {/* Menu "⋯" mở thả xuống dưới nút thao tác */}
                                  {openActionMenuId === mem.id && (
                                    <div
                                      ref={actionMenuRef}
                                      className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 text-left animate-in fade-in-0 zoom-in-95 select-none"
                                    >
                                      {/* 1. Nếu là chính bản thân người dùng (isSelf) */}
                                      {isSelf && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              if (navigator?.clipboard) {
                                                navigator.clipboard.writeText(mem.email || loggedInUser?.email || '')
                                                showFeedback('success', 'Đã sao chép email của bạn vào clipboard!')
                                              }
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Copy className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                                            <span>Sao chép email của bạn</span>
                                          </button>

                                          <div className="h-px bg-[#F1F3F5] dark:bg-border/60 my-1" />

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              handleOpenLeaveModal()
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2]/50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <LogOut className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
                                            <span>Rời khỏi ban tổ chức</span>
                                          </button>
                                        </>
                                      )}

                                      {/* 2. Nếu là thành viên khác và người dùng là Admin */}
                                      {!isSelf && isCurrentUserAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              setTransferTarget(mem)
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                          >
                                            <Crown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="whitespace-nowrap">Chuyển quyền chủ nhiệm</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              handleToggleActive(mem.id)
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                          >
                                            {mem.isActive !== false ? (
                                              <>
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span className="whitespace-nowrap">Khóa thành viên</span>
                                              </>
                                            ) : (
                                              <>
                                                <Unlock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <span className="whitespace-nowrap">Mở khóa thành viên</span>
                                              </>
                                            )}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              setViewingMember(mem)
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                                          >
                                            <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span className="whitespace-nowrap">Xem thông tin liên hệ</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              if (navigator?.clipboard && mem.email) {
                                                navigator.clipboard.writeText(mem.email)
                                                showFeedback('success', `Đã sao chép email ${mem.email}!`)
                                              }
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Copy className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                                            <span>Sao chép email</span>
                                          </button>

                                          <div className="h-px bg-[#F1F3F5] dark:bg-border/60 my-1" />

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              handleDeleteMember(mem)
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-[#DC2626] hover:bg-[#FEE2E2]/50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
                                            <span>Xóa khỏi ban tổ chức</span>
                                          </button>
                                        </>
                                      )}

                                      {/* 3. Nếu là thành viên khác và người dùng là Cộng tác viên (Sinh viên) */}
                                      {!isSelf && !isCurrentUserAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              setViewingMember(mem)
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Eye className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                                            <span>Xem thông tin liên hệ</span>
                                          </button>

                                          <a
                                            href={`mailto:${mem.email || ''}`}
                                            onClick={() => setOpenActionMenuId(null)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Mail className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                                            <span>Gửi email liên hệ</span>
                                          </a>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenActionMenuId(null)
                                              if (navigator?.clipboard && mem.email) {
                                                navigator.clipboard.writeText(mem.email)
                                                showFeedback('success', `Đã sao chép email ${mem.email}!`)
                                              }
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                          >
                                            <Copy className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                                            <span>Sao chép email</span>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              )}

              {/* Tab 2: Lời mời qua email */}
              {activeTab === 'INVITATIONS' && (
                <>
                  <div className="grid grid-cols-[2.5fr_2fr_1.5fr_1.5fr_auto] items-center px-5 py-2 text-xs font-normal text-[#6B7280] dark:text-muted-foreground">
                    <div>Email người nhận</div>
                    <div>Người mời</div>
                    <div>Vai trò</div>
                    <div>Thời gian gửi</div>
                    <div className="text-right min-w-[120px]">Thao tác</div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-1">
                    {isLoadingInvitations && invitations.length === 0 ? (
                      <div className="flex flex-col gap-2.5 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid grid-cols-[2.5fr_2fr_1.5fr_1.5fr_auto] items-center shadow-2xs"
                          >
                            <div className="space-y-1 pr-2">
                              <Skeleton className="h-4 w-44 rounded" />
                              <Skeleton className="h-3 w-28 rounded" />
                            </div>
                            <div className="space-y-1">
                              <Skeleton className="h-3.5 w-32 rounded" />
                              <Skeleton className="h-3 w-20 rounded" />
                            </div>
                            <div>
                              <Skeleton className="h-5 w-24 rounded-full" />
                            </div>
                            <div>
                              <Skeleton className="h-3.5 w-24 rounded" />
                            </div>
                            <div className="flex justify-end gap-1.5">
                              <Skeleton className="h-8 w-20 rounded-lg" />
                              <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredInvitations.length === 0 ? (
                      <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                        Không có lời mời nào đang chờ phản hồi.
                      </div>
                    ) : (
                      filteredInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs transition-all px-5 py-3 grid grid-cols-[2.5fr_2fr_1.5fr_1.5fr_auto] items-center"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-foreground text-xs truncate">
                              {inv.name || inv.email}
                            </p>
                            {inv.name && inv.name !== inv.email && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                {inv.email}
                              </p>
                            )}
                          </div>
                          <div className="text-[#6B7280] dark:text-muted-foreground text-xs truncate">
                            {inv.invitedBy || 'Quản trị viên'}
                          </div>
                          <div className="text-xs text-[#4B5563] dark:text-muted-foreground">
                            Cộng tác viên
                          </div>
                          <div className="text-xs text-[#6B7280] dark:text-muted-foreground whitespace-nowrap">
                            {formatDateDisplay(inv.invitedAt)}
                          </div>
                          <div className="text-right min-w-[120px]">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleSimulateAcceptInvite(inv)}
                                className="h-7 px-2.5 text-[11px] font-medium border-border/80 gap-1 cursor-pointer rounded-lg hover:bg-muted"
                                title="Xác nhận tham gia (giả lập sinh viên nhấn đồng ý)"
                              >
                                <UserCheck className="h-3 w-3 text-[#1B4B8A]" />
                                <span>Xác nhận</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(inv.email || '')}
                                className="h-7 w-7 p-0 text-[#6B7280] hover:text-foreground cursor-pointer rounded-lg"
                                title="Gửi lại email"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvite(inv.id)}
                                className="h-7 w-7 p-0 text-[#DC2626] hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer rounded-lg"
                                title="Hủy lời mời"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

      {/* 4. MODAL THÊM THÀNH VIÊN QUA EMAIL (Đã xóa icon, có gợi ý email, dấu chấm i hover) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-card border border-border p-6 space-y-4 shadow-xl text-left animate-in zoom-in-95">
            {/* Header: Đã xóa icon theo yêu cầu */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Mời thành viên qua Email
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gửi lời mời tham gia Ban tổ chức Fanpage
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setShowEmailSuggestions(false)
                }}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              {/* Input Email kèm gợi ý tài khoản trong hệ thống */}
              <div className="space-y-1.5 relative" ref={emailInputContainerRef}>
                <label className="text-xs font-semibold text-foreground">
                  Email sinh viên / cán bộ cần mời <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="Nhập tên, MSSV hoặc email CTU..."
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    setShowEmailSuggestions(true)
                  }}
                  onFocus={() => {
                    if (inviteEmail.trim()) setShowEmailSuggestions(true)
                  }}
                  className="h-9 text-xs rounded-lg border-border"
                  required
                  autoFocus
                />

                {/* Dropdown gợi ý email khi nhập */}
                {showEmailSuggestions && inviteEmail.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-card border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1 text-xs divide-y divide-border/40">
                    {isSearchingUsers ? (
                      <div className="p-3 text-center text-muted-foreground text-[11px]">
                        Đang tìm kiếm tài khoản...
                      </div>
                    ) : matchingSuggestions.length > 0 ? (
                      matchingSuggestions.map((userSug) => (
                        <button
                          key={userSug.id}
                          type="button"
                          onClick={() => {
                            setInviteEmail(userSug.email)
                            setShowEmailSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-muted rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {userSug.fullName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {userSug.email}
                            </p>
                          </div>
                          {userSug.studentId && (
                            <span className="text-[10px] bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded shrink-0">
                              {userSug.studentId}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground text-[11px]">
                        Không tìm thấy tài khoản phù hợp trong hệ thống
                      </div>
                    )}
                  </div>
                )}

                {/* Trạng thái xác thực email */}
                {isEmailValidInSystem ? (
                  <p className="text-[11px] text-emerald-600 font-medium pt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>Tài khoản gợi ý từ danh bạ hệ thống.</span>
                  </p>
                ) : inviteEmail.trim().length > 5 && !inviteEmail.includes('@') ? (
                  <p className="text-[11px] text-amber-600 font-medium pt-0.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>Vui lòng nhập đầy đủ địa chỉ email (ví dụ: student@ctu.edu.vn).</span>
                  </p>
                ) : null}
              </div>

              {/* Dòng vai trò mặc định với dấu chấm (i) hover ra thông tin */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
                <span>
                  Vai trò mặc định: <strong className="text-foreground font-medium">Cộng tác viên</strong>
                </span>

                {/* Dấu chấm i với popup hover */}
                <div className="relative group/info inline-flex items-center">
                  <div
                    tabIndex={0}
                    className="h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-[10px] font-bold cursor-help border border-border/80"
                    title="Thông tin vai trò"
                  >
                    i
                  </div>

                  {/* Tooltip khi hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/info:block w-64 p-2.5 rounded-xl bg-[#0B1626] dark:bg-card text-white dark:text-foreground text-[11px] leading-relaxed shadow-xl border border-white/10 dark:border-border z-50 animate-in fade-in-0 zoom-in-95 pointer-events-none select-text">
                    Cộng tác viên có quyền hỗ trợ quản lý sự kiện và điểm danh người tham gia. Bạn có thể chuyển quyền Quản trị viên cho thành viên này sau.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0B1626] dark:border-t-card" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setShowEmailSuggestions(false)
                  }}
                  className="h-9 rounded-lg cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isEmailValidInSystem || isSendingInvite}
                  className="h-9 px-4 rounded-lg bg-[#1B4B8A] hover:bg-[#163e72] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isSendingInvite ? 'Đang gửi...' : 'Gửi lời mời'}
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
              <div className="h-10 w-10 rounded-xl bg-[#1B4B8A]/10 text-[#1B4B8A] flex items-center justify-center shrink-0">
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

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-muted/40 border border-border text-xs text-foreground space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-[#1B4B8A] shrink-0" />
                <span>Lưu ý quan trọng</span>
              </p>
              <p className="leading-relaxed text-[#4B5563] dark:text-muted-foreground">
                Sau khi chuyển, <strong className="font-bold text-foreground">{transferTarget.fullName}</strong> sẽ trở thành Quản trị viên. Bạn sẽ chuyển về vai trò <strong className="font-bold text-foreground">Cộng tác viên</strong>.
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
                className="h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#163e72] text-white gap-1.5 cursor-pointer shadow-xs"
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
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-muted/40 border border-border text-xs text-foreground space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Không thể thực hiện</span>
                </p>
                <p className="text-[11px] leading-relaxed text-[#4B5563] dark:text-muted-foreground">
                  {leaveWarning}
                </p>
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
                  className="h-9 rounded-lg cursor-pointer bg-[#DC2626] hover:bg-[#b91c1c]"
                >
                  Xác nhận rời khỏi
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL XEM THÔNG TIN LIÊN HỆ CỦA THÀNH VIÊN */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-card border border-border p-5 space-y-4 shadow-xl text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-sm text-foreground">Thông tin liên hệ thành viên</h3>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              {viewingMember.avatarUrl ? (
                <img
                  src={viewingMember.avatarUrl}
                  alt={viewingMember.fullName}
                  className="h-12 w-12 rounded-full object-cover border border-border/80"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-[#1B4B8A]/10 text-[#1B4B8A] font-bold text-sm flex items-center justify-center shrink-0">
                  {viewingMember.fullName?.substring(0, 2).toUpperCase() || 'TV'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-foreground truncate">
                  {viewingMember.fullName}
                </h4>
                <p className="text-xs text-[#6B7280] dark:text-muted-foreground mt-0.5">
                  {viewingMember.staffId || `TV-${viewingMember.userId || viewingMember.id.replace('mem-', '')}`} • {viewingMember.role === 'ADMIN' ? 'Quản trị viên' : 'Cộng tác viên'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs bg-[#F9FAFB] dark:bg-muted/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7280] dark:text-muted-foreground">Email:</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-medium text-foreground truncate">{viewingMember.email || 'organizer@ctu.edu.vn'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(viewingMember.email || '')
                        showFeedback('success', 'Đã sao chép email!')
                      }
                    }}
                    className="p-1 text-[#6B7280] hover:text-[#1B4B8A] transition-colors cursor-pointer"
                    title="Sao chép email"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7280] dark:text-muted-foreground">Số điện thoại:</span>
                <span className="font-medium text-foreground">{viewingMember.phone || '0912 345 678'}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7280] dark:text-muted-foreground">Trạng thái:</span>
                <span className={`font-medium ${viewingMember.isActive !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {viewingMember.isActive !== false ? 'Đang hoạt động' : 'Tạm khóa'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6B7280] dark:text-muted-foreground">Ngày tham gia:</span>
                <span className="font-medium text-foreground">{formatDateDisplay(viewingMember.joinedAt || (viewingMember as any).createdAt)}</span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
              <a
                href={`mailto:${viewingMember.email || ''}`}
                className="h-8 px-3 rounded-lg border border-[#1B4B8A] text-[#1B4B8A] hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Gửi email</span>
              </a>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setViewingMember(null)}
                className="h-8 rounded-lg text-xs cursor-pointer"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
