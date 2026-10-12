import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EventDetailView, type Event } from '@/features/events'

const mockEvent: Event = {
  id: 'evt-1',
  title: 'AI & Machine Learning Global Summit 2026',
  description:
    'Explore state-of-the-art advances in agentic artificial intelligence, foundational models, and scalable web systems.',
  category: 'CONFERENCE',
  status: 'PUBLISHED',
  startTime: '2026-11-15T09:00:00Z',
  endTime: '2026-11-17T17:00:00Z',
  location: { type: 'OFFLINE', city: 'San Francisco, CA', address: 'Moscone Center' },
  capacity: 500,
  registeredCount: 342,
  price: 199,
  organizerId: 'org-1',
  organizerName: 'TechVision Foundation',
  tags: ['AI', 'Engineering', 'Innovation'],
  isModerationRequired: true,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const event = { ...mockEvent, id: id || mockEvent.id }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      <EventDetailView event={event} />
    </div>
  )
}
