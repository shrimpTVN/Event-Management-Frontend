import React from 'react'
import { Button } from '@/components/ui/button'

export type FeedTabType = 'DISCOVER' | 'FOLLOWING'

interface FeedTabsProps {
  activeTab: FeedTabType
  onTabChange: (tab: FeedTabType) => void
}

const tabs: { id: FeedTabType; label: string }[] = [
  { id: 'DISCOVER', label: 'Khám phá' },
  { id: 'FOLLOWING', label: 'Đang theo dõi' },
]

export const FeedTabs: React.FC<FeedTabsProps> = ({ activeTab, onTabChange }) => (
  <div
    role="group"
    aria-label="Nguồn bài viết"
    className="grid w-full grid-cols-2 items-center gap-1 rounded-lg bg-muted/60 p-1 md:flex md:h-10 md:max-w-[680px] md:gap-2"
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
        {tab.label}
      </Button>
    ))}
  </div>
)
