import { getUserDisplayRole } from '../services/superAdminService'
import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/shared/utils/cn'
import type {
  AdminEventStatus,
  FanpageStatus,
  UserRole,
  UserStatus,
  SuperAdminUser,
  UserSystemRole,
} from '../types/superAdmin.types'

export const adminRoleLabels: Record<UserRole, string> = {
  SUPERADMIN: 'Super admin',
  STAFF: 'Cán bộ',
  STUDENT: 'Sinh viên',
}

export const systemRoleLabels: Record<UserSystemRole, string> = {
  ADMIN: 'Super admin',
  STUDENT: 'Sinh viên',
  FANPAGE_ADMIN: 'Quản trị fanpage',
}

export function UserPermissionBadges({ user }: { user: SuperAdminUser }) {
  const role = getUserDisplayRole(user)
  return role ? (
    <AdminRoleBadge role={role} />
  ) : (
    <span className="text-xs text-muted-foreground">—</span>
  )
}

export function AdminRoleBadge({ role }: { role: UserRole }) {
  return (
    <AdminBadge tone={role === 'STUDENT' ? 'neutral' : 'primary'}>
      {adminRoleLabels[role]}
    </AdminBadge>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <AdminBadge
      dot
      tone={status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : 'danger'}
    >
      {status === 'ACTIVE' ? 'Hoạt động' : status === 'PENDING' ? 'Chờ xác nhận' : 'Bị khóa'}
    </AdminBadge>
  )
}

export function FanpageStatusBadge({ status }: { status: FanpageStatus }) {
  return (
    <AdminBadge
      dot
      tone={status === 'ACTIVE' ? 'success' : status === 'PENDING' ? 'warning' : 'danger'}
    >
      {status === 'ACTIVE'
        ? 'Hoạt động'
        : status === 'PENDING'
          ? 'Chờ duyệt'
          : status === 'REJECTED'
            ? 'Đã từ chối'
            : 'Bị khóa'}
    </AdminBadge>
  )
}

export function EventStatusBadge({ status }: { status: AdminEventStatus }) {
  const labels: Record<AdminEventStatus, string> = {
    OPEN: 'Đang mở',
    HAPPENING: 'Đang diễn ra',
    COMPLETED: 'Đã đóng',
    VIOLATED: 'Vi phạm',
    HIDDEN: 'Đã ẩn',
    DRAFT: 'Bản nháp',
    CANCELLED: 'Đã hủy',
  }
  return (
    <AdminBadge
      dot
      tone={
        status === 'OPEN'
          ? 'success'
          : status === 'HAPPENING'
            ? 'primary'
            : ['VIOLATED', 'HIDDEN', 'CANCELLED'].includes(status)
              ? 'danger'
              : 'neutral'
      }
    >
      {labels[status]}
    </AdminBadge>
  )
}

export function AdminBadge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode
  tone?: 'neutral' | 'primary' | 'danger' | 'success' | 'warning'
  dot?: boolean
}) {
  const dotColors = {
    neutral: 'bg-muted-foreground/50',
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-destructive',
  }
  if (dot) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium',
          tone === 'neutral'
            ? 'text-muted-foreground'
            : tone === 'danger'
              ? 'text-destructive'
              : 'text-foreground'
        )}
      >
        <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', dotColors[tone])} />
        {children}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium leading-none whitespace-nowrap',
        tone === 'neutral' && 'bg-muted/40 text-muted-foreground',
        tone === 'primary' && 'bg-brand-subtle text-brand-subtle-foreground',
        tone === 'success' &&
          'bg-emerald-50/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
        tone === 'warning' &&
          'bg-amber-50/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
        tone === 'danger' && 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
      )}
    >
      {children}
    </span>
  )
}

export function AdminDetailSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent
        side="right"
        className="flex h-dvh w-full flex-col gap-0 overflow-hidden border-l border-border bg-background p-0 text-left sm:max-w-xl md:max-w-xl lg:max-w-xl"
      >
        <SheetHeader className="shrink-0 gap-1 space-y-0 border-b border-border bg-background px-6 py-5 pr-14 text-left">
          <SheetTitle className="font-k2d text-xl font-semibold">{title}</SheetTitle>
          <SheetDescription className="text-sm">{description}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 py-6">
          {children}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-6 py-4 [&>button]:h-10">
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AdminDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  )
}

export function AdminDetailField({
  label,
  children,
  wide = false,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', wide && 'md:col-span-2')}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="m-0 break-words text-sm font-medium leading-relaxed text-foreground [overflow-wrap:anywhere]">
        {children == null || children === '' ? 'Chưa có dữ liệu' : children}
      </dd>
    </div>
  )
}
