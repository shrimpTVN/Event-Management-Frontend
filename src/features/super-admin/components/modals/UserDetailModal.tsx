import React from 'react'
import { X, Shield, Lock, Unlock, Mail, Phone, School, Calendar, Award } from 'lucide-react'
import type { SuperAdminUser } from '../../types/superAdmin.types'

interface UserDetailModalProps {
  user: SuperAdminUser | null
  isOpen: boolean
  onClose: () => void
  onToggleStatus: (userId: string) => void
  onChangeRole: (userId: string, newRole: SuperAdminUser['role']) => void
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onToggleStatus,
  onChangeRole,
}) => {
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-xl rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-k2d font-bold text-foreground">Hồ Sơ Chi Tiết Người Dùng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* User Basic Info Header */}
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-xs"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-k2d font-bold text-foreground">{user.name}</h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    user.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                  }`}
                >
                  {user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã bị khóa'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Mã số: <span className="font-semibold text-foreground">{user.code}</span></p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-[#F9FAFB] dark:bg-muted/20 p-4 rounded-xl border border-border/60">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="truncate">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Số điện thoại</p>
                <p className="font-medium text-foreground">{user.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <School className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Đơn vị / Khoa trực thuộc</p>
                <p className="font-medium text-foreground">{user.schoolName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Ngày tham gia hệ thống</p>
                <p className="font-medium text-foreground">{user.createdAt}</p>
              </div>
            </div>

            {user.majorName && (
              <div className="flex items-center gap-2.5 sm:col-span-2">
                <Award className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Chuyên ngành đào tạo</p>
                  <p className="font-medium text-foreground">{user.majorName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Role Setting */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Phân vai trò tài khoản</label>
            <div className="grid grid-cols-3 gap-2">
              {(['STUDENT', 'STAFF', 'ORGANIZER'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onChangeRole(user.id, r)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    user.role === r
                      ? 'border-primary bg-primary text-white shadow-xs'
                      : 'border-border bg-white dark:bg-card text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted'
                  }`}
                >
                  {r === 'STUDENT' ? 'Sinh viên' : r === 'STAFF' ? 'Cán bộ' : 'Ban tổ chức'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-white dark:bg-card">
          <button
            type="button"
            onClick={() => onToggleStatus(user.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              user.status === 'ACTIVE'
                ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {user.status === 'ACTIVE' ? (
              <>
                <Lock className="w-4 h-4" />
                Khóa tài khoản này
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Mở khóa tài khoản
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-card border border-border text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
