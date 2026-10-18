import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EventDetailView, StudentLeftSidebar, type Event } from '@/features/events'

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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-4xl flex flex-col gap-6 pb-16">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại danh sách sự kiện</span>
            </Link>

            <EventDetailView event={event} />
          </div>
        </main>
      </div>
    </div>
  )
}
