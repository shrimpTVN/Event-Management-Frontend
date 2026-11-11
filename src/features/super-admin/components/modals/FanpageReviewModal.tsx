import React, { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Building,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Lock,
  Unlock,
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
import type { SuperAdminFanpage } from '../../types/superAdmin.types'

interface FanpageReviewModalProps {
  fanpage: SuperAdminFanpage | null
  isOpen: boolean
  onClose: () => void
  onApprove: (fanpageId: string) => void
  onReject: (fanpageId: string, reason: string) => void
  onToggleLock: (fanpageId: string) => void
}

export const FanpageReviewModal: React.FC<FanpageReviewModalProps> = ({
  fanpage,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onToggleLock,
}) => {
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  if (!fanpage) return null

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return
    onReject(fanpage.id, rejectReason.trim())
    setIsRejecting(false)
    setRejectReason('')
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 gap-0 text-left bg-white dark:bg-card border-l border-border shadow-2xl"
      >
        {/* Header Drawer */}
        <SheetHeader className="px-6 py-5 border-b border-border/80 bg-slate-50/50 dark:bg-muted/20">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>
              {fanpage.status === 'PENDING'
                ? 'Phê duyệt đăng ký Fanpage'
                : 'Chi tiết & Quản trị Fanpage'}
            </span>
          </div>
          <SheetTitle className="text-xl font-k2d font-bold text-foreground mt-1 flex items-center justify-between">
            <span>{fanpage.name}</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Đơn vị: <span className="font-semibold text-foreground">{fanpage.schoolName}</span> • ID #{fanpage.id}
          </SheetDescription>
        </SheetHeader>

        {/* Body Drawer (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Fanpage Basic Header */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-border/70">
            <img
              src={
                fanpage.avatarUrl ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'
              }
              alt={fanpage.name}
              className="w-16 h-16 rounded-2xl object-cover border border-border shadow-xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-foreground truncate">{fanpage.name}</h4>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                    fanpage.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                      : fanpage.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200'
                  )}
                >
                  {fanpage.status === 'ACTIVE'
                    ? 'Đang hoạt động'
                    : fanpage.status === 'PENDING'
                    ? 'Đang chờ duyệt'
                    : 'Bị khóa / Từ chối'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {fanpage.description || 'Chưa có phần giới thiệu.'}
              </p>
            </div>
          </div>

          {/* Representative & Unit Details */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Thông Tin Người Đại Diện &amp; Đơn Vị
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/60 dark:bg-muted/20 p-4 rounded-xl border border-border/70">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary shrink-0" />
                <span>Người đại diện: <strong className="text-foreground">{fanpage.representativeName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary shrink-0" />
                <span>Đơn vị: <strong className="text-foreground">{fanpage.schoolName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">Email: {fanpage.representativeEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>SĐT: {fanpage.representativePhone}</span>
              </div>
            </div>
          </div>

          {/* Proof Documents Section */}
          <div className="border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              Hồ Sơ Minh Chứng Thành Lập / Đơn Vị Giới Thiệu
            </h5>
            <div className="flex items-center justify-between bg-white dark:bg-card p-3 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {fanpage.proofFileName || 'Minh_chung_thanh_lap_don_vi.pdf'}
                  </p>
                  <p className="text-xs text-muted-foreground">Định dạng PDF • Đã xác thực chữ ký số</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert(`Đang tải tệp: ${fanpage.proofFileName || 'Minh chứng'}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Tải / Xem tệp
              </button>
            </div>
          </div>

          {/* Rejection input mode */}
          {isRejecting && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Lý do từ chối phê duyệt hoặc tạm khóa
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết để thông báo cho người đại diện..."
                rows={3}
                className="w-full text-sm p-3 rounded-xl border border-red-200 bg-white dark:bg-card text-foreground focus:outline-hidden focus:ring-2 focus:ring-red-500 font-sans"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-border text-foreground hover:bg-[#F3F4F6] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectReason.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Xác nhận Từ Chối
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="px-6 py-4 border-t border-border/80 bg-slate-50/50 dark:bg-muted/20 flex flex-row items-center justify-between gap-3">
          <div>
            {fanpage.status !== 'PENDING' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onToggleLock(fanpage.id)}
                className={cn(
                  'gap-1.5 text-xs font-semibold cursor-pointer',
                  fanpage.status === 'ACTIVE'
                    ? 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                )}
              >
                {fanpage.status === 'ACTIVE' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Tạm khóa Fanpage</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Mở khóa hoạt động</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {fanpage.status === 'PENDING' && !isRejecting && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejecting(true)}
                  className="gap-1.5 text-xs font-semibold text-red-700 border-red-200 hover:bg-red-50 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => onApprove(fanpage.id)}
                  className="gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Phê Duyệt Ngay</span>
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Đóng
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
