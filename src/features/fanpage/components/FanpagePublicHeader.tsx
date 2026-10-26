import React, { useState } from 'react'
import { Plus, Check, MessageSquare } from 'lucide-react'
import type { FanpageDetail } from '../types/fanpage.types'

interface FanpagePublicHeaderProps {
  fanpage: FanpageDetail
  onMessageClick?: () => void
  onFollowChange?: (isFollowing: boolean) => void
}

export const FanpagePublicHeader: React.FC<FanpagePublicHeaderProps> = ({
  fanpage,
  onMessageClick,
  onFollowChange,
}) => {
  const [isFollowing, setIsFollowing] = useState(fanpage.isFollowing)
  const [followers, setFollowers] = useState(fanpage.followerCount)

  React.useEffect(() => {
    setIsFollowing(fanpage.isFollowing)
    setFollowers(fanpage.followerCount)
  }, [fanpage.id, fanpage.isFollowing, fanpage.followerCount])

  const handleToggleFollow = () => {
    const nextState = !isFollowing
    setIsFollowing(nextState)
    setFollowers((prev) => (nextState ? prev + 1 : prev - 1))
    onFollowChange?.(nextState)
  }

  return (
    <div className="w-full bg-white dark:bg-card border border-border/80 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5 sm:gap-6">
      {/* Left: Avatar + Fanpage Name + Stats */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 min-w-0 text-center sm:text-left">
        {/* Avatar 100px */}
        <div className="relative shrink-0">
          <img
            src={fanpage.avatarUrl}
            alt={fanpage.name}
            className="h-24 w-24 rounded-full object-cover border-2 border-border/80 shadow-2xs p-0.5 bg-white dark:bg-card"
          />
        </div>

        {/* Title & Metadata */}
        <div className="min-w-0">
          <h1 className="font-k2d font-bold text-xl sm:text-2xl text-foreground tracking-tight line-clamp-1">
            {fanpage.name}
          </h1>

          <div className="flex items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-muted-foreground mt-1.5">
            <div>
              <span className="font-semibold text-foreground">{followers}</span>{' '}
              <span>Followers</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">{fanpage.eventCount}</span>{' '}
              <span>sự kiện</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions (Theo dõi, Nhắn tin) */}
      <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center sm:justify-end">
        {/* Follow Button */}
        <button
          type="button"
          onClick={handleToggleFollow}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg transition-all shadow-2xs cursor-pointer ${
            isFollowing
              ? 'bg-muted hover:bg-muted/80 text-foreground border border-border/80'
              : 'bg-[#1B4B8A] hover:bg-[#153a6b] text-white'
          }`}
        >
          {isFollowing ? (
            <>
              <Check className="h-4 w-4" />
              <span>Đang theo dõi</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Theo dõi</span>
            </>
          )}
        </button>

        {/* Message Button */}
        <button
          type="button"
          onClick={onMessageClick}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#1B4B8A] dark:text-blue-400 bg-white dark:bg-card border border-[#D1D5DB] dark:border-border hover:bg-muted/60 rounded-lg transition-all shadow-2xs cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Nhắn tin</span>
        </button>
      </div>
    </div>
  )
}
