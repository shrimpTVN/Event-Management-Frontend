import React, { useState, useMemo } from 'react'
import { Search, Filter, Eye, EyeOff, CheckCircle2, Calendar } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Quản trị hệ thống</span>
          <span>/</span>
          <span className="text-primary font-semibold">Sự kiện</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-k2d font-bold text-foreground tracking-tight">
              Quản lý & kiểm duyệt sự kiện
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Giám sát chất lượng hoạt động, xử lý tố cáo vi phạm và hạ sự kiện không phù hợp
            </p>
          </div>
          {violatedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {violatedCount} Sự kiện vi phạm/bị ẩn
            </span>
          )}
        </div>
      </div>

      {/* 2. Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng sự kiện</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-foreground mt-1">{totalCount}</p>
        </div>

        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang mở đăng ký</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-emerald-600 mt-1">{String(openCount).padStart(2, '0')}</p>
        </div>

        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Đang diễn ra</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-primary mt-1">{happeningCount}</p>
        </div>

        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Bị vi phạm / Ẩn</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-red-600 mt-1">{violatedCount}</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sự kiện, đơn vị tổ chức, địa điểm..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-[#F9FAFB] dark:bg-muted/40 focus:bg-white dark:focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-hidden transition-all font-sans"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc:
          </span>
          {[
            { id: 'ALL' as const, label: 'Tất cả' },
            { id: 'OPEN' as const, label: 'Đang mở đăng ký' },
            { id: 'HAPPENING' as const, label: 'Đang diễn ra' },
            { id: 'COMPLETED' as const, label: 'Đã kết thúc' },
            { id: 'VIOLATED' as const, label: 'Bị ẩn / Vi phạm' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-[#F3F4F6] dark:bg-muted text-foreground/70 hover:bg-[#E5E7EB] dark:hover:bg-muted/80'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table View */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F9FAFB] dark:bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Tên Sự Kiện</th>
                <th className="py-3.5 px-4">Fanpage</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Địa Điểm</th>
                <th className="py-3.5 px-4">Số Lượng</th>
                <th className="py-3.5 px-4">ĐRL</th>
                <th className="py-3.5 px-4">SV5T</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy sự kiện nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#F9FAFB] dark:hover:bg-muted/20 transition-colors">
                    {/* Event Title + Banner thumbnail */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {evt.bannerUrl ? (
                          <img
                            src={evt.bannerUrl}
                            alt={evt.title}
                            className="w-12 h-9 rounded-lg object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-lg bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-foreground leading-tight truncate">
                            {evt.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Tạo ngày: {evt.createdAt}</p>
                        </div>
                      </div>
                    </td>

                    {/* Organizer Fanpage */}
                    <td className="py-3.5 px-4 font-semibold text-primary">{evt.fanpageName}</td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {evt.startDateTime}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-xs text-foreground/80 max-w-[140px] truncate">
                      {evt.location}
                    </td>

                    {/* Registrations / Capacity */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-bold text-foreground">
                          {evt.registeredCount}/{evt.capacity}
                        </span>
                        <div className="w-16 h-1.5 bg-[#F3F4F6] dark:bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, (evt.registeredCount / evt.capacity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Training points */}
                    <td className="py-3.5 px-4 font-bold text-primary">+{evt.trainingPoint}đ</td>

                    {/* SV5T */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-[120px] truncate">
                      {evt.sv5tCriteriaName || 'Không áp dụng'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          evt.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : evt.status === 'HAPPENING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : evt.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700 dark:bg-muted dark:text-muted-foreground border border-slate-200 dark:border-border'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            evt.status === 'OPEN'
                              ? 'bg-emerald-500'
                              : evt.status === 'HAPPENING'
                              ? 'bg-blue-500'
                              : evt.status === 'COMPLETED'
                              ? 'bg-slate-400'
                              : 'bg-red-500'
                          }`}
                        />
                        {evt.status === 'OPEN'
                          ? 'Đang mở'
                          : evt.status === 'HAPPENING'
                          ? 'Đang diễn ra'
                          : evt.status === 'COMPLETED'
                          ? 'Đã kết thúc'
                          : 'Bị vi phạm / Ẩn'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectEvent(evt)}
                          title="Xem chi tiết & báo cáo"
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleHideEvent(evt.id)}
                          title={
                            evt.status === 'VIOLATED' || evt.status === 'HIDDEN'
                              ? 'Khôi phục sự kiện'
                              : 'Hạ sự kiện vi phạm'
                          }
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            evt.status === 'VIOLATED' || evt.status === 'HIDDEN'
                              ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                          }`}
                        >
                          {evt.status === 'VIOLATED' || evt.status === 'HIDDEN' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 border-t border-border bg-[#F9FAFB] dark:bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Hiển thị <strong>{filteredEvents.length}</strong> trên tổng số <strong>{events.length}</strong> sự kiện</span>
        </div>
      </div>
    </div>
  )
}
