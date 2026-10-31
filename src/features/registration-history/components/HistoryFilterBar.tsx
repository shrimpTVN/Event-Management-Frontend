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

export const HistoryTabBar: React.FC<HistoryTabBarProps> = ({
  activeStatus,
  onStatusChange,
  counts,
}) => {
  const tabs: { id: HistoryStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tất cả', count: counts?.all ?? 0 },
    { id: 'UPCOMING', label: 'Sắp diễn ra', count: counts?.upcoming ?? 0 },
    { id: 'COMPLETED', label: 'Hoàn thành', count: counts?.completed ?? 0 },
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border/60">
      <div>
        <h2 className="font-k2d font-bold text-base sm:text-lg text-foreground">
          Danh sách sự kiện
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Quản lý, theo dõi minh chứng và lịch sử tham gia sự kiện của bạn.
        </p>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* View Mode Switcher (Bảng ↔ Thẻ) */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-border/80 bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('TABLE')}
              title="Dạng bảng (Chi tiết & Tinh gọn)"
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-card text-primary shadow-2xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('GRID')}
              title="Dạng thẻ (Lưới)"
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                viewMode === 'GRID'
                  ? 'bg-white dark:bg-card text-primary shadow-2xs font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search input field */}
        <div className="relative flex-1 sm:w-72 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
          <input
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={onToggleFilterModal}
          className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#374151] dark:text-foreground bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg hover:bg-muted/50 transition-colors shrink-0 shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#374151] dark:text-foreground" />
          <span>Bộ lọc</span>
        </button>
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
      <HistoryTabBar
        activeStatus={activeStatus}
        onStatusChange={onStatusChange}
        counts={counts}
      />
      <HistorySearchBar
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onToggleFilterModal={onToggleFilterModal}
      />
    </div>
  )
}

