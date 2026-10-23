import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EventCard, EventFilterBar, StudentLeftSidebar, eventService } from '@/features/events'

export const EventListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: () => eventService.getEvents(),
  })

  const filteredEvents = events.filter((evt) =>
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

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 animate-pulse h-64"
                  >
                    <div className="h-32 bg-muted rounded-xl w-full" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🔍</span>
                <h3 className="font-semibold text-foreground text-base">
                  Không tìm thấy sự kiện nào
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchTerm
                    ? `Không có sự kiện nào khớp với "${searchTerm}". Hãy thử từ khóa khác.`
                    : 'Hiện chưa có sự kiện nào được công bố.'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
