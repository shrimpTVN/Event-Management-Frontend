import type { NotificationItem } from '../types/notification.types'
import { notificationPath } from '../notificationPath'

export interface FanpageInvitation {
  id: number | string
  fanpageId: number | string
  fanpageName?: string
  fanpageAvatarUrl?: string
  inviterName?: string
  createdByName?: string
  status: string
  createdAt: string
}

export interface NotificationFeedEntry {
  key: string
  createdAt: string
  invitation?: FanpageInvitation
  notification?: NotificationItem
  notificationIds: Array<number | string>
  unread: boolean
}

export function buildNotificationFeed(
  notifications: NotificationItem[],
  invitations: FanpageInvitation[]
): NotificationFeedEntry[] {
  const uniqueInvitations = [...new Map(invitations.map((i) => [String(i.id), i])).values()]
  const entries: NotificationFeedEntry[] = uniqueInvitations.map((invitation) => ({
    key: `invitation-${invitation.id}`, createdAt: invitation.createdAt,
    invitation, notificationIds: [], unread: false,
  }))
  const seen = new Set<string>()
  for (const notification of notifications) {
    if (seen.has(String(notification.id))) continue
    seen.add(String(notification.id))
    // Same text is not proof of the same event. Match only invitation notifications
    // for this fanpage, created alongside the invitation (including legacy payloads).
    const isInvitation = notification.type === 'FANPAGE_MEMBER_INVITED' ||
      (!notification.type && /invited you to join|đã mời bạn tham gia/i.test(notification.message))
    const path = notificationPath(notification)
    const match = isInvitation ? entries.find((entry) => {
      const invitation = entry.invitation
      if (!invitation || path?.split(/[?#]/)[0] !== `/fanpage/${invitation.fanpageId}`) return false
      const difference = Math.abs(Date.parse(notification.createdAt) - Date.parse(invitation.createdAt))
      return Number.isFinite(difference) && difference <= 120_000
    }) : undefined
    if (match) {
      match.notification ??= notification
      match.notificationIds.push(notification.id)
      match.unread ||= notification.status === 'UNREAD'
    } else {
      entries.push({ key: `notification-${notification.id}`, createdAt: notification.createdAt,
        notification, notificationIds: [notification.id], unread: notification.status === 'UNREAD' })
    }
  }
  return entries.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
}

export function getInvitationSender(invitation: FanpageInvitation, notification?: NotificationItem) {
  const name = invitation.inviterName || invitation.createdByName
  if (name) return name
  return notification?.message.match(/^(.+?)\s+(?:invited you to join|đã mời bạn tham gia)/i)?.[1] || 'Ban quản trị'
}
