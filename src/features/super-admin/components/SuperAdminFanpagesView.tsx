import React, { useState, useMemo } from 'react'
import { Search, Filter, Eye, CheckCircle2, FileText, Lock, Unlock } from 'lucide-react'
import type { SuperAdminFanpage, FanpageStatus } from '../types/superAdmin.types'

interface SuperAdminFanpagesViewProps {
  fanpages: SuperAdminFanpage[]
  onSelectFanpage: (fanpage: SuperAdminFanpage) => void
  onApproveFanpage: (fanpageId: string) => void
  onToggleLockFanpage: (fanpageId: string) => void
}

export const SuperAdminFanpagesView: React.FC<SuperAdminFanpagesViewProps> = ({
  fanpages,
  onSelectFanpage,
  onApproveFanpage,
  onToggleLockFanpage,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | FanpageStatus>('ALL')

  const totalCount = fanpages.length
  const pendingCount = fanpages.filter((f) => f.status === 'PENDING').length
  const activeCount = fanpages.filter((f) => f.status === 'ACTIVE').length
  const lockedCount = fanpages.filter((f) => f.status === 'LOCKED' || f.status === 'REJECTED').length

  const filteredFanpages = useMemo(() => {
    return fanpages.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.representativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.representativeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.schoolName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus = statusFilter === 'ALL' || f.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [fanpages, searchQuery, statusFilter])

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <span>Quản trị hệ thống</span>
          <span>/</span>
          <span className="text-primary font-semibold">Fanpage</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-k2d font-bold text-foreground tracking-tight">
              Quản lý & phê duyệt Fanpage
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Xét duyệt quyền hạn tổ chức sự kiện cho các Đoàn thể, Câu lạc bộ và Đơn vị trực thuộc
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {pendingCount} Fanpage chờ duyệt
            </span>
          )}
        </div>
      </div>

      {/* 2. Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tất cả Fanpage</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-foreground mt-1">{totalCount}</p>
        </div>

        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Chờ duyệt</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-amber-600 mt-1">{String(pendingCount).padStart(2, '0')}</p>
        </div>

        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang hoạt động</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>

        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Bị khóa / từ chối</p>
          <p className="text-2xl sm:text-3xl font-k2d font-bold text-red-600 mt-1">{lockedCount}</p>
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
            placeholder="Tìm kiếm fanpage, người đại diện, đơn vị..."
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
            { id: 'PENDING' as const, label: 'Chờ duyệt' },
            { id: 'ACTIVE' as const, label: 'Đã duyệt' },
            { id: 'LOCKED' as const, label: 'Bị khóa' },
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
                <th className="py-3.5 px-4">Tên Fanpage</th>
                <th className="py-3.5 px-4">Người Đại Diện</th>
                <th className="py-3.5 px-4">Mã Số</th>
                <th className="py-3.5 px-4">SĐT</th>
                <th className="py-3.5 px-4">Đơn Vị</th>
                <th className="py-3.5 px-4">Giấy Tờ Minh Chứng</th>
                <th className="py-3.5 px-4">Ngày Đăng Ký</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredFanpages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy Fanpage nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredFanpages.map((f) => (
                  <tr key={f.id} className="hover:bg-[#F9FAFB] dark:hover:bg-muted/20 transition-colors">
                    {/* Fanpage name + avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={f.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'}
                          alt={f.name}
                          className="w-9 h-9 rounded-xl object-cover border border-border shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-foreground leading-tight">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground">{f.eventsCount} sự kiện đã tạo</p>
                        </div>
                      </div>
                    </td>

                    {/* Representative Name */}
                    <td className="py-3.5 px-4 font-semibold text-foreground">{f.representativeName}</td>

                    {/* Code */}
                    <td className="py-3.5 px-4 text-muted-foreground">{f.representativeCode}</td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-muted-foreground">{f.representativePhone}</td>

                    {/* Unit */}
                    <td className="py-3.5 px-4 text-foreground/80">{f.schoolName}</td>

                    {/* Proof File */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectFanpage(f)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors max-w-[140px] truncate cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{f.proofFileName || 'Xem tệp...'}</span>
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">{f.createdAt}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          f.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : f.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            f.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : f.status === 'PENDING'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                        {f.status === 'ACTIVE'
                          ? 'Đã duyệt'
                          : f.status === 'PENDING'
                          ? 'Chờ duyệt'
                          : 'Bị khóa / Từ chối'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectFanpage(f)}
                          title="Xem chi tiết & minh chứng"
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {f.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => onApproveFanpage(f.id)}
                            title="Phê duyệt ngay"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {f.status !== 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => onToggleLockFanpage(f.id)}
                            title={f.status === 'ACTIVE' ? 'Khóa fanpage' : 'Mở khóa'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              f.status === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {f.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}
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
          <span>Hiển thị <strong>{filteredFanpages.length}</strong> trên tổng số <strong>{fanpages.length}</strong> Fanpage</span>
        </div>
      </div>
    </div>
  )
}
