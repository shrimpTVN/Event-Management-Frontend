import React from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type FeedTabType = 'DISCOVER' | 'RECOMMENDED' | 'FOLLOWING'

interface FeedTabsProps {
  activeTab: FeedTabType
  onTabChange: (tab: FeedTabType) => void
}

const tabs: { id: FeedTabType; label: string }[] = [
  { id: 'DISCOVER', label: 'Khám phá' },
  { id: 'RECOMMENDED', label: 'Gợi ý' },
  { id: 'FOLLOWING', label: 'Đang theo dõi' },
]

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => (
  <div
    role="group"
    aria-label="Nguồn bài viết"
    className="grid w-full grid-cols-3 items-center gap-1 rounded-lg bg-muted/60 p-1 md:flex md:h-10 md:max-w-[680px] md:gap-2"
  >
    {tabs.map((tab) => (
      <Button
        key={tab.id}
        variant="ghost"
        type="button"
        aria-pressed={activeTab === tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`h-11 min-w-0 gap-1.5 px-1 text-xs md:h-8 md:px-3 md:text-sm ${activeTab === tab.id ? 'bg-background text-primary font-semibold shadow-xs hover:bg-background' : 'text-muted-foreground font-medium hover:bg-muted'}`}
      >
        {tab.id === 'RECOMMENDED' && (
          <Sparkles
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-amber-500' : ''}`}
          />
        )}
        {tab.label}
      </Button>
    ))}
  </div>
)
