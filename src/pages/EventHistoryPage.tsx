import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  HistoryStatsCards,
  HistoryTabBar,
  HistorySearchBar,
  RegisteredEventCard,
  RegisteredEventTable,
  ProofModal,
  AbsenceModal,
  CancelConfirmModal,
  StudentAttendanceModal,
  historyService,
  normalizeHistoryStatus,
  calculateRealHistoryStats,
  getEventTerm,
  type RegisteredEventItem,
  type HistoryStatus,
  type HistoryStats,
  type AbsenceFormData,
} from '@/features/registration-history'
import { StudentLeftSidebar } from '@/features/events'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarDays, CheckCircle, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export const EventHistoryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState<HistoryStatus>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('2026 - 2027')
  const [selectedSemester, setSelectedSemester] = useState('1')
  const [appliedYear, setAppliedYear] = useState('2026 - 2027')
  const [appliedSemester, setAppliedSemester] = useState('1')

  // View mode switcher: 'TABLE' (Mặc định dạng bảng tinh gọn) | 'GRID' (Dạng lưới thẻ)
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>(() => {
    try {
      const saved = localStorage.getItem('ctu_history_view_mode')
      if (saved === 'GRID' || saved === 'TABLE') return saved
    } catch {
      // Ignore
    }
    return 'TABLE'
  })

  const handleViewModeChange = (mode: 'GRID' | 'TABLE') => {
    setViewMode(mode)
    try {
      localStorage.setItem('ctu_history_view_mode', mode)
    } catch {
      // Ignore
    }
  }

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['registrations', 'history'],
    queryFn: () => historyService.getMyHistory(),
  })

  // Modals state
  const [proofModalEvent, setProofModalEvent] = useState<RegisteredEventItem | null>(null)
  const [absenceModalEvent, setAbsenceModalEvent] = useState<RegisteredEventItem | null>(null)
  const [cancelModalEvent, setCancelModalEvent] = useState<RegisteredEventItem | null>(null)
  const [attendanceModalEvent, setAttendanceModalEvent] = useState<RegisteredEventItem | null>(null)

  // Feedback notification toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'info'
    message: string
  } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Calculate dynamic stats merged with real trend indicators calculated from actual data
  const stats: HistoryStats = useMemo(() => {
    return calculateRealHistoryStats(events, appliedYear, appliedSemester)
  }, [events, appliedYear, appliedSemester])

  // Filter events by applied academic year and semester if dates are available
  const termFilteredList = useMemo(() => {
    const list = Array.isArray(events) ? events : []
    if (list.length === 0) return []

    const listWithTerms = list.map((e) => ({ event: e, term: getEventTerm(e) }))
    const matched = listWithTerms
      .filter((item) => item.term && item.term.year === appliedYear && item.term.semester === appliedSemester)
      .map((item) => item.event)

    if (listWithTerms.some((item) => item.term !== null)) {
      return matched
    }
    return list
  }, [events, appliedYear, appliedSemester])

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: termFilteredList.length,
      upcoming: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'UPCOMING').length,
      completed: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'COMPLETED').length,
      absent: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'ABSENT').length,
      cancelled: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'CANCELLED').length,
    }
  }, [termFilteredList])

  // Filtered event list
  const filteredEvents = useMemo(() => {
    return termFilteredList.filter((evt) => {
      // Filter by status tab
      if (activeStatus !== 'ALL') {
        const itemStatus = normalizeHistoryStatus(evt.status)
        if (itemStatus !== activeStatus) {
          return false
        }
      }

      // Filter by search query with safe property access
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const title = (evt.title || evt.eventName || '').toLowerCase()
        const organizer = (evt.organizer?.name || 'Ban Tổ Chức').toLowerCase()
        const location = (evt.location || '').toLowerCase()
        if (!title.includes(query) && !organizer.includes(query) && !location.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [termFilteredList, activeStatus, searchTerm])

  // Handlers for modal actions
  const handleAbsenceSubmit = (_data: AbsenceFormData) => {
    showToast(
      'Đơn xin vắng của bạn đã được gửi thành công đến Ban tổ chức! Vui lòng chờ phản hồi trong vòng 24h.'
    )
  }

  const handleCancelConfirm = async (event: RegisteredEventItem) => {
    const targetId = event.id || String(event.eventId)
    const eventId = event.eventId || event.id
    const title = event.title || event.eventName || 'Sự kiện'

    try {
      await historyService.cancelRegistration(eventId)
      queryClient.setQueryData(['registrations', 'history'], (old: RegisteredEventItem[] = []) =>
        (Array.isArray(old) ? old : []).map((e) =>
          (e.id === targetId || (event.eventId && String(e.eventId) === String(event.eventId)))
            ? {
                ...e,
                status: 'CANCELLED' as const,
                canCancel: false,
                canRequestAbsence: false,
              }
            : e
        )
      )
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      showToast(`Đã hủy đăng ký thành công sự kiện "${title}".`, 'info')
    } catch (err: any) {
      console.error('Failed to cancel registration:', err)
      const rawMsg = err?.response?.data?.message || err?.message || ''
      let msg = 'Không thể hủy đăng ký sự kiện. Vui lòng thử lại sau!'
      if (rawMsg.includes('after event close')) {
        msg = 'Không thể hủy đăng ký sau khi sự kiện đã đóng hạn!'
      }
      showToast(msg, 'info')
    }
  }

  const handleComplaint = (event: RegisteredEventItem) => {
    setProofModalEvent(null)
    const title = event.title || event.eventName || 'Sự kiện'
    showToast(
      `Đã ghi nhận yêu cầu khiếu nại minh chứng cho sự kiện "${title}". Ban phụ trách sẽ liên hệ lại với bạn.`,
      'info'
    )
  }

  const handleApplyFilter = () => {
    setAppliedYear(selectedYear)
    setAppliedSemester(selectedSemester)
    showToast(`Đã lọc danh sách sự kiện theo Năm học ${selectedYear} - Học kì ${selectedSemester}.`, 'info')
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs md:text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container Layout: Left sidebar with padding, Main content extends flush to right edge */}
      <div className="w-full flex-1 min-h-0 flex items-start pl-4 sm:pl-6 pr-0 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content: History Management View (Thanh scroll sát mép phải màn hình) */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 pl-1 pr-4 sm:pr-6 custom-scrollbar">
          <div className="w-full max-w-full flex flex-col gap-4 pb-16">
            {/* Top Bar: Title + Năm học, Học kì, Tìm (Tiêu đề và bộ lọc) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
                Lịch sử tham gia
              </h1>

              {/* Year, Semester dropdowns & Tìm button using shadcn Select */}
              <div className="flex items-center gap-2.5 sm:gap-3 self-start sm:self-auto">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[130px] sm:w-[140px] h-8 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs">
                    <SelectValue placeholder="Chọn năm học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026 - 2027">2026 - 2027</SelectItem>
                    <SelectItem value="2025 - 2026">2025 - 2026</SelectItem>
                    <SelectItem value="2024 - 2025">2024 - 2025</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-[105px] sm:w-[115px] h-8 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs">
                    <SelectValue placeholder="Chọn học kì" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Học kì 1</SelectItem>
                    <SelectItem value="2">Học kì 2</SelectItem>
                    <SelectItem value="3">Học kì 3</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="h-8 px-4 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
                >
                  Tìm
                </button>
              </div>
            </div>

            {/* 4 Summary Stat Cards (Frame 227) */}
            <HistoryStatsCards stats={stats} />

            {/* Main Section: Folder-style Tab Bar above White Container */}
            <div className="flex flex-col mt-2">
              <HistoryTabBar
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                counts={counts}
              />

              {/* Main Content White Container (Frame 229) */}
              <div
                className={`bg-white dark:bg-card border border-[#E5E7EB] dark:border-border ${
                  activeStatus === 'ALL' ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
                } p-4 sm:p-5 flex flex-col gap-4 shadow-2xs`}
              >
                {/* Search & Filter Toolbar with View Mode Switcher */}
                <HistorySearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  onToggleFilterModal={() => {
                    showToast('Đang mở bộ lọc nâng cao...', 'info')
                  }}
                />

              {/* Responsive Events View (Table or Grid Cards) */}
              {isLoading ? (
                viewMode === 'TABLE' ? (
                  <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 rounded-2xl overflow-x-auto custom-scrollbar border border-border/40 animate-pulse">
                    <div className="min-w-[860px]">
                      <div className="grid grid-cols-12 items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
                        <div className="col-span-4">Sự kiện & Ban tổ chức</div>
                        <div className="col-span-3">Thời gian & Địa điểm</div>
                        <div className="col-span-2">Quyền lợi</div>
                        <div className="col-span-2">Trạng thái</div>
                        <div className="col-span-1 text-right">Thao tác</div>
                      </div>
                      <div className="flex flex-col gap-2.5 mt-1">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid grid-cols-12 items-center shadow-2xs"
                          >
                            <div className="col-span-4 flex items-center gap-3 pr-3">
                              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <Skeleton className="h-4 w-3/4 rounded" />
                                <Skeleton className="h-3 w-1/2 rounded" />
                              </div>
                            </div>
                            <div className="col-span-3 space-y-1.5 pr-2">
                              <Skeleton className="h-3.5 w-36 rounded" />
                              <Skeleton className="h-3 w-28 rounded" />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Skeleton className="h-5 w-20 rounded-md" />
                            </div>
                            <div className="col-span-2">
                              <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <Skeleton className="h-8 w-16 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 shadow-2xs"
                      >
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                        <div className="flex justify-between items-center mt-2">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-7 w-20 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : filteredEvents.length > 0 ? (
                viewMode === 'TABLE' ? (
                  <div
                    key={activeStatus}
                    className="animate-in fade-in-50 slide-in-from-bottom-1 duration-200 ease-out"
                  >
                    <RegisteredEventTable
                      events={filteredEvents}
                      onOpenProofModal={(e) => setProofModalEvent(e)}
                      onOpenAbsenceModal={(e) => setAbsenceModalEvent(e)}
                      onOpenCancelModal={(e) => setCancelModalEvent(e)}
                      onOpenAttendanceModal={(e) => setAttendanceModalEvent(e)}
                    />
                  </div>
                ) : (
                  <div
                    key={activeStatus}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 animate-in fade-in-50 slide-in-from-bottom-1 duration-200 ease-out"
                  >
                    {filteredEvents.map((evt, idx) => (
                      <RegisteredEventCard
                        key={evt.id || evt.eventId || idx}
                        event={evt}
                        onOpenProofModal={(e) => setProofModalEvent(e)}
                        onOpenAbsenceModal={(e) => setAbsenceModalEvent(e)}
                        onOpenCancelModal={(e) => setCancelModalEvent(e)}
                        onOpenAttendanceModal={(e) => setAttendanceModalEvent(e)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-dashed border-border/80 p-12 text-center flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-foreground">
                    Không tìm thấy sự kiện đăng ký nào
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {searchTerm
                      ? `Không có sự kiện nào khớp với từ khóa "${searchTerm}". Hãy thử kiểm tra lại từ khóa hoặc xóa bộ lọc.`
                      : 'Bạn chưa có sự kiện nào trong danh mục này. Hãy khám phá và đăng ký thêm các sự kiện mới!'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 px-3.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                    >
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>

      {/* Modals */}
      <ProofModal
        isOpen={Boolean(proofModalEvent)}
        onClose={() => setProofModalEvent(null)}
        event={proofModalEvent}
        onComplaint={handleComplaint}
      />

      <AbsenceModal
        isOpen={Boolean(absenceModalEvent)}
        onClose={() => setAbsenceModalEvent(null)}
        event={absenceModalEvent}
        onSubmit={handleAbsenceSubmit}
      />

      <CancelConfirmModal
        isOpen={Boolean(cancelModalEvent)}
        onClose={() => setCancelModalEvent(null)}
        event={cancelModalEvent}
        onConfirm={handleCancelConfirm}
      />

      <StudentAttendanceModal
        isOpen={Boolean(attendanceModalEvent)}
        onClose={() => setAttendanceModalEvent(null)}
        event={attendanceModalEvent}
        onSuccess={(msg) => {
          showToast(msg, 'success')
          queryClient.invalidateQueries({ queryKey: ['registrations', 'history'] })
          queryClient.invalidateQueries({ queryKey: ['student-semester-points'] })
          queryClient.invalidateQueries({ queryKey: ['point-transactions'] })
          queryClient.invalidateQueries({ queryKey: ['criteria-progress'] })
        }}
      />
    </div>
  )
}
