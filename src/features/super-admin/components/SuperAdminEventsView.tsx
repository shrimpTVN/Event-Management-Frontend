import React, { useState, useMemo } from 'react'
import { Search, X, Eye, EyeOff, CheckCircle2, Calendar, MapPin, Clock } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { SuperAdminEvent, AdminEventStatus } from '../types/superAdmin.types'

interface SuperAdminEventsViewProps {
  events: SuperAdminEvent[]
  onSelectEvent: (event: SuperAdminEvent) => void
  onToggleHideEvent: (eventId: string, reason?: string) => void
}

export const SuperAdminEventsView: React.FC<SuperAdminEventsViewProps> = ({
  events,
  onSelectEvent,
  onToggleHideEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminEventStatus>('ALL')

  const totalCount = events.length
  const openCount = events.filter((e) => e.status === 'OPEN').length
  const happeningCount = events.filter((e) => e.status === 'HAPPENING').length
  const completedCount = events.filter((e) => e.status === 'COMPLETED').length
  const violatedCount = events.filter((e) => e.status === 'VIOLATED' || e.status === 'HIDDEN').length

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.fanpageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'VIOLATED'
          ? e.status === 'VIOLATED' || e.status === 'HIDDEN'
          : e.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [events, searchQuery, statusFilter])

  const statusTabs = [
    { id: 'ALL' as const, label: 'Tất cả sự kiện', count: totalCount },
    { id: 'OPEN' as const, label: 'Đang mở đăng ký', count: openCount },
    { id: 'HAPPENING' as const, label: 'Đang diễn ra', count: happeningCount },
    { id: 'VIOLATED' as const, label: 'Bị vi phạm / Ẩn', count: violatedCount },
    { id: 'COMPLETED' as const, label: 'Đã kết thúc', count: completedCount },
  ]

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Summary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-primary font-bold">Sự kiện</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý & kiểm duyệt sự kiện
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giám sát chất lượng hoạt động, xử lý tố cáo vi phạm và hạ sự kiện không phù hợp toàn trường.
          </p>
        </div>

        {violatedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{violatedCount} sự kiện vi phạm / bị ẩn</span>
          </span>
        )}
      </div>

      {/* 2. Connected Status Tabs */}
      <div className="space-y-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 px-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
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
            statusFilter === 'ALL' ? 'rounded-b-2xl rounded-tr-2xl' : 'rounded-2xl'
          )}
        >
          {/* Header trong panel: Ô tìm kiếm bên trái, số lượng tóm tắt bên phải */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm theo tên sự kiện, đơn vị, địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-normal">
              {filteredEvents.length} sự kiện {statusFilter !== 'ALL' ? 'trong mục này' : 'tổng cộng'}
            </div>
          </div>

          {/* Vùng chứa các card sự kiện bo tròn cách nhau */}
          <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 overflow-x-auto rounded-xl">
            <div className="min-w-[840px]">
              {/* Header hàng cột phẳng, chữ xám nhẹ */}
              <div className="grid grid-cols-[1fr_180px_180px_100px_120px_90px] items-center px-5 py-2 text-xs font-normal text-muted-foreground">
                <div>Tên sự kiện &amp; Đơn vị</div>
                <div>Thời gian &amp; Địa điểm</div>
                <div>Đăng ký / Chỉ tiêu</div>
                <div className="text-center">Quyền lợi</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-right">Thao tác</div>
              </div>

              {/* Danh sách các card hàng bo tròn */}
              <div className="flex flex-col gap-2.5 mt-1 animate-in fade-in-50 duration-150">
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
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid grid-cols-[1fr_180px_180px_100px_120px_90px] items-center shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all',
                          isViolated && 'border-red-200 dark:border-red-900/50 bg-red-50/20'
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
                            <p
                              className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors cursor-pointer"
                              onClick={() => onSelectEvent(evt)}
                            >
                              {evt.title}
                            </p>
                            <p className="text-[11px] text-primary font-medium truncate mt-0.5">
                              {evt.fanpageName}
                            </p>
                          </div>
                        </div>

                        {/* 2. Thời gian & Địa điểm */}
                        <div className="space-y-0.5 text-xs pr-2 min-w-0">
                          <p className="text-foreground/90 font-medium truncate flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{evt.startDateTime}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{evt.location}</span>
                          </p>
                        </div>

                        {/* 3. Đăng ký / Sức chứa */}
                        <div className="space-y-1 text-xs pr-4">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-foreground">
                              {evt.registeredCount}/{evt.capacity}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              {Math.round((evt.registeredCount / Math.max(1, evt.capacity)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F3F4F6] dark:bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                isViolated ? 'bg-red-500' : 'bg-[#1B4B8A]'
                              )}
                              style={{ width: `${Math.min(100, (evt.registeredCount / Math.max(1, evt.capacity)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 4. Quyền lợi (ĐRL / SV5T) */}
                        <div className="flex flex-col items-center justify-center gap-0.5 text-xs">
                          <span className="font-bold text-primary text-xs">+{evt.trainingPoint} ĐRL</span>
                          {evt.sv5tCriteriaName && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[90px]" title={evt.sv5tCriteriaName}>
                              {evt.sv5tCriteriaName}
                            </span>
                          )}
                        </div>

                        {/* 5. Trạng thái */}
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border',
                              evt.status === 'OPEN'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : evt.status === 'HAPPENING'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : evt.status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground border-slate-200 dark:border-border'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                evt.status === 'OPEN'
                                  ? 'bg-emerald-500'
                                  : evt.status === 'HAPPENING'
                                  ? 'bg-blue-500'
                                  : evt.status === 'COMPLETED'
                                  ? 'bg-slate-400'
                                  : 'bg-red-500'
                              )}
                            />
                            <span>
                              {evt.status === 'OPEN'
                                ? 'Đang mở'
                                : evt.status === 'HAPPENING'
                                ? 'Đang diễn ra'
                                : evt.status === 'COMPLETED'
                                ? 'Đã kết thúc'
                                : 'Vi phạm / Ẩn'}
                            </span>
                          </span>
                        </div>

                        {/* 6. Thao tác */}
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectEvent(evt)}
                            title="Xem chi tiết & kiểm duyệt"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleHideEvent(evt.id)}
                            title={isViolated ? 'Khôi phục sự kiện' : 'Hạ sự kiện vi phạm'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors cursor-pointer',
                              isViolated
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                            )}
                          >
                            {isViolated ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
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
    </div>
  )
}
