import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import React from 'react'
import { Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react'
import type { HistoryStatus } from '../types/history.types'
import { cn } from '@/lib/utils'

export interface HistoryTabBarProps {
  activeStatus: HistoryStatus
  onStatusChange: (status: HistoryStatus) => void
  counts?: {
    all?: number
    upcoming?: number
    completed?: number
    absent?: number
    cancelled?: number
  }
}

/**
 * Desktop original folder-style tab bar (Tai bìa hồ sơ gắn liền khung trắng chuẩn Figma trên Laptop)
 */
export const HistoryTabBar: React.FC<HistoryTabBarProps> = ({
  activeStatus,
  onStatusChange,
  counts,
}) => {
  const tabs: { id: HistoryStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tất cả', count: counts?.all ?? 0 },
    { id: 'UPCOMING', label: 'Sắp diễn ra', count: counts?.upcoming ?? 0 },
    { id: 'COMPLETED', label: 'Đã điểm danh', count: counts?.completed ?? 0 },
    { id: 'ABSENT', label: 'Vắng', count: counts?.absent ?? 0 },
    { id: 'CANCELLED', label: 'Đã hủy', count: counts?.cancelled ?? 0 },
  ]

  return (
    <div className="flex items-end gap-1 sm:gap-2 -mb-px relative z-10 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusChange(tab.id)}
            className={`px-5 py-2.5 text-sm transition-all duration-200 ease-out cursor-pointer whitespace-nowrap select-none flex items-center gap-1.5 ${
              isActive
                ? 'bg-white dark:bg-card text-foreground font-semibold rounded-t-xl border-t border-x border-[#E5E7EB] dark:border-border shadow-2xs pb-3'
                : 'text-muted-foreground hover:text-foreground font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs ${
                  isActive
                    ? 'text-foreground/80 font-normal'
                    : 'text-muted-foreground/70 font-normal'
                }`}
              >
                ({tab.count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Mobile Shopee-style underline tab bar (Nằm sát dưới Header, cuộn ngang trái phải trên điện thoại)
 */
export const MobileHistoryTabBar: React.FC<HistoryTabBarProps> = ({
  activeStatus,
  onStatusChange,
  counts,
}) => {
  const activeTabRef = React.useRef<HTMLButtonElement | null>(null)

  React.useEffect(() => {
    if (typeof activeTabRef.current?.scrollIntoView === 'function') {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [activeStatus])

  const tabs: { id: HistoryStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tất cả', count: counts?.all ?? 0 },
    { id: 'UPCOMING', label: 'Sắp diễn ra', count: counts?.upcoming ?? 0 },
    { id: 'COMPLETED', label: 'Đã điểm danh', count: counts?.completed ?? 0 },
    { id: 'ABSENT', label: 'Vắng', count: counts?.absent ?? 0 },
    { id: 'CANCELLED', label: 'Đã hủy', count: counts?.cancelled ?? 0 },
  ]

  return (
    <div className="w-full bg-background border-b border-border shrink-0 z-20">
      <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth px-4">
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id

          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={cn(
                'relative py-3 text-xs transition-colors cursor-pointer whitespace-nowrap select-none flex items-center gap-1 shrink-0 font-medium bg-transparent',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[11px] text-muted-foreground/70 font-normal">
                  ({tab.count})
                </span>
              )}

              {/* Active Underline Indicator in primary */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface HistorySearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onToggleFilterModal?: () => void
  viewMode?: 'GRID' | 'TABLE'
  onViewModeChange?: (mode: 'GRID' | 'TABLE') => void
}

export const HistorySearchBar: React.FC<HistorySearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onToggleFilterModal,
  viewMode = 'TABLE',
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-border/60">
      <div>
        <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
          Danh sách sự kiện
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
          Quản lý, theo dõi minh chứng và lịch sử tham gia sự kiện của bạn.
        </p>
      </div>

      <div className="student-history-search flex items-center gap-2 sm:gap-3">
        {/* View Mode Switcher (Bảng ↔ Thẻ) */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border/80 bg-muted/40 shrink-0">
            <Tooltip content="Dạng bảng (Chi tiết & Tinh gọn)">
              <button
                type="button"
                onClick={() => onViewModeChange('TABLE')}
                aria-label="Dạng bảng (Chi tiết & Tinh gọn)"
                className={cn(
                  'p-1.5 rounded-md transition-colors cursor-pointer',
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-card text-primary shadow-2xs font-medium'
                    : 'text-muted-foreground hover:text-foreground bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content="Dạng thẻ (Lưới)">
              <button
                type="button"
                onClick={() => onViewModeChange('GRID')}
                aria-label="Dạng thẻ (Lưới)"
                className={cn(
                  'p-1.5 rounded-md transition-colors cursor-pointer',
                  viewMode === 'GRID'
                    ? 'bg-white dark:bg-card text-primary shadow-2xs font-medium'
                    : 'text-muted-foreground hover:text-foreground bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Search input field */}
        <div className="relative min-w-0 flex-1 sm:w-64 lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm sự kiện..."
            className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#1B4B8A] focus:border-[#1B4B8A] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer bg-transparent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        {onToggleFilterModal && (
          <button
            type="button"
            onClick={onToggleFilterModal}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#374151] dark:text-foreground bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg hover:bg-muted/50 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#374151] dark:text-foreground" />
            <span className="hidden xs:inline">Bộ lọc</span>
          </button>
        )}
      </div>
    </div>
  )
}

export interface HistoryFilterBarProps extends HistoryTabBarProps, HistorySearchBarProps {}

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  activeStatus,
  onStatusChange,
  counts,
  onToggleFilterModal,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <HistoryTabBar activeStatus={activeStatus} onStatusChange={onStatusChange} counts={counts} />
      <HistorySearchBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onToggleFilterModal={onToggleFilterModal}
      />
    </div>
  )
}
