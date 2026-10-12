import React, { useState } from 'react'
import { EventCard, EventFilterBar, type Event } from '@/features/events'

const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'AI & Machine Learning Global Summit 2026',
    description:
      'Explore the future of agentic AI, large models, and real-world enterprise applications.',
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
  },
  {
    id: 'evt-2',
    title: 'Fullstack React Architecture Masterclass',
    description:
      'Deep dive into Clean & Layered Architecture, state machines, and resilient web design.',
    category: 'WORKSHOP',
    status: 'PUBLISHED',
    startTime: '2026-10-28T14:00:00Z',
    endTime: '2026-10-28T18:00:00Z',
    location: { type: 'ONLINE', onlineMeetingUrl: 'https://meet.eventhub.io/react-arch' },
    capacity: 100,
    registeredCount: 88,
    price: 0,
    organizerId: 'org-2',
    organizerName: 'DevCraft Academy',
    tags: ['React', 'TypeScript', 'Clean Code'],
    isModerationRequired: false,
    createdAt: '2026-10-05T00:00:00Z',
    updatedAt: '2026-10-05T00:00:00Z',
  },
]

export const EventListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEvents = mockEvents.filter((evt) =>
    evt.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="text-muted-foreground mt-1">Discover workshops, seminars, and summits.</p>
        </div>

        <EventFilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt) => (
          <EventCard key={evt.id} event={evt} />
        ))}
      </div>
    </div>
  )
}
