import React from 'react'
import { X, CheckCircle2, AlertCircle, Clock, ShieldCheck, FileText } from 'lucide-react'
import type { RegisteredEventItem } from '../types/history.types'

interface ProofModalProps {
  isOpen: boolean
  onClose: () => void
  event: RegisteredEventItem | null
  onComplaint?: (event: RegisteredEventItem) => void
}

export const ProofModal: React.FC<ProofModalProps> = ({
  isOpen,
  onClose,
  event,
  onComplaint,
}) => {
  if (!isOpen || !event) return null

  const title = event.title || event.eventName || 'Sự kiện'
  const sessions = Array.isArray(event.attendanceSessions) ? event.attendanceSessions : []
  const studentName = event.studentInfo?.fullName || 'Đoàn Tài Lộc'
  const studentMssv = event.studentInfo?.mssv || 'B2303827'
  const points =
    event.pointsCategory ||
    (event.benefits && event.benefits.length > 0
      ? `ĐRL: +${event.benefits[0]}`
      : 'ĐRL theo quy định')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground">
                Thông tin minh chứng
              </h3>
              <p className="text-xs text-muted-foreground">
                Dữ liệu điểm danh và xác nhận tham gia sự kiện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-muted/30 border border-border/70 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Sinh viên:</span>
              <span className="font-semibold text-foreground text-sm">
                {studentName} ({studentMssv})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">Điểm cộng rèn luyện:</span>
              <span className="font-semibold text-primary text-sm inline-flex items-center gap-1">
                {points}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground block mb-0.5">Sự kiện:</span>
              <span className="font-medium text-foreground text-sm">{title}</span>
            </div>
          </div>

          {/* Attendance History Table */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-foreground mb-2.5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Lịch sử điểm danh các buổi
            </h4>

            {sessions.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border/80">
                    <tr>
                      <th className="px-3.5 py-2.5 text-center w-12">STT</th>
                      <th className="px-3.5 py-2.5">Buổi / Đợt</th>
                      <th className="px-3.5 py-2.5">Thời gian điểm danh</th>
                      <th className="px-3.5 py-2.5">Người điểm danh</th>
                      <th className="px-3.5 py-2.5 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sessions.map((session, index) => (
                      <tr key={session.id || `session-${index}`} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3.5 py-3 text-center font-medium text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-3.5 py-3 font-medium text-foreground">
                          {session.sessionName || `Buổi ${index + 1}`}
                        </td>
                        <td className="px-3.5 py-3 text-muted-foreground">
                          {session.checkInTime || '—'}
                        </td>
                        <td className="px-3.5 py-3 text-muted-foreground">
                          {session.checkedBy || '—'}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          {session.status === 'VALID' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Hợp lệ
                            </span>
                          )}
                          {session.status === 'ABSENT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                              <AlertCircle className="h-3 w-3" />
                              Vắng
                            </span>
                          )}
                          {(session.status === 'NOT_STARTED' || !session.status) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                              Chưa diễn ra
                            </span>
                          )}
                          {session.status &&
                            !['VALID', 'ABSENT', 'NOT_STARTED'].includes(session.status) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                                {session.status}
                              </span>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Chưa có dữ liệu điểm danh cho sự kiện này.
              </div>
            )}
          </div>

          {/* Additional note */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Điểm rèn luyện sẽ được tổng kết tự động vào hệ thống quản lý ĐRL sau khi ban tổ chức hoàn tất rà soát biên bản sự kiện.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-muted/10">
          <button
            type="button"
            onClick={() => onComplaint?.(event)}
            className="px-4 py-2 text-xs md:text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            Khiếu nại kết quả
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs md:text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
