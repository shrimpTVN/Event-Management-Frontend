import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Check,
  Ban,
  Trash2,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { superAdminService } from '../../services/superAdminService'
import type { FanpageAdminItem } from '../../types/superAdmin.types'

export const SuperAdminFanpagesView: React.FC = () => {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-fanpages', page, keyword, selectedStatus],
    queryFn: () =>
      superAdminService.getFanpages({
        page,
        size: 15,
        keyword: keyword.trim() || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      }),
  })

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.acceptFanpage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-fanpages'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Phê duyệt fanpage thất bại!')
    },
  })

  const banMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.banFanpage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-fanpages'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Khóa fanpage thất bại!')
    },
  })

  const unbanMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.unbanFanpage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-fanpages'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Mở khóa fanpage thất bại!')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => superAdminService.deleteFanpage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-fanpages'] })
      queryClient.invalidateQueries({ queryKey: ['superadmin-overview'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Xóa fanpage thất bại!')
    },
  })

  const handleDelete = (f: FanpageAdminItem) => {
    if (confirm(`Bạn có chắc muốn xóa fanpage "${f.name}" không?`)) {
      deleteMutation.mutate(f.id)
    }
  }

  const fanpages = data?.content || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-k2d font-bold text-2xl text-foreground">
            Quản lý Fanpage & Tổ chức
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xét duyệt đơn đăng ký fanpage mới, giám sát hoạt động và khóa các tổ chức vi phạm.
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
              placeholder="Tìm theo tên fanpage, mã tổ chức..."
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
              <option value="PENDING">Chờ phê duyệt (PENDING)</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="BANNED">Đã bị khóa (BANNED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Fanpages Table */}
      <div className="rounded-2xl bg-white dark:bg-card border border-border shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Tổ chức / Fanpage</th>
                <th className="py-3 px-4">Đơn vị chủ quản</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Quy mô</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Đang tải danh sách fanpage...
                  </td>
                </tr>
              ) : fanpages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy fanpage nào phù hợp.
                  </td>
                </tr>
              ) : (
                fanpages.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                    {/* Fanpage Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {f.avatarUrl ? (
                          <img
                            src={f.avatarUrl}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0">
                            {f.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate max-w-[220px]">
                            {f.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Mã: {f.code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Org */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="truncate max-w-[180px]" title={f.orgName}>
                        {f.orgName || f.parentOrg || 'Đoàn trường ĐHCT'}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="truncate max-w-[160px]">{f.helpContact || 'Chưa có email'}</div>
                      {f.helpPhone && (
                        <div className="text-[10px] text-foreground font-mono">{f.helpPhone}</div>
                      )}
                    </td>

                    {/* Followers & Events */}
                    <td className="py-3 px-4">
                      <div className="text-foreground font-medium">
                        {f.followerCount} người theo dõi
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {f.eventCount} sự kiện
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {f.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                          <Clock className="h-3 w-3" />
                          <span>CHỜ DUYỆT</span>
                        </span>
                      ) : f.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                          <ShieldCheck className="h-3 w-3" />
                          <span>HOẠT ĐỘNG</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                          <Ban className="h-3 w-3" />
                          <span>ĐÃ KHÓA</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {f.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => acceptMutation.mutate(f.id)}
                            disabled={acceptMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-2xs cursor-pointer transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Duyệt</span>
                          </button>
                        )}

                        {f.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => banMutation.mutate(f.id)}
                            disabled={banMutation.isPending}
                            className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-400 text-[11px] font-medium cursor-pointer transition-colors"
                            title="Khóa hoạt động fanpage"
                          >
                            Khóa
                          </button>
                        )}

                        {f.status === 'BANNED' && (
                          <button
                            type="button"
                            onClick={() => unbanMutation.mutate(f.id)}
                            disabled={unbanMutation.isPending}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-400 text-[11px] font-medium cursor-pointer transition-colors"
                            title="Mở khóa fanpage"
                          >
                            Mở khóa
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(f)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                          title="Xóa fanpage"
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
