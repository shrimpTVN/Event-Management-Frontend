import React from 'react'
import { Sparkles } from 'lucide-react'

export type FeedTabType = 'DISCOVER' | 'RECOMMENDED' | 'FOLLOWING'

interface FeedTabsProps {
  activeTab: FeedTabType
  onTabChange: (tab: FeedTabType) => void
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-full max-w-[680px] h-10 bg-[#F0F2F5] dark:bg-muted p-1 rounded-[10px] flex items-center gap-2">
      <button
        type="button"
        onClick={() => onTabChange('DISCOVER')}
        className={`w-[94px] h-8 px-3 py-1.5 rounded-lg text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer ${
          activeTab === 'DISCOVER'
            ? 'bg-white dark:bg-card text-[#1B4B8A] dark:text-primary font-semibold shadow-xs'
            : 'bg-[#E5E7EB] dark:bg-muted/80 text-[#6B7280] dark:text-muted-foreground font-medium hover:bg-[#E5E7EB]/80'
        }`}
      >
        Khám phá
      </button>

      <button
        type="button"
        onClick={() => onTabChange('RECOMMENDED')}
        className={`w-[89px] h-8 px-3 py-1.5 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
          activeTab === 'RECOMMENDED'
            ? 'bg-white dark:bg-card text-[#1B4B8A] dark:text-primary font-semibold shadow-xs'
            : 'bg-[#E5E7EB] dark:bg-muted/80 text-[#6B7280] dark:text-muted-foreground font-medium hover:bg-[#E5E7EB]/80'
        }`}
      >
        <Sparkles className={`h-4 w-4 shrink-0 ${activeTab === 'RECOMMENDED' ? 'text-amber-500' : 'text-[#6B7280]'}`} />
        <span>Gợi ý</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('FOLLOWING')}
        className={`w-[121px] h-8 px-3 py-1.5 rounded-lg text-sm transition-all flex items-center justify-center shrink-0 cursor-pointer ${
          activeTab === 'FOLLOWING'
            ? 'bg-white dark:bg-card text-[#1B4B8A] dark:text-primary font-semibold shadow-xs'
            : 'bg-[#E5E7EB] dark:bg-muted/80 text-[#6B7280] dark:text-muted-foreground font-medium hover:bg-[#E5E7EB]/80'
        }`}
      >
        Đang theo dõi
      </button>
    </div>
  )
}
