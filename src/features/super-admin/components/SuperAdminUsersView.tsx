import { Tooltip } from '@/components/ui/tooltip'
import { AdminActionMenu } from './AdminActionMenu'
import { getUserDisplayRole, isValidUserId } from '../services/superAdminService'
import { UserPermissionBadges, UserStatusBadge, AdminPaginationBar } from './AdminDetails'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import React, { useState, useMemo } from 'react'
import { Search, X, Lock, Unlock, Eye, Copy, Check, MoreHorizontal } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { SuperAdminUser, UserRole, UserStatus } from '../types/superAdmin.types'

interface SuperAdminUsersViewProps {
  users: SuperAdminUser[]
  onSelectUser: (user: SuperAdminUser) => void
  onToggleStatus: (userId: string) => void
  page?: number
  totalPages?: number
  totalElements?: number
  onPageChange?: (page: number) => void
  roleFilter?: 'ALL' | UserRole | UserStatus
  onRoleFilterChange?: (tab: 'ALL' | UserRole | UserStatus) => void
  searchQuery?: string
  onSearchChange?: (keyword: string) => void
}

export const SuperAdminUsersView: React.FC<SuperAdminUsersViewProps> = ({
  users,
  onSelectUser,
  onToggleStatus,
  page = 0,
  totalPages = 1,
  totalElements,
  onPageChange,
  roleFilter: controlledRoleFilter,
  onRoleFilterChange,
  searchQuery: controlledSearchQuery,
  onSearchChange,
}) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [internalActiveTab, setInternalActiveTab] = useState<'ALL' | UserRole | UserStatus>('ALL')
  const searchQuery = controlledSearchQuery ?? internalSearchQuery
  const activeTab = controlledRoleFilter ?? internalActiveTab
  const isServerFiltered = Boolean(onRoleFilterChange || onSearchChange)
  const setSearchQuery = (val: string) => {
    setInternalSearchQuery(val)
    onSearchChange?.(val)
  }
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const handleCopyEmail = (email: string, userId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!email) return
    navigator?.clipboard?.writeText(email)
    setCopiedUserId(userId)
    setTimeout(() => {
      setCopiedUserId((prev) => (prev === userId ? null : prev))
    }, 2000)
  }

  const filteredUsers = useMemo(() => {
    if (isServerFiltered) return users
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
            : getUserDisplayRole(u) === activeTab

      return matchSearch && matchTab
    })
  }, [users, searchQuery, activeTab, isServerFiltered])

  const tabs = [
    { id: 'ALL' as const, label: 'Tất cả tài khoản' },
    { id: 'STUDENT' as const, label: 'Sinh viên' },
    { id: 'STAFF' as const, label: 'Cán bộ' },
    { id: 'SUPERADMIN' as const, label: 'Super admin' },
    { id: 'LOCKED' as const, label: 'Bị khóa' },
  ]

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Người dùng</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">Quản lý người dùng</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tra cứu, phân quyền vai trò và quản lý trạng thái tài khoản sinh viên & cán bộ toàn
            trường.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted/40 dark:bg-muted/40 text-muted-foreground border border-border dark:border-border">
            Tổng {totalElements ?? users.length} tài khoản
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
              <Button
                variant="ghost"
                size="sm"
                key={tab.id}
                type="button"
                onClick={() => {
                  setInternalActiveTab(tab.id)
                  onRoleFilterChange?.(tab.id)
                }}
                className={cn(
                  'h-auto rounded-b-none px-4 sm:px-5 py-2.5 text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5',
                  isActive
                    ? 'bg-white dark:bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-[#E5E7EB] dark:border-border shadow-2xs pb-3'
                    : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-t-lg'
                )}
              >
                <span>{tab.label}</span>
              </Button>
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
              <Input
                type="text"
                placeholder="Tìm họ tên, email, MSSV, mã cán bộ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-normal">
              {totalElements !== undefined
                ? `Hiển thị ${filteredUsers.length} / ${totalElements} tài khoản`
                : `${filteredUsers.length} tài khoản ${activeTab !== 'ALL' ? 'trong mục này' : 'tổng cộng'}`}
            </div>
          </div>

          {/* Bảng danh sách các dòng thiết kế dạng Card chuẩn như Quản lý Thành viên */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[860px]">
              {/* Header hàng cột phẳng */}
              <div className="grid grid-cols-[2.5fr_1.2fr_2fr_1.4fr_1.1fr_130px] items-center px-5 py-2 text-xs font-normal text-[#6B7280] dark:text-muted-foreground">
                <div>Người dùng &amp; Email</div>
                <div>Mã định danh</div>
                <div>Thông tin hồ sơ</div>
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
                    const userKey = u.id || u.email

                    return (
                      <div
                        key={userKey}
                        onClick={() => onSelectUser(u)}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-xl hover:border-border dark:hover:border-border hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-all px-5 py-3.5 grid grid-cols-[2.5fr_1.2fr_2fr_1.4fr_1.1fr_130px] items-center group relative cursor-pointer',
                          isLocked && 'bg-slate-50/60 dark:bg-slate-900/30 opacity-75',
                          openActionMenuId === userKey ? 'z-50 border-[#1B4B8A]/40' : 'z-10'
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
                            <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {u.name ? u.name.substring(0, 2).toUpperCase() : 'ND'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Tooltip content={u.name}>
                              <p className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors">
                                {u.name}
                              </p>
                            </Tooltip>
                            <Tooltip content={u.email}>
                              <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground truncate mt-0.5">
                                {u.email}
                              </p>
                            </Tooltip>
                          </div>
                        </div>

                        {/* 2. Mã số */}
                        <div className="flex min-w-0 flex-col gap-1 text-xs">
                          {u.studentProfile && (
                            <span className="font-medium">
                              MSSV: {u.studentProfile.studentId || '—'}
                            </span>
                          )}
                          {u.staffProfile && (
                            <span className="font-medium">
                              Mã CB: {u.staffProfile.staffId || '—'}
                            </span>
                          )}
                          {!u.studentProfile && !u.staffProfile && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>

                        <div className="flex min-w-0 flex-col gap-1 pr-3 text-xs">
                          {u.studentProfile && (
                            <>
                              <Tooltip content={u.studentProfile.schoolName}>
                                <p className="truncate font-medium">
                                  {u.studentProfile.schoolName || 'Chưa cập nhật khoa / trường'}
                                </p>
                              </Tooltip>
                              {u.studentProfile.majorName && (
                                <Tooltip content={u.studentProfile.majorName}>
                                  <p className="truncate text-muted-foreground">
                                    {u.studentProfile.majorName}
                                  </p>
                                </Tooltip>
                              )}
                            </>
                          )}
                          {u.staffProfile && (
                            <>
                              <Tooltip content={u.staffProfile.orgName}>
                                <p className="truncate font-medium">
                                  {u.staffProfile.orgName || 'Chưa cập nhật đơn vị'}
                                </p>
                              </Tooltip>
                              {u.staffProfile.title && (
                                <Tooltip content={u.staffProfile.title}>
                                  <p className="truncate text-muted-foreground">
                                    {u.staffProfile.title}
                                  </p>
                                </Tooltip>
                              )}
                            </>
                          )}
                          {!u.studentProfile && !u.staffProfile && (
                            <p className="text-muted-foreground">Chưa có thông tin hồ sơ</p>
                          )}
                        </div>

                        {/* 4. Vai trò */}
                        <div>
                          <UserPermissionBadges user={u} />
                        </div>
                        <div className="flex justify-center">
                          <UserStatusBadge status={u.status} />
                        </div>
                        {/* 6. Thao tác hover kiểu Google Drive */}
                        <div className="text-right min-w-[130px] relative flex items-center justify-end">
                          <div className="flex items-center justify-end gap-1">
                            {/* Nút Xem chi tiết (mở Drawer) & Copy email khi hover */}
                            <div
                              className={cn(
                                'items-center gap-1 transition-all duration-150',
                                openActionMenuId === userKey
                                  ? 'flex opacity-100'
                                  : 'flex opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                              )}
                            >
                              <Tooltip content="Xem hồ sơ chi tiết (Mở Drawer)">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectUser(u)
                                  }}
                                  aria-label="Xem hồ sơ chi tiết (Mở Drawer)"
                                  className="h-8 w-8 rounded-lg p-0 flex items-center justify-center text-[#6B7280] hover:text-primary hover:bg-muted/40 dark:hover:bg-muted/40 dark:hover:text-muted-foreground transition-colors cursor-pointer"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Tooltip>

                              <Tooltip
                                content={
                                  copiedUserId === userKey ? 'Đã sao chép!' : 'Sao chép email'
                                }
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => handleCopyEmail(u.email, userKey, e)}
                                  aria-label={
                                    copiedUserId === userKey ? 'Đã sao chép!' : 'Sao chép email'
                                  }
                                  className="h-8 w-8 rounded-lg p-0 flex items-center justify-center text-[#6B7280] hover:text-primary hover:bg-muted/40 dark:hover:bg-muted/40 dark:hover:text-muted-foreground transition-colors cursor-pointer"
                                >
                                  {copiedUserId === userKey ? (
                                    <Check className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </Tooltip>
                            </div>

                            {/* Nút ba chấm chứa các tùy chọn còn lại */}
                            <div className="inline-block relative">
                              <Tooltip content="Tùy chọn khác">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActionMenuAnchor(e.currentTarget)
                                    setOpenActionMenuId(
                                      openActionMenuId === userKey ? null : userKey
                                    )
                                  }}
                                  className={cn(
                                    'h-8 w-8 rounded-lg p-0 flex items-center justify-center transition-colors cursor-pointer',
                                    openActionMenuId === userKey
                                      ? 'bg-[#F3F4F6] dark:bg-muted text-foreground'
                                      : 'text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted opacity-60 group-hover:opacity-100'
                                  )}
                                  aria-label="Tùy chọn khác"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </Tooltip>

                              {openActionMenuId === userKey && (
                                <AdminActionMenu
                                  anchor={actionMenuAnchor}
                                  onClose={() => setOpenActionMenuId(null)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-52 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 text-left animate-in fade-in-0 zoom-in-95 select-none"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onSelectUser(u)
                                    }}
                                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Xem hồ sơ chi tiết</span>
                                  </Button>

                                  <Button
                                    disabled={!isValidUserId(u.id)}
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onToggleStatus(u.id)
                                    }}
                                    className={cn(
                                      'w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                                      isLocked
                                        ? 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/40'
                                        : 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/40'
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
                                  </Button>

                                  <div className="h-px bg-border/60 my-1" />

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      handleCopyEmail(u.email, userKey)
                                    }}
                                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Sao chép email</span>
                                  </Button>

                                  <Button
                                    disabled={
                                      !u.studentProfile?.studentId && !u.staffProfile?.staffId
                                    }
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      if (navigator?.clipboard) {
                                        navigator.clipboard.writeText(
                                          [u.studentProfile?.studentId, u.staffProfile?.staffId]
                                            .filter(Boolean)
                                            .join(', ')
                                        )
                                      }
                                    }}
                                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Sao chép mã định danh</span>
                                  </Button>
                                </AdminActionMenu>
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

          {onPageChange && (
            <AdminPaginationBar
              page={page}
              totalPages={totalPages}
              totalElements={totalElements ?? users.length}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
