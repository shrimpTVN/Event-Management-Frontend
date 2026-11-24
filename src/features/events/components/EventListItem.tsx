import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bookmark, CalendarDays, Gift, ImageIcon, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextTooltip } from '@/components/ui/text-tooltip'
import { Tooltip } from '@/components/ui/tooltip'
import type { Event } from '../types/event.types'
import { RegistrationDeadline, type useRegistrationDeadline } from './RegistrationDeadline'

interface EventListItemProps {
  event: Event
  organizerName: string
  dateTime: string
  location: string
  benefits: { label: string; title: string }[]
  deadline: ReturnType<typeof useRegistrationDeadline>
  onSave: () => void
  registrationAction: ReactNode
}

export function EventListItem({
  event,
  organizerName,
  dateTime,
  location,
  benefits,
  deadline,
  onSave,
  registrationAction,
}: EventListItemProps) {
  const route = useLocation()
  const detailUrl = `/events/${event.id}`
  const from = { from: `${route.pathname}${route.search}` }
  return (
    <article className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-xl border border-border/70 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-card sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-x-4 sm:p-4">
      <Link
        to={detailUrl}
        state={from}
        aria-label={`Xem sự kiện ${event.title}`}
        className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-muted sm:row-span-2 sm:h-36"
      >
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-7 w-7 text-muted-foreground/60" aria-hidden="true" />
        )}
      </Link>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Link
            to={`/fanpage/${event.organizerId || '1'}`}
            className="min-w-0 truncate hover:text-primary"
          >
            {organizerName}
          </Link>
          {event.eventTypeName && (
            <span className="hidden shrink-0 rounded-md bg-primary/5 px-1.5 py-0.5 text-primary sm:inline">
              {event.eventTypeName}
            </span>
          )}
        </div>
        <h2 className="line-clamp-3 sm:line-clamp-2 font-k2d text-base font-semibold leading-snug text-foreground">
          <Link to={detailUrl} state={from} className="hover:text-primary">
            {event.title}
          </Link>
        </h2>
        <div className="flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
            <TextTooltip
              label={dateTime}
              content={dateTime}
              className="truncate font-medium text-foreground"
            />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <TextTooltip label={location} content={location} className="truncate" />
          </div>
        </div>
      </div>
      <div className="col-span-2 flex min-w-0 flex-col gap-3 sm:col-span-1 sm:col-start-2">
        <div className="flex min-w-0 items-start gap-2 text-xs">
          <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-col gap-1 text-muted-foreground">
            {benefits.map((benefit, index) => (
              <TextTooltip
                key={index}
                label={benefit.label}
                content={benefit.title}
                className="truncate"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.capacity > 0 ? `${event.registeredCount}/${event.capacity}` : 'Không giới hạn'}
            </span>
            <RegistrationDeadline info={deadline} isRegistered={event.isRegistered} />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Tooltip content={event.isSaved ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-11 w-11 sm:h-8 sm:w-8"
                aria-label={event.isSaved ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện'}
                aria-pressed={Boolean(event.isSaved)}
                onClick={onSave}
              >
                <Bookmark
                  className={`h-4 w-4 ${event.isSaved ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`}
                />
              </Button>
            </Tooltip>
            {registrationAction}
          </div>
        </div>
      </div>
    </article>
  )
}
