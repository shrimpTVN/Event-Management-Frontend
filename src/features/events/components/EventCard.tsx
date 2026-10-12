import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar as CalendarIcon, Tag } from 'lucide-react'
import { formatDate, formatCurrency } from '@/shared'
import type { Event } from '../types/event.types'

interface EventCardProps {
  event: Event
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-primary">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5">{event.category}</span>
          <span className="font-bold text-sm text-foreground">{formatCurrency(event.price)}</span>
        </div>

        <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h2>

        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>

        <div className="space-y-1.5 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>
              {event.location.type === 'ONLINE'
                ? 'Online Stream'
                : `${event.location.city || ''} (${event.location.address || ''})`}
            </span>
          </div>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6">
        <Link
          to={`/events/${event.id}`}
          className="w-full inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          View Details & Register
        </Link>
      </div>
    </div>
  )
}
