import React, { useState, useMemo, useRef, useEffect } from 'react'
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
import type { AdminEvent, EventStatus } from '../types/fanpageAdmin.types'
import { MOCK_ADMIN_EVENTS, MOCK_EVENT_TYPES } from '../services/fanpageAdminService'

interface FanpageEventListViewProps {
  events?: AdminEvent[]
  onCreateEventClick?: () => void
  onEventClick?: (eventId: string) => void
  onEditClick?: (event: AdminEvent) => void
}

export const FanpageEventListView: React.FC<FanpageEventListViewProps> = ({
  events = MOCK_ADMIN_EVENTS,
  onCreateEventClick,
  onEventClick,
  onEditClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // Đóng popover bộ lọc khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lọc bỏ trạng thái DRAFT nếu không dùng
  const validEvents = useMemo(() => events.filter((e) => e.status !== 'DRAFT'), [events])

  // Lọc sự kiện theo tab và từ khóa
  const filteredEvents = useMemo(() => {
    return validEvents.filter((evt) => {
      const matchSearch =
        evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchType =
        selectedType === 'ALL' || evt.eventTypeId.toString() === selectedType

      let matchStatus = true
      if (activeStatusTab === 'UPCOMING') {
        // Sự kiện sắp diễn ra: ngày bắt đầu từ hôm nay trở đi và chưa kết thúc
        matchStatus = evt.dateStart >= '2026-10-24' && evt.status !== 'CLOSED'
      } else if (activeStatusTab !== 'ALL') {
        matchStatus = evt.status === activeStatusTab
      }

      return matchSearch && matchType && matchStatus
    })
  }, [validEvents, searchTerm, selectedType, activeStatusTab])

  // Count summaries
  const totalCount = validEvents.length
  const upcomingCount = validEvents.filter(
    (e) => e.dateStart >= '2026-10-24' && e.status !== 'CLOSED'
  ).length
  const publishedCount = validEvents.filter((e) => e.status === 'PUBLISHED').length
  const closedCount = validEvents.filter((e) => e.status === 'CLOSED').length

  // Danh sách quyền lợi chi tiết của sự kiện (dùng cho popover)
  const getEventBenefits = (evt: AdminEvent) => {
    const list: { title: string; desc: string }[] = []
    if (evt.trainingPoints && evt.trainingPoints > 0) {
      list.push({
        title: `+${evt.trainingPoints} ĐRL`,
        desc: evt.trainingPointCategoryName || 'Cộng điểm rèn luyện theo quy chế Nhà trường',
      })
    }
    if (evt.sv5tCriteriaName) {
      list.push({
        title: 'Tiêu chuẩn SV5T',
        desc: evt.sv5tCriteriaName,
      })
    }
    if (evt.hasCertificate) {
      list.push({
        title: 'Giấy chứng nhận',
        desc: 'Cấp chứng nhận điện tử sau khi hoàn thành điểm danh',
      })
    }
    return list
  }

  // Trend Badge Helper theo chuẩn thiết kế card tổng quan
  const getTrendBadge = (
    trend: { value: string; isUp?: boolean },
    variant: 'success' | 'neutral' | 'danger'
  ) => {
    const arrow = trend.isUp ? '▲' : '▼'

    if (variant === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
          <span>{arrow}</span>
          <span>{trend.value}</span>
        </span>
      )
    }

    if (variant === 'danger') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-400">
          <span>{arrow}</span>
          <span>{trend.value}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280] dark:bg-muted dark:text-muted-foreground">
        <span>{arrow}</span>
        <span>{trend.value}</span>
      </span>
    )
  }

  // 4 Cards thống kê (chỉ hiển thị tăng/giảm cho card Tất cả sự kiện)
  const statsCards = [
    {
      id: 'ALL',
      title: 'Tất cả sự kiện',
      value: totalCount,
      trend: {
        value: '25%',
        isUp: true,
      },
      trendVariant: 'success' as const,
      subText: '4 sự kiện trong tháng này',
    },
    {
      id: 'UPCOMING',
      title: 'Sự kiện sắp diễn ra',
      value: upcomingCount,
      subText: 'Sự kiện kế tiếp: 05/11',
    },
    {
      id: 'PUBLISHED',
      title: 'Đang mở đăng ký',
      value: publishedCount,
      subText: 'Sẵn sàng tiếp nhận sinh viên',
    },
    {
      id: 'CLOSED',
      title: 'Đã kết thúc',
      value: closedCount,
      subText: 'Đã hoàn thành tổ chức',
    },
  ]

  // Badge trạng thái thu gọn, không gây tràn dòng
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Đang mở
          </span>
        )
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            Kết thúc
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
            Đã hủy
          </span>
        )
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            Bản nháp
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị fanpage</span>
            <span>/</span>
            <span className="text-primary font-bold">Sự kiện</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý sự kiện
          </h1>
          <p className="text-xs text-muted-foreground">
            Tạo, theo dõi số lượng đăng ký và cập nhật toàn bộ sự kiện của fanpage trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateEventClick}
          className="px-4 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tạo sự kiện mới</span>
        </button>
      </div>

      {/* 2. Thống kê sự kiện (4 Cards hiển thị thông tin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div
            key={card.id}
            className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white dark:bg-card border border-border/80 text-left hover:shadow-xs transition-shadow"
          >
            {/* Top: Tiêu đề chỉ số */}
            <div className="text-xs sm:text-sm font-normal text-[#667085] dark:text-muted-foreground line-clamp-1 mb-2">
              {card.title}
            </div>

            {/* Middle: Con số lớn + Badge tăng/giảm (chỉ hiển thị với Tất cả sự kiện) */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-bold font-k2d text-foreground tracking-tight leading-none">
                {card.value}
              </span>
              {card.trend && getTrendBadge(card.trend, card.trendVariant || 'success')}
            </div>

            {/* Bottom: Dòng thông tin phụ so sánh / trạng thái */}
            <div className="text-xs text-[#667085] dark:text-muted-foreground truncate">
              {card.subText}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Danh sách sự kiện & Toolbar */}
      <div className="flex flex-col mt-2">
        {/* Hàng Tab Bar phía trên: Chuẩn phong cách Folder Tab như bên Student */}
        <div className="flex items-end gap-1 sm:gap-2 -mb-px relative z-10 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'Tất cả', count: totalCount },
            { id: 'UPCOMING', label: 'Sắp diễn ra', count: upcomingCount },
            { id: 'PUBLISHED', label: 'Đang mở đăng ký', count: publishedCount },
            { id: 'CLOSED', label: 'Đã kết thúc', count: closedCount },
          ].map((tab) => {
            const isActive = activeStatusTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                className={`px-5 py-2.5 text-sm transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white dark:bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-[#E5E7EB] dark:border-border shadow-2xs pb-3'
                    : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-t-lg'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs ${
                    isActive
                      ? 'text-foreground/80 font-normal'
                      : 'text-muted-foreground/70 font-normal'
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            )
          })}
        </div>

        {/* Khung chính chứa Toolbar & Bảng sự kiện */}
        <div
          className={`bg-white dark:bg-card border border-[#E5E7EB] dark:border-border ${
            activeStatusTab === 'ALL' ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
          } p-4 sm:p-5 flex flex-col gap-4 shadow-2xs`}
        >
          {/* Header trong panel: Tiêu đề bên trái, Search & Filter kiểu Student bên phải */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div>
              <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
                Danh sách sự kiện
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quản lý, theo dõi số lượng đăng ký và điểm danh toàn bộ sự kiện của fanpage.
              </p>
            </div>

            {/* Toolbar góc phải: Search + Bộ lọc (Student style) */}
            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto w-full md:w-auto">
              {/* Ô tìm kiếm kiểu Student */}
              <div className="relative flex-1 sm:w-72 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện, mã code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#1B4B8A] focus:border-[#1B4B8A] transition-colors shadow-2xs"
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

              {/* Nút Bộ lọc kiểu Student */}
              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors shrink-0 shadow-2xs cursor-pointer ${
                    selectedType !== 'ALL' || isFilterOpen
                      ? 'bg-primary/5 text-primary border-primary/40 dark:bg-primary/20'
                      : 'text-[#374151] dark:text-foreground bg-white dark:bg-card border-[#E5E7EB] dark:border-border hover:bg-muted/50'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4 text-[#374151] dark:text-foreground" />
                  <span>Bộ lọc</span>
                  {selectedType !== 'ALL' && (
                    <span className="h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>

                {/* Popover Bộ lọc khi bấm vào nút */}
                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-card border border-border rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <span className="text-xs font-bold text-foreground">Loại sự kiện</span>
                      {selectedType !== 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setSelectedType('ALL')}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Đặt lại</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 max-h-56 overflow-y-auto custom-scrollbar">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedType('ALL')
                          setIsFilterOpen(false)
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          selectedType === 'ALL'
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>Tất cả loại</span>
                        {selectedType === 'ALL' && <span>✓</span>}
                      </button>
                      {MOCK_EVENT_TYPES.map((t) => {
                        const isSelected = selectedType === t.id.toString()
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedType(t.id.toString())
                              setIsFilterOpen(false)
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <span>{t.name}</span>
                            {isSelected && <span>✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bảng danh sách sự kiện: Dạng Floating Rounded Rows theo chuẩn hình mẫu */}
          <div className="p-4 sm:p-5 bg-[#F9FAFB]/50 dark:bg-background/40 overflow-x-auto">
            <div className="min-w-[840px]">
              {/* Header hàng cột phẳng, chữ xám nhẹ, không viền gồ ghề */}
              <div className="grid grid-cols-12 items-center px-5 py-2.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground">
                <div className="col-span-4">Tên sự kiện</div>
                <div className="col-span-3">Thời gian & Địa điểm</div>
                <div className="col-span-2">Đăng ký / Sức chứa</div>
                <div className="col-span-1">Quyền lợi</div>
                <div className="col-span-1 text-center">Trạng thái</div>
                <div className="col-span-1 text-right">Chi tiết</div>
              </div>

              {/* Danh sách các hàng sự kiện dạng Floating Rounded Cards */}
              <div
                key={activeStatusTab}
                className="flex flex-col gap-2.5 mt-1 animate-in fade-in-50 slide-in-from-bottom-1 duration-200 ease-out"
              >
                {filteredEvents.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                    Không tìm thấy sự kiện nào phù hợp với bộ lọc.
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const regPercent = Math.min(
                      100,
                      Math.round((evt.registeredCount / evt.capacity) * 100)
                    )
                    const benefits = getEventBenefits(evt)

                    return (
                      <div
                        key={evt.id}
                        className="bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all px-5 py-3.5 grid grid-cols-12 items-center group cursor-pointer"
                        onClick={() => onEventClick && onEventClick(evt.id)}
                      >
                        {/* Cột 1: Tên sự kiện & Mã code (đã bỏ icon AI) */}
                        <div className="col-span-4 min-w-0 pr-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors text-left line-clamp-1">
                              {evt.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="font-semibold text-primary tracking-wide">{evt.code}</span>
                              <span>•</span>
                              <span className="truncate">{evt.eventTypeName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cột 2: Thời gian & Địa điểm */}
                        <div className="col-span-3 space-y-1 text-[11px] pr-2">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>
                              {evt.dateStart} · {evt.timeStart} - {evt.timeEnd}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground line-clamp-1">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        </div>

                        {/* Cột 3: Đăng ký / Sức chứa */}
                        <div className="col-span-2 space-y-1.5 pr-4">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-foreground">
                              {evt.registeredCount} / {evt.capacity}
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {regPercent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${regPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Cột 4: Quyền lợi */}
                        <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                          <div className="relative group/benefits inline-block text-left py-0.5">
                            <div className="flex items-center gap-1.5 cursor-pointer">
                              {evt.trainingPoints && evt.trainingPoints > 0 ? (
                                <span className="font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-[11px] whitespace-nowrap">
                                  +{evt.trainingPoints} ĐRL
                                </span>
                              ) : evt.sv5tCriteriaName ? (
                                <span className="font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 text-[11px] whitespace-nowrap">
                                  SV5T
                                </span>
                              ) : evt.hasCertificate ? (
                                <span className="font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 text-[11px] whitespace-nowrap">
                                  Chứng nhận
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Không có
                                </span>
                              )}

                              {benefits.length > 1 && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap bg-slate-100 text-slate-600 border-slate-200 group-hover/benefits:bg-slate-200 group-hover/benefits:text-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                  title="Rê chuột để xem thêm quyền lợi"
                                >
                                  +{benefits.length - 1}
                                </span>
                              )}
                            </div>

                            {/* Hover Popover */}
                            {benefits.length > 0 && (
                              <div className="invisible opacity-0 group-hover/benefits:visible group-hover/benefits:opacity-100 transition-all duration-150 pointer-events-none group-hover/benefits:pointer-events-auto absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-card border border-border rounded-xl shadow-xl p-4 z-50 text-left">
                                <h4 className="font-bold text-xs text-foreground mb-3 pb-2 border-b border-border">
                                  Quyền lợi ({benefits.length})
                                </h4>
                                <div className="space-y-3">
                                  {benefits.map((b, idx) => (
                                    <div key={idx} className="space-y-0.5">
                                      <p className="font-bold text-xs text-foreground">
                                        {b.title}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {b.desc}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cột 5: Trạng thái */}
                        <div className="col-span-1 flex justify-center">
                          {getStatusBadge(evt.status)}
                        </div>

                        {/* Cột 6: Nút thao tác Chỉnh sửa & Xem chi tiết */}
                        <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
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

          {/* Phân trang */}
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Hiển thị <strong>{filteredEvents.length}</strong> trên tổng số{' '}
              <strong>{validEvents.length}</strong> sự kiện
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="px-3 h-8 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed text-xs font-medium"
              >
                Trước
              </button>
              <button
                type="button"
                className="px-3 h-8 rounded-lg border border-primary bg-primary text-white text-xs font-semibold"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="px-3 h-8 rounded-lg border border-border bg-muted/30 text-muted-foreground cursor-not-allowed text-xs font-medium"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

