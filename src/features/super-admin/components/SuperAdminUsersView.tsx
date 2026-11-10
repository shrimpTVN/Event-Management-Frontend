import React, { useState, useMemo } from 'react'
import { Search, Filter, Lock, Unlock, Eye } from 'lucide-react'
import type { SuperAdminUser, UserRole } from '../types/superAdmin.types'

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
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL')

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.schoolName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter

      return matchSearch && matchRole
    })
  }, [users, searchQuery, roleFilter])

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Quản trị hệ thống</span>
          <span>/</span>
          <span className="text-primary font-semibold">Người dùng</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-k2d font-bold text-foreground tracking-tight">
              Quản lý người dùng
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tra cứu, phân quyền vai trò và quản lý trạng thái tài khoản sinh viên & cán bộ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-primary border border-blue-200 dark:border-blue-800">
              Tổng cộng {users.length} tài khoản
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="MSSV, Họ tên, Email..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-[#F9FAFB] dark:bg-muted/40 focus:bg-white dark:focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition-all font-sans"
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc:
          </span>
          {[
            { id: 'ALL' as const, label: 'Tất cả' },
            { id: 'STUDENT' as const, label: 'Sinh viên' },
            { id: 'STAFF' as const, label: 'Cán bộ' },
            { id: 'ORGANIZER' as const, label: 'Ban tổ chức' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setRoleFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === pill.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-[#F3F4F6] dark:bg-muted text-foreground/70 hover:bg-[#E5E7EB] dark:hover:bg-muted/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Table View */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB] dark:bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Mã Số</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Vai Trò</th>
                <th className="py-3.5 px-4">Đơn Vị</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F9FAFB] dark:hover:bg-muted/20 transition-colors">
                    {/* Name + Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-foreground leading-tight">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">{u.majorName || 'Chưa cập nhật ngành'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3.5 px-4 font-semibold text-foreground">{u.code}</td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-muted-foreground">{u.email}</td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'STUDENT'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : u.role === 'STAFF'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {u.role === 'STUDENT' ? 'Sinh Viên' : u.role === 'STAFF' ? 'Cán Bộ' : 'Ban Tổ Chức'}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-4 text-foreground/80">{u.schoolName}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectUser(u)}
                          title="Xem chi tiết hồ sơ"
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u.id)}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 border-t border-border bg-[#F9FAFB] dark:bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Hiển thị <strong>{filteredUsers.length}</strong> trên tổng số <strong>{users.length}</strong> tài khoản</span>
        </div>
      </div>
    </div>
  )
}
