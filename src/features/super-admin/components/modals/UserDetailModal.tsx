import React, { useState } from 'react'
import {
  Shield,
  Lock,
  Unlock,
  Mail,
  Phone,
  School,
  Calendar,
  Award,
  Copy,
  Check,
  GraduationCap,
  Briefcase,
  Users,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'
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
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!user) return null

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return
    navigator?.clipboard?.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldName ? null : prev))
    }, 2000)
  }

  const isLocked = user.status === 'LOCKED'

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 gap-0 text-left bg-white dark:bg-card border-l border-border shadow-2xl"
      >
        {/* 1. Header Drawer */}
        <SheetHeader className="px-6 py-5 border-b border-border/80 bg-slate-50/50 dark:bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Hồ sơ người dùng hệ thống</span>
          </div>
          <SheetTitle className="text-xl font-k2d font-bold text-foreground mt-1 flex items-center justify-between">
            <span>{user.name}</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Mã định danh: <span className="font-semibold text-foreground">{user.code}</span> • ID hệ thống #{user.id}
          </SheetDescription>
        </SheetHeader>

        {/* 2. Body Drawer (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Avatar & Profile Badge Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-border/70">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#1B4B8A] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'ND'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-foreground truncate">{user.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Badge trạng thái */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                    user.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                    )}
                  />
                  <span>{user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã bị khóa'}</span>
                </span>

                {/* Badge vai trò */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                    user.role === 'STUDENT'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : user.role === 'STAFF'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  )}
                >
                  {user.role === 'STUDENT' ? (
                    <GraduationCap className="w-3 h-3" />
                  ) : user.role === 'STAFF' ? (
                    <Briefcase className="w-3 h-3" />
                  ) : (
                    <Users className="w-3 h-3" />
                  )}
                  <span>
                    {user.role === 'STUDENT'
                      ? 'Sinh viên'
                      : user.role === 'STAFF'
                      ? 'Cán bộ'
                      : 'Ban tổ chức'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Section: Thông tin liên hệ & định danh */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Thông tin liên hệ &amp; Tổ chức
            </h5>
            <div className="grid grid-cols-1 gap-2.5 text-xs bg-slate-50/60 dark:bg-muted/20 p-4 rounded-xl border border-border/70">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Email trường:
                </span>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email, 'email')}
                    className="p-1 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Sao chép email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Số điện thoại:
                </span>
                <span className="font-medium text-foreground">{user.phone || 'Chưa cập nhật'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <School className="w-3.5 h-3.5 text-primary" />
                  Đơn vị / Khoa:
                </span>
                <span className="font-medium text-foreground text-right">{user.schoolName || 'Trường ĐH Cần Thơ'}</span>
              </div>

              {user.majorName && (
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    Chuyên ngành:
                  </span>
                  <span className="font-medium text-foreground text-right">{user.majorName}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Ngày tham gia:
                </span>
                <span className="font-medium text-foreground">{user.createdAt || '11/11/2026'}</span>
              </div>
            </div>
          </div>

          {/* Section: Phân quyền vai trò tài khoản */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Phân quyền vai trò hệ thống
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {(['STUDENT', 'STAFF', 'ORGANIZER'] as const).map((r) => {
                const isCurrent = user.role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChangeRole(user.id, r)}
                    className={cn(
                      'py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1',
                      isCurrent
                        ? 'border-primary bg-primary text-white shadow-xs'
                        : 'border-border bg-white dark:bg-card text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted'
                    )}
                  >
                    {r === 'STUDENT' ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : r === 'STAFF' ? (
                      <Briefcase className="w-4 h-4" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    <span>
                      {r === 'STUDENT'
                        ? 'Sinh viên'
                        : r === 'STAFF'
                        ? 'Cán bộ'
                        : 'Ban tổ chức'}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Thay đổi vai trò sẽ cập nhật quyền truy cập chức năng của người dùng ngay lập tức.
            </p>
          </div>
        </div>

        {/* 3. Footer Actions */}
        <SheetFooter className="px-6 py-4 border-t border-border/80 bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onToggleStatus(user.id)}
            className={cn(
              'gap-2 text-xs font-semibold cursor-pointer',
              isLocked
                ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                : 'border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40'
            )}
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở khóa tài khoản</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa tài khoản này</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Đóng
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
