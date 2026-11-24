import type { NotificationItem } from './types/notification.types'

export function notificationPath(item: NotificationItem): string | null {
  let path = item.url?.trim()
  if (!path) return null
  if (/^\d+$/.test(path)) {
    const event =
      item.type !== 'EVENT_ABSENCE_ALERT' &&
      (item.title?.toLowerCase().includes('event') ||
        item.message?.toLowerCase().includes('sự kiện'))
    path = event ? `/events/${path}` : `/fanpage/${path}`
  }
  return path.replace(/^\/fanpages\/(\d+)(?=[/?#]|$)/, '/fanpage/$1')
}

export function normalizeNotification(item: NotificationItem): NotificationItem {
  return {
    ...item,
    title: item.title || (item.type === 'EVENT_ABSENCE_ALERT' ? 'Nhắc nhở vắng mặt' : 'Thông báo'),
    ...(item.url ? { url: notificationPath(item) } : {}),
  }
}
