import { Award, ShieldCheck, X, Calendar, Flag, Bell } from 'lucide-react'

/**
 * Format thời gian hiển thị thân thiện (giống phong cách mạng xã hội)
 */
export const formatNotificationTime = (dateStr?: string): string => {
  if (!dateStr) return 'Gần đây'
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    if (isNaN(diffMs) || diffMs < 0) return 'Vừa xong'

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`

    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return 'Gần đây'
  }
}

/**
 * Badge icon phân loại thông báo
 */
export const getNotificationIconBadge = (title: string = '', message: string = '', iconSizeClass: string = 'h-4 w-4', type = '') => {
  const text = (title + ' ' + message).toLowerCase()
  // Prefer the API type; negative outcomes must precede "duyệt" and "fanpage".
  if (/REJECTED|SUSPENDED|ABSENCE/.test(type) || /rejected|từ chối|không (?:được )?duyệt|suspended|vắng mặt/.test(text)) {
    return { bgColor: 'bg-destructive', icon: <X className={`${iconSizeClass} text-white`} /> }
  }
  if (/INVITED|INVITATION|APPOINTED/.test(type)) {
    return { bgColor: 'bg-primary', icon: <Flag className={`${iconSizeClass} text-white`} /> }
  }
  if (
    text.includes('point') ||
    text.includes('điểm') ||
    text.includes('khen thưởng') ||
    text.includes('rèn luyện')
  ) {
    return {
      bgColor: 'bg-warning',
      icon: <Award className={`${iconSizeClass} text-white`} />,
    }
  }
  if (text.includes('approved') || text.includes('duyệt') || text.includes('chấp thuận')) {
    return {
      bgColor: 'bg-green-600 dark:bg-green-500',
      icon: <ShieldCheck className={`${iconSizeClass} text-white`} />,
    }
  }
  if (text.includes('rejected') || text.includes('từ chối') || text.includes('suspended')) {
    return {
      bgColor: 'bg-destructive',
      icon: <X className={`${iconSizeClass} text-white`} />,
    }
  }
  if (text.includes('event') || text.includes('sự kiện') || text.includes('lịch trình')) {
    return {
      bgColor: 'bg-primary',
      icon: <Calendar className={`${iconSizeClass} text-white`} />,
    }
  }
  if (
    text.includes('fanpage') ||
    text.includes('club') ||
    text.includes('mời') ||
    text.includes('vai trò') ||
    text.includes('admin')
  ) {
    return {
      bgColor: 'bg-primary',
      icon: <Flag className={`${iconSizeClass} text-white`} />,
    }
  }
  return {
    bgColor: 'bg-primary',
    icon: <Bell className={`${iconSizeClass} text-white`} />,
  }
}
