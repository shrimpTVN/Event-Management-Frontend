import React, { useState, useMemo } from 'react'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  RotateCcw,
  Pencil,
} from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { cn } from '@/shared/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { EventFilterModal, type EventFilterFormValues, isEventMatchingRegistrationStatus } from '@/features/events'
import type { AdminEvent, EventStatus } from '../types/fanpageAdmin.types'
import { MOCK_ADMIN_EVENTS, fanpageAdminService } from '../services/fanpageAdminService'

// Định dạng thời gian: "04/11/2026 · 07:00" (không hiển thị "07:00 - 07:00" khi giờ bắt đầu và kết thúc giống nhau)
function formatEventTime(dateStart: string, timeStart: string, timeEnd: string): string {
  let datePart = ''
  const match = dateStart.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const [, yyyy, mm, dd] = match
    datePart = `${dd}/${mm}/${yyyy}`
  } else {
    const d = new Date(dateStart)
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0')
      datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
    } else {
      datePart = dateStart
    }
  }

  const cleanStart = (timeStart || '').trim()
  const cleanEnd = (timeEnd || '').trim()
  const timePart = !cleanEnd || cleanStart === cleanEnd ? cleanStart : `${cleanStart} - ${cleanEnd}`

  return timePart ? `${datePart} · ${timePart}` : datePart
}

// Lọc bỏ emoji trong tên sự kiện nếu có
function cleanEventName(name: string): string {
  return name.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim()
}

interface FanpageEventListViewProps {
  events?: AdminEvent[]
  isLoading?: boolean
  onCreateEventClick?: () => void
  onEventClick?: (eventId: string) => void
  onEditClick?: (event: AdminEvent) => void
}

