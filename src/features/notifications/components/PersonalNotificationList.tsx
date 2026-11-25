import React, { useState } from 'react'
import { Bell, Building2, Check, CheckCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'
import { formatNotificationTime, getNotificationIconBadge } from '../utils/notificationUtils'
import { getInvitationSender, type NotificationFeedEntry } from '../utils/notificationFeed'
import type { usePersonalNotificationFeed } from '../hooks/usePersonalNotificationFeed'

type PersonalFeed = ReturnType<typeof usePersonalNotificationFeed>
type FilterFeed = Pick<
  PersonalFeed,
  'filter' | 'setFilter' | 'unreadCount' | 'markAllAsRead' | 'isMarkingAllAsRead'
>
export type NotificationListFeed = Pick<
  PersonalFeed,
  'entries' | 'filter' | 'markAsRead' | 'isLoading' | 'isError' | 'retry'
> &
  Partial<
    Pick<
      PersonalFeed,
      | 'feedback'
      | 'searchQuery'
      | 'respond'
      | 'pendingInvitation'
      | 'hasNextPage'
      | 'isFetchingNextPage'
      | 'fetchNextPage'
    >
  >

export function NotificationFilters({ feed }: { feed: FilterFeed }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2" role="group" aria-label="Lọc thông báo">
        {(['ALL', 'UNREAD'] as const).map((filter) => (
          <Button
            key={filter}
            variant="ghost"
            aria-pressed={feed.filter === filter}
            onClick={() => feed.setFilter(filter)}
            className={cn(
              'h-10 px-4 text-sm',
              feed.filter === filter
                ? 'bg-brand-subtle text-brand-subtle-foreground hover:bg-brand-subtle'
                : 'text-muted-foreground'
            )}
          >
            {filter === 'ALL' ? 'Tất cả' : 'Chưa đọc'}
          </Button>
        ))}
      </div>
      {feed.unreadCount > 0 && (
        <Button
          variant="ghost"
          onClick={() => feed.markAllAsRead()}
          disabled={feed.isMarkingAllAsRead}
          aria-label="Đánh dấu tất cả là đã đọc"
          className="h-10 gap-2 px-2 text-primary hover:text-primary"
        >
          <CheckCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm">Đọc tất cả</span>
        </Button>
      )}
    </div>
  )
}

function NotificationAvatar({ entry }: { entry: NotificationFeedEntry }) {
  const [brokenImage, setBrokenImage] = useState(false)
  const src = entry.invitation?.fanpageAvatarUrl || entry.notification?.iconUrl
  const badge = getNotificationIconBadge(
    entry.notification?.title,
    entry.notification?.message,
    'h-4 w-4',
    entry.invitation ? 'FANPAGE_MEMBER_INVITED' : entry.notification?.type
  )
  const Fallback = entry.invitation ? Building2 : Bell
  return (
    <div className="relative h-12 w-12 shrink-0" aria-hidden="true">
      {src && !brokenImage ? (
        <img
          src={src}
          alt=""
          onError={() => setBrokenImage(true)}
          className="h-12 w-12 rounded-full border border-border object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
          <Fallback className="h-6 w-6" />
        </div>
      )}
      <span
        className={cn(
          'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background',
          badge.bgColor
        )}
      >
        {badge.icon}
      </span>
    </div>
  )
}

// React text nodes only: quoted entity names and actors get the same emphasis in
// both the page and dropdown, without rendering HTML supplied by a notification.
export function NotificationMessage({ message }: { message: string }) {
  const parts = message.split(/(["“][^"”]+["”]|\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (/^(?:["“]|\*\*)/.test(part))
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.replace(/^\*\*|\*\*$/g, '')}
            </strong>
          )
        const actor =
          index === 0
            ? part.match(/^(.{1,100}?)\s+(đã |invited |accepted |declined |was appointed )/i)
            : null
        return actor ? (
          <React.Fragment key={index}>
            <strong className="font-semibold text-foreground">{actor[1]}</strong>
            {part.slice(actor[1].length)}
          </React.Fragment>
        ) : (
          part
        )
      })}
    </>
  )
}

