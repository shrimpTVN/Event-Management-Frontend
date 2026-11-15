import * as Dialog from '@radix-ui/react-dialog'
import {
  isAttendanceComplete,
  isAttendanceStarted,
  isAttendanceAbsent,
  isAttendancePending,
} from '@/shared/utils/attendanceState'
import {
  useAttendanceDraft,
  hasAttendanceProof,
  isPhotoAttendance,
} from '../hooks/useAttendanceDraft'
import { AttendanceTick } from './AttendanceTick'
import { AttendanceProofDialog } from './AttendanceProofDialog'
import { AttendanceOnBehalfDialog } from './AttendanceOnBehalfDialog'
import { DateSortButton } from './DateSortButton'
import { sortByDate, type DateSortDirection } from '../utils/dateSort'
import { buildPointCategoryCodes } from '@/shared/utils/pointCategoryCodes'
import { createSv5tLabelFormatter } from '@/shared/utils/sv5tLabels'
import { EventManagementSummary } from './EventManagementSummary'
import React, { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  CheckCircle2,
  Download,
  Search,
  Clock,
  X,
  Eye,
  Camera,
  Loader2,
  UserX,
  UserCheck,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminEvent, EventRegistrationItem } from '../types/fanpageAdmin.types'
import { fanpageAdminService } from '../services/fanpageAdminService'

interface FanpageEventDetailAdminViewProps {
  event: AdminEvent
  onBack: () => void
  onEditClick?: (event: AdminEvent) => void
}

