import React, { useState } from 'react'
import {
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Award,
  ShieldCheck,
  UserCheck,
  ChevronRight,
} from 'lucide-react'
import type {
  VolunteerApplicant,
  VolunteerRole,
  VolunteerRecruitmentPost,
} from '../types/fanpageAdmin.types'

interface VolunteerApplicationsModalProps {
  isOpen: boolean
  onClose: () => void
  recruitmentPost: VolunteerRecruitmentPost
  applicants: VolunteerApplicant[]
  onUpdateApplicantStatus: (applicantId: string, status: 'APPROVED' | 'REJECTED', role?: VolunteerRole) => void
  onAssignRole: (applicantId: string, role: VolunteerRole) => void
}

const ROLE_LABELS: Record<VolunteerRole, { label: string; icon: string }> = {
  CHECKIN: { label: 'Điểm danh & Đón tiếp', icon: '🎟️' },
  LOGISTICS: { label: 'Hậu cần & Máy chiếu', icon: '📦' },
  RECEPTION: { label: 'Lễ tân & Khách mời', icon: '🤝' },
  MEDIA: { label: 'Truyền thông & Chụp ảnh', icon: '📸' },
}

export const VolunteerApplicationsModal: React.FC<VolunteerApplicationsModalProps> = ({
  isOpen,
  onClose,
  recruitmentPost,
  applicants,
  onUpdateApplicantStatus,
  onAssignRole,
}) => {
  const [activeTab, setActiveTab] = useState<'APPLICANTS' | 'ASSIGNMENT'>('APPLICANTS')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | VolunteerRole>('ALL')

  if (!isOpen) return null

  const filteredApplicants = applicants.filter((item) => {
    const matchSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.major.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter
    const matchRole = selectedRoleFilter === 'ALL' || item.appliedRole === selectedRoleFilter
    return matchSearch && matchStatus && matchRole
  })

  const pendingCount = applicants.filter((a) => a.status === 'PENDING').length
  const approvedCount = applicants.filter((a) => a.status === 'APPROVED').length

  const roles: VolunteerRole[] = ['CHECKIN', 'LOGISTICS', 'RECEPTION', 'MEDIA']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-k2d font-bold text-lg text-foreground">
                Quản lý ứng viên & Phân công Tình nguyện viên
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold">
                {applicants.length} ứng viên đã nộp đơn
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Đợt tuyển: <span className="font-medium text-foreground">{recruitmentPost.title}</span> (Chỉ tiêu: {recruitmentPost.targetCount} bạn)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-border flex items-center gap-4 bg-muted/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('APPLICANTS')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'APPLICANTS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>1. Danh sách đơn ứng tuyển</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ASSIGNMENT')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ASSIGNMENT'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>2. Phân công nhiệm vụ cụ thể</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
              {approvedCount} đã duyệt
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-xs">
          {activeTab === 'APPLICANTS' ? (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên sinh viên, MSSV, ngành học..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-background rounded-lg border border-border px-2 h-8">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="PENDING">Chờ duyệt ({pendingCount})</option>
                      <option value="APPROVED">Đã duyệt ({approvedCount})</option>
                      <option value="REJECTED">Từ chối</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-background rounded-lg border border-border px-2 h-8">
                    <select
                      value={selectedRoleFilter}
                      onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
                      className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">Tất cả vị trí mong muốn</option>
                      <option value="CHECKIN">🎟️ Điểm danh & Đón tiếp</option>
                      <option value="LOGISTICS">📦 Hậu cần & Máy chiếu</option>
                      <option value="RECEPTION">🤝 Lễ tân & Khách mời</option>
                      <option value="MEDIA">📸 Truyền thông</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Applicants List */}
              <div className="space-y-2.5">
                {filteredApplicants.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="font-medium">Không tìm thấy đơn ứng tuyển nào phù hợp</p>
                  </div>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-4 rounded-xl border border-border bg-white dark:bg-card shadow-2xs hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {applicant.fullName}
                          </span>
                          <span className="font-mono text-muted-foreground text-xs px-2 py-0.5 rounded bg-muted">
                            {applicant.studentId}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            Khóa {applicant.kNumber} · {applicant.major}
                          </span>
                          {applicant.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-semibold flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              Chờ duyệt
                            </span>
                          )}
                          {applicant.status === 'APPROVED' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Đã duyệt
                            </span>
                          )}
                          {applicant.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-semibold flex items-center gap-1">
                              <XCircle className="h-2.5 w-2.5" />
                              Từ chối
                            </span>
                          )}
                        </div>

                        {/* Applied Role & Reason */}
                        <div className="flex items-center gap-2 text-xs pt-1">
                          <span className="text-muted-foreground">Nguyện vọng:</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold text-[11px]">
                            {ROLE_LABELS[applicant.appliedRole]?.icon} {ROLE_LABELS[applicant.appliedRole]?.label}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground text-[11px]">SĐT: {applicant.phone}</span>
                        </div>

                        <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg italic">
                          &ldquo;{applicant.reason}&rdquo;
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {applicant.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateApplicantStatus(applicant.id, 'APPROVED', applicant.appliedRole)}
                              className="px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Duyệt đơn</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateApplicantStatus(applicant.id, 'REJECTED')}
                              className="px-2.5 h-8 rounded-lg border border-border bg-white dark:bg-card hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-muted-foreground font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}

                        {applicant.status === 'APPROVED' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Đã phân công: <strong>{ROLE_LABELS[applicant.assignedRole || applicant.appliedRole]?.label}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('ASSIGNMENT')}
                              className="px-2.5 h-7 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[11px] font-medium text-foreground flex items-center gap-1 cursor-pointer"
                            >
                              <span>Đổi vai trò</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {applicant.status === 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => onUpdateApplicantStatus(applicant.id, 'APPROVED', applicant.appliedRole)}
                            className="px-2.5 h-7 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Xem xét lại
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: PHÂN CÔNG NHIỆM VỤ CỤ THỂ */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold">
                    Quy chuẩn quyền lợi: +10 ĐRL Ban tổ chức · Điểm SV5T Tình nguyện tốt · Giấy chứng nhận Đoàn trường
                  </span>
                </div>
                <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                  {approvedCount} bạn đã sẵn sàng
                </span>
              </div>

              {/* Grid 4 vai trò chính */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const roleConfig = ROLE_LABELS[role]
                  const assignedStudents = applicants.filter(
                    (a) => a.status === 'APPROVED' && (a.assignedRole || a.appliedRole) === role
                  )
                  const slotTarget = recruitmentPost.rolesNeeded.find((r) => r.role === role)?.targetCount || 2

                  return (
                    <div
                      key={role}
                      className="p-4 rounded-xl border border-border bg-white dark:bg-card shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{roleConfig.icon}</span>
                          <div>
                            <h4 className="font-semibold text-foreground text-xs">{roleConfig.label}</h4>
                            <p className="text-[10px] text-muted-foreground">
                              {role === 'CHECKIN'
                                ? 'Phụ trách điểm danh vào cửa, hướng dẫn sinh viên'
                                : role === 'LOGISTICS'
                                ? 'Phụ trách máy chiếu, chiếu mã PIN, micro & teabreak'
                                : role === 'RECEPTION'
                                ? 'Đón tiếp doanh nghiệp & đại biểu danh dự'
                                : 'Chụp ảnh sự kiện, tư liệu fanpage'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          assignedStudents.length >= slotTarget
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          {assignedStudents.length} / {slotTarget} bạn
                        </span>
                      </div>

                      {/* Danh sách sinh viên được phân công vào vai trò này */}
                      <div className="space-y-2">
                        {assignedStudents.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground border border-dashed border-border rounded-lg text-[11px]">
                            Chưa có sinh viên nào được phân công vào nhóm này.
                          </div>
                        ) : (
                          assignedStudents.map((st) => (
                            <div
                              key={st.id}
                              className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {st.fullName}{' '}
                                  <span className="font-mono text-muted-foreground text-[10px]">
                                    ({st.studentId})
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {st.major} · SĐT: {st.phone}
                                </div>
                              </div>

                              {/* Dropdown đổi ban/nhóm trực tiếp */}
                              <select
                                value={role}
                                onChange={(e) => onAssignRole(st.id, e.target.value as VolunteerRole)}
                                className="h-7 px-2 text-[10px] font-medium rounded border border-border bg-white dark:bg-card text-foreground cursor-pointer focus:outline-hidden"
                              >
                                <option value="CHECKIN">🎟️ Điểm danh</option>
                                <option value="LOGISTICS">📦 Hậu cần</option>
                                <option value="RECEPTION">🤝 Lễ tân</option>
                                <option value="MEDIA">📸 Media</option>
                              </select>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-muted/20 text-xs">
          <span className="text-muted-foreground text-[11px]">
            Tất cả Tình nguyện viên được duyệt sẽ nhận quyền lợi riêng khi sự kiện hoàn thành.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-8 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
