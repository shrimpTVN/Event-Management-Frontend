import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search,
  X,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  Building2,
  Phone,
  FileText,
  Copy,
  Check,
  MoreHorizontal,
} from 'lucide-react'
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
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [copiedFanpageId, setCopiedFanpageId] = useState<string | null>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)

  // Click outside listener for action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setOpenActionMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopyEmail = (email: string, fanpageId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!email) return
    navigator?.clipboard?.writeText(email)
    setCopiedFanpageId(fanpageId)
    setTimeout(() => {
      setCopiedFanpageId((prev) => (prev === fanpageId ? null : prev))
    }, 2000)
  }

  const totalCount = fanpages.length
  const pendingCount = fanpages.filter((f) => f.status === 'PENDING').length
  const activeCount = fanpages.filter((f) => f.status === 'ACTIVE').length
  const lockedCount = fanpages.filter((f) => f.status === 'LOCKED' || f.status === 'REJECTED').length

  const filteredFanpages = useMemo(() => {
    return fanpages.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.representativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.schoolName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchTab = statusFilter === 'ALL' ? true : f.status === statusFilter

      return matchSearch && matchTab
    })
  }, [fanpages, searchQuery, statusFilter])

  const tabs = [
    { id: 'ALL' as const, label: 'Tất cả câu lạc bộ', count: totalCount },
    { id: 'PENDING' as const, label: 'Chờ phê duyệt', count: pendingCount },
    { id: 'ACTIVE' as const, label: 'Đang hoạt động', count: activeCount },
    { id: 'LOCKED' as const, label: 'Bị khóa / Từ chối', count: lockedCount },
  ]

  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-primary font-bold">Câu lạc bộ &amp; Fanpage</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Quản lý Ban tổ chức &amp; Fanpage
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xét duyệt hồ sơ thành lập, theo dõi hoạt động và kiểm soát trạng thái các tổ chức trực thuộc ĐHCT.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {pendingCount > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{pendingCount} hồ sơ chờ duyệt</span>
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1B4B8A] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Tổng {fanpages.length} tổ chức
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
              <input
                type="text"
                placeholder="Tìm tên CLB, người đại diện, khoa viện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 h-9 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
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

          {/* Bảng danh sách các dòng thiết kế dạng Card chuẩn như Quản lý Thành viên */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[880px]">
              {/* Header hàng cột phẳng */}
              <div className="grid grid-cols-[2.5fr_1.8fr_1.8fr_1.2fr_1.2fr_130px] items-center px-5 py-2 text-xs font-normal text-[#6B7280] dark:text-muted-foreground">
                <div>Tên Fanpage &amp; Sự kiện</div>
                <div>Người đại diện</div>
                <div>Đơn vị / Khoa</div>
                <div>Minh chứng</div>
                <div className="text-center">Trạng thái</div>
                <div className="text-right min-w-[130px]">Thao tác</div>
              </div>

              {/* Danh sách các card hàng bo tròn (gap-2.5) */}
              <div className="flex flex-col gap-2.5 mt-1">
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
                        onClick={() => onSelectFanpage(f)}
                        className={cn(
                          'bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl shadow-2xs hover:shadow-xs hover:border-[#1B4B8A]/30 dark:hover:border-blue-500/30 hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-all px-5 py-3.5 grid grid-cols-[2.5fr_1.8fr_1.8fr_1.2fr_1.2fr_130px] items-center group relative cursor-pointer',
                          isPending && 'border-amber-200 dark:border-amber-900/50 bg-amber-50/15',
                          isLocked && 'bg-slate-50/60 dark:bg-slate-900/30 opacity-75',
                          openActionMenuId === f.id ? 'z-50 border-[#1B4B8A]/40' : 'z-10'
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
                            <p className="font-semibold text-foreground text-xs leading-snug truncate hover:text-primary transition-colors">
                              {f.name}
                            </p>
                            <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground truncate mt-0.5">
                              {f.eventsCount} sự kiện đã tổ chức
                            </p>
                          </div>
                        </div>

                        {/* 2. Người đại diện */}
                        <div className="space-y-0.5 text-xs pr-2 min-w-0">
                          <p className="text-foreground font-medium truncate">
                            {f.representativeName}
                          </p>
                          <p className="text-[11px] text-[#6B7280] dark:text-muted-foreground truncate flex items-center gap-1">
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
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectFanpage(f)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors max-w-[120px] truncate cursor-pointer"
                            title={f.proofFileName || 'Xem minh chứng (Mở Drawer)'}
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

                        {/* 6. Thao tác hover kiểu Google Drive */}
                        <div className="text-right min-w-[130px] relative flex items-center justify-end">
                          <div className="flex items-center justify-end gap-1">
                            {/* Nút Xem chi tiết (mở Drawer) & Copy email khi hover */}
                            <div
                              className={cn(
                                'items-center gap-1 transition-all duration-150',
                                openActionMenuId === f.id
                                  ? 'flex opacity-100'
                                  : 'flex opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                              )}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectFanpage(f)
                                }}
                                title="Xem hồ sơ & xét duyệt (Mở Drawer)"
                                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1B4B8A] hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleCopyEmail(f.representativeEmail, f.id, e)}
                                title={copiedFanpageId === f.id ? 'Đã sao chép!' : 'Sao chép email người đại diện'}
                                className="h-8 w-8 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1B4B8A] hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                {copiedFanpageId === f.id ? (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>

                            {/* Nút ba chấm chứa các tùy chọn còn lại */}
                            <div className="inline-block relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenActionMenuId(openActionMenuId === f.id ? null : f.id)
                                }}
                                className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center transition-colors cursor-pointer',
                                  openActionMenuId === f.id
                                    ? 'bg-[#F3F4F6] dark:bg-muted text-foreground'
                                    : 'text-[#6B7280] hover:text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted opacity-60 group-hover:opacity-100'
                                )}
                                title="Tùy chọn khác"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {openActionMenuId === f.id && (
                                <div
                                  ref={actionMenuRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 text-left animate-in fade-in-0 zoom-in-95 select-none"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      onSelectFanpage(f)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Xem chi tiết hồ sơ</span>
                                  </button>

                                  {isPending ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null)
                                        onApproveFanpage(f.id)
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                      <span>Phê duyệt ngay</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenuId(null)
                                        onToggleLockFanpage(f.id)
                                      }}
                                      className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer',
                                        f.status === 'ACTIVE'
                                          ? 'text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                          : 'text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                      )}
                                    >
                                      {f.status === 'ACTIVE' ? (
                                        <>
                                          <Lock className="h-3.5 w-3.5 shrink-0" />
                                          <span>Tạm khóa fanpage</span>
                                        </>
                                      ) : (
                                        <>
                                          <Unlock className="h-3.5 w-3.5 shrink-0" />
                                          <span>Mở khóa fanpage</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  <div className="h-px bg-border/60 my-1" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      handleCopyEmail(f.representativeEmail, f.id)
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-normal text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>Sao chép email đại diện</span>
                                  </button>
                                </div>
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
        </div>
      </div>
    </div>
  )
}
