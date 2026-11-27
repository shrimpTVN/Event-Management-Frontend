import { Tooltip } from '@/components/ui/tooltip'
import { AdminActionMenu } from './AdminActionMenu'
import { EventBenefitsModal } from './modals/EventBenefitsModal'
import { EventStatusBadge, AdminPaginationBar } from './AdminDetails'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import React, { useState, useMemo } from 'react'
import {
  Search,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { SuperAdminEvent, AdminEventStatus } from '../types/superAdmin.types'

interface SuperAdminEventsViewProps {
  events: SuperAdminEvent[]
  onSelectEvent: (event: SuperAdminEvent) => void
  onToggleHideEvent: (eventId: string, reason?: string) => void
  page?: number
  totalPages?: number
  totalElements?: number
  onPageChange?: (page: number) => void
  statusFilter?: 'ALL' | AdminEventStatus
  onStatusFilterChange?: (status: 'ALL' | AdminEventStatus) => void
  searchQuery?: string
  onSearchChange?: (keyword: string) => void
}

export const SuperAdminEventsView: React.FC<SuperAdminEventsViewProps> = ({
  events,
  onSelectEvent,
  onToggleHideEvent,
  page = 0,
  totalPages = 1,
  totalElements,
  onPageChange,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
  searchQuery: controlledSearchQuery,
  onSearchChange,
}) => {
  const [benefitsEvent, setBenefitsEvent] = useState<SuperAdminEvent | null>(null)
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [internalStatusFilter, setInternalStatusFilter] = useState<'ALL' | AdminEventStatus>('ALL')
  const searchQuery = controlledSearchQuery ?? internalSearchQuery
  const statusFilter = controlledStatusFilter ?? internalStatusFilter
  const setSearchQuery = (val: string) => {
    setInternalSearchQuery(val)
    onSearchChange?.(val)
  }
  const setStatusFilter = (val: 'ALL' | AdminEventStatus) => {
    setInternalStatusFilter(val)
    onStatusFilterChange?.(val)
  }
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLButtonElement | null>(null)

  const totalCount = events.length
  const openCount = events.filter((e) => e.status === 'OPEN').length
  const happeningCount = events.filter((e) => e.status === 'HAPPENING').length
  const completedCount = events.filter((e) => e.status === 'COMPLETED').length
  const violatedCount = events.filter(
    (e) => e.status === 'VIOLATED' || e.status === 'HIDDEN'
  ).length

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.fanpageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchTab =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'VIOLATED'
            ? evt.status === 'VIOLATED' || evt.status === 'HIDDEN'
            : evt.status === statusFilter

      return matchSearch && matchTab
    })
  }, [events, searchQuery, statusFilter])

  const tabs = [
    { id: 'ALL' as const, label: 'Tất cả sự kiện', count: totalCount },
    { id: 'OPEN' as const, label: 'Đang mở đăng ký', count: openCount },
    { id: 'HAPPENING' as const, label: 'Đang diễn ra', count: happeningCount },
    { id: 'COMPLETED' as const, label: 'Đã đóng', count: completedCount },
    {
      id: 'DRAFT' as const,
      label: 'Bản nháp',
      count: events.filter((e) => e.status === 'DRAFT').length,
    },
    {
      id: 'CANCELLED' as const,
      label: 'Đã hủy',
      count: events.filter((e) => e.status === 'CANCELLED').length,
    },
    { id: 'VIOLATED' as const, label: 'Vi phạm / Ẩn', count: violatedCount },
  ]

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-in fade-in duration-300">
      <EventBenefitsModal event={benefitsEvent} onClose={() => setBenefitsEvent(null)} />
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Sự kiện toàn trường</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Kiểm duyệt &amp; Giám sát sự kiện
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi tiến độ, kiểm duyệt nội dung và xử lý báo cáo vi phạm sự kiện trên toàn hệ
            thống ĐHCT.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {violatedCount > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 " />
              <span>{violatedCount} sự kiện vi phạm / ẩn</span>
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted/40 dark:bg-muted/40 text-muted-foreground border border-border dark:border-border">
            Tổng {totalElements ?? events.length} sự kiện
          </span>
        </div>
      </div>

      {/* 2. Khối bảng mở rộng kéo dài sang phải theo chuẩn nhóm trang Quản lý Fanpage */}
      <div className="flex flex-col mt-2">
        {/* Hàng Tab Bar dạng folder tab bo tròn trên đỉnh */}
        <div className="flex items-end gap-1.5 -mb-px relative z-10 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <Button
                variant="ghost"
                size="sm"
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'h-auto rounded-b-none px-4 sm:px-5 py-2.5 text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5',
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
              </Button>
            )
          })}
        </div>

        {/* Khung chính Bảng Trắng chứa Toolbar & Danh sách card hàng */}
        <div
          className={cn(
            'bg-white dark:bg-card border border-[#E5E7EB] dark:border-border p-4 sm:p-5 flex flex-col gap-4 shadow-2xs w-full',
            statusFilter === 'ALL' ? 'rounded-b-2xl rounded-tr-2xl rounded-tl-none' : 'rounded-2xl'
          )}
        >
          {/* Header trong panel: Ô tìm kiếm & tóm tắt */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Tìm sự kiện, đơn vị tổ chức, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-normal">
              {filteredEvents.length} sự kiện{' '}
              {statusFilter !== 'ALL' ? 'trong mục này' : 'tổng cộng'}
            </div>
          </div>

          {/* Bảng danh sách các dòng thiết kế dạng Card chuẩn như Quản lý Thành viên */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[880px]">
              {/* Header hàng cột phẳng */}
              <div className="grid grid-cols-[2.5fr_1.8fr_1.5fr_1.2fr_1.2fr_130px] items-center px-5 py-2 text-xs font-normal text-[#6B7280] dark:text-muted-foreground">
                <div>Tên sự kiện &amp; Đơn vị</div>
                <div>Thời gian &amp; Địa điểm</div>
                <div>Đăng ký / Chỉ tiêu</div>
                <div className="text-center">Quyền lợi</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-right min-w-[130px]">Thao tác</div>
              </div>

              {/* Danh sách các card hàng bo tròn (gap-2.5) */}
              <div className="flex flex-col gap-2.5 mt-1">
                {filteredEvents.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                    Không tìm thấy sự kiện nào phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const isViolated = evt.status === 'VIOLATED' || evt.status === 'HIDDEN'

                    return (
                      <div
                        key={evt.id}
                        onClick={() => onSelectEvent(evt)}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-xl hover:border-border dark:hover:border-border hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-all px-5 py-3.5 grid grid-cols-[2.5fr_1.8fr_1.5fr_1.2fr_1.2fr_130px] items-center group relative cursor-pointer',

                          openActionMenuId === evt.id ? 'z-50 border-[#1B4B8A]/40' : 'z-10'
                        )}
                      >
                        {/* 1. Tên sự kiện & Banner & Đơn vị */}
                        <div className="flex items-center gap-3 pr-3 min-w-0">
                          {evt.bannerUrl ? (
                            <img
                              src={evt.bannerUrl}
                              alt={evt.title}
                              className="h-10 w-12 rounded-xl object-cover shrink-0 border border-border/60 shadow-2xs"
                            />
                          ) : (
                            <div className="h-10 w-12 rounded-xl bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0 border border-border/60">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Tooltip content={evt.title}>
                              <p className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors">
                                {evt.title}
                              </p>
                            </Tooltip>
                            <Tooltip content={evt.fanpageName}>
                              <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                                {evt.fanpageName}
                              </p>
                            </Tooltip>
                          </div>
                        </div>

                        {/* 2. Thời gian & Địa điểm */}
                        <div className="flex flex-col gap-0.5 text-xs pr-2 min-w-0">
                          <p className="text-foreground/90 font-medium truncate flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{evt.startDateTime}</span>
                          </p>
                          <Tooltip content={evt.location}>
                            <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{evt.location}</span>
                            </p>
                          </Tooltip>
                        </div>

                        {/* Registration counts are shown only when supplied by the API. */}
                        <div className="flex flex-col gap-1 pr-4 text-xs">
                          <span className="font-semibold tabular-nums text-foreground">
                            {evt.registeredCount == null
                              ? 'Chưa có dữ liệu'
                              : evt.registeredCount.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-muted-foreground">
                            Chỉ tiêu: {evt.capacity ?? '—'}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setBenefitsEvent(evt)
                            }}
                          >
                            Xem quyền lợi
                          </Button>
                        </div>

                        {/* 5. Trạng thái */}
                        <div className="flex justify-center">
                          <EventStatusBadge status={evt.status} />
                        </div>
                        {/* 6. Thao tác hover kiểu Google Drive */}
                        <div className="text-right min-w-[130px] relative flex items-center justify-end">
                          <div className="flex items-center justify-end gap-1">
                            {/* Nút Xem chi tiết (mở Drawer) khi hover */}
                            <div
                              className={cn(
                                'items-center gap-1 transition-all duration-150',
                                openActionMenuId === evt.id
                                  ? 'flex opacity-100'
                                  : 'flex opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                              )}
                            >
                              <Tooltip content="Xem chi tiết & kiểm duyệt (Mở Drawer)">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectEvent(evt)
                                  }}
                                  aria-label="Xem chi tiết & kiểm duyệt (Mở Drawer)"
                                  className="h-8 w-8 rounded-lg p-0 flex items-center justify-center text-[#6B7280] hover:text-primary hover:bg-muted/40 dark:hover:bg-muted/40 dark:hover:text-muted-foreground transition-colors cursor-pointer"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            </div>

                            {/* Nút ba chấm chứa các tùy chọn còn lại */}
                            <div className="inline-block relative">
                              <Tooltip content="Tùy chọn khác">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActionMenuAnchor(e.currentTarget)
                                    setOpenActionMenuId(openActionMenuId === evt.id ? null : evt.id)
                                  }}
                                  className={cn(
                                    'h-8 w-8 rounded-lg p-0 flex items-center justify-center transition-colors cursor-pointer',
                                    openActionMenuId === evt.id
                                      ? 'bg-[#F3F4F6] dark:bg-muted text-foreground'
                                      : 'text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted opacity-60 group-hover:opacity-100'
                                  )}
                                  aria-label="Tùy chọn khác"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </Tooltip>

                              {openActionMenuId === evt.id && (
                                <AdminActionMenu
                                  anchor={actionMenuAnchor}
                                  onClose={() => setOpenActionMenuId(null)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-52 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 text-left animate-in fade-in-0 zoom-in-95 select-none"
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onSelectEvent(evt)
                                    }}
                                    className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Xem chi tiết sự kiện</span>
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onToggleHideEvent(evt.id)
                                    }}
                                    className={cn(
                                      'w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                                      isViolated
                                        ? 'text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/40'
                                        : 'text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30'
                                    )}
                                  >
                                    {isViolated ? (
                                      <>
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        <span>Khôi phục / Bỏ ẩn</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="h-3.5 w-3.5 shrink-0" />
                                        <span>Hạ / Ẩn sự kiện</span>
                                      </>
                                    )}
                                  </Button>
                                </AdminActionMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {onPageChange && (
            <AdminPaginationBar
              page={page}
              totalPages={totalPages}
              totalElements={totalElements ?? events.length}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
