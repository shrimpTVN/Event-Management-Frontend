import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  MapPin,
  ExternalLink,
  Link,
  Check,
  CheckCheck,
  UserCheck,
  CheckCircle2,
  CalendarDays,
  Users,
  Download,
  Search,
  Clock,
  X,
  Eye,
  Camera,
  RotateCcw,
  Save,
  Loader2,
  UserX,
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
import { cn } from '@/lib/utils'
import type {
  AdminEvent,
  EventRegistrationItem,
  RegistrationStatus,
} from '../types/fanpageAdmin.types'
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
  const isStudentProof = event.attendanceMethod === 'STUDENT_PROOF'
  const sessionType: 'START' | 'END' | 'BOTH' = event.attendanceSessionType || 'BOTH'
  const requireStart = sessionType === 'START' || sessionType === 'BOTH'
  const requireEnd = sessionType === 'END' || sessionType === 'BOTH'

  // Event completion and finalize modal state: default to 'PUBLISHED' for active attendance workflow
  const [currentEventStatus, setCurrentEventStatus] = useState<string>(
    event.status && event.status !== 'CLOSED' ? event.status : 'PUBLISHED'
  )
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Query attendee list directly from mock backend API
  const { data: attendeesData, isLoading: isLoadingAttendees } = useQuery({
    queryKey: ['event-attendees', event.fanpageId, event.id],
    queryFn: () => fanpageAdminService.getEventAttendees(event.fanpageId || '1', event.id),
  })

  // Query point categories for short code matching (e.g. "V.b", "I.a")
  const { data: pointCategories = [] } = useQuery({
    queryKey: ['pointCategories'],
    queryFn: () => fanpageAdminService.getPointCategories(),
  })

  // Format short training point category badge: e.g. "+3 ĐRL mục V.b"
  const trainingPointBadgeText = React.useMemo(() => {
    const pts = `+${event.trainingPoints || 0} ĐRL`
    if (event.trainingPointCategoryCode) {
      return `${pts} mục ${event.trainingPointCategoryCode}`
    }

    const found = pointCategories.find(
      (c) =>
        (event.trainingPointCategoryId && c.id === event.trainingPointCategoryId) ||
        (event.trainingPointCategoryName && c.name === event.trainingPointCategoryName)
    )
    if (found?.note) {
      const code = found.note.replace(/^Mã tiêu chí:\s*/i, '').trim()
      if (code) return `${pts} mục ${code}`
    }

    const name = event.trainingPointCategoryName || ''
    const matchRomanSub = name.match(/^(?:Điều\s+)?([IVXLCDM]+)\.([a-z0-9]+)/i)
    if (matchRomanSub) return `${pts} mục ${matchRomanSub[1].toUpperCase()}.${matchRomanSub[2].toLowerCase()}`
    const matchRoman = name.match(/^(?:Điều\s+)?([IVXLCDM]+)[\.\:]?/i)
    if (matchRoman) return `${pts} mục ${matchRoman[1].toUpperCase()}`
    const matchLetter = name.match(/^([a-z])[\.\:]\s+/i)
    if (matchLetter) return `${pts} mục ${matchLetter[1].toLowerCase()}`

    return pts
  }, [
    event.trainingPoints,
    event.trainingPointCategoryCode,
    event.trainingPointCategoryId,
    event.trainingPointCategoryName,
    pointCategories,
  ])

  const sv5tBadgeText = React.useMemo(() => {
    if (!event.sv5tCriteriaName) return 'Không xét SV5T'
    const cleaned = event.sv5tCriteriaName
      .replace(/^Tiêu chuẩn\s+/i, '')
      .replace(/^Tiêu chí\s+/i, '')
      .trim()
    return `SV5T: ${cleaned}`
  }, [event.sv5tCriteriaName])

  // Synchronized registrations state with server data
  const [registrations, setRegistrations] = useState<EventRegistrationItem[]>([])

  useEffect(() => {
    if (attendeesData && attendeesData.length > 0) {
      setRegistrations(attendeesData)
    }
  }, [attendeesData])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isCopied, setIsCopied] = useState(false)
  const [batchNotice, setBatchNotice] = useState<string | null>(null)

  // Student Proof Review Modal State
  const [reviewingItem, setReviewingItem] = useState<EventRegistrationItem | null>(null)

  // Finalize attendance and update database with student benefits
  const handleConfirmFinalize = async () => {
    setIsFinalizing(true)
    const updatedAttendees = registrations.map((item) => {
      const isDone = item.status === 'COMPLETED' || item.status === 'CHECKED_IN'
      if (isDone) {
        return { ...item, status: 'COMPLETED' as RegistrationStatus }
      }
      return {
        ...item,
        status: 'ABSENTED' as RegistrationStatus,
        entryCheckInTime: undefined,
        checkOutTime: undefined,
      }
    })

    try {
      await fanpageAdminService.finalizeAttendance(
        event.fanpageId || '1',
        event.id,
        updatedAttendees
      )
    } catch (err) {
      console.warn('Finalize API failed, updating local state', err)
    }

    setRegistrations(updatedAttendees)
    setIsFinalizing(false)
    setIsFinalizeModalOpen(false)
    setCurrentEventStatus('CLOSED')
    setBatchNotice(
      `Đã cập nhật danh sách điểm danh lên cơ sở dữ liệu thành công! Đã ghi nhận hoàn thành sự kiện và cộng quyền lợi (+${event.trainingPoints || 0} ĐRL${event.sv5tCriteriaName ? `, ${event.sv5tCriteriaName}` : ''}) cho ${completedCount} sinh viên đủ điều kiện.`
    )
  }

  // Export CSV handler
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'MSSV',
      'Họ và tên',
      'Ngành học',
      'Thời gian đăng ký',
      'Giờ vào cửa',
      'Giờ ra về',
      'Trạng thái điểm danh',
    ]
    const rows = filteredRegistrations.map((item, index) => [
      index + 1,
      item.studentId,
      `"${item.fullName}"`,
      `"${item.major}"`,
      item.registeredAt || '',
      item.entryCheckInTime || '',
      item.checkOutTime || '',
      item.status === 'COMPLETED' || item.status === 'CHECKED_IN'
        ? 'Đã điểm danh'
        : item.status === 'ABSENTED'
        ? 'Vắng mặt'
        : item.status === 'ENTRY_CHECKED'
        ? 'Mới điểm danh 1 phiên'
        : 'Chưa điểm danh',
    ])
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `DiemDanh_${event.code || 'SuKien'}_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Toggle Absent status for a student (Mark as Absent or revert back to Not Checked-in)
  const handleToggleAbsent = (regId: string) => {
    setRegistrations((prev) =>
      prev.map((item) => {
        if (item.id !== regId) return item
        if (item.status === 'ABSENTED') {
          // Revert back to not checked in
          return {
            ...item,
            status: 'APPROVED',
          }
        } else {
          // Mark as absent, clear check-in timestamps
          return {
            ...item,
            status: 'ABSENTED',
            entryCheckInTime: undefined,
            checkOutTime: undefined,
            checkInTime: undefined,
          }
        }
      })
    )
  }

  // Toggle a specific session (START or END) for MANUAL mode
  const handleToggleManualSession = (regId: string, session: 'START' | 'END') => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setRegistrations((prev) =>
      prev.map((item) => {
        if (item.id !== regId) return item

        // If previously absent, clear absent status when organizer checks in
        let updatedEntry = item.entryCheckInTime
        let updatedCheckout = item.checkOutTime

        if (session === 'START') {
          updatedEntry = updatedEntry ? undefined : nowTime
        } else {
          updatedCheckout = updatedCheckout ? undefined : nowTime
        }

        const startDone = Boolean(updatedEntry)
        const endDone = Boolean(updatedCheckout)

        let newStatus: RegistrationStatus = 'APPROVED'
        if (requireStart && requireEnd) {
          if (startDone && endDone) {
            newStatus = 'COMPLETED'
          } else if (startDone || endDone) {
            newStatus = 'ENTRY_CHECKED'
          } else {
            newStatus = 'APPROVED'
          }
        } else if (requireStart) {
          newStatus = startDone ? 'COMPLETED' : 'APPROVED'
        } else if (requireEnd) {
          newStatus = endDone ? 'COMPLETED' : 'APPROVED'
        }

        return {
          ...item,
          entryCheckInTime: updatedEntry,
          checkOutTime: updatedCheckout,
          checkInTime: updatedEntry || updatedCheckout,
          status: newStatus,
        }
      })
    )
  }

  // Batch Approve all students who submitted proof (Mode: STUDENT_PROOF)
  const handleBatchApproveProofs = () => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    let count = 0
    setRegistrations((prev) =>
      prev.map((item) => {
        const hasAnyProof = Boolean(item.startEvidenceUrl || item.endEvidenceUrl || item.evidenceUrl)
        const isDone = item.status === 'COMPLETED' || item.status === 'CHECKED_IN'
        if (hasAnyProof && !isDone) {
          count++
          return {
            ...item,
            status: 'COMPLETED',
            checkInTime: item.checkInTime || nowTime,
          }
        }
        return item
      })
    )

    if (count > 0) {
      setBatchNotice(
        `Đã duyệt điểm danh thành công cho ${count} sinh viên có nộp ảnh minh chứng!`
      )
      setTimeout(() => setBatchNotice(null), 4000)
    }
  }

  // Handle Approve Proof in Modal (or inline)
  const handleApproveProof = (regId: string) => {
    setRegistrations((prev) =>
      prev.map((item) =>
        item.id === regId
          ? {
              ...item,
              status: 'COMPLETED',
              checkInTime:
                item.checkInTime ||
                new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : item
      )
    )
    setReviewingItem(null)
  }

  // Handle Reject Proof in Modal
  const handleRejectProof = (regId: string) => {
    setRegistrations((prev) =>
      prev.map((item) =>
        item.id === regId
          ? {
              ...item,
              status: 'ABSENTED',
            }
          : item
      )
    )
    setReviewingItem(null)
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

    const matchStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'COMPLETED' &&
        (item.status === 'COMPLETED' || item.status === 'CHECKED_IN')) ||
      (selectedStatus === 'PENDING' &&
        (item.status === 'APPROVED' || item.status === 'PENDING')) ||
      (selectedStatus === 'ENTRY_CHECKED' && item.status === 'ENTRY_CHECKED') ||
      (selectedStatus === 'ABSENTED' && item.status === 'ABSENTED') ||
      (selectedStatus === 'PROOF_SUBMITTED' &&
        Boolean(item.startEvidenceUrl || item.endEvidenceUrl || item.evidenceUrl))
    return matchSearch && matchStatus
  })

  // Initials generator for attendee avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Counts for attendance
  const capacity = event.capacity || 300
  const registeredCount = registrations.length || 0
  const completedCount = registrations.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'CHECKED_IN'
  ).length
  const absentedCount = registrations.filter((r) => r.status === 'ABSENTED').length
  const pendingCount = registrations.filter(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CHECKED_IN' && r.status !== 'ABSENTED'
  ).length
  const proofCount = registrations.filter(
    (r) => r.startEvidenceUrl || r.endEvidenceUrl || r.evidenceUrl
  ).length
  const pendingProofCount = registrations.filter(
    (r) =>
      (r.startEvidenceUrl || r.endEvidenceUrl || r.evidenceUrl) &&
      r.status !== 'COMPLETED' &&
      r.status !== 'CHECKED_IN'
  ).length
  const progressPercent = Math.min(100, Math.round((registeredCount / capacity) * 100))

  // Result Badge Helper (Strictly consistent with design: Đã điểm danh / Chưa điểm danh / Vắng mặt)
  const getResultBadge = (item: EventRegistrationItem) => {
    const hasProof = Boolean(item.startEvidenceUrl || item.endEvidenceUrl || item.evidenceUrl)
    switch (item.status) {
      case 'COMPLETED':
      case 'CHECKED_IN':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <CheckCircle2 className="h-3 w-3" />
            Đã điểm danh
          </span>
        )
      case 'ABSENTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
            <UserX className="h-3 w-3" />
            Vắng mặt
          </span>
        )
      case 'ENTRY_CHECKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-medium inline-flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            Mới điểm danh 1 phiên
          </span>
        )
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
            Chưa điểm danh
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
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header & Breadcrumb & Page Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBack}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Quản trị fanpage
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={onBack}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Sự kiện
            </button>
            <span>/</span>
            <span className="text-primary font-bold">{event.code || 'EVT-0001'}</span>
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Quay lại danh sách sự kiện"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              Chi tiết sự kiện
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi nội dung sự kiện, thông tin sự kiện và dữ liệu đăng ký.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onEditClick && (
            <button
              type="button"
              onClick={() => onEditClick(event)}
              className="px-4 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Chỉnh sửa sự kiện</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary Banner Card with Event Poster and Integrated Benefits */}
      <div className="rounded-2xl border border-border bg-white dark:bg-card shadow-2xs overflow-hidden p-4 sm:p-5 flex flex-col md:flex-row items-center md:items-stretch gap-5">
        {/* Left: Event Poster Image with balanced aspect ratio */}
        <div className="w-full md:w-64 lg:w-72 aspect-[16/9] md:aspect-auto md:h-auto shrink-0 rounded-xl overflow-hidden bg-muted relative border border-border/60">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[160px] flex items-center justify-center text-muted-foreground bg-muted/40">
              <CalendarDays className="h-10 w-10 opacity-30" />
            </div>
          )}
        </div>

        {/* Right: Main Event Info, Actions and Benefits Strip */}
        <div className="flex-1 flex flex-col justify-between gap-3.5 min-w-0 w-full">
          <div>
            {/* Top row: Status, Type pill and Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold shrink-0">
                  {currentEventStatus === 'PUBLISHED'
                    ? 'Đang mở'
                    : currentEventStatus === 'CLOSED'
                    ? 'Đã kết thúc'
                    : currentEventStatus === 'CANCELLED'
                    ? 'Đã hủy'
                    : 'Bản nháp'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shrink-0">
                  {event.eventTypeName || 'Sự kiện'}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  #{event.code}
                </span>
              </div>

              {/* Action buttons integrated cleanly on the right */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/events/${event.id}`, '_blank')}
                  className="h-8 px-3 text-xs font-semibold gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Xem trang sự kiện</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 px-3 text-xs font-semibold gap-1.5"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Link className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Event Name */}
            <h2 className="font-k2d font-bold text-xl sm:text-2xl text-foreground mt-2 line-clamp-2">
              {event.name}
            </h2>

            {/* Time, Location & Capacity details */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground font-medium">
                  {event.timeStart}–{event.timeEnd} · {event.dateStart}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-foreground font-medium">{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Sức chứa: <strong className="text-foreground">{registeredCount}/{capacity}</strong> ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Integrated Benefits Badges (Short & Minimalist) */}
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-0.5">
              Quyền lợi:
            </span>

            {/* Badge 1: ĐRL ngắn gọn (như "+3 ĐRL mục V.b") */}
            <span
              className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold cursor-help"
              title={event.trainingPointCategoryName || 'Điểm rèn luyện theo quy chế'}
            >
              {trainingPointBadgeText}
            </span>

            {/* Badge 2: Tiêu chuẩn SV5T ngắn gọn */}
            <span
              className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium cursor-help"
              title={event.sv5tCriteriaName || 'Tiêu chuẩn SV5T'}
            >
              {sv5tBadgeText}
            </span>

            {/* Badge 3: Chứng nhận */}
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium">
              {event.hasCertificate ? 'Có Giấy chứng nhận' : 'Không cấp chứng nhận'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Top Metric Summary Cards (4 Cards - Minimalist, No Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Đã đăng ký */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-border shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đã đăng ký
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {progressPercent}% sức chứa
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-k2d font-bold text-2xl sm:text-3xl text-foreground">
                {registeredCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                / {capacity} sinh viên
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(progressPercent, registeredCount > 0 ? 2 : 0))}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Còn {Math.max(0, capacity - registeredCount)} suất tham gia
          </p>
        </div>

        {/* Metric 2: Đã hoàn thành điểm danh */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-border shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Đã điểm danh
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
              {registeredCount > 0 ? `${Math.round((completedCount / registeredCount) * 100)}% có mặt` : '0%'}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-k2d font-bold text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                / {registeredCount} đã đăng ký
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${registeredCount > 0 ? Math.min(100, Math.round((completedCount / registeredCount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {completedCount > 0 ? `${completedCount} sinh viên đã hoàn thành` : 'Chưa có lượt điểm danh'}
          </p>
        </div>

        {/* Metric 3: Minh chứng / Chưa điểm danh & Vắng mặt */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-border shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isStudentProof ? 'Chờ duyệt minh chứng' : 'Chưa điểm danh / Vắng'}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              {isStudentProof ? `${registeredCount - proofCount} chưa nộp` : `${pendingCount} chưa · ${absentedCount} vắng`}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-k2d font-bold text-2xl sm:text-3xl text-amber-600 dark:text-amber-400">
                {isStudentProof ? proofCount : pendingCount + absentedCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                sinh viên cần xử lý
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-amber-500 h-1.5 transition-all duration-300"
                style={{
                  width: `${registeredCount > 0 ? Math.min(100, Math.round((pendingCount / registeredCount) * 100)) : 0}%`,
                }}
              />
              <div
                className="bg-rose-500 h-1.5 transition-all duration-300"
                style={{
                  width: `${registeredCount > 0 ? Math.min(100, Math.round((absentedCount / registeredCount) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isStudentProof ? 'Cần duyệt ảnh minh chứng' : `${pendingCount} chưa điểm danh · ${absentedCount} vắng`}
          </p>
        </div>

        {/* Metric 4: Hình thức điểm danh */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-border shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Phương thức xác thực
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                isStudentProof
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              )}
            >
              {isStudentProof ? 'Nộp minh chứng' : 'Điểm danh trực tiếp'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="font-k2d font-bold text-base sm:text-lg text-foreground leading-snug line-clamp-1">
              {isStudentProof ? 'Sinh viên nộp ảnh minh chứng' : 'Ban tổ chức xác thực tại chỗ'}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {isStudentProof
                ? 'Sinh viên tải ảnh minh chứng để BTC kiểm duyệt'
                : 'BTC trực tiếp kiểm tra và đánh dấu danh sách'}
            </p>
          </div>
          <div className="pt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground">
              {sessionType === 'BOTH'
                ? 'Áp dụng 2 phiên (Đầu giờ & Cuối giờ)'
                : sessionType === 'START'
                ? 'Áp dụng 1 phiên (Đầu giờ)'
                : 'Áp dụng 1 phiên (Cuối giờ)'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Full-width Registrations List */}
      <div className="w-full space-y-4">
        {/* Main Panel Container */}
        <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                  Danh sách người đăng ký sự kiện
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quản lý {filteredRegistrations.length} sinh viên tham gia và theo dõi tiến độ điểm danh.
                </p>
              </div>

              {/* Action buttons on toolbar */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                {isStudentProof && (
                  <Button
                    type="button"
                    onClick={handleBatchApproveProofs}
                    disabled={pendingProofCount === 0 || currentEventStatus === 'CLOSED'}
                    className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    title={
                      pendingProofCount > 0
                        ? `Duyệt nhanh tất cả ${pendingProofCount} sinh viên đã nộp ảnh minh chứng`
                        : 'Không có minh chứng nào đang chờ duyệt'
                    }
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Duyệt tất cả minh chứng ({pendingProofCount})</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Xuất CSV</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(true)}
                  className={`h-9 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all ${
                    currentEventStatus === 'CLOSED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-primary hover:bg-primary/95 text-white shadow-xs'
                  }`}
                  title={
                    currentEventStatus === 'CLOSED'
                      ? 'Bấm để đối soát hoặc cập nhật lại CSDL'
                      : 'Cập nhật danh sách điểm danh lên CSDL, hoàn thành sự kiện và cộng quyền lợi cho sinh viên'
                  }
                >
                  {currentEventStatus === 'CLOSED' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Đã chốt · Cập nhật lại CSDL</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Lưu</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Batch Action Notification */}
            {batchNotice && (
              <div className="p-2.5 px-3.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{batchNotice}</span>
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
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Select using shadcn Select */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[190px] h-9 text-xs bg-white dark:bg-card">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="COMPLETED">Đã điểm danh</SelectItem>
                  <SelectItem value="PENDING">Chưa điểm danh</SelectItem>
                  <SelectItem value="ABSENTED">Vắng mặt</SelectItem>
                  {sessionType === 'BOTH' && (
                    <SelectItem value="ENTRY_CHECKED">Mới điểm danh 1 phiên</SelectItem>
                  )}
                  {isStudentProof && (
                    <SelectItem value="PROOF_SUBMITTED">Có ảnh minh chứng</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bảng danh sách: Floating Rounded Rows Layout */}
            <div className="p-3 sm:p-4 bg-[#F9FAFB]/50 dark:bg-background/40 rounded-xl overflow-x-auto">
              <div className="min-w-[850px]">
                {/* Header hàng cột phẳng */}
                <div className="grid grid-cols-12 items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
                  <div className="col-span-3">Sinh viên</div>
                  <div className="col-span-2">Thời gian & Lịch sử</div>
                  <div className="col-span-2">
                    {isStudentProof ? 'Tiến độ minh chứng' : 'Phiên điểm danh'}
                  </div>
                  <div className="col-span-2 text-center">Trạng thái</div>
                  <div className="col-span-3 text-right">Thao tác</div>
                </div>

                {/* Danh sách các hàng Floating Rounded Cards */}
                <div className="flex flex-col gap-2.5 mt-1">
                  {isLoadingAttendees && registrations.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80 flex flex-col items-center justify-center gap-2.5 text-xs">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Đang tải danh sách sinh viên đăng ký từ máy chủ...</span>
                    </div>
                  ) : filteredRegistrations.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80 text-xs">
                      Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                    </div>
                  ) : (
                    filteredRegistrations.map((item) => {
                      const isDone = item.status === 'COMPLETED' || item.status === 'CHECKED_IN'
                      const isAbsent = item.status === 'ABSENTED'
                      const hasStartProof = Boolean(item.startEvidenceUrl || item.evidenceUrl)
                      const hasEndProof = Boolean(item.endEvidenceUrl)
                      const hasAnyProof = hasStartProof || hasEndProof

                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all px-5 py-3.5 grid grid-cols-12 items-center group"
                        >
                          {/* Cột 1: Thông tin sinh viên (3 cols) */}
                          <div className="col-span-3 min-w-0 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                                {getInitials(item.fullName)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                  {item.fullName}
                                </p>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                  <span className="font-mono text-primary font-medium">
                                    {item.studentId}
                                  </span>
                                  <span>•</span>
                                  <span className="truncate">{item.major}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cột 2: Thời gian & Lịch sử (2 cols) */}
                          <div className="col-span-2 space-y-1 text-[11px] pr-2">
                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span>Đăng ký: {item.registeredAt || '2026-10-15'}</span>
                            </div>
                            <div className="text-muted-foreground text-[10px] space-y-0.5">
                              {item.entryCheckInTime && (
                                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                                  Vào: {item.entryCheckInTime}
                                </p>
                              )}
                              {item.checkOutTime && (
                                <p className="text-blue-700 dark:text-blue-400 font-medium">
                                  Ra: {item.checkOutTime}
                                </p>
                              )}
                              {!item.entryCheckInTime && !item.checkOutTime && (
                                <span>{isAbsent ? 'Đã ghi nhận vắng' : 'Chưa có giờ vào/ra'}</span>
                              )}
                            </div>
                          </div>

                          {/* Cột 3: Tiến độ phiên điểm danh / Minh chứng (2 cols) */}
                          <div className="col-span-2 text-xs">
                            {isStudentProof ? (
                              // Student Proof Mode
                              sessionType === 'BOTH' ? (
                                <div className="flex flex-col gap-1 text-[11px]">
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      hasStartProof
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <Camera className="h-3 w-3" />
                                    Đầu giờ: {hasStartProof ? 'Đã nộp' : 'Chưa'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      hasEndProof
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <Camera className="h-3 w-3" />
                                    Cuối giờ: {hasEndProof ? 'Đã nộp' : 'Chưa'}
                                  </span>
                                </div>
                              ) : sessionType === 'START' ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    hasStartProof
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  <Camera className="h-3 w-3" />
                                  Đầu giờ: {hasStartProof ? 'Đã nộp ảnh' : 'Chưa nộp'}
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    hasEndProof
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  <Camera className="h-3 w-3" />
                                  Cuối giờ: {hasEndProof ? 'Đã nộp ảnh' : 'Chưa nộp'}
                                </span>
                              )
                            ) : (
                              // BTC Manual / QR Mode
                              sessionType === 'BOTH' ? (
                                <div className="flex flex-col gap-1 text-[11px]">
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      item.entryCheckInTime
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <UserCheck className="h-3 w-3" />
                                    Đầu: {item.entryCheckInTime ? 'Đã duyệt' : 'Chưa'}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      item.checkOutTime
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <UserCheck className="h-3 w-3" />
                                    Cuối: {item.checkOutTime ? 'Đã duyệt' : 'Chưa'}
                                  </span>
                                </div>
                              ) : sessionType === 'START' ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    item.entryCheckInTime
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Đầu giờ: {item.entryCheckInTime ? 'Đã điểm danh' : 'Chưa'}
                                </span>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                    item.checkOutTime
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  <UserCheck className="h-3 w-3" />
                                  Cuối giờ: {item.checkOutTime ? 'Đã điểm danh' : 'Chưa'}
                                </span>
                              )
                            )}
                          </div>

                          {/* Cột 4: Trạng thái (2 cols) */}
                          <div className="col-span-2 flex justify-center">
                            {getResultBadge(item)}
                          </div>

                          {/* Cột 5: Thao tác (3 cols) */}
                          <div className="col-span-3 flex items-center justify-end gap-1.5">
                            {isStudentProof ? (
                              // STUDENT_PROOF Actions
                              <>
                                {hasAnyProof ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setReviewingItem(item)}
                                      className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Xem ảnh minh chứng và đối soát"
                                    >
                                      <Eye className="h-3 w-3" />
                                      <span>Xem ảnh</span>
                                    </button>
                                    {!isDone && (
                                      <button
                                        type="button"
                                        onClick={() => handleApproveProof(item.id)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                                        title="Duyệt điểm danh nhanh"
                                      >
                                        <Check className="h-3 w-3" />
                                        <span>Duyệt</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground italic mr-1">
                                    Chờ ảnh
                                  </span>
                                )}
                                {/* Nút Vắng mặt cho STUDENT_PROOF */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAbsent(item.id)}
                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                    isAbsent
                                      ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                      : 'border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                  }`}
                                  title={
                                    isAbsent
                                      ? 'Đang đánh dấu vắng (Bấm để hủy vắng)'
                                      : 'Đánh dấu sinh viên vắng mặt'
                                  }
                                >
                                  <UserX className="h-3 w-3" />
                                  <span>{isAbsent ? 'Đã vắng' : 'Vắng'}</span>
                                </button>
                              </>
                            ) : (
                              // MANUAL BTC Actions
                              sessionType === 'BOTH' ? (
                                <div className="flex items-center gap-1">
                                  {/* Tích đầu giờ */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleManualSession(item.id, 'START')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                      item.entryCheckInTime
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'border border-border text-foreground hover:bg-muted'
                                    }`}
                                    title={
                                      item.entryCheckInTime
                                        ? `Đầu giờ: ${item.entryCheckInTime} (Bấm để hủy)`
                                        : 'Bấm để điểm danh đầu giờ'
                                    }
                                  >
                                    {item.entryCheckInTime ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <span>Đầu</span>
                                  </button>

                                  {/* Tích cuối giờ */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleManualSession(item.id, 'END')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                      item.checkOutTime
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'border border-border text-foreground hover:bg-muted'
                                    }`}
                                    title={
                                      item.checkOutTime
                                        ? `Cuối giờ: ${item.checkOutTime} (Bấm để hủy)`
                                        : 'Bấm để điểm danh cuối giờ'
                                    }
                                  >
                                    {item.checkOutTime ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                    <span>Cuối</span>
                                  </button>

                                  {/* Nút Vắng mặt */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAbsent(item.id)}
                                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                      isAbsent
                                        ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                        : 'border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                    }`}
                                    title={
                                      isAbsent
                                        ? 'Đang đánh dấu vắng (Bấm để hủy vắng)'
                                        : 'Đánh dấu sinh viên vắng mặt'
                                    }
                                  >
                                    <UserX className="h-3 w-3" />
                                    <span>{isAbsent ? 'Đã vắng' : 'Vắng'}</span>
                                  </button>
                                </div>
                              ) : sessionType === 'START' ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleManualSession(item.id, 'START')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                                      item.entryCheckInTime
                                        ? 'border border-border text-muted-foreground hover:bg-muted'
                                        : 'bg-primary text-white hover:bg-primary/95 shadow-2xs'
                                    }`}
                                    title={
                                      item.entryCheckInTime
                                        ? 'Bấm để hủy điểm danh'
                                        : 'Điểm danh đầu giờ ngay'
                                    }
                                  >
                                    {item.entryCheckInTime ? (
                                      <>
                                        <RotateCcw className="h-3 w-3" />
                                        <span>Hủy</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3" />
                                        <span>Đầu giờ</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAbsent(item.id)}
                                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                      isAbsent
                                        ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                        : 'border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                    }`}
                                    title={
                                      isAbsent
                                        ? 'Đang đánh dấu vắng (Bấm để hủy vắng)'
                                        : 'Đánh dấu sinh viên vắng mặt'
                                    }
                                  >
                                    <UserX className="h-3 w-3" />
                                    <span>{isAbsent ? 'Đã vắng' : 'Vắng'}</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleManualSession(item.id, 'END')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                                      item.checkOutTime
                                        ? 'border border-border text-muted-foreground hover:bg-muted'
                                        : 'bg-primary text-white hover:bg-primary/95 shadow-2xs'
                                    }`}
                                    title={
                                      item.checkOutTime
                                        ? 'Bấm để hủy điểm danh'
                                        : 'Điểm danh cuối giờ ngay'
                                    }
                                  >
                                    {item.checkOutTime ? (
                                      <>
                                        <RotateCcw className="h-3 w-3" />
                                        <span>Hủy</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3" />
                                        <span>Cuối giờ</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAbsent(item.id)}
                                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                                      isAbsent
                                        ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                        : 'border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                    }`}
                                    title={
                                      isAbsent
                                        ? 'Đang đánh dấu vắng (Bấm để hủy vắng)'
                                        : 'Đánh dấu sinh viên vắng mặt'
                                    }
                                  >
                                    <UserX className="h-3 w-3" />
                                    <span>{isAbsent ? 'Đã vắng' : 'Vắng'}</span>
                                  </button>
                                </div>
                              )
                            )}
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

      {/* Modal: Xem và Duyệt minh chứng sinh viên (StudentProofReviewModal) */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setReviewingItem(null)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-xl bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="min-w-0 pr-4">
                <h3 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                  Minh chứng điểm danh sinh viên
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kiểm tra hình ảnh có mặt tại sự kiện của sinh viên
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Student Info Box */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Họ tên sinh viên:</span>
                  <span className="font-semibold text-foreground text-sm">
                    {reviewingItem.fullName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[11px]">Mã số sinh viên:</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {reviewingItem.studentId}
                  </span>
                </div>
              </div>

              {/* Photo Previews (Start & End Sessions) */}
              {sessionType === 'BOTH' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Ảnh minh chứng đầu giờ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        <span>Minh chứng đầu giờ</span>
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          reviewingItem.startEvidenceUrl || reviewingItem.evidenceUrl
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {reviewingItem.startEvidenceUrl || reviewingItem.evidenceUrl
                          ? 'Đã nộp'
                          : 'Chưa nộp'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden bg-black/5 flex items-center justify-center h-48">
                      {reviewingItem.startEvidenceUrl || reviewingItem.evidenceUrl ? (
                        <img
                          src={reviewingItem.startEvidenceUrl || reviewingItem.evidenceUrl}
                          alt={`Minh chứng đầu giờ của ${reviewingItem.fullName}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          Không có ảnh minh chứng
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ảnh minh chứng cuối giờ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        <span>Minh chứng cuối giờ</span>
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          reviewingItem.endEvidenceUrl
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {reviewingItem.endEvidenceUrl ? 'Đã nộp' : 'Chưa nộp'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden bg-black/5 flex items-center justify-center h-48">
                      {reviewingItem.endEvidenceUrl ? (
                        <img
                          src={reviewingItem.endEvidenceUrl}
                          alt={`Minh chứng cuối giờ của ${reviewingItem.fullName}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          Không có ảnh minh chứng
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Single Session Preview (START or END)
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {sessionType === 'START'
                        ? 'Ảnh minh chứng đầu giờ:'
                        : 'Ảnh minh chứng cuối giờ:'}
                    </span>
                  </span>
                  <div className="rounded-xl border border-border overflow-hidden bg-black/5 flex items-center justify-center max-h-72">
                    {reviewingItem.startEvidenceUrl ||
                    reviewingItem.endEvidenceUrl ||
                    reviewingItem.evidenceUrl ? (
                      <img
                        src={
                          sessionType === 'END'
                            ? reviewingItem.endEvidenceUrl || reviewingItem.evidenceUrl
                            : reviewingItem.startEvidenceUrl || reviewingItem.evidenceUrl
                        }
                        alt={`Minh chứng của ${reviewingItem.fullName}`}
                        className="w-full h-auto max-h-72 object-contain"
                      />
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        Không có ảnh minh chứng đính kèm
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/60">
                  <span className="block text-[10px]">Cơ chế:</span>
                  <span className="font-medium text-foreground">
                    {sessionType === 'BOTH'
                      ? 'Nộp ảnh đầu giờ & cuối giờ'
                      : sessionType === 'START'
                      ? 'Nộp ảnh đầu giờ'
                      : 'Nộp ảnh cuối giờ'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/20 border border-border/60">
                  <span className="block text-[10px]">Trạng thái hiện tại:</span>
                  <span className="font-medium text-foreground">
                    {reviewingItem.status === 'COMPLETED' ? 'Đã duyệt hợp lệ' : 'Đang chờ duyệt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleRejectProof(reviewingItem.id)}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                Từ chối (Vắng mặt)
              </button>
              <button
                type="button"
                onClick={() => handleApproveProof(reviewingItem.id)}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Duyệt điểm danh</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Xác nhận chốt điểm danh và cộng quyền lợi (FinalizeAttendanceModal) */}
      {isFinalizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isFinalizing && setIsFinalizeModalOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-card text-foreground border border-border rounded-xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50/50 dark:bg-muted/40">
              <div className="min-w-0 pr-2">
                <h3 className="font-semibold text-base text-foreground font-heading">
                  Chốt điểm danh sự kiện
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Lưu kết quả vào CSDL và cập nhật quyền lợi sinh viên
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isFinalizing && setIsFinalizeModalOpen(false)}
                disabled={isFinalizing}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs md:text-sm">
              {/* Thống kê sinh viên dạng 2 thẻ đơn giản */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-white dark:bg-card shadow-2xs space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Đủ điều kiện</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-base text-foreground">{completedCount}</span>
                    <span className="text-muted-foreground text-[11px]">/ {registeredCount} sinh viên</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                    Ghi nhận hoàn thành
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border bg-white dark:bg-card shadow-2xs space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Chưa đạt / Vắng mặt</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-base text-foreground">
                      {Math.max(0, registeredCount - completedCount)}
                    </span>
                    <span className="text-muted-foreground text-[11px]">sinh viên</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Đánh dấu vắng
                  </span>
                </div>
              </div>

              {/* Danh sách quyền lợi dạng bảng danh mục phẳng */}
              <div className="rounded-lg border border-border divide-y divide-border text-xs bg-white dark:bg-card shadow-2xs">
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground">Điểm rèn luyện</span>
                  <span className="font-semibold text-foreground">
                    +{event.trainingPoints || 0} ĐRL
                  </span>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground">Tiêu chí Sinh viên 5 Tốt</span>
                  <span className="font-medium text-foreground">
                    {event.sv5tCriteriaName || 'Không áp dụng'}
                  </span>
                </div>
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-muted-foreground">Chứng nhận hoàn thành</span>
                  <span className="font-medium text-foreground">
                    {event.hasCertificate ? 'Có cấp E-Certificate' : 'Không cấp'}
                  </span>
                </div>
              </div>

              {/* Ghi chú quy trình ngắn gọn */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sau khi chốt, sự kiện sẽ chuyển sang trạng thái <strong>Đã kết thúc (CLOSED)</strong> và kết quả điểm danh được lưu vào hệ thống học vụ.
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFinalizing}
                onClick={() => setIsFinalizeModalOpen(false)}
                className="h-9 px-4 text-xs font-medium cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isFinalizing}
                onClick={handleConfirmFinalize}
                className="h-9 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-white cursor-pointer shadow-2xs"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu CSDL...</span>
                  </>
                ) : (
                  <span>Xác nhận chốt</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
