import { Tooltip } from '@/components/ui/tooltip'
import { useEffect, useState } from 'react'
import { Check, FileText, Lock, Unlock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  FanpageStatusBadge,
  AdminDetailField,
  AdminDetailSection,
  AdminDetailSheet,
} from '../AdminDetails'
import type { SuperAdminFanpage } from '../../types/superAdmin.types'
import { superAdminService } from '../../services/superAdminService'

interface FanpageReviewModalProps {
  fanpage: SuperAdminFanpage | null
  isOpen: boolean
  onClose: () => void
  onApprove: (fanpageId: string) => void
  onReject: (fanpageId: string, reason: string) => void
  onToggleLock: (fanpageId: string) => void
}

export function FanpageReviewModal({
  fanpage,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onToggleLock,
}: FanpageReviewModalProps) {
  const [reason, setReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [followerCount, setFollowerCount] = useState<number | null>(null)
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  useEffect(() => {
    if (!isOpen || !fanpage) return
    let active = true
    setIsLoadingFollowers(true)
    setFollowerCount(null)
    void superAdminService.getFanpageFollowerCount(fanpage.id).then((count) => {
      if (active) {
        setFollowerCount(count)
        setIsLoadingFollowers(false)
      }
    })
    return () => {
      active = false
    }
  }, [fanpage?.id, isOpen])
  useEffect(() => {
    setReason('')
    setIsRejecting(false)
  }, [fanpage?.id, isOpen])
  if (!fanpage) return null
  const pending = fanpage.status === 'PENDING'
  const restricted = fanpage.status === 'LOCKED' || fanpage.status === 'REJECTED'
  const confirmReject = () => {
    if (!reason.trim()) return
    onReject(fanpage.id, reason.trim())
    setIsRejecting(false)
    setReason('')
  }
  return (
    <AdminDetailSheet
      open={isOpen}
      onClose={onClose}
      title={pending ? 'Duyệt đăng ký fanpage' : 'Chi tiết fanpage'}
      description={`ID ${fanpage.id} · Ngày đăng ký ${fanpage.createdAt || 'Chưa cập nhật'}`}
      footer={
        isRejecting ? (
          <>
            <Button variant="outline" onClick={() => setIsRejecting(false)}>
              Hủy
            </Button>
            <Button variant="destructive" disabled={!reason.trim()} onClick={confirmReject}>
              Xác nhận từ chối
            </Button>
          </>
        ) : (
          <>
            {!pending && (
              <Button
                variant="outline"
                className={restricted ? 'mr-auto' : 'mr-auto text-red-700 dark:text-red-300'}
                onClick={() => onToggleLock(fanpage.id)}
              >
                {restricted ? (
                  <Unlock className="mr-2 h-4 w-4" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                {restricted ? 'Mở khóa fanpage' : 'Tạm khóa fanpage'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            {pending && (
              <>
                <Button
                  variant="outline"
                  className="text-red-700 dark:text-red-300"
                  onClick={() => setIsRejecting(true)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Từ chối
                </Button>
                <Button onClick={() => onApprove(fanpage.id)}>
                  <Check className="mr-2 h-4 w-4" />
                  Phê duyệt
                </Button>
              </>
            )}
          </>
        )
      }
    >
      <div className="flex min-w-0 items-start gap-4">
        {fanpage.avatarUrl ? (
          <img
            src={fanpage.avatarUrl}
            alt={fanpage.name}
            className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
            {fanpage.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <Tooltip content={fanpage.name}>
            <h2 className="w-full font-k2d text-lg font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
              {fanpage.name}
            </h2>
          </Tooltip>
          <FanpageStatusBadge status={fanpage.status} />
        </div>
      </div>
      {fanpage.description && (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
          {fanpage.description}
        </p>
      )}
      {fanpage.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <p className="mb-1 font-semibold">Lý do từ chối</p>
          <p className="whitespace-pre-wrap break-words">{fanpage.rejectionReason}</p>
        </div>
      )}
      <AdminDetailSection title="Người đại diện · Admin fanpage">
        <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminDetailField label="Họ và tên">{fanpage.representativeName}</AdminDetailField>
          <AdminDetailField label="Mã số">{fanpage.representativeCode}</AdminDetailField>
          <AdminDetailField label="Email" wide>
            {fanpage.representativeEmail}
          </AdminDetailField>
          <AdminDetailField label="Số điện thoại">{fanpage.representativePhone}</AdminDetailField>
        </dl>
      </AdminDetailSection>
      <AdminDetailSection title="Thông tin đơn vị">
        <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <AdminDetailField label="Khoa / Trường" wide>
            {fanpage.schoolName}
          </AdminDetailField>
          <AdminDetailField label="Email liên hệ fanpage" wide>
            {fanpage.contactEmail}
          </AdminDetailField>
          <AdminDetailField label="Số điện thoại liên hệ fanpage">
            {fanpage.contactPhone}
          </AdminDetailField>
          <AdminDetailField label="Sự kiện đã tổ chức">{fanpage.eventsCount}</AdminDetailField>
          <AdminDetailField label="Người theo dõi">
            <span role="status" aria-live="polite">
              {isLoadingFollowers
                ? 'Đang tải…'
                : followerCount == null
                  ? 'Chưa tải được dữ liệu'
                  : followerCount.toLocaleString('vi-VN')}
            </span>
          </AdminDetailField>
        </dl>
      </AdminDetailSection>
      <AdminDetailSection title="Hồ sơ minh chứng">
        <div className="flex items-start gap-3 rounded-xl border border-border p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <p className="break-all text-sm font-medium">
              {fanpage.proofFileName || 'Hồ sơ minh chứng'}
            </p>
            {fanpage.proofFileUrl && /^https?:\/\//i.test(fanpage.proofFileUrl) ? (
              <a
                href={fanpage.proofFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Xem tệp minh chứng ↗
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có tệp đính kèm</p>
            )}
          </div>
        </div>
      </AdminDetailSection>
      {isRejecting && (
        <AdminDetailSection title="Từ chối đăng ký">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fanpage-reject-reason">
              Lý do từ chối <span className="text-red-700">*</span>
            </Label>
            <Textarea
              id="fanpage-reject-reason"
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do gửi đến người đại diện..."
              rows={4}
              className="placeholder:text-gray-400"
            />
          </div>
        </AdminDetailSection>
      )}
    </AdminDetailSheet>
  )
}
