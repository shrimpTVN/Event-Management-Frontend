import React from 'react'
import verifyIcon from '@/assets/verify.png'

interface VerifiedBadgeProps {
  className?: string
  title?: string
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = 'h-5 w-5',
  title = 'Đã xác thực',
}) => {
  return (
    <img
      src={verifyIcon}
      alt={title}
      title={title}
      className={`${className} shrink-0 inline-block object-contain select-none`}
    />
  )
}

