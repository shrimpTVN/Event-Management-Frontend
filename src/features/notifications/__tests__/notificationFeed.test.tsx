import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { buildNotificationFeed, getInvitationSender } from '../utils/notificationFeed'
import { getNotificationIconBadge } from '../utils/notificationUtils'
import { NotificationMessage } from '../components/PersonalNotificationList'
import type { NotificationItem } from '../types/notification.types'

const invitation = { id: 10, fanpageId: 5, fanpageName: 'Đoàn khoa', status: 'PENDING', createdAt: '2026-11-24T08:00:00Z' }
const notification: NotificationItem = { id: 20, type: 'FANPAGE_MEMBER_INVITED', title: 'Thông báo',
  message: 'Ngọc Anh invited you to join "Đoàn khoa".', url: '/fanpage/5', status: 'UNREAD', createdAt: '2026-11-24T08:00:01Z' }

describe('personal notification feed', () => {
  it('merges the API invitation and its system notification into one actionable row', () => {
    const entries = buildNotificationFeed([notification, notification], [invitation, invitation])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ invitation, notificationIds: [20], unread: true })
    expect(getInvitationSender(invitation, notification)).toBe('Ngọc Anh')
  })
  it('does not hide other events, other fanpages or a later invitation with the same text', () => {
    const entries = buildNotificationFeed([notification,
      { ...notification, id: 21, type: 'FANPAGE_APPROVED' },
      { ...notification, id: 22, url: '/fanpage/6' },
      { ...notification, id: 23, createdAt: '2026-11-25T08:00:00Z' },
    ], [invitation])
    expect(entries).toHaveLength(4)
    expect(entries[0].notification?.id).toBe(23)
  })
  it('keeps a read invitation out of unread even when it is still pending', () => {
    const [entry] = buildNotificationFeed([{ ...notification, status: 'READ' }], [invitation])
    expect(entry.unread).toBe(false)
    expect(entry.invitation?.status).toBe('PENDING')
  })
  it('never uses the recipient as the inviter or invents a personal name', () => {
    expect(getInvitationSender(invitation)).toBe('Ban quản trị')
  })
  it('uses danger for rejected approval instead of classifying the word duyệt as success', () => {
    expect(getNotificationIconBadge('Không được duyệt', '', undefined, 'FANPAGE_REJECTED').bgColor).toBe('bg-destructive')
  })
  it('emphasizes actor and entity names as safe text without rendering supplied HTML', () => {
    render(<NotificationMessage message={'Ngọc Anh đã duyệt "Hội thảo AI". <script>alert(1)</script>'} />)
    expect(screen.getByText('Ngọc Anh').tagName).toBe('STRONG')
    expect(screen.getByText('"Hội thảo AI"').tagName).toBe('STRONG')
    expect(document.querySelector('script')).toBeNull()
  })
})
