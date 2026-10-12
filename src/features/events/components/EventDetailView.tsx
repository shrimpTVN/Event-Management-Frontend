import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, ShieldCheck } from 'lucide-react'
import { formatDate, formatCurrency } from '@/shared'
import type { Event } from '../types/event.types'

interface EventDetailViewProps {
  event: Event
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {event.category}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{event.title}</h1>
        <p className="text-lg text-muted-foreground">{event.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-semibold">{formatDate(event.startTime)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-semibold">
              {event.location.type === 'ONLINE'
                ? 'Online Stream'
                : `${event.location.city || ''} (${event.location.address || ''})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registration</p>
            <p className="text-sm font-semibold">
              {event.registeredCount} / {event.capacity} Attendees
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-xs text-muted-foreground">Registration Fee</span>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(event.price)}</p>
        </div>

        <Link
          to={`/events/${event.id}/register`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow hover:bg-primary/90 transition-all"
        >
          <ShieldCheck className="h-4 w-4" />
          Register Now
        </Link>
      </div>
    </div>
  )
}
