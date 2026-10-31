import React from 'react'
import { Sparkles, LayoutList, LayoutGrid } from 'lucide-react'

export type FeedTabType = 'DISCOVER' | 'RECOMMENDED' | 'FOLLOWING'
export type ViewMode = 'FEED' | 'GRID'

interface FeedTabsProps {
  activeTab: FeedTabType
  onTabChange: (tab: FeedTabType) => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  activeTab,
  onTabChange,
  viewMode = 'FEED',
  onViewModeChange,
}) => {
  return (
    <div className="w-full h-11 bg-[#F0F2F5] dark:bg-muted p-1 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
      {/* Left: Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => onTabChange('DISCOVER')}
          className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            activeTab === 'DISCOVER'
              ? 'bg-white dark:bg-card text-[#1B4B8A] dark:text-primary font-bold shadow-xs'
              : 'text-[#6B7280] dark:text-muted-foreground font-medium hover:text-foreground hover:bg-[#E5E7EB]/60'
          }`}
        >
          Khám phá
        </button>

        <button
          type="button"
          onClick={() => onTabChange('RECOMMENDED')}
          className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'RECOMMENDED'
              ? 'bg-white dark:bg-card text-[#1B4B8A] dark:text-primary font-bold shadow-xs'
              : 'text-[#6B7280] dark:text-muted-foreground font-medium hover:text-foreground hover:bg-[#E5E7EB]/60'
          }`}
        >
          <Sparkles
            className={`h-3.5 w-3.5 shrink-0 ${
              activeTab === 'RECOMMENDED' ? 'text-amber-500' : 'text-[#6B7280]'
            }`}
          />
          <span>Gợi ý</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('FOLLOWING')}
          className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            activeTab === 'FOLLOWING'
              ? 'bg-white dark:bg-card text-[#1B4B8A] dark:text-primary font-bold shadow-xs'
              : 'text-[#6B7280] dark:text-muted-foreground font-medium hover:text-foreground hover:bg-[#E5E7EB]/60'
          }`}
        >
          Đang theo dõi
        </button>
      </div>

      {/* Right: View Mode Toggle (Option A: Feed ↔ Grid) */}
      {onViewModeChange && (
        <div className="flex items-center bg-white/70 dark:bg-card/70 p-0.5 rounded-lg border border-border/60 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('FEED')}
            className={`h-8 px-2.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'FEED'
                ? 'bg-white dark:bg-card text-primary font-bold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dạng bài viết (Bảng tin chi tiết)"
          >
            <LayoutList className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Bài viết</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('GRID')}
            className={`h-8 px-2.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'GRID'
                ? 'bg-white dark:bg-card text-primary font-bold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dạng lưới (Tra cứu nhanh nhiều sự kiện)"
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Lưới thẻ</span>
          </button>
        </div>
      )}
    </div>
  )
}
