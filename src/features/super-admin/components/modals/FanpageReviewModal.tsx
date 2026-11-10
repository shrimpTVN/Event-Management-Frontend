import React, { useState } from 'react'
import { X, CheckCircle, XCircle, FileText, Download, Building, User, Phone, Mail, AlertTriangle } from 'lucide-react'
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

  if (!isOpen || !fanpage) return null

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return
    onReject(fanpage.id, rejectReason.trim())
    setIsRejecting(false)
    setRejectReason('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-k2d font-bold text-foreground">
              {fanpage.status === 'PENDING' ? 'Phê Duyệt Đăng Ký Fanpage' : 'Chi Tiết & Quản Trị Fanpage'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Fanpage Basic Header */}
          <div className="flex items-start gap-4">
            <img
              src={fanpage.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'}
              alt={fanpage.name}
              className="w-16 h-16 rounded-2xl object-cover border border-border shadow-xs"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xl font-k2d font-bold text-foreground">{fanpage.name}</h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    fanpage.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : fanpage.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                  }`}
                >
                  {fanpage.status === 'ACTIVE'
                    ? 'Đang hoạt động'
                    : fanpage.status === 'PENDING'
                    ? 'Đang chờ duyệt'
                    : 'Bị khóa / Từ chối'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{fanpage.description || 'Chưa có phần giới thiệu.'}</p>
            </div>
          </div>

          {/* Representative & Unit Details */}
          <div className="bg-[#F9FAFB] dark:bg-muted/20 p-4 rounded-xl border border-border space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thông Tin Người Đại Diện & Đơn Vị</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-white dark:bg-card">
          <div>
            {fanpage.status !== 'PENDING' && (
              <button
                type="button"
                onClick={() => onToggleLock(fanpage.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  fanpage.status === 'ACTIVE'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                }`}
              >
                {fanpage.status === 'ACTIVE' ? 'Tạm khóa Fanpage' : 'Mở khóa hoạt động'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {fanpage.status === 'PENDING' && !isRejecting && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Từ chối
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(fanpage.id)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Phê Duyệt Ngay
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-card border border-border text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
