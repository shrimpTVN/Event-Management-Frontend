import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  X,
  Lock,
  Unlock,
  Eye,
  GraduationCap,
  Briefcase,
  Users,
  Copy,
  Check,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { SuperAdminUser, UserRole, UserStatus } from '../types/superAdmin.types'

interface SuperAdminUsersViewProps {
  users: SuperAdminUser[]
  onSelectUser: (user: SuperAdminUser) => void
  onToggleStatus: (userId: string) => void
}

export const SuperAdminUsersView: React.FC<SuperAdminUsersViewProps> = ({
  users,
  onSelectUser,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'ALL' | UserRole | UserStatus>('ALL')
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)

  // Click outside listener for action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyEmail = (email: string, userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!email) return
    navigator?.clipboard?.writeText(email)
    setCopiedUserId(userId)
    setTimeout(() => {
      setCopiedUserId((prev) => (prev === userId ? null : prev))
    }, 2000)
  }

  const totalCount = users.length
  const studentCount = users.filter((u) => u.role === 'STUDENT').length
  const staffCount = users.filter((u) => u.role === 'STAFF').length
  const organizerCount = users.filter((u) => u.role === 'ORGANIZER').length
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.schoolName && u.schoolName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.majorName && u.majorName.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchTab =
        activeTab === 'ALL'
          ? true
          : activeTab === 'LOCKED'
          ? u.status === 'LOCKED'
          : u.role === activeTab

      return matchSearch && matchTab
    })
  }, [users, searchQuery, activeTab])

  const tabs = [
    { id: 'ALL' as const, label: 'Tất cả tài khoản', count: totalCount },
    { id: 'STUDENT' as const, label: 'Sinh viên', count: studentCount },
    { id: 'STAFF' as const, label: 'Cán bộ', count: staffCount },
    { id: 'ORGANIZER' as const, label: 'Ban tổ chức', count: organizerCount },
    { id: 'LOCKED' as const, label: 'Bị khóa', count: lockedCount },
  ]

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-primary font-bold">Người dùng</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý người dùng
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tra cứu, phân quyền vai trò và quản lý trạng thái tài khoản sinh viên & cán bộ toàn trường.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1B4B8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Tổng {users.length} tài khoản
          </span>
        </div>
      </div>

      {/* 2. Khối bảng mở rộng kéo dài sang phải theo chuẩn nhóm trang Quản lý Fanpage */}
      <div className="flex flex-col mt-2">
        {/* Hàng Tab Bar dạng folder tab bo tròn trên đỉnh */}
        <div className="flex items-end gap-1.5 -mb-px relative z-10 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 sm:px-5 py-2.5 text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5',
                  isActive
                    ? 'bg-white dark:bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-[#E5E7EB] dark:border-border shadow-2xs pb-3'
                    : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-t-lg'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-xs font-normal',
                    isActive ? 'text-foreground/80' : 'text-muted-foreground/70'
                  )}
                >
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Khung chính Bảng Trắng chứa Toolbar & Danh sách card hàng */}
        <div
          className={cn(
            'bg-white dark:bg-card border border-[#E5E7EB] dark:border-border p-4 sm:p-5 flex flex-col gap-4 shadow-2xs w-full',
            activeTab === 'ALL' ? 'rounded-b-2xl rounded-tr-2xl rounded-tl-none' : 'rounded-2xl'
          )}
        >
          {/* Header trong panel: Ô tìm kiếm & tóm tắt */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm MSSV, họ tên, email, khoa viện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-normal">
              {filteredUsers.length} tài khoản {activeTab !== 'ALL' ? 'trong mục này' : 'tổng cộng'}
            </div>
          </div>

          {/* Bảng danh sách các dòng thiết kế dạng Card chuẩn như Quản lý Thành viên */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[860px]">
              {/* Header hàng cột phẳng */}
              <div className="grid grid-cols-[2.5fr_1.2fr_2fr_1.4fr_1.1fr_130px] items-center px-5 py-2 text-xs font-normal text-[#6B7280] dark:text-muted-foreground">
                <div>Người dùng &amp; Email</div>
                <div>Mã số</div>
                <div>Đơn vị / Khoa</div>
                <div>Vai trò</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-right min-w-[130px]">Thao tác</div>
              </div>

              {/* Danh sách các card hàng bo tròn (gap-2.5) */}
              <div className="flex flex-col gap-2.5 mt-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isLocked = u.status === 'LOCKED'

                    return (
                      <div
                        key={u.id}
                        onClick={() => onSelectUser(u)}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-[#1B4B8A]/30 dark:hover:border-blue-500/30 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-all px-5 py-3.5 grid grid-cols-[2.5fr_1.2fr_2fr_1.4fr_1.1fr_130px] items-center group relative cursor-pointer',
                          isLocked && 'bg-slate-50/60 dark:bg-slate-900/30 opacity-75',
                          openActionMenuId === u.id ? 'z-50 border-[#1B4B8A]/40' : 'z-10'
                        )}
                      >
                        {/* 1. Người dùng & Avatar & Email */}
                        <div className="flex items-center gap-3 pr-3 min-w-0">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="h-10 w-10 rounded-full object-cover shrink-0 border border-border/60"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[#1B4B8A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {u.name ? u.name.substring(0, 2).toUpperCase() : 'ND'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground truncate mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        {/* 2. Mã số */}
                        <div className="text-xs font-semibold text-foreground">
                          {u.code}
                        </div>

                        {/* 3. Đơn vị / Khoa */}
                        <div className="space-y-0.5 text-xs pr-2 min-w-0">
                          <p className="text-foreground font-medium truncate">
                            {u.schoolName || 'Trường ĐH Cần Thơ'}
                          </p>
                          {u.majorName && (
                            <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground truncate">
                              {u.majorName}
                            </p>
                          )}
                        </div>

                        {/* 4. Vai trò */}
                        <div>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border',
                              u.role === 'STUDENT'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : u.role === 'STAFF'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            )}
                          >
                            {u.role === 'STUDENT' ? (
                              <GraduationCap className="w-3 h-3 shrink-0" />
                            ) : u.role === 'STAFF' ? (
                              <Briefcase className="w-3 h-3 shrink-0" />
                            ) : (
                              <Users className="w-3 h-3 shrink-0" />
                            )}
                            <span>
                              {u.role === 'STUDENT'
                                ? 'Sinh viên'
                                : u.role === 'STAFF'
                                ? 'Cán bộ'
                                : 'Ban tổ chức'}
                            </span>
                          </span>
                        </div>

                        {/* 5. Trạng thái */}
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border',
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                              )}
                            />
                            <span>{u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}</span>
                          </span>
                        </div>

                        {/* 6. Thao tác hover kiểu Google Drive */}
                        <div className="text-right min-w-[130px] relative flex items-center justify-end">
                          <div className="flex items-center justify-end gap-1">
                            {/* Nút Xem chi tiết (mở Drawer) & Copy email khi hover */}
                            <div
                              className={cn(
                                'items-center gap-1 transition-all duration-150',
                                openActionMenuId === u.id
                                  ? 'flex opacity-100'
                                  : 'flex opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                              )}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectUser(u)
                                }}
                                title="Xem hồ sơ chi tiết (Mở Drawer)"
                                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1B4B8A] hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleCopyEmail(u.email, u.id, e)}
                                title={copiedUserId === u.id ? 'Đã sao chép!' : 'Sao chép email'}
                                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1B4B8A] hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                {copiedUserId === u.id ? (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>

                            {/* Nút ba chấm chứa các tùy chọn còn lại */}
                            <div className="inline-block relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenActionMenuId(openActionMenuId === u.id ? null : u.id)
                                }}
                                className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                                  openActionMenuId === u.id
                                    ? 'bg-[#F3F4F6] dark:bg-muted text-foreground'
                                    : 'text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted opacity-60 group-hover:opacity-100'
                                )}
                                title="Tùy chọn khác"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {openActionMenuId === u.id && (
                                <div
                                  ref={actionMenuRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 text-left animate-in fade-in-0 zoom-in-95 select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onSelectUser(u)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Xem hồ sơ chi tiết</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onToggleStatus(u.id)
                                    }}
                                    className={cn(
                                      'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                                      isLocked
                                        ? 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                        : 'text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                    )}
                                  >
                                    {isLocked ? (
                                      <>
                                        <Unlock className="h-3.5 w-3.5 shrink-0" />
                                        <span>Mở khóa tài khoản</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-3.5 w-3.5 shrink-0" />
                                        <span>Khóa tài khoản này</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="h-px bg-border/60 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      handleCopyEmail(u.email, u.id)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Sao chép email</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      if (navigator?.clipboard) {
                                        navigator.clipboard.writeText(u.code)
                                      }
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Sao chép mã số ({u.code})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
