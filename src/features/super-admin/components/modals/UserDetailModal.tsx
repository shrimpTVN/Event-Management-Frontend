import { Tooltip } from '@/components/ui/tooltip'
import {
  getSuperAdminRoles,
  isValidUserId,
  getUserDisplayRole,
  superAdminService,
} from '../../services/superAdminService'
import { useEffect, useState } from 'react'
import { Check, Copy, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  UserPermissionBadges,
  UserStatusBadge,
  AdminDetailField,
  AdminDetailSection,
  AdminDetailSheet,
  AdminBadge,
} from '../AdminDetails'
import type { SuperAdminUser, UserFanpageMembership } from '../../types/superAdmin.types'

interface UserDetailModalProps {
  user: SuperAdminUser | null
  isOpen: boolean
  onClose: () => void
  onToggleStatus: (userId: string) => void
  onToggleSuperAdmin: (userId: string, enabled: boolean) => Promise<boolean>
}
export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onToggleStatus,
  onToggleSuperAdmin,
}: UserDetailModalProps) {
  const [copied, setCopied] = useState(false)
  const [memberships, setMemberships] = useState<UserFanpageMembership[]>([])
  const [membershipsLoading, setMembershipsLoading] = useState(false)
  const [membershipsError, setMembershipsError] = useState('')
  const [retryMemberships, setRetryMemberships] = useState(0)
  useEffect(() => {
    if (!isOpen || !user) return
    let active = true
    setMembershipsLoading(true)
    setMemberships([])
    setMembershipsError('')
    void superAdminService
      .getUserFanpages(user.id, user.email)
      .then((result) => {
        if (!active) return
        setMemberships(result.items)
        if (result.incomplete) setMembershipsError('Chưa tải được đầy đủ các fanpage.')
      })
      .catch(() => {
        if (active) setMembershipsError('Không thể tải danh sách fanpage.')
      })
      .finally(() => {
        if (active) setMembershipsLoading(false)
      })
    return () => {
      active = false
    }
  }, [user?.id, user?.email, isOpen, retryMemberships])
  const [isSaving, setIsSaving] = useState(false)
  const [roleError, setRoleError] = useState('')

  useEffect(() => {
    setCopied(false)

    setRoleError('')
  }, [user?.id, isOpen])
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])
  if (!user) return null
  const isLocked = user.status === 'LOCKED'
  const student = user.studentProfile
  const staff = user.staffProfile
  const isSuperAdmin = getUserDisplayRole(user) === 'SUPERADMIN'
  let canDemote = true
  try {
    if (isSuperAdmin) getSuperAdminRoles(user, false)
  } catch {
    canDemote = false
  }
  const toggleSuperAdmin = async () => {
    setIsSaving(true)
    setRoleError('')
    try {
      if (!(await onToggleSuperAdmin(user.id, !isSuperAdmin)))
        setRoleError('Không thể lưu thay đổi. Vui lòng thử lại.')
    } catch {
      setRoleError('Không thể lưu thay đổi. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(user.email)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <AdminDetailSheet
      open={isOpen}
      onClose={onClose}
      title="Chi tiết người dùng"
      description={
        isValidUserId(user.id) ? `ID tài khoản ${user.id}` : 'Chưa lấy được ID tài khoản'
      }
      footer={
        <>
          <Button
            variant="outline"
            className={isLocked ? 'mr-auto' : 'mr-auto text-red-700 dark:text-red-300'}
            disabled={!isValidUserId(user.id)}
            onClick={() => onToggleStatus(user.id)}
          >
            {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
            {isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="break-words font-k2d text-xl font-semibold">{user.name}</h2>
          <UserStatusBadge status={user.status} />
        </div>
      </div>
      <AdminDetailSection title="Thông tin tài khoản">
        <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminDetailField label="Email" wide>
            <div className="flex items-start gap-2">
              <span className="min-w-0 flex-1 break-all">{user.email}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={copyEmail}
                aria-label={copied ? 'Đã sao chép email' : 'Sao chép email'}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <span className="sr-only" role="status">
                {copied ? 'Đã sao chép email' : ''}
              </span>
            </div>
          </AdminDetailField>
          {user.phone && !staff && (
            <AdminDetailField label="Số điện thoại">{user.phone}</AdminDetailField>
          )}
          {user.createdAt && (
            <AdminDetailField label="Ngày tạo tài khoản">{user.createdAt}</AdminDetailField>
          )}
          <AdminDetailField label="Vai trò" wide>
            <UserPermissionBadges user={user} />
          </AdminDetailField>
        </dl>
      </AdminDetailSection>
      {student && (
        <AdminDetailSection title="Hồ sơ sinh viên">
          <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminDetailField label="Mã số sinh viên">{student.studentId}</AdminDetailField>
            <AdminDetailField label="Khóa">{student.kNumber}</AdminDetailField>
            <AdminDetailField label="Khoa / Trường" wide>
              {student.schoolName}
            </AdminDetailField>
            <AdminDetailField label="Chuyên ngành" wide>
              {student.majorName}
            </AdminDetailField>
            {student.associationName && (
              <AdminDetailField label="Đơn vị Đoàn / Hội" wide>
                {student.associationName}
              </AdminDetailField>
            )}
            {user.eventsParticipatedCount != null && (
              <AdminDetailField label="Sự kiện đã tham gia">
                {user.eventsParticipatedCount}
              </AdminDetailField>
            )}
          </dl>
        </AdminDetailSection>
      )}
      {staff && (
        <AdminDetailSection title="Hồ sơ cán bộ">
          <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AdminDetailField label="Mã số cán bộ">{staff.staffId}</AdminDetailField>
            <AdminDetailField label="Số điện thoại">{staff.phoneNumber}</AdminDetailField>
            <AdminDetailField label="Đơn vị công tác" wide>
              {staff.orgName}
            </AdminDetailField>
            <AdminDetailField label="Chức danh" wide>
              {staff.title}
            </AdminDetailField>
          </dl>
        </AdminDetailSection>
      )}
      {!student && !staff && (
        <AdminDetailSection title="Hồ sơ cá nhân">
          <p className="text-sm text-muted-foreground">Chưa có thông tin hồ sơ cá nhân.</p>
        </AdminDetailSection>
      )}
      <AdminDetailSection title="Fanpage tham gia">
        {membershipsLoading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Đang tải fanpage…
          </p>
        ) : (
          <>
            {memberships.length > 0 && (
              <div className="flex flex-col divide-y divide-border">
                {memberships.map((fanpage) => (
                  <div
                    key={fanpage.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    {fanpage.avatarUrl ? (
                      <img
                        src={fanpage.avatarUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                        {fanpage.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                      <Tooltip content={fanpage.name}>
                        <span className="break-words text-sm font-medium">{fanpage.name}</span>
                      </Tooltip>
                      <AdminBadge tone={fanpage.role === 'ADMIN' ? 'primary' : 'neutral'}>
                        {fanpage.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                      </AdminBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {membershipsError ? (
              <div className="flex items-center justify-between gap-3">
                <p role="status" className="text-sm text-muted-foreground">
                  {membershipsError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRetryMemberships((value) => value + 1)}
                >
                  Thử lại
                </Button>
              </div>
            ) : (
              !memberships.length && (
                <p className="text-sm text-muted-foreground">Chưa tham gia fanpage nào.</p>
              )
            )}
          </>
        )}
      </AdminDetailSection>
      <AdminDetailSection title="Quyền Super admin">
        {!isValidUserId(user.id) && (
          <p className="text-xs text-muted-foreground">
            Cần ID tài khoản hợp lệ để thay đổi quyền hoặc trạng thái.
          </p>
        )}
        <div className="flex flex-col items-start gap-3">
          {!canDemote && (
            <p className="text-xs text-muted-foreground">
              Chưa xác định được loại tài khoản gốc để gỡ quyền Super admin.
            </p>
          )}
          {roleError && (
            <p role="alert" className="text-xs text-destructive">
              {roleError}
            </p>
          )}
          <Button
            variant={isSuperAdmin ? 'outline' : 'default'}
            disabled={isSaving || !canDemote || !isValidUserId(user.id)}
            onClick={toggleSuperAdmin}
          >
            {isSaving
              ? 'Đang lưu…'
              : isSuperAdmin
                ? 'Gỡ quyền Super admin'
                : 'Cấp quyền Super admin'}
          </Button>
        </div>
      </AdminDetailSection>
    </AdminDetailSheet>
  )
}