export const FanpageEventDetailAdminView: React.FC<FanpageEventDetailAdminViewProps> = ({
  event,
  onBack,
  onEditClick,
}) => {
  // Attendance method and session configuration
  const sessionType: 'START' | 'END' | 'BOTH' = event.attendanceSessionType || 'BOTH'
  const attendance = useAttendanceDraft(event)
  const {
    registrations,
    source,
    isLoading: isLoadingAttendees,
    changedCount,
    isSaving,
    readOnly,
  } = attendance
  const isStudentProof = isPhotoAttendance(event, source)
  const currentEventStatus = attendance.effectiveStatus
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [onBehalfOpen, setOnBehalfOpen] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const reviewingItem = registrations.find((row) => row.id === reviewingId) ?? null

  // Format date DD/MM/YYYY for Vietnamese users
  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return ''
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, yyyy, mm, dd] = match
      return `${dd}/${mm}/${yyyy}`
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  }

  // Query point categories for short code matching (e.g. "V.b", "I.a")
  const { data: pointCategories = [] } = useQuery({
    queryKey: ['pointCategories'],
    queryFn: () => fanpageAdminService.getPointCategories(),
  })

  const { data: sv5tCriterias = [] } = useQuery({
    queryKey: ['sv5tCriterias'],
    queryFn: () => fanpageAdminService.getSv5tCriterias(),
  })

  const trainingPointBenefits = React.useMemo(() => {
    const codes = buildPointCategoryCodes(pointCategories)
    const points = event.eventPoints?.length
      ? event.eventPoints
      : (event.trainingPoints ?? 0) > 0
        ? [
            {
              pointCategoryId: event.trainingPointCategoryId,
              pointCategoryCode: event.trainingPointCategoryCode,
              point: event.trainingPoints!,
            },
          ]
        : []
    return points.map((point) => {
      const code =
        (point.pointCategoryId != null ? codes.get(point.pointCategoryId) : undefined) ||
        point.pointCategoryCode?.replace(/^mục\s+/i, '')
      return `+${point.point} điểm${code ? ` mục ${code}` : ''}`
    })
  }, [
    event.eventPoints,
    event.trainingPoints,
    event.trainingPointCategoryId,
    event.trainingPointCategoryCode,
    pointCategories,
  ])
  const sv5tCriteriaLabel = React.useMemo(
    () =>
      createSv5tLabelFormatter(sv5tCriterias)(event.sv5tCriteriaName ?? '', event.sv5tCriteriaId),
    [sv5tCriterias, event.sv5tCriteriaName, event.sv5tCriteriaId]
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [registrationDateSort, setRegistrationDateSort] = useState<DateSortDirection>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isCopied, setIsCopied] = useState(false)

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const exportLock = useRef(false)
  const handleExportCsv = async () => {
    if (exportLock.current) return
    exportLock.current = true
    setIsExporting(true)
    setExportError(null)
    let url: string | null = null
    try {
      const file = await fanpageAdminService.exportAttendeesCsv(event.fanpageId, event.id)
      url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendees-event-${event.id}.csv`
      document.body.appendChild(link)
      try {
        link.click()
      } finally {
        link.remove()
      }
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Không xuất được CSV. Vui lòng thử lại.'
      )
    } finally {
      if (url) URL.revokeObjectURL(url)
      exportLock.current = false
      setIsExporting(false)
    }
  }

  // Copy link handler
  const handleCopyLink = () => {
    const url = window.location.origin + `/events/${event.id}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Filter registrations
  const filteredRegistrations = registrations.filter((item) => {
    const matchSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.major.toLowerCase().includes(searchTerm.toLowerCase())

    const committed = source.find((row) => row.id === item.id) ?? item
    const matchStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'COMPLETED' && isAttendanceComplete(committed.status)) ||
      (selectedStatus === 'CHECKED_IN' && isAttendanceStarted(committed.status)) ||
      (selectedStatus === 'PENDING' &&
        (committed.status === 'REGISTERED' ||
          committed.status === 'APPROVED' ||
          committed.status === 'PENDING')) ||
      (selectedStatus === 'ENTRY_CHECKED' &&
        (committed.status === 'ENTRY_CHECKED' || committed.status === 'CHECKED_IN')) ||
      (selectedStatus === 'ABSENTED' && isAttendanceAbsent(committed.status)) ||
      (selectedStatus === 'WAITING_CONFIRM' && isAttendancePending(committed.status)) ||
      (selectedStatus === 'PROOF_SUBMITTED' &&
        (hasAttendanceProof(item) || isAttendancePending(committed.status)))
    return matchSearch && matchStatus
  })

  const sortedRegistrations = sortByDate(
    filteredRegistrations,
    registrationDateSort,
    (row) => row.registeredAtRaw ?? row.registeredAt
  )
  const selectionMode = isStudentProof ? 'PROOF' : attendance.manualSession
  const isSelectable = (row: EventRegistrationItem) =>
    !readOnly &&
    (isStudentProof
      ? isAttendancePending(row.status)
      : row.status === (attendance.manualSession === 'START' ? 'REGISTERED' : 'CHECKED_IN'))
  const selectableRows = filteredRegistrations.filter((row) =>
    isSelectable(source.find((saved) => saved.id === row.id) ?? row)
  )
  const selectedIds = attendance.selectedIds.filter((id) => {
    const row = source.find((saved) => saved.id === id)
    return row && isSelectable(row)
  })
  const allVisibleSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedIds.includes(row.id))
  const someVisibleSelected = selectableRows.some((row) => selectedIds.includes(row.id))
  const selectionLabel = isStudentProof
    ? 'Chọn'
    : attendance.manualSession === 'START'
      ? 'Check-in'
      : 'Check-out'

  // Initials generator for attendee avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Counts for attendance
  const registeredCount = registrations.length || 0
  const completedCount = source.filter((r) => isAttendanceComplete(r.status)).length
  const absentedCount = source.filter((r) => isAttendanceAbsent(r.status)).length
  const pendingCount = source.filter(
    (r) =>
      !isAttendanceStarted(r.status) && !isAttendanceAbsent(r.status) && r.status !== 'CANCELLED'
  ).length
  const pendingProofCount = source.filter((row) => isAttendancePending(row.status)).length

  // Result Badge Helper (Strictly consistent with design: Đã điểm danh / Chưa điểm danh / Vắng mặt)
  const getResultBadge = (item: EventRegistrationItem) => {
    const hasProof = Boolean(item.startEvidenceUrl || item.endEvidenceUrl || item.evidenceUrl)
    switch (item.status) {
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'RECORDED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" />
            Hoàn thành
          </span>
        )
      case 'SELF_CHECKED_IN':
      case 'CHECKED_IN':
      case 'ENTRY_CHECKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-foreground text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <Check className="h-3 w-3" />
            Đã check-in
          </span>
        )
      case 'ABSENT':
      case 'ABSENTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <UserX className="h-3 w-3" />
            Vắng mặt
          </span>
        )
      case 'SPENDING_CONFIRM':
        return (
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Chờ xác nhận
          </span>
        )
      case 'REGISTERED':
      case 'APPROVED':
      case 'PENDING':
        if (isStudentProof && hasProof) {
          return (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
              <Camera className="h-3 w-3" />
              Chờ duyệt ảnh
            </span>
          )
        }
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap">
            Chờ điểm danh
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium whitespace-nowrap">
            Đã hủy
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex w-full flex-col gap-5 text-left animate-in fade-in duration-300">
      <EventManagementSummary
        event={event}
        status={currentEventStatus}
        date={formatDateVN(event.dateStart)}
        trainingPoints={trainingPointBenefits}
        sv5tCriteria={sv5tCriteriaLabel}
        registered={registeredCount}
        completed={completedCount}
        pending={isStudentProof ? pendingProofCount : pendingCount}
        absent={absentedCount}
        isStudentProof={isStudentProof}
        sessionType={sessionType}
        isCopied={isCopied}
        onBack={onBack}
        onEdit={onEditClick}
        onCopyLink={handleCopyLink}
        onCloseEvent={!readOnly ? () => setCloseDialogOpen(true) : undefined}
        closingDisabled={isSaving || attendance.isClosing}
      />

      {/* 3. Main Content: Full-width Registrations List */}
      <div className="w-full space-y-4">
        {/* Main Panel Container */}
        <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h3 className="font-k2d text-base font-bold text-foreground sm:text-lg">
                Danh sách đăng ký
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filteredRegistrations.length} sinh viên
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {!readOnly && isStudentProof && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving || attendance.isClosing || isLoadingAttendees}
                  onClick={() => {
                    attendance.clearNotice()
                    setOnBehalfOpen(true)
                  }}
                  className="gap-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  Điểm danh thay
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="gap-1.5"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
              </Button>
            </div>
          </div>
          {exportError && (
            <p role="alert" className="text-right text-sm text-destructive">
              {exportError}
            </p>
          )}
          {attendance.notice && (
            <p
              role={attendance.notice.type === 'error' ? 'alert' : 'status'}
              className={
                attendance.notice.type === 'error'
                  ? 'text-sm text-destructive'
                  : 'text-sm text-foreground'
              }
            >
              {attendance.notice.message}
            </p>
          )}
          {attendance.isError && (
            <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
              Không tải được danh sách đăng ký.
              <Button type="button" size="sm" variant="outline" onClick={() => attendance.retry()}>
                Thử lại
              </Button>
            </div>
          )}

          {/* Search & Filter Toolbar with shadcn Input and Select */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Bar using shadcn Input */}
            <div className="relative flex-1 sm:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
              <Input
                type="text"
                placeholder="Tìm kiếm sinh viên, MSSV, ngành..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Status Select using shadcn Select */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[190px] h-9 text-xs bg-white dark:bg-card">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                <SelectItem value="CHECKED_IN">Đã check-in đầu giờ</SelectItem>
                <SelectItem value="PENDING">Chưa điểm danh</SelectItem>
                {isStudentProof && <SelectItem value="WAITING_CONFIRM">Chờ xác nhận</SelectItem>}
                <SelectItem value="ABSENTED">Vắng mặt</SelectItem>
                {isStudentProof && (
                  <SelectItem value="PROOF_SUBMITTED">Có ảnh minh chứng</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {!readOnly &&
            ((!isStudentProof &&
              (attendance.manualStartCount > 0 || attendance.manualEndCount > 0)) ||
              selectedIds.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                {!isStudentProof && (
                  <div
                    role="tablist"
                    aria-label="Lượt điểm danh"
                    className="inline-flex gap-1 rounded-lg bg-muted p-1"
                  >
                    {(['START', 'END'] as const).map((session) => (
                      <Button
                        key={session}
                        type="button"
                        role="tab"
                        aria-selected={attendance.manualSession === session}
                        tabIndex={attendance.manualSession === session ? 0 : -1}
                        onKeyDown={(e) => {
                          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                            e.preventDefault()
                            const next =
                              e.key === 'Home'
                                ? 'START'
                                : e.key === 'End'
                                  ? 'END'
                                  : session === 'START'
                                    ? 'END'
                                    : 'START'
                            attendance.setManualSession(next)
                            const tabs =
                              e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                                '[role="tab"]'
                              )
                            tabs?.[next === 'START' ? 0 : 1]?.focus()
                          }
                        }}
                        size="sm"
                        variant="ghost"
                        disabled={isSaving}
                        className={
                          attendance.manualSession === session
                            ? 'h-8 bg-background shadow-sm hover:bg-background'
                            : 'h-8 text-muted-foreground'
                        }
                        onClick={() => attendance.setManualSession(session)}
                      >
                        {session === 'START'
                          ? 'Check-in (' + attendance.manualStartCount + ')'
                          : 'Check-out (' + attendance.manualEndCount + ')'}
                      </Button>
                    ))}
                  </div>
                )}
                {selectedIds.length > 0 && (
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    <span role="status" className="text-xs text-muted-foreground">
                      Đã chọn {selectedIds.length}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSaving}
                      onClick={attendance.discard}
                    >
                      {isStudentProof ? 'Bỏ chọn' : 'Hủy thay đổi'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => attendance.save(isStudentProof ? 'PROOF' : 'MANUAL')}
                      className="gap-1.5"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isStudentProof
                        ? isSaving
                          ? 'Đang xác nhận...'
                          : 'Xác nhận (' + selectedIds.length + ')'
                        : isSaving
                          ? 'Đang lưu...'
                          : 'Lưu'}
                    </Button>
                  </div>
                )}
              </div>
            )}

          {/* Bảng danh sách: Floating Rounded Rows Layout */}
          <div className="p-3 sm:p-4 bg-[#F9FAFB]/50 dark:bg-background/40 rounded-xl overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Header hàng cột phẳng */}
              <div className="grid grid-cols-12 items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
                <div className="col-span-4 flex items-center gap-2">
                  {!readOnly && (
                    <AttendanceTick
                      compact
                      label="Chọn tất cả"
                      name="trong danh sách đang lọc"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected && !allVisibleSelected}
                      disabled={isSaving || selectableRows.length === 0}
                      onChange={() =>
                        attendance.selectRows(
                          selectableRows.map((row) => row.id),
                          !allVisibleSelected,
                          selectionMode
                        )
                      }
                    />
                  )}
                  Sinh viên
                </div>
                <div className="col-span-3">
                  <DateSortButton
                    label="Thời gian & Lịch sử"
                    direction={registrationDateSort}
                    onChange={setRegistrationDateSort}
                  />
                </div>
                <div className="col-span-3">Điểm danh & minh chứng</div>
                <div className="col-span-2 text-center">Trạng thái</div>
              </div>

              {/* Danh sách các hàng Floating Rounded Cards */}
              <div className="flex flex-col gap-2.5 mt-1">
                {isLoadingAttendees && registrations.length === 0 ? (
                  <div className="flex flex-col gap-2.5 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-card border border-border/80 rounded-xl px-5 py-3.5 grid grid-cols-12 items-center shadow-2xs"
                      >
                        {/* Col 1: Sinh viên (3 cols) */}
                        <div className="col-span-4 min-w-0 pr-3 flex items-center gap-2.5">
                          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-3 w-20 rounded" />
                          </div>
                        </div>

                        {/* Col 2: Thời gian (2 cols) */}
                        <div className="col-span-3 flex flex-col gap-1.5 pr-2">
                          <Skeleton className="h-3.5 w-28 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </div>

                        {/* Col 3: Phiên điểm danh (2 cols) */}
                        <div className="col-span-3 flex flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-24 rounded" />
                          <Skeleton className="h-3.5 w-24 rounded" />
                        </div>

                        {/* Col 4: Trạng thái (2 cols) */}
                        <div className="col-span-2 flex justify-center">
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="p-10 text-center text-muted-foreground bg-white dark:bg-card rounded-xl border border-border/80 text-xs">
                    Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                  </div>
                ) : (
                  sortedRegistrations.map((item) => {
                    const hasCheckInPhoto = Boolean(item.startEvidenceUrl || item.evidenceUrl)
                    const saved = source.find((row) => row.id === item.id)

                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-xl shadow-2xs hover:border-border hover:bg-muted/20 transition-all px-5 py-3.5 grid grid-cols-12 items-center group"
                      >
                        {/* Cột 1: Thông tin sinh viên (3 cols) */}
                        <div className="col-span-4 min-w-0 pr-3">
                          <div className="flex items-center gap-2.5">
                            {!readOnly && (
                              <AttendanceTick
                                compact
                                label={selectionLabel}
                                name={item.fullName}
                                checked={selectedIds.includes(item.id)}
                                disabled={isSaving || !saved || !isSelectable(saved)}
                                onChange={() =>
                                  isStudentProof
                                    ? attendance.toggleProof(item.id)
                                    : attendance.toggleSession(item.id, attendance.manualSession)
                                }
                              />
                            )}
                            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground font-medium text-[11px] flex items-center justify-center shrink-0">
                              {getInitials(item.fullName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">
                                {item.fullName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <span className="shrink-0">{item.studentId}</span>
                                <span>•</span>
                                <span className="truncate">{item.major}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cột 2: Thời gian & Lịch sử (2 cols) */}
                        <div className="col-span-3 flex flex-col gap-1 text-[11px] pr-2">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>Đăng ký: {item.registeredAt || 'Chưa cập nhật'}</span>
                          </div>
                          <div className="text-muted-foreground whitespace-nowrap">
                            {saved?.entryCheckInTime || saved?.checkOutTime ? (
                              <span>
                                Vào: {saved.entryCheckInTime || '—'}{' '}
                                <span className="px-1 text-muted-foreground/60">·</span> Ra:{' '}
                                {saved.checkOutTime || '—'}
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </div>

                        {/* Cột 3: Tiến độ phiên điểm danh / Minh chứng (2 cols) */}
                        <div className="col-span-3 text-xs">
                          <div className="flex flex-col items-start gap-2">
                            {!isStudentProof && (
                              <div className="flex flex-col gap-1 text-muted-foreground">
                                <span>
                                  Check-in:{' '}
                                  {saved?.entryCheckInTime ||
                                  isAttendanceStarted(saved?.status ?? '')
                                    ? 'Đã vào'
                                    : 'Chưa'}
                                </span>
                                <span>
                                  Check-out:{' '}
                                  {saved?.checkOutTime || isAttendanceComplete(saved?.status ?? '')
                                    ? 'Đã ra'
                                    : 'Chưa'}
                                </span>
                              </div>
                            )}
                            {hasCheckInPhoto && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => setReviewingId(item.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Xem ảnh
                              </Button>
                            )}
                            {isStudentProof && !hasCheckInPhoto && (
                              <span className="text-xs text-muted-foreground">Chưa gửi hình</span>
                            )}
                          </div>
                        </div>

                        {/* Cột 4: Trạng thái (2 cols) */}
                        <div className="col-span-2 flex justify-center">
                          {getResultBadge(saved ?? item)}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog.Root
        open={closeDialogOpen}
        onOpenChange={(open) => !attendance.isClosing && setCloseDialogOpen(open)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-xl">
            <Dialog.Title className="font-k2d text-lg font-semibold">
              Kết thúc sự kiện?
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Người đã hoàn tất điểm danh được ghi nhận và cộng quyền lợi. Người chưa hoàn tất, kể
              cả đang chờ xác nhận, sẽ bị tính vắng. Sau khi kết thúc không thể điểm danh thêm.
              {changedCount > 0 && ` ${changedCount} lựa chọn chưa lưu sẽ không được áp dụng.`}
            </Dialog.Description>
            <p className="text-sm text-foreground">
              {
                source.filter((row) => row.status === 'COMPLETED' || row.status === 'CONFIRMED')
                  .length
              }{' '}
              sinh viên được ghi nhận ·{' '}
              {
                source.filter(
                  (row) =>
                    !isAttendanceComplete(row.status) &&
                    !isAttendanceAbsent(row.status) &&
                    row.status !== 'CANCELLED'
                ).length
              }{' '}
              sinh viên sẽ bị tính vắng
            </p>
            {attendance.notice?.type === 'error' && (
              <p role="alert" className="text-sm text-destructive">
                {attendance.notice.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={attendance.isClosing}
                onClick={() => setCloseDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                disabled={attendance.isClosing}
                onClick={async () => {
                  if (await attendance.closeEvent()) setCloseDialogOpen(false)
                }}
                className="bg-[#C2412D] text-white hover:bg-[#A93625] focus-visible:ring-[#C2412D]/30"
              >
                {attendance.isClosing ? 'Đang kết thúc...' : 'Kết thúc sự kiện'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {onBehalfOpen && (
        <AttendanceOnBehalfDialog
          key={`${event.fanpageId}:${event.id}`}
          rows={source}
          busy={isSaving}
          readOnly={readOnly}
          error={attendance.notice?.type === 'error' ? attendance.notice.message : undefined}
          onSave={attendance.attendOnBehalf}
          onClose={() => setOnBehalfOpen(false)}
        />
      )}

      <AttendanceProofDialog
        item={reviewingItem}
        saved={isAttendanceComplete(source.find((row) => row.id === reviewingId)?.status ?? '')}
        isConfirming={isSaving}
        error={attendance.notice?.type === 'error' ? attendance.notice.message : undefined}
        disabled={
          isSaving ||
          readOnly ||
          !isAttendancePending(source.find((row) => row.id === reviewingId)?.status ?? '')
        }
        onConfirm={() => {
          if (reviewingId) void attendance.confirmOne(reviewingId)
        }}
        onClose={() => setReviewingId(null)}
      />
    </div>
  )
}