export function PersonalNotificationList({
  feed,
  onOpen,
  onAccepted,
  compact = false,
}: {
  feed: NotificationListFeed
  onOpen: (entry: NotificationFeedEntry) => void
  onAccepted?: (name: string) => void
  compact?: boolean
}) {
  return (
    <>
      {feed.feedback && (
        <p role="status" className="m-3 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
          {feed.feedback}
        </p>
      )}
      {feed.isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-destructive"
        >
          <span>Không thể tải đầy đủ thông báo.</span>
          <Button variant="outline" onClick={feed.retry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      )}
      {feed.isLoading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 px-4 py-12 text-sm text-muted-foreground"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Đang tải thông báo…
        </div>
      ) : feed.entries.length === 0 && !feed.isError ? (
        <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
          <div className="rounded-full bg-muted p-4 text-muted-foreground">
            <Bell className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">
            {feed.searchQuery?.trim()
              ? 'Không tìm thấy thông báo phù hợp'
              : feed.filter === 'UNREAD'
                ? 'Bạn đã đọc hết thông báo'
                : 'Chưa có thông báo'}
          </p>
          {feed.searchQuery?.trim() && feed.hasNextPage && (
            <p className="text-xs text-muted-foreground">
              Tải thêm thông báo để tìm trong các mục cũ hơn.
            </p>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-1 p-2 sm:p-3" aria-label="Danh sách thông báo">
          {feed.entries.map((entry) => {
            const invitation = entry.invitation
            const pending = invitation?.status === 'PENDING'
            const notification = entry.notification
            const busy = invitation && feed.pendingInvitation === invitation.id
            const content = (
              <>
                <NotificationAvatar entry={entry} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 break-words text-sm leading-6 [overflow-wrap:anywhere]">
                      {invitation ? (
                        <p>
                          <strong className="font-semibold">
                            {getInvitationSender(invitation, notification)}
                          </strong>{' '}
                          đã mời bạn tham gia ban tổ chức fanpage{' '}
                          <strong className="font-semibold">
                            {invitation.fanpageName || 'Fanpage'}
                          </strong>
                          .
                        </p>
                      ) : (
                        <>
                          {notification?.title &&
                            notification.title !== 'Thông báo' &&
                            notification.title.trim() !== notification.message?.trim() && (
                              <p className="font-semibold text-foreground">{notification.title}</p>
                            )}
                          <p className="whitespace-pre-line">
                            <NotificationMessage
                              message={notification?.message || 'Bạn có thông báo mới.'}
                            />
                          </p>
                        </>
                      )}
                    </div>
                    {entry.unread && (
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-label="Chưa đọc"
                      />
                    )}
                  </div>
                  <time
                    dateTime={entry.createdAt}
                    title={new Date(entry.createdAt).toLocaleString('vi-VN')}
                    className={cn(
                      'text-xs leading-5',
                      entry.unread ? 'font-medium text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {formatNotificationTime(entry.createdAt)}
                  </time>
                  {invitation &&
                    (pending ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          disabled={Boolean(feed.pendingInvitation)}
                          onClick={() => feed.respond?.(invitation, true, onAccepted)}
                          className="h-10 bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                        >
                          {busy ? 'Đang xử lý…' : 'Chấp nhận'}
                        </Button>
                        <Button
                          disabled={Boolean(feed.pendingInvitation)}
                          variant="outline"
                          onClick={() => feed.respond?.(invitation, false)}
                          className="h-10 px-4"
                        >
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {invitation.status === 'ACCEPTED' && (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                        {invitation.status === 'ACCEPTED'
                          ? 'Đã chấp nhận lời mời'
                          : ['DECLINED', 'REJECTED'].includes(invitation.status)
                            ? 'Đã từ chối lời mời'
                            : 'Lời mời đã hủy'}
                      </p>
                    ))}
                </div>
              </>
            )
            const rowClass = cn(
              'flex w-full items-start gap-4 rounded-xl p-3 text-left text-foreground transition-colors',
              entry.unread ? 'bg-brand-subtle/60' : 'hover:bg-muted/60',
              compact && 'gap-3'
            )
            return (
              <li key={entry.key}>
                {invitation ? (
                  <div className={rowClass}>
                    <div
                      className="flex w-full items-start gap-4"
                      onClick={() => {
                        if (entry.unread) entry.notificationIds.forEach((id) => feed.markAsRead(id))
                      }}
                    >
                      {content}
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => onOpen(entry)}
                    className={cn(
                      rowClass,
                      'h-auto whitespace-normal font-normal focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'
                    )}
                  >
                    {content}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {feed.hasNextPage && (
        <div className="flex justify-center border-t border-border p-3">
          <Button
            variant="ghost"
            disabled={feed.isFetchingNextPage}
            onClick={feed.fetchNextPage}
            className="h-10 text-primary"
          >
            {feed.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm thông báo'}
          </Button>
        </div>
      )}
    </>
  )
}
