import { Tooltip } from '@/components/ui/tooltip'
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  EventFilterModal,
  type EventFilterFormValues,
  resolveAllowedPointCategoryIds,
  eventFilterOptionsService,
  type EventFilterOptions,
} from '@/features/events'
import type { AdminEvent } from '../types/fanpageAdmin.types'
import { adminEventState, adminEventTiming, adminRegistrationLabel } from '../utils/adminEventState'
import { useTimeBoundary } from '@/shared/hooks/useTimeBoundary'
import { nextTimeBoundary } from '@/shared/utils/registrationEligibility'
import { MOCK_ADMIN_EVENTS, fanpageAdminService } from '../services/fanpageAdminService'

// Định dạng thời gian: "04/11/2026 · 07:00" (không hiển thị "07:00 - 07:00" khi giờ bắt đầu và kết thúc giống nhau)
function formatEventTime(dateStart: string, timeStart: string, timeEnd: string): string {
  let datePart: string
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
  const [dateSort, setDateSort] = useState<'asc' | 'desc' | null>(null)
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
  const now = useTimeBoundary(
    nextTimeBoundary(
      events.flatMap((event) =>
        Object.values(adminEventTiming(event))
          .filter((value): value is number => value !== null)
          .map((value) => new Date(value).toISOString())
      )
    )
  )
  const eventStates = useMemo(
    () =>
      new Map(
        events.map((event) => [event.id, adminEventState(event, registeredCountMap[event.id], now)])
      ),
    [events, registeredCountMap, now]
  )

  const { data: filterOptions } = useQuery<EventFilterOptions>({
    queryKey: ['event-filter-options'],
    queryFn: () => eventFilterOptionsService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  })

  const activeFilterCount = useMemo(() => {
    return [
      drawerFilterValues.status,
      drawerFilterValues.eventTypeId,
      drawerFilterValues.pointCategoryId,
      drawerFilterValues.criteriaId,
      drawerFilterValues.semesterId && drawerFilterValues.semesterId !== 'ALL'
        ? drawerFilterValues.semesterId
        : null,
      drawerFilterValues.academicYear && drawerFilterValues.academicYear !== 'ALL'
        ? drawerFilterValues.academicYear
        : null,
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

    const selectedTypeLabels = rawTypeIds.map((tid) => {
      const found = filterOptions?.eventTypes?.find((et) => String(et.id) === String(tid))
      return (found?.label || tid).toLowerCase()
    })

    const selectedCritLabels = rawCritIds.map((cid) => {
      const found = filterOptions?.criterias?.find((c) => String(c.id) === String(cid))
      return (found?.label || cid).toLowerCase().replace('tiêu chuẩn', '').trim()
    })

    // Resolve allowed point categories respecting parent/child hierarchy
    const allowedPointCatIds = resolveAllowedPointCategoryIds(
      rawPointCatIds,
      filterOptions?.pointCategories
    )

    // Resolve allowed SV5T criteria respecting parent/child hierarchy
    const allowedCritIds = new Set<string>()
    const critNames: string[] = []
    const keywords: string[] = []
    rawCritIds.forEach((cid) => {
      allowedCritIds.add(cid)
      const crit = filterOptions?.criterias?.find((c) => String(c.id) === cid)
      if (crit?.childIds) {
        crit.childIds.forEach((id) => allowedCritIds.add(String(id)))
      }
      if (crit?.childNames) {
        crit.childNames.forEach((cn) => critNames.push(cn.toLowerCase()))
      }
      if (crit?.keywords) {
        crit.keywords.forEach((kw) => keywords.push(kw.toLowerCase()))
      }
      if (crit?.label) {
        const clean = crit.label.toLowerCase().replace('tiêu chuẩn', '').trim()
        critNames.push(clean)
        if (clean.includes('tình nguyện')) keywords.push('tình nguyện', 'hiến máu')
        else if (clean.includes('đạo đức')) keywords.push('đạo đức', 'lối sống')
        else if (clean.includes('thể lực')) keywords.push('thể lực', 'thể thao')
        else if (clean.includes('học tập')) keywords.push('học tập')
        else if (clean.includes('hội nhập')) keywords.push('hội nhập', 'ngoại ngữ', 'tin học')
      }
    })

    // Resolve academic year matching semester IDs
    const matchingYearSemesterIds = new Set<string>()
    if (
      drawerFilterValues.academicYear &&
      drawerFilterValues.academicYear !== 'ALL' &&
      filterOptions?.semesters
    ) {
      filterOptions.semesters.forEach((s) => {
        if (s.academicYear === drawerFilterValues.academicYear) {
          matchingYearSemesterIds.add(String(s.id))
        }
      })
    }

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

      const state = eventStates.get(evt.id)!
      if (activeStatusTab !== 'ALL' && state.tab !== activeStatusTab) return false

      // 3. Drawer Status (OPEN_REGISTRATION, PUBLISHED, COMPLETED...)
      if (rawStatus.length > 0) {
        const matchesStatus = rawStatus.some((key) =>
          key === 'PUBLISHED'
            ? state.label === 'Chờ diễn ra' || state.tab === 'OPEN_REGISTRATION'
            : key === 'CLOSED_REGISTRATION'
              ? adminRegistrationLabel(evt, registeredCountMap[evt.id], now) === 'Đã đóng đăng ký'
              : state.tab === key
        )
        if (!matchesStatus) return false
      }

      // 4. Event Types (Multi-select)
      if (rawTypeIds.length > 0) {
        const evtTypeId = String(evt.eventTypeId || '')
        const evtTypeName = (evt.eventTypeName || '').toLowerCase()
        const evtTitle = (evt.name || '').toLowerCase()

        const matchesType =
          (evtTypeId && rawTypeIds.includes(evtTypeId)) ||
          selectedTypeLabels.some(
            (lbl) =>
              lbl &&
              (evtTypeName.includes(lbl) || lbl.includes(evtTypeName) || evtTitle.includes(lbl))
          ) ||
          rawTypeIds.some(
            (tid) => evtTypeName.includes(tid.toLowerCase()) || evtTitle.includes(tid.toLowerCase())
          )

        if (!matchesType) return false
      }

      // 5. Point Categories (ĐRL)
      if (rawPointCatIds.length > 0) {
        const pPoints = (evt as any).eventPoints || []
        const evtCatId = Number((evt as any).pointCategoryId || '')
        const hasPointMatch =
          (allowedPointCatIds.size > 0 &&
            (allowedPointCatIds.has(evtCatId) ||
              pPoints.some((ep: any) =>
                allowedPointCatIds.has(Number(ep.pointCategoryId || ep.id))
              ))) ||
          rawPointCatIds.includes(String((evt as any).pointCategoryId || '')) ||
          pPoints.some((ep: any) => rawPointCatIds.includes(String(ep.pointCategoryId || ep.id)))

        if (!hasPointMatch) return false
      }

      // 6. SV5T Criteria
      if (rawCritIds.length > 0) {
        const evtCritId = String(evt.sv5tCriteriaId || (evt as any).criteriaId || '')
        const evtCritName = (evt.sv5tCriteriaName || (evt as any).criteriaName || '').toLowerCase()
        const hasCritMatch =
          (evtCritId && allowedCritIds.has(evtCritId)) ||
          (evtCritName &&
            critNames.some((cn) => cn && (evtCritName.includes(cn) || cn.includes(evtCritName)))) ||
          (evtCritName && keywords.some((kw) => kw && evtCritName.includes(kw))) ||
          selectedCritLabels.some(
            (lbl) => lbl && evtCritName && (evtCritName.includes(lbl) || lbl.includes(evtCritName))
          )

        if (!hasCritMatch) return false
      }

      // 7. Academic Year & Semester
      if (drawerFilterValues.academicYear && drawerFilterValues.academicYear !== 'ALL') {
        const pSemId = String(evt.semesterId || '')
        const pYear = String((evt as any).academicYear || '')
        if (pYear && pYear === drawerFilterValues.academicYear) {
          // match directly
        } else if (pSemId && matchingYearSemesterIds.size > 0) {
          if (!matchingYearSemesterIds.has(pSemId)) return false
        }
      }

      if (drawerFilterValues.semesterId && drawerFilterValues.semesterId !== 'ALL') {
        if (String(evt.semesterId) !== String(drawerFilterValues.semesterId)) return false
      }

      // 8. Date Happen Range
      if (drawerFilterValues.dateHappenFrom) {
        const d = evt.dateStart || evt.dateHappen
        if (d && d.slice(0, 10) < drawerFilterValues.dateHappenFrom) return false
      }
      if (drawerFilterValues.dateHappenTo) {
        const d = evt.dateEnd || evt.dateStart || evt.dateHappen
        if (d && d.slice(0, 10) > drawerFilterValues.dateHappenTo) return false
      }

      return true
    })
  }, [
    validEvents,
    searchTerm,
    activeStatusTab,
    drawerFilterValues,
    filterOptions,
    eventStates,
    registeredCountMap,
    now,
  ])

  const sortedEvents = useMemo(() => {
    if (!dateSort) return filteredEvents
    const eventTime = (event: AdminEvent) => {
      for (const value of [event.dateHappen, event.dateStart]) {
        if (!value) continue
        const timestamp = Date.parse(
          /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T${event.timeStart || '00:00'}` : value
        )
        if (Number.isFinite(timestamp)) return timestamp
      }
      return null
    }
    return [...filteredEvents].sort((a, b) => {
      const left = eventTime(a)
      const right = eventTime(b)
      if (left == null) return right == null ? 0 : 1
      if (right == null) return -1
      return dateSort === 'desc' ? right - left : left - right
    })
  }, [filteredEvents, dateSort])

  const counts = useMemo(
    () => ({
      all: validEvents.length,
      open: [...eventStates.values()].filter((state) => state.tab === 'OPEN_REGISTRATION').length,
      ongoing: [...eventStates.values()].filter((state) => state.tab === 'ONGOING').length,
      completed: [...eventStates.values()].filter((state) => state.tab === 'COMPLETED').length,
      cancelled: [...eventStates.values()].filter((state) => state.tab === 'CANCELLED').length,
      draft: [...eventStates.values()].filter((state) => state.tab === 'DRAFT').length,
    }),
    [validEvents, eventStates]
  )

  const renderStatus = (event: AdminEvent) => {
    const state = eventStates.get(event.id)!
    return (
      <span className="inline-flex flex-col gap-1 text-xs">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-foreground">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', state.color)} />
          {state.label}
        </span>
        {state.detail && (
          <span className="pl-3.5 text-[11px] text-muted-foreground">{state.detail}</span>
        )}
      </span>
    )
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
            <h1 className="font-k2d font-bold text-2xl text-foreground">Quản lý sự kiện</h1>
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
            { id: 'OPEN_REGISTRATION', label: 'Đang mở đăng ký', count: counts.open },
            { id: 'ONGOING', label: 'Đang diễn ra', count: counts.ongoing },
            { id: 'COMPLETED', label: 'Đã kết thúc', count: counts.completed },
            { id: 'CANCELLED', label: 'Đã hủy', count: counts.cancelled },
            { id: 'DRAFT', label: 'Bản nháp', count: counts.draft },
          ].map((tab) => {
            const isActive = activeStatusTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                aria-pressed={isActive}
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
              {filteredEvents.length} sự kiện{' '}
              {activeStatusTab !== 'ALL' ? 'trong mục này' : 'tổng cộng'}
            </div>
          </div>

          {/* Thanh tóm tắt tiêu chí lọc đang áp dụng */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs">
              <span className="text-primary font-medium">
                Đang áp dụng {activeFilterCount} tiêu chí lọc ({filteredEvents.length} sự kiện phù
                hợp)
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
                  activeStatusTab === 'COMPLETED'
                    ? 'grid-cols-[1fr_240px_110px_90px]'
                    : 'grid-cols-[1fr_220px_110px_170px_90px]'
                )}
              >
                <div>Tên sự kiện</div>
                <div>
                  <Tooltip
                    content={
                      dateSort === 'desc' ? 'Sắp xếp cũ nhất trước' : 'Sắp xếp mới nhất trước'
                    }
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2 h-8 gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground"
                      aria-label={`Thời gian & Địa điểm: ${dateSort === 'desc' ? 'mới nhất trước' : dateSort === 'asc' ? 'cũ nhất trước' : 'chưa sắp xếp'}`}
                      onClick={() =>
                        setDateSort((previous) => (previous === 'desc' ? 'asc' : 'desc'))
                      }
                    >
                      Thời gian &amp; Địa điểm
                      {dateSort === 'desc' ? (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ) : dateSort === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </Tooltip>
                </div>
                <div>Đăng ký</div>
                {activeStatusTab !== 'COMPLETED' && <div className="text-left">Trạng thái</div>}
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
                          activeStatusTab === 'COMPLETED'
                            ? 'grid-cols-[1fr_240px_110px_90px]'
                            : 'grid-cols-[1fr_220px_110px_170px_90px]'
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
                        {activeStatusTab !== 'COMPLETED' && (
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
                  sortedEvents.map((evt) => {
                    const realRegisteredCount =
                      registeredCountMap[evt.id] ?? evt.registeredCount ?? 0
                    const isNearlyFull =
                      evt.capacity > 0 && realRegisteredCount / evt.capacity >= 0.9
                    const isClosed = eventStates.get(evt.id)?.tab === 'COMPLETED'
                    const eventTime = formatEventTime(evt.dateStart, evt.timeStart, evt.timeEnd)
                    const displayName = cleanEventName(evt.name)

                    return (
                      <div
                        key={evt.id}
                        onClick={() => onEventClick && onEventClick(evt.id)}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all px-5 py-3.5 grid items-center group cursor-pointer relative',
                          activeStatusTab === 'COMPLETED'
                            ? 'grid-cols-[1fr_240px_110px_90px]'
                            : 'grid-cols-[1fr_220px_110px_170px_90px]',
                          isClosed && 'opacity-75 hover:opacity-95'
                        )}
                      >
                        {/* Cột 1: Tên sự kiện (chỉ 1 hàng + tooltip, dòng phụ: mã + loại sự kiện) */}
                        <div className="min-w-0 pr-4">
                          <Tooltip content={displayName}>
                            <p className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors truncate leading-snug">
                              {displayName}
                            </p>
                          </Tooltip>
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
                            <Tooltip content={evt.location}>
                              <span className="truncate">{evt.location}</span>
                            </Tooltip>
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
                        {activeStatusTab !== 'COMPLETED' && (
                          <div className="flex justify-start text-left">{renderStatus(evt)}</div>
                        )}

                        {/* Cột 5: Thao tác */}
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onEditClick && (
                            <Tooltip content="Chỉnh sửa sự kiện">
                              <button
                                type="button"
                                aria-label="Chỉnh sửa sự kiện"
                                onClick={() => onEditClick(evt)}
                                className="w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer shadow-2xs shrink-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content="Xem chi tiết sự kiện">
                            <button
                              type="button"
                              aria-label="Xem chi tiết sự kiện"
                              onClick={() => onEventClick && onEventClick(evt.id)}
                              className="w-8 h-8 rounded-full border border-border/80 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/50 group-hover:bg-primary/5 transition-all cursor-pointer shadow-2xs shrink-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </Tooltip>
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
              sortedEvents.map((evt) => {
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
                      <Tooltip content={displayName}>
                        <p className="font-semibold text-foreground text-xs truncate leading-snug">
                          {displayName}
                        </p>
                      </Tooltip>
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
                        <Tooltip content={evt.location}>
                          <span className="truncate">{evt.location}</span>
                        </Tooltip>
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
                      {activeStatusTab !== 'COMPLETED' && renderStatus(evt)}
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
