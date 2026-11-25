import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useTimeBoundary } from '@/shared/hooks/useTimeBoundary'
import { isUpcomingRegistration, nextTimeBoundary } from '@/shared/utils/registrationEligibility'
import { matchesPageSearch, useMobilePageSearch } from '@/shared/components/layout/MobileSubpageHeader'
import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared'
import {
  HistoryTabBar,
  MobileHistoryTabBar,
  MobileFilterSheet,
  HistorySearchBar,
  RegisteredEventCard,
  RegisteredEventTable,
  ProofModal,
  AbsenceModal,
  CancelConfirmModal,
  StudentAttendanceModal,
  historyService,
  normalizeHistoryStatus,
  getEventTerm,
  type RegisteredEventItem,
  type HistoryStatus,
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
import { CalendarDays, CheckCircle, AlertCircle, RotateCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export const EventHistoryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeStatus, setActiveStatus] = useState<HistoryStatus>('ALL')
  const mobileSearch = useMobilePageSearch()
  const [desktopSearchTerm, setDesktopSearchTerm] = useState('')
  const searchTerm = mobileSearch.active ? mobileSearch.query : desktopSearchTerm
  const setSearchTerm = (value: string) =>
    mobileSearch.active ? mobileSearch.setQuery?.(value) : setDesktopSearchTerm(value)

  const [selectedYear, setSelectedYear] = useState('2026 - 2027')
  const [selectedSemester, setSelectedSemester] = useState('1')
  const [appliedYear, setAppliedYear] = useState('2026 - 2027')
  const [appliedSemester, setAppliedSemester] = useState('1')

  // Fetch real Academic Years and Semesters from backend
  const { data: academicYears = [] } = useQuery<any[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      try {
        const res: any = await apiClient.get('/academic-years')
        return res?.data || (Array.isArray(res) ? res : [])
      } catch {
        return []
      }
    },
  })

  const { data: semesters = [] } = useQuery<any[]>({
    queryKey: ['semesters'],
    queryFn: async () => {
      try {
        const res: any = await apiClient.get('/semesters')
        return res?.data || (Array.isArray(res) ? res : [])
      } catch {
        return []
      }
    },
  })

  // Generate Year options
  const yearOptions = useMemo(() => {
    if (Array.isArray(academicYears) && academicYears.length > 0) {
      return academicYears.map((y: any) => {
        const code = y.code || ''
        const label = code.includes('-') && !code.includes(' - ') ? code.replace('-', ' - ') : code
        return { value: label, label }
      })
    }
    return [
      { value: '2026 - 2027', label: '2026 - 2027' },
      { value: '2025 - 2026', label: '2025 - 2026' },
      { value: '2024 - 2025', label: '2024 - 2025' },
    ]
  }, [academicYears])

  // Helper to get semesters available for a given year
  const getSemestersForYear = (yearStr: string) => {
    const cleanYear = yearStr.replace(/\s+/g, '')
    const matchedYear = academicYears.find(
      (y: any) => (y.code || '').replace(/\s+/g, '') === cleanYear
    )

    if (Array.isArray(semesters) && semesters.length > 0) {
      const list = semesters.filter((s: any) => {
        if (matchedYear && s.academicYearId != null) {
          return s.academicYearId === matchedYear.id
        }
        if (s.academicYear) {
          return s.academicYear.replace(/\s+/g, '') === cleanYear
        }
        return true
      })
      if (list.length > 0) return list
    }
    return [
      { number: 1, status: 'ONGOING' },
      { number: 2, status: 'UPCOMING' },
      { number: 3, status: 'UPCOMING' },
    ]
  }

  // Available semesters for currently selected year
  const currentYearSemesters = useMemo(() => {
    return getSemestersForYear(selectedYear)
  }, [selectedYear, academicYears, semesters])

  const semesterOptions = useMemo(() => {
    return currentYearSemesters.map((s: any) => ({
      value: String(s.number),
      label: `Học kỳ ${s.number}`,
    }))
  }, [currentYearSemesters])

  // Synchronous Year change: updates applied values immediately, validates semester
  const handleYearChange = (newYear: string) => {
    const validSemesters = getSemestersForYear(newYear)
    let nextSemester = selectedSemester
    if (!validSemesters.some((s: any) => String(s.number) === selectedSemester)) {
      const activeSem =
        validSemesters.find((s: any) => s.status === 'ONGOING' || s.status === 'ACTIVE') ||
        validSemesters[0]
      nextSemester = activeSem ? String(activeSem.number) : '1'
    }

    setSelectedYear(newYear)
    setAppliedYear(newYear)
    setSelectedSemester(nextSemester)
    setAppliedSemester(nextSemester)
  }

  // Synchronous Semester change: updates applied value immediately
  const handleSemesterChange = (newSemester: string) => {
    setSelectedSemester(newSemester)
    setAppliedSemester(newSemester)
  }

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

  const compactHistory = useMediaQuery('(max-width: 767px)')
  const effectiveViewMode = compactHistory ? 'GRID' : viewMode
  const handleViewModeChange = (mode: 'GRID' | 'TABLE') => {
    setViewMode(mode)
    try {
      localStorage.setItem('ctu_history_view_mode', mode)
    } catch {
      // Ignore
    }
  }

  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
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

  // Filter events by applied academic year and semester if dates are available
  const termFilteredList = useMemo(() => {
    const list = Array.isArray(events) ? events : []
    if (list.length === 0) return []

    const normYear = (y?: string) => (y || '').replace(/\s+/g, '')

    const listWithTerms = list.map((e) => ({ event: e, term: getEventTerm(e) }))
    const matched = listWithTerms
      .filter(
        (item) =>
          item.term &&
          normYear(item.term.year) === normYear(appliedYear) &&
          String(item.term.semester) === String(appliedSemester)
      )
      .map((item) => item.event)

    if (listWithTerms.some((item) => item.term !== null)) {
      return matched
    }
    return list
  }, [events, appliedYear, appliedSemester])

  const now = useTimeBoundary(nextTimeBoundary(events.map((event) => event.startsAt)))

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: termFilteredList.length,
      upcoming: termFilteredList.filter((e) => isUpcomingRegistration(e, now))
        .length,
      completed: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'COMPLETED')
        .length,
      absent: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'ABSENT').length,
      cancelled: termFilteredList.filter((e) => normalizeHistoryStatus(e.status) === 'CANCELLED')
        .length,
    }
  }, [termFilteredList, now])

  // Filtered event list combining status, year/semester, and diacritic-insensitive search
  const filteredEvents = useMemo(() => {
    return termFilteredList.filter((evt) => {
      // Filter by status tab
      if (activeStatus !== 'ALL') {
        if (activeStatus === 'UPCOMING' && !isUpcomingRegistration(evt, now)) return false
        const itemStatus = normalizeHistoryStatus(evt.status)
        if (itemStatus !== activeStatus) {
          return false
        }
      }

      // Filter by search query using diacritic-insensitive matchesPageSearch
      if (searchTerm.trim()) {
        const title = evt.title || evt.eventName || ''
        const organizer = evt.organizer?.name || 'Ban Tổ Chức'
        const location = evt.location || ''
        if (!matchesPageSearch(searchTerm, title, organizer, location)) {
          return false
        }
      }

      return true
    })
  }, [termFilteredList, activeStatus, searchTerm, now])

  // Contextual empty state message
  const emptyStateInfo = useMemo(() => {
    if (searchTerm.trim()) {
      return {
        title: 'Không tìm thấy sự kiện phù hợp',
        description: `Không có sự kiện nào khớp với từ khóa "${searchTerm}". Hãy thử kiểm tra lại từ khóa hoặc xóa tìm kiếm.`,
        showClearSearch: true,
      }
    }
    switch (activeStatus) {
      case 'UPCOMING':
        return {
          title: 'Chưa có sự kiện sắp diễn ra trong học kỳ này',
          description: 'Bạn chưa có sự kiện nào sắp tới trong học kỳ đã chọn.',
          showClearSearch: false,
        }
      case 'COMPLETED':
        return {
          title: 'Chưa có sự kiện đã điểm danh trong học kỳ này',
          description: 'Bạn chưa có sự kiện nào đã điểm danh trong học kỳ này.',
          showClearSearch: false,
        }
      case 'ABSENT':
        return {
          title: 'Chưa có sự kiện vắng trong học kỳ này',
          description: 'Bạn không có sự kiện nào vắng mặt trong học kỳ này.',
          showClearSearch: false,
        }
      case 'CANCELLED':
        return {
          title: 'Chưa có sự kiện đã hủy trong học kỳ này',
          description: 'Bạn chưa hủy sự kiện nào trong học kỳ này.',
          showClearSearch: false,
        }
      default:
        return {
          title: 'Không có sự kiện đăng ký nào',
          description: 'Bạn chưa có sự kiện nào trong học kỳ này.',
          showClearSearch: false,
        }
    }
  }, [searchTerm, activeStatus])

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
          e.id === targetId || (event.eventId && String(e.eventId) === String(event.eventId))
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
    showToast(
      `Đã lọc danh sách sự kiện theo Năm học ${selectedYear} - Học kì ${selectedSemester}.`,
      'info'
    )
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

      {/* Mobile Only: Shopee-style Tab Bar directly under Header (Navbar), edge-to-edge full width */}
      {compactHistory && (
        <div className="md:hidden w-full shrink-0 z-20">
          <MobileHistoryTabBar
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            counts={counts}
          />
        </div>
      )}

      {/* Main Container Layout: Left sidebar with padding, Main content extends flush to right edge */}
      <div className="w-full flex-1 min-h-0 flex items-start px-4 sm:pl-6 sm:pr-0 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden xl:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content: History Management View (Thanh scroll sát mép phải màn hình) */}
        <main
          data-student-scroll
          className="flex-1 min-w-0 h-full overflow-y-auto py-3 sm:py-4 pl-0 pr-0 sm:pr-3 custom-scrollbar"
        >
          <div className="w-full max-w-full flex flex-col gap-3 sm:gap-4 pb-16">
            {/* Top Bar: Title + Năm học, Học kì, Tìm (Tiêu đề và bộ lọc) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              {/* Desktop heading only (Mobile header handled by MobileSubpageHeader) */}
              <h1
                data-mobile-page-heading
                className="hidden md:block text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight"
              >
                Lịch sử tham gia
              </h1>

              {compactHistory ? (
                /* Mobile: equally sized year and semester filters */
                <div className="grid md:hidden grid-cols-2 items-center gap-2.5 w-full">
                  <div className="min-w-0">
                    <MobileFilterSheet
                      title="Chọn năm học"
                      value={selectedYear}
                      displayValue={selectedYear}
                      options={yearOptions}
                      onChange={handleYearChange}
                      accessibleLabel="Chọn năm học"
                    />
                  </div>
                  <div className="min-w-0">
                    <MobileFilterSheet
                      title="Chọn học kỳ"
                      value={selectedSemester}
                      displayValue={`Học kỳ ${selectedSemester}`}
                      options={semesterOptions}
                      onChange={handleSemesterChange}
                      accessibleLabel="Chọn học kỳ"
                    />
                  </div>
                </div>
              ) : (
                /* Desktop: Existing Select controls + Tìm button */
                <div className="hidden md:flex items-center gap-2 sm:gap-3 w-full sm:w-auto self-start sm:self-auto min-w-0">
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-[140px] h-10 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs px-3.5">
                      <SelectValue placeholder="Chọn năm học" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSemester} onValueChange={handleSemesterChange}>
                    <SelectTrigger className="w-[115px] h-10 text-xs font-medium bg-white dark:bg-card border-[#E5E7EB] dark:border-border text-foreground shadow-2xs px-3.5">
                      <SelectValue placeholder="Chọn học kì" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="h-10 px-4 text-xs font-semibold text-white bg-[#1B4B8A] hover:bg-[#153a6b] rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
                  >
                    Tìm
                  </button>
                </div>
              )}
            </div>

            {/* Main Section: Desktop folder-style tab bar connected seamlessly to White Container */}
            <div className="flex flex-col mt-1 sm:mt-2">
              {!compactHistory && (
                <div className="hidden md:block">
                  <HistoryTabBar
                    activeStatus={activeStatus}
                    onStatusChange={setActiveStatus}
                    counts={counts}
                  />
                </div>
              )}

              {/* Main Content Container (Frame 229 on desktop, clean transparent on mobile) */}
              <div
                className={`bg-transparent md:bg-white md:dark:bg-card border-0 md:border md:border-[#E5E7EB] md:dark:border-border rounded-xl ${
                  activeStatus === 'ALL'
                    ? 'md:rounded-b-xl md:rounded-tr-xl md:rounded-tl-none'
                    : 'md:rounded-xl'
                } p-0 md:p-5 flex flex-col gap-3 sm:gap-4 shadow-none md:shadow-2xs`}
              >
                {/* Search & Filter Toolbar with View Mode Switcher (Desktop only) */}
                <div data-mobile-page-search className="hidden md:block">
                  <HistorySearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    viewMode={effectiveViewMode}
                    onViewModeChange={compactHistory ? undefined : handleViewModeChange}
                    onToggleFilterModal={() => {
                      showToast('Đang mở bộ lọc nâng cao...', 'info')
                    }}
                  />
                </div>

                {/* Results count indicator */}
                {!isLoading && !isError && filteredEvents.length > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium px-1">
                    <span>{filteredEvents.length} sự kiện</span>
                  </div>
                )}

                {/* Responsive Events View (Table or Grid Cards) */}
                {isLoading ? (
                  effectiveViewMode === 'TABLE' ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
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
                ) : isError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center flex flex-col items-center justify-center gap-3">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading font-semibold text-sm text-foreground">
                        Không thể tải danh sách sự kiện
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối và thử lại.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-1 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      <span>Thử lại</span>
                    </button>
                  </div>
                ) : filteredEvents.length > 0 ? (
                  effectiveViewMode === 'TABLE' ? (
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
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in-50 slide-in-from-bottom-1 duration-200 ease-out"
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
                  <div className="rounded-xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
                    <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                      <CalendarDays className="h-7 w-7" />
                    </div>
                    <h3 className="font-heading font-semibold text-sm text-foreground">
                      {emptyStateInfo.title}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {emptyStateInfo.description}
                    </p>
                    {emptyStateInfo.showClearSearch && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
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
          queryClient.invalidateQueries({ queryKey: ['registrations'] })
          queryClient.invalidateQueries({ queryKey: ['event-attendees'] })
          queryClient.invalidateQueries({ queryKey: ['student-semester-points'] })
          queryClient.invalidateQueries({ queryKey: ['point-transactions'] })
          queryClient.invalidateQueries({ queryKey: ['criteria-progress'] })
        }}
      />
    </div>
  )
}
