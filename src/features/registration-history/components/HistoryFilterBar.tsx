import React from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { HistoryStatus } from '../types/history.types'

interface HistoryFilterBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  activeStatus: HistoryStatus
  onStatusChange: (status: HistoryStatus) => void
  counts?: {
    all?: number
    upcoming?: number
    completed?: number
    absent?: number
    cancelled?: number
  }
  onToggleFilterModal?: () => void
}

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  activeStatus,
  onStatusChange,
  counts,
  onToggleFilterModal,
}) => {
  const tabs: { id: HistoryStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'Tất cả', count: counts?.all ?? 0 },
    { id: 'UPCOMING', label: 'Sắp diễn ra', count: counts?.upcoming ?? 0 },
    { id: 'COMPLETED', label: 'Hoàn thành', count: counts?.completed ?? 0 },
    { id: 'ABSENT', label: 'Vắng', count: counts?.absent ?? 0 },
    { id: 'CANCELLED', label: 'Đã hủy', count: counts?.cancelled ?? 0 },
  ]

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-3 border-b border-border/70">
      {/* Left: Tab selection with active bottom underline and count badges */}
      <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar pt-1">
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className="relative pb-2.5 flex items-center gap-2 group whitespace-nowrap transition-colors cursor-pointer"
            >
              <span
                className={`text-sm ${
                  isActive
                    ? 'font-semibold text-[#1B4B8A] dark:text-blue-400'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </span>

              {/* Count badge */}
              <span
                className={`inline-flex items-center justify-center min-w-[20px] px-2 py-0.5 rounded-full text-xs transition-colors ${
                  isActive
                    ? 'bg-[#1B4B8A] text-white font-semibold dark:bg-blue-600'
                    : 'bg-[#E5E7EB] dark:bg-muted text-muted-foreground font-medium group-hover:bg-muted/80'
                }`}
              >
                {tab.count}
              </span>

              {/* Active Underline Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1B4B8A] dark:bg-blue-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Right: Search Input + 'Bộ lọc' button */}
      <div className="flex items-center gap-3">
        {/* Search input field */}
        <div className="relative flex-1 sm:w-72 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm sự kiện..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#1B4B8A] focus:border-[#1B4B8A] transition-colors"
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
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#374151] dark:text-foreground bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-lg hover:bg-muted/50 transition-colors shrink-0 shadow-2xs cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4 text-[#374151] dark:text-foreground" />
          <span>Bộ lọc</span>
        </button>
      </div>
    </div>
  )
}
