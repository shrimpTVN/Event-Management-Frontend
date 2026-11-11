import React, { useState, useMemo } from 'react'
import { Search, X, Lock, Unlock, Eye, GraduationCap, Briefcase, Users } from 'lucide-react'
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

      {/* 2. Connected Tabs */}
      <div className="space-y-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 px-1">
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

        {/* Khung chính Bảng Trắng chứa Toolbar & Các card hàng bo tròn */}
        <div
          className={cn(
            'bg-white dark:bg-card border border-[#E5E7EB] dark:border-border p-4 sm:p-5 flex flex-col gap-4 shadow-2xs',
            activeTab === 'ALL' ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-2xl'
          )}
        >
          {/* Header trong panel: Ô tìm kiếm bên trái, số lượng tóm tắt bên phải */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm MSSV, họ tên, email, khoa viện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
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

          {/* Vùng chứa các card người dùng bo tròn cách nhau */}
          <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 overflow-x-auto rounded-xl">
            <div className="min-w-[800px]">
              {/* Header hàng cột phẳng, chữ xám nhẹ */}
              <div className="grid grid-cols-[1fr_120px_200px_130px_110px_90px] items-center px-5 py-2 text-xs font-normal text-muted-foreground">
                <div>Người dùng &amp; Email</div>
                <div>Mã số</div>
                <div>Đơn vị / Khoa</div>
                <div>Vai trò</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-right">Thao tác</div>
              </div>

              {/* Danh sách các card hàng bo tròn */}
              <div className="flex flex-col gap-2.5 mt-1 animate-in fade-in-50 duration-150">
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
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid grid-cols-[1fr_120px_200px_130px_110px_90px] items-center shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all',
                          isLocked && 'bg-slate-50/50 dark:bg-slate-900/20 opacity-80'
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
                            <p
                              className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors cursor-pointer"
                              onClick={() => onSelectUser(u)}
                            >
                              {u.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
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
                            <p className="text-[11px] text-muted-foreground truncate">
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
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
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
                                : 'bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground border-slate-200 dark:border-border'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                              )}
                            />
                            <span>{u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}</span>
                          </span>
                        </div>

                        {/* 6. Thao tác */}
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectUser(u)}
                            title="Xem chi tiết người dùng"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleStatus(u.id)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors cursor-pointer',
                              u.status === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            )}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
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