export const FanpageEventListView: React.FC<FanpageEventListViewProps> = ({
  events = MOCK_ADMIN_EVENTS,
  isLoading = false,
  onCreateEventClick,
  onEventClick,
  onEditClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [drawerFilterValues, setDrawerFilterValues] = useState<EventFilterFormValues>({})

  // Fetch số lượng đăng ký thực tế cho từng sự kiện
  const registeredCountQueries = useQueries({
    queries: events.map((evt) => ({
      queryKey: ['event-registered-count', evt.fanpageId, evt.id],
      queryFn: () => fanpageAdminService.getEventRegisteredCount(evt.fanpageId, evt.id),
      staleTime: 30_000,
      retry: 1,
    })),
  })

  const registeredCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    events.forEach((evt, idx) => {
      const count = registeredCountQueries[idx]?.data
      map[evt.id] = typeof count === 'number' ? count : (evt.registeredCount ?? 0)
    })
    return map
  }, [events, registeredCountQueries])

  const validEvents = useMemo(() => events, [events])

  const activeFilterCount = useMemo(() => {
    return [
      drawerFilterValues.status,
      drawerFilterValues.eventTypeId,
      drawerFilterValues.pointCategoryId,
      drawerFilterValues.criteriaId,
      drawerFilterValues.semesterId && drawerFilterValues.semesterId !== 'ALL' ? drawerFilterValues.semesterId : null,
      drawerFilterValues.academicYear && drawerFilterValues.academicYear !== 'ALL' ? drawerFilterValues.academicYear : null,
      drawerFilterValues.dateHappenFrom,
      drawerFilterValues.dateHappenTo,
    ].filter(Boolean).length
  }, [drawerFilterValues])

  // Lọc sự kiện theo tab trạng thái, từ khóa, bộ lọc drawer nâng cao
  const filteredEvents = useMemo(() => {
    const rawTypeIds = drawerFilterValues.eventTypeId
      ? drawerFilterValues.eventTypeId.split(',').filter(Boolean)
      : []
    const rawStatus = drawerFilterValues.status
      ? drawerFilterValues.status.split(',').filter(Boolean)
      : []
    const rawPointCatIds = drawerFilterValues.pointCategoryId
      ? drawerFilterValues.pointCategoryId.split(',').filter(Boolean)
      : []
    const rawCritIds = drawerFilterValues.criteriaId
      ? drawerFilterValues.criteriaId.split(',').filter(Boolean)
      : []

    return validEvents.filter((evt) => {
      // 1. Text search
      const q = searchTerm.trim().toLowerCase()
      if (q) {
        const matchSearch =
          evt.name.toLowerCase().includes(q) ||
          evt.code.toLowerCase().includes(q) ||
          evt.location.toLowerCase().includes(q)
        if (!matchSearch) return false
      }

      // 2. Tab status (ALL, UPCOMING, PUBLISHED, CLOSED, DRAFT)
      if (activeStatusTab === 'UPCOMING') {
        if (evt.status === 'CLOSED' || evt.status === 'CANCELLED' || evt.status === 'DRAFT') return false
      } else if (activeStatusTab === 'DRAFT') {
        if (evt.status !== 'DRAFT') return false
      } else if (activeStatusTab === 'PUBLISHED') {
        if (evt.status !== 'PUBLISHED') return false
      } else if (activeStatusTab === 'CLOSED') {
        if (evt.status !== 'CLOSED') return false
      }

      // 3. Drawer Status (OPEN_REGISTRATION, PUBLISHED, COMPLETED...)
      if (rawStatus.length > 0) {
        const matchesStatus = rawStatus.some((sKey) =>
          isEventMatchingRegistrationStatus(
            {
              status: evt.status,
              dateOpen: (evt as any).dateOpen || evt.dateStart,
              dateClose: (evt as any).dateClose || evt.dateEnd,
              dateHappen: evt.dateHappen || evt.dateStart,
              startTime: evt.dateStart,
              endTime: evt.dateEnd,
            } as any,
            sKey
          )
        )
        if (!matchesStatus) return false
      }

      // 4. Event Types (Multi-select)
      if (rawTypeIds.length > 0) {
        const matchesType = rawTypeIds.some(
          (tid) =>
            String(evt.eventTypeId) === String(tid) ||
            (evt.eventTypeName && evt.eventTypeName.toLowerCase().includes(tid.toLowerCase()))
        )
        if (!matchesType) return false
      }

      // 5. Point Categories (ĐRL)
      if (rawPointCatIds.length > 0) {
        const evtCatId = String((evt as any).pointCategoryId || (evt as any).eventPoints?.[0]?.pointCategoryId || '')
        if (!rawPointCatIds.includes(evtCatId)) return false
      }

      // 6. SV5T Criteria
      if (rawCritIds.length > 0) {
        const evtCritId = String(evt.sv5tCriteriaId || (evt as any).criteriaId || '')
        if (!rawCritIds.includes(evtCritId)) return false
      }

      // 7. Date Happen Range
      if (drawerFilterValues.dateHappenFrom) {
        const d = evt.dateStart || evt.dateHappen
        if (d && d < drawerFilterValues.dateHappenFrom) return false
      }
      if (drawerFilterValues.dateHappenTo) {
        const d = evt.dateEnd || evt.dateStart || evt.dateHappen
        if (d && d > drawerFilterValues.dateHappenTo) return false
      }

      // 8. Semester
      if (drawerFilterValues.semesterId && drawerFilterValues.semesterId !== 'ALL') {
        if (String(evt.semesterId) !== String(drawerFilterValues.semesterId)) return false
      }

      return true
    })
  }, [validEvents, searchTerm, activeStatusTab, drawerFilterValues])

  // Đếm số lượng theo trạng thái
  const counts = useMemo(() => {
    return {
      all: validEvents.length,
      upcoming: validEvents.filter(
        (e) => e.status !== 'CLOSED' && e.status !== 'CANCELLED' && e.status !== 'DRAFT'
      ).length,
      published: validEvents.filter((e) => e.status === 'PUBLISHED').length,
      closed: validEvents.filter((e) => e.status === 'CLOSED').length,
      draft: validEvents.filter((e) => e.status === 'DRAFT').length,
    }
  }, [validEvents])

  // Badge trạng thái: chấm màu nhỏ + chữ
  const renderStatus = (status: EventStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Đang mở</span>
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 shrink-0" />
            <span>Đã kết thúc</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-destructive font-normal whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-destructive shrink-0" />
            <span>Đã hủy</span>
          </span>
        )
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-normal whitespace-nowrap">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40 shrink-0" />
            <span>Bản nháp</span>
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Breadcrumb + Tiêu đề "Quản lý sự kiện" + Nút chính "Tạo sự kiện mới" */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <span>Quản trị fanpage</span>
          <span>/</span>
          <span className="text-primary font-semibold">Sự kiện</span>
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              Quản lý sự kiện
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tạo, theo dõi số lượng đăng ký và cập nhật toàn bộ sự kiện của fanpage trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateEventClick}
            className="px-4 h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo sự kiện mới</span>
          </button>
        </div>
      </div>

      {/* 2. Khối bảng màu trắng với thanh Folder Tab bo tròn khi chọn */}
      <div className="flex flex-col mt-2">
        {/* Hàng Tab Bar dạng folder tab bo tròn trên đỉnh, nổi và kết nối liền mạch với khung trắng */}
        <div className="flex items-end gap-1.5 -mb-px relative z-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'Tất cả', count: counts.all },
            { id: 'UPCOMING', label: 'Sắp diễn ra', count: counts.upcoming },
            { id: 'PUBLISHED', label: 'Đang mở đăng ký', count: counts.published },
            { id: 'CLOSED', label: 'Đã kết thúc', count: counts.closed },
            { id: 'DRAFT', label: 'Bản nháp', count: counts.draft },
          ].map((tab) => {
            const isActive = activeStatusTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                className={cn(
                  'px-4 sm:px-5 py-2.5 text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5',
                  isActive
                    ? 'bg-white dark:bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-[#E5E7EB] dark:border-border shadow-2xs pb-3'
                    : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-t-lg'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-xs font-normal',
                    isActive ? 'text-foreground/80' : 'text-muted-foreground/70'
                  )}
                >
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Khung chính Bảng Trắng chứa Toolbar & Các card hàng bo tròn */}
        <div
          className={cn(
            'bg-white dark:bg-card border border-[#E5E7EB] dark:border-border p-4 sm:p-5 flex flex-col gap-4 shadow-2xs',
            activeStatusTab === 'ALL' ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-2xl'
          )}
        >
          {/* Header trong panel: Ô tìm kiếm + Bộ lọc bên trái, số lượng tóm tắt bên phải */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo tên sự kiện, mã code, địa điểm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
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

              {/* Nút Bộ lọc Drawer */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(true)}
                className={cn(
                  'flex items-center gap-2 px-3.5 h-9 text-xs sm:text-sm font-medium rounded-xl border transition-colors shrink-0 cursor-pointer',
                  activeFilterCount > 0
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-[#E5E7EB] dark:border-border text-foreground bg-white dark:bg-card hover:bg-muted/50'
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Dòng tóm tắt góc phải */}
            <div className="text-xs text-muted-foreground font-normal">
              {filteredEvents.length} sự kiện {activeStatusTab !== 'ALL' ? 'trong mục này' : 'tổng cộng'}
            </div>
          </div>

          {/* Thanh tóm tắt tiêu chí lọc đang áp dụng */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs">
              <span className="text-primary font-medium">
                Đang áp dụng {activeFilterCount} tiêu chí lọc ({filteredEvents.length} sự kiện phù hợp)
              </span>
              <button
                type="button"
                onClick={() => setDrawerFilterValues({})}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại</span>
              </button>
            </div>
          )}

          {/* 3. Vùng chứa các card sự kiện bo tròn cách nhau */}
          <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 overflow-x-auto rounded-xl">
            <div className="min-w-[760px]">
              {/* Header hàng cột phẳng, chữ xám nhẹ, không viền gồ ghề */}
              <div
                className={cn(
                  'grid items-center px-5 py-2 text-xs font-normal text-muted-foreground',
                  activeStatusTab === 'CLOSED'
                    ? 'grid-cols-[1fr_240px_110px_90px]'
                    : 'grid-cols-[1fr_240px_110px_110px_90px]'
                )}
              >
                <div>Tên sự kiện</div>
                <div>Thời gian &amp; Địa điểm</div>
                <div>Đăng ký</div>
                {activeStatusTab !== 'CLOSED' && <div className="text-center">Trạng thái</div>}
                <div className="text-right">Thao tác</div>
              </div>

              {/* Danh sách các card sự kiện bo tròn cách nhau (gap-2.5) */}
              <div
                key={activeStatusTab}
                className="flex flex-col gap-2.5 mt-1 animate-in fade-in-50 duration-150"
              >
                {isLoading ? (
                  <div className="flex flex-col gap-2.5 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid items-center shadow-2xs',
                          activeStatusTab === 'CLOSED'
                            ? 'grid-cols-[1fr_240px_110px_90px]'
                            : 'grid-cols-[1fr_240px_110px_110px_90px]'
                        )}
                      >
                        <div className="flex items-center gap-3 pr-4">
                          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-40 rounded" />
                          <Skeleton className="h-3 w-32 rounded" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-16 rounded" />
                        </div>
                        {activeStatusTab !== 'CLOSED' && (
                          <div className="flex justify-center">
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                    Không tìm thấy sự kiện nào phù hợp với bộ lọc.
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const realRegisteredCount = registeredCountMap[evt.id] ?? evt.registeredCount ?? 0
                    const isNearlyFull = evt.capacity > 0 && realRegisteredCount / evt.capacity >= 0.9
                    const isClosed = evt.status === 'CLOSED'
                    const eventTime = formatEventTime(evt.dateStart, evt.timeStart, evt.timeEnd)
                    const displayName = cleanEventName(evt.name)

                    return (
                      <div
                        key={evt.id}
                        onClick={() => onEventClick && onEventClick(evt.id)}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all px-5 py-3.5 grid items-center group cursor-pointer relative',
                          activeStatusTab === 'CLOSED'
                            ? 'grid-cols-[1fr_240px_110px_90px]'
                            : 'grid-cols-[1fr_240px_110px_110px_90px]',
                          isClosed && 'opacity-75 hover:opacity-95'
                        )}
                      >
                        {/* Cột 1: Tên sự kiện (chỉ 1 hàng + tooltip, dòng phụ: mã + loại sự kiện) */}
                        <div className="min-w-0 pr-4">
                          <p
                            title={displayName}
                            className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors truncate leading-snug"
                          >
                            {displayName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono tracking-wide">{evt.code}</span>
                            <span>·</span>
                            <span className="truncate">{evt.eventTypeName}</span>
                          </div>
                        </div>

                        {/* Cột 2: Thời gian & Địa điểm */}
                        <div className="space-y-1 text-[11px] pr-3">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{eventTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate" title={evt.location}>
                              {evt.location}
                            </span>
                          </div>
                        </div>

                        {/* Cột 3: Đăng ký (chỉ hiện text "1 / 300", màu nhấn khi >= 90%) */}
                        <div className="text-[11px] pr-2">
                          <span
                            className={cn(
                              'font-semibold text-xs',
                              isNearlyFull ? 'text-destructive' : 'text-foreground'
                            )}
                          >
                            {realRegisteredCount} / {evt.capacity}
                          </span>
                        </div>

                        {/* Cột 4: Trạng thái (chấm màu nhỏ + chữ; ẨN khi đang ở tab "Đã kết thúc") */}
                        {activeStatusTab !== 'CLOSED' && (
                          <div className="flex justify-center">
                            {renderStatus(evt.status)}
                          </div>
                        )}

                        {/* Cột 5: Thao tác */}
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onEditClick && (
                            <button
                              type="button"
                              title="Chỉnh sửa sự kiện"
                              onClick={() => onEditClick(evt)}
                              className="w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer shadow-2xs shrink-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Xem chi tiết sự kiện"
                            onClick={() => onEventClick && onEventClick(evt.id)}
                            className="w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/50 group-hover:bg-primary/5 transition-all cursor-pointer shadow-2xs shrink-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Mobile view (< 768px): Thẻ bo tròn cách nhau, không cuộn ngang */}
          <div
            key={`mobile-${activeStatusTab}`}
            className="flex flex-col gap-2.5 md:hidden animate-in fade-in-50 duration-150"
          >
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                Không tìm thấy sự kiện nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const realRegisteredCount = registeredCountMap[evt.id] ?? evt.registeredCount ?? 0
                const isNearlyFull = evt.capacity > 0 && realRegisteredCount / evt.capacity >= 0.9
                const eventTime = formatEventTime(evt.dateStart, evt.timeStart, evt.timeEnd)
                const displayName = cleanEventName(evt.name)

                return (
                  <div
                    key={evt.id}
                    onClick={() => onEventClick && onEventClick(evt.id)}
                    className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 space-y-2.5 shadow-2xs hover:border-primary/40 transition-all cursor-pointer"
                  >
                    <div>
                      <p
                        title={displayName}
                        className="font-semibold text-foreground text-xs truncate leading-snug"
                      >
                        {displayName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-mono tracking-wide">{evt.code}</span>
                        <span>·</span>
                        <span className="truncate">{evt.eventTypeName}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{eventTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate" title={evt.location}>
                          {evt.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                      <span
                        className={cn(
                          'font-medium',
                          isNearlyFull ? 'text-destructive font-semibold' : 'text-foreground'
                        )}
                      >
                        {realRegisteredCount} / {evt.capacity} đăng ký
                      </span>
                      {activeStatusTab !== 'CLOSED' && renderStatus(evt.status)}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Phân trang */}
          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Hiển thị <strong>{filteredEvents.length}</strong> trên tổng số{' '}
              <strong>{validEvents.length}</strong> sự kiện
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled
                className="px-3 h-8 rounded-lg border border-border/80 bg-white dark:bg-card text-muted-foreground/60 cursor-not-allowed text-xs font-medium"
              >
                Trước
              </button>
              <button
                type="button"
                className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="px-3 h-8 rounded-lg border border-border/80 bg-white dark:bg-card text-muted-foreground/60 cursor-not-allowed text-xs font-medium"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc Drawer */}
      <EventFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialValues={drawerFilterValues}
        onApply={(values) => setDrawerFilterValues(values)}
        events={validEvents as any}
        hideFanpageFilter={true}
      />
    </div>
  )
}
