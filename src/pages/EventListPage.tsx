import React, { useState } from 'react'
import { EventCard, EventFilterBar, StudentLeftSidebar, type Event } from '@/features/events'

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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-5xl flex flex-col gap-6 pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
                  Tất cả sự kiện
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Khám phá các hội thảo, tọa đàm, chiến dịch tình nguyện và phong trào sinh viên
                </p>
              </div>

              <EventFilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
