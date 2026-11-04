import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search,
  CalendarDays,
  MapPin,
  Users,
  Trash2,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdminService'
import type { EventAdminItem } from '../../types/superAdmin.types'

export const SuperAdminEventsView: React.FC = () => {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-events', page, keyword, selectedStatus],
    queryFn: () =>
      superAdminService.getEvents({
        page,
        size: 15,
        keyword: keyword.trim() || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-events'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Xóa sự kiện thất bại!')
    },
  })

  const handleDelete = (e: EventAdminItem) => {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ sự kiện "${e.name}" khỏi hệ thống không?`)) {
      deleteMutation.mutate(e.id)
    }
  }

  const events = data?.content || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Quản lý Sự kiện Toàn trường
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giám sát tất cả sự kiện đã xuất bản, bản nháp và đóng từ tất cả các ban tổ chức.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-white dark:bg-card hover:bg-muted text-xs font-semibold cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm theo tên sự kiện, địa điểm..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(0)
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã công khai (PUBLISHED)</option>
              <option value="DRAFT">Bản nháp (DRAFT)</option>
              <option value="CLOSED">Đã đóng (CLOSED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Events Table */}
      <div className="rounded-2xl bg-white dark:bg-card border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Sự kiện</th>
                <th className="py-3 px-4">Ban tổ chức</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Số lượng ĐK</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Đang tải danh sách sự kiện...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chưa có sự kiện nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    {/* Event Banner & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-20 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                          {e.bannerUrl ? (
                            <img
                              src={e.bannerUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground opacity-40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate max-w-[240px]" title={e.name}>
                            {e.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[240px]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{e.location || 'Khu II, ĐH Cần Thơ'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Organizer */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="truncate max-w-[160px]" title={e.fanpageName}>
                        {e.fanpageName || `Fanpage #${e.fanpageId}`}
                      </div>
                    </td>

                    {/* Happen Date */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1 text-foreground font-medium">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        <span>{e.dateHappen}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ĐK: {e.dateOpen} → {e.dateClose}
                      </div>
                    </td>

                    {/* Capacity / Registered */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-foreground font-medium">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{e.registeredCount} / {e.capacity}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {e.status === 'PUBLISHED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                          CÔNG KHAI
                        </span>
                      ) : e.status === 'DRAFT' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                          BẢN NHÁP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                          ĐÃ ĐÓNG
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/events/${e.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-border bg-white dark:bg-card hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          title="Xem trang sự kiện công khai"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(e)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                          title="Xóa sự kiện"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Trang {page + 1} / {totalPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-50 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-50 cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

