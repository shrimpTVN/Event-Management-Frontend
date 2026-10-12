import React from 'react'
import { ModerationQueue } from '@/features/moderation'

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Two-step registration moderation and attendee approval queue.
        </p>
      </div>

      <ModerationQueue />
    </div>
  )
}
