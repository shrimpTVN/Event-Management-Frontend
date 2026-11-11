import React, { useState, useMemo } from 'react'
import { Search, X, Eye, CheckCircle2, FileText, Lock, Unlock, Phone, Building2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
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

      const matchStatus = statusFilter === 'ALL' ? true : f.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [fanpages, searchQuery, statusFilter])

  const statusTabs = [
    { id: 'ALL' as const, label: 'Tất cả fanpage', count: totalCount },
    { id: 'PENDING' as const, label: 'Chờ duyệt', count: pendingCount },
    { id: 'ACTIVE' as const, label: 'Đang hoạt động', count: activeCount },
    { id: 'LOCKED' as const, label: 'Bị khóa / Từ chối', count: lockedCount },
  ]

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb & Summary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-primary font-bold">Fanpage</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý & phê duyệt Fanpage
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xét duyệt quyền hạn tổ chức sự kiện cho các Đoàn thể, Câu lạc bộ và Đơn vị trực thuộc toàn trường.
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingCount} Fanpage chờ duyệt</span>
          </span>
        )}
      </div>

      {/* 2. Khối bảng màu trắng với thanh Folder Tab bo tròn khi chọn */}
      <div className="flex flex-col mt-2">
        {/* Hàng Tab Bar dạng folder tab bo tròn trên đỉnh, nổi và kết nối liền mạch với khung trắng */}
        <div className="flex items-end gap-1.5 -mb-px relative z-10 overflow-x-auto no-scrollbar">
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
            statusFilter === 'ALL' ? 'rounded-b-2xl rounded-tr-2xl rounded-tl-none' : 'rounded-2xl'
          )}
        >
          {/* Header trong panel: Ô tìm kiếm bên trái, số lượng tóm tắt bên phải */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm fanpage, người đại diện, đơn vị..."
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
              {filteredFanpages.length} fanpage {statusFilter !== 'ALL' ? 'trong mục này' : 'tổng cộng'}
            </div>
          </div>

          {/* Vùng chứa các card fanpage bo tròn cách nhau */}
          <div className="p-3 sm:p-4 bg-[#F9FAFB]/60 dark:bg-background/40 overflow-x-auto rounded-xl">
            <div className="min-w-[840px]">
              {/* Header hàng cột phẳng, chữ xám nhẹ */}
              <div className="grid grid-cols-[1fr_200px_180px_120px_120px_100px] items-center px-5 py-2 text-xs font-normal text-muted-foreground">
                <div>Tên Fanpage &amp; Sự kiện</div>
                <div>Người đại diện</div>
                <div>Đơn vị / Khoa</div>
                <div>Minh chứng</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-right">Thao tác</div>
              </div>

              {/* Danh sách các card hàng bo tròn */}
              <div className="flex flex-col gap-2.5 mt-1 animate-in fade-in-50 duration-150">
                {filteredFanpages.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground bg-white dark:bg-card rounded-2xl border border-border/80">
                    Không tìm thấy Fanpage nào phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  filteredFanpages.map((f) => {
                    const isPending = f.status === 'PENDING'
                    const isLocked = f.status === 'LOCKED' || f.status === 'REJECTED'

                    return (
                      <div
                        key={f.id}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 rounded-2xl px-5 py-3.5 grid grid-cols-[1fr_200px_180px_120px_120px_100px] items-center shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all',
                          isPending && 'border-amber-200 dark:border-amber-900/50 bg-amber-50/15',
                          isLocked && 'bg-slate-50/50 dark:bg-slate-900/20 opacity-80'
                        )}
                      >
                        {/* 1. Tên Fanpage & Avatar */}
                        <div className="flex items-center gap-3 pr-3 min-w-0">
                          {f.avatarUrl ? (
                            <img
                              src={f.avatarUrl}
                              alt={f.name}
                              className="h-10 w-10 rounded-xl object-cover shrink-0 border border-border/60 shadow-2xs"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-[#1B4B8A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {f.name ? f.name.substring(0, 2).toUpperCase() : 'FP'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors cursor-pointer"
                              onClick={() => onSelectFanpage(f)}
                            >
                              {f.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {f.eventsCount} sự kiện đã tổ chức
                            </p>
                          </div>
                        </div>

                        {/* 2. Người đại diện */}
                        <div className="space-y-0.5 text-xs pr-2 min-w-0">
                          <p className="text-foreground font-medium truncate">
                            {f.representativeName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <span>{f.representativeCode}</span>
                            {f.representativePhone && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  {f.representativePhone}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        {/* 3. Đơn vị / Khoa */}
                        <div className="text-xs text-foreground/90 font-medium truncate pr-2 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{f.schoolName}</span>
                        </div>

                        {/* 4. Giấy tờ minh chứng */}
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectFanpage(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors max-w-[120px] truncate cursor-pointer"
                            title={f.proofFileName || 'Xem minh chứng'}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{f.proofFileName || 'Minh chứng'}</span>
                          </button>
                        </div>

                        {/* 5. Trạng thái */}
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border',
                              f.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : f.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                f.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : f.status === 'PENDING'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              )}
                            />
                            <span>
                              {f.status === 'ACTIVE'
                                ? 'Đã duyệt'
                                : f.status === 'PENDING'
                                ? 'Chờ duyệt'
                                : 'Bị khóa'}
                            </span>
                          </span>
                        </div>

                        {/* 6. Thao tác */}
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectFanpage(f)}
                            title="Xem chi tiết & xét duyệt"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => onApproveFanpage(f.id)}
                              title="Phê duyệt ngay"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onToggleLockFanpage(f.id)}
                              title={f.status === 'ACTIVE' ? 'Khóa fanpage' : 'Mở khóa'}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors cursor-pointer',
                                f.status === 'ACTIVE'
                                  ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              )}
                            >
                              {f.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}
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
