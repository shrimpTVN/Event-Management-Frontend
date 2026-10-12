import React from 'react'
import { PhotoCheckIn } from '@/features/check-in'

export const CheckInPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Self Check-In</h1>
        <p className="text-sm text-muted-foreground">
          Upload a clear photo of yourself at the entrance to verify your attendance.
        </p>
      </div>

      <PhotoCheckIn />
    </div>
  )
}
