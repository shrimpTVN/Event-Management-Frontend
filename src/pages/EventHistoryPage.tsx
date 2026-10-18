import React, { useState, useMemo } from 'react'
import {
  HistoryStatsCards,
  HistoryFilterBar,
  RegisteredEventCard,
  ProofModal,
  AbsenceModal,
  CancelConfirmModal,
  mockRegisteredEvents,
  mockHistoryStats,
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
import { CalendarDays, CheckCircle, AlertCircle } from 'lucide-react'

export const EventHistoryPage: React.FC = () => {
  const [events, setEvents] = useState<RegisteredEventItem[]>(mockRegisteredEvents)
  const [activeStatus, setActiveStatus] = useState<HistoryStatus>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('2026 - 2027')
  const [selectedSemester, setSelectedSemester] = useState('1')

  // Modals state
  const [proofModalEvent, setProofModalEvent] = useState<RegisteredEventItem | null>(null)
  const [absenceModalEvent, setAbsenceModalEvent] = useState<RegisteredEventItem | null>(null)
  const [cancelModalEvent, setCancelModalEvent] = useState<RegisteredEventItem | null>(null)

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

  // Calculate dynamic stats merged with Figma trend indicators
  const stats = useMemo(() => {
    const totalRegistered = events.length
    const upcoming = events.filter((e) => e.status === 'UPCOMING').length
    const completed = events.filter((e) => e.status === 'COMPLETED').length
    const absent = events.filter((e) => e.status === 'ABSENT').length

    return {
      totalRegistered: mockHistoryStats.totalRegistered || totalRegistered,
      totalTrend: mockHistoryStats.totalTrend,
      upcoming: mockHistoryStats.upcoming || upcoming,
      upcomingTrend: mockHistoryStats.upcomingTrend,
      completed: mockHistoryStats.completed || completed,
      completedTrend: mockHistoryStats.completedTrend,
      absent: mockHistoryStats.absent || absent,
      absentTrend: mockHistoryStats.absentTrend,
    }
  }, [events])

  // Tab counts
  const counts = useMemo(
    () => ({
      all: 30, // matching Figma tab badge 30
      upcoming: 20, // matching Figma tab badge 20
      completed: 10, // matching Figma tab badge 10
      absent: 1, // matching Figma tab badge 1
      cancelled: 0, // matching Figma tab badge 0
    }),
    []
  )

  // Filtered event list
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Filter by status tab
      if (activeStatus !== 'ALL' && evt.status !== activeStatus) {
        return false
      }

      // Filter by search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchesTitle = evt.title.toLowerCase().includes(query)
        const matchesOrganizer = evt.organizer.name.toLowerCase().includes(query)
        const matchesLocation = evt.location.toLowerCase().includes(query)
        if (!matchesTitle && !matchesOrganizer && !matchesLocation) {
          return false
        }
      }

      return true
    })
  }, [events, activeStatus, searchTerm])

  // Handlers for modal actions
  const handleAbsenceSubmit = (_data: AbsenceFormData) => {
    showToast(
      'Đơn xin vắng của bạn đã được gửi thành công đến Ban tổ chức! Vui lòng chờ phản hồi trong vòng 24h.'
    )
  }

  const handleCancelConfirm = (event: RegisteredEventItem) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              status: 'CANCELLED',
              canCancel: false,
              canRequestAbsence: false,
            }
          : e
      )
    )
    showToast(`Đã hủy đăng ký thành công sự kiện "${event.title}".`, 'info')
  }

  const handleComplaint = (event: RegisteredEventItem) => {
    setProofModalEvent(null)
    showToast(
      `Đã ghi nhận yêu cầu khiếu nại minh chứng cho sự kiện "${event.title}". Ban phụ trách sẽ liên hệ lại với bạn.`,
      'info'
    )
  }

  const handleApplyFilter = () => {
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
              className="ml-2 text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container Layout: Left sidebar flush left, content scrolling independently */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content: History Management View */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-6xl flex flex-col gap-4 pb-16">
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
            <HistoryStatsCards
              stats={stats}
              activeFilter={activeStatus}
              onSelectFilter={(status) => setActiveStatus(status)}
            />

            {/* Main Content White Container (Frame 229) */}
            <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xs">
              {/* Event Filter Toolbar (Tabs on left, Search + Bộ lọc on right) */}
              <HistoryFilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                activeStatus={activeStatus}
                onStatusChange={setActiveStatus}
                counts={counts}
                onToggleFilterModal={() => {
                  showToast('Đang mở bộ lọc nâng cao...', 'info')
                }}
              />

              {/* 3-column Events Cards Grid (Frame 231) */}
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredEvents.map((evt) => (
                    <RegisteredEventCard
                      key={evt.id}
                      event={evt}
                      onOpenProofModal={(e) => setProofModalEvent(e)}
                      onOpenAbsenceModal={(e) => setAbsenceModalEvent(e)}
                      onOpenCancelModal={(e) => setCancelModalEvent(e)}
                    />
                  ))}
                </div>
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
    </div>
  )
}
