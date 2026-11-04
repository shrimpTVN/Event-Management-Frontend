import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  RefreshCw,
  X,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdminService'
import type { UserAdminItem } from '../../types/superAdmin.types'

export const SuperAdminUsersView: React.FC = () => {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // Change Role Modal State
  const [userForRoleChange, setUserForRoleChange] = useState<UserAdminItem | null>(null)
  const [newRole, setNewRole] = useState<string>('STUDENT')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-users', page, keyword, selectedRole, selectedStatus],
    queryFn: () =>
      superAdminService.getUsers({
        page,
        size: 15,
        keyword: keyword.trim() || undefined,
        role: selectedRole !== 'ALL' ? selectedRole : undefined,
        isActive:
          selectedStatus === 'ACTIVE'
            ? true
            : selectedStatus === 'LOCKED'
            ? false
            : undefined,
      }),
  })

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Thao tác khóa/mở tài khoản thất bại!')
    },
  })

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number | string; role: string }) =>
      superAdminService.changeUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] })
      setUserForRoleChange(null)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Thay đổi quyền người dùng thất bại!')
    },
  })

  const handleOpenRoleModal = (u: UserAdminItem) => {
    setUserForRoleChange(u)
    setNewRole(u.role)
  }

  const handleConfirmRoleChange = () => {
    if (!userForRoleChange) return
    changeRoleMutation.mutate({ id: userForRoleChange.id, role: newRole })
  }

  const users = data?.content || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Quản lý Người dùng
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Danh sách toàn bộ sinh viên, cán bộ quản trị fanpage và phân quyền hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-white dark:bg-card hover:bg-muted text-xs font-semibold cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm theo tên, email, MSSV..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên (STUDENT)</option>
              <option value="FANPAGE_ADMIN">Quản trị Fanpage (FANPAGE_ADMIN)</option>
              <option value="ADMIN">Super Admin (ADMIN)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="rounded-2xl bg-white dark:bg-card border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Người dùng</th>
                <th className="py-3 px-4">Đơn vị / Lớp</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                            {u.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {u.fullName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {u.email}
                          </div>
                          {u.studentId && (
                            <div className="text-[10px] text-primary font-mono font-bold">
                              MSSV: {u.studentId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* School / Class */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="truncate max-w-[200px]">
                        {u.majorName || u.schoolName || 'Chưa cập nhật'}
                      </div>
                      {u.classCode && (
                        <div className="text-[10px] text-foreground font-mono">
                          Lớp: {u.classCode}
                        </div>
                      )}
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                          SUPER ADMIN
                        </span>
                      ) : u.role === 'FANPAGE_ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                          QUẢN TRỊ FANPAGE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                          SINH VIÊN
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
                          <UserX className="h-3.5 w-3.5" />
                          <span>Đã khóa</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(u)}
                          className="px-2.5 py-1 rounded-lg border border-border bg-white dark:bg-card hover:bg-muted text-[11px] font-semibold cursor-pointer transition-colors"
                          title="Đổi phân quyền"
                        >
                          Phân quyền
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatusMutation.mutate(u.id)}
                          disabled={toggleStatusMutation.isPending}
                          className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                            u.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/40'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/40 dark:hover:bg-emerald-950/40'
                          }`}
                          title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {u.isActive ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Trang {page + 1} / {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {userForRoleChange && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-border rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-k2d font-bold text-base text-foreground">
                Thay đổi phân quyền
              </h3>
              <button
                type="button"
                onClick={() => setUserForRoleChange(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-muted-foreground">
                Cập nhật quyền truy cập cho người dùng{' '}
                <span className="font-semibold text-foreground">
                  {userForRoleChange.fullName} ({userForRoleChange.email})
                </span>
                :
              </p>

              <div className="space-y-1.5 pt-1">
                {[
                  { id: 'STUDENT', label: 'Sinh viên (STUDENT)', desc: 'Tham gia sự kiện, tích lũy ĐRL & SV5T' },
                  { id: 'FANPAGE_ADMIN', label: 'Quản trị Fanpage (FANPAGE_ADMIN)', desc: 'Đại diện CLB/Khoa tạo sự kiện' },
                  { id: 'ADMIN', label: 'Super Admin (ADMIN)', desc: 'Toàn quyền cấu hình & quản trị hệ thống' },
                ].map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      newRole === r.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={newRole === r.id}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-semibold text-xs text-foreground">{r.label}</div>
                      <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setUserForRoleChange(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={changeRoleMutation.isPending}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {changeRoleMutation.isPending ? 'Đang lưu...' : 'Lưu quyền'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
