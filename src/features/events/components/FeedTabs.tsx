import React from 'react'
import { Sparkles } from 'lucide-react'

export type FeedTabType = 'DISCOVER' | 'RECOMMENDED' | 'FOLLOWING'

interface FeedTabsProps {
  activeTab: FeedTabType
  onTabChange: (tab: FeedTabType) => void
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-muted/80 p-1.5 w-full">
      <button
        type="button"
        onClick={() => onTabChange('DISCOVER')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
          activeTab === 'DISCOVER'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Khám phá
      </button>

      <button
        type="button"
        onClick={() => onTabChange('RECOMMENDED')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
          activeTab === 'RECOMMENDED'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sparkles className="h-4 w-4 text-amber-500" />
        Gợi ý
      </button>

      <button
        type="button"
        onClick={() => onTabChange('FOLLOWING')}
        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
          activeTab === 'FOLLOWING'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Đang theo dõi
      </button>
    </div>
  )
}
