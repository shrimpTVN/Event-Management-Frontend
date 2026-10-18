import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { RegistrationForm } from '@/features/registration'
import { StudentLeftSidebar } from '@/features/events'

export const RegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-xl flex flex-col gap-6 pb-16">
            <Link
              to={`/events/${id}`}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại thông tin sự kiện</span>
            </Link>

            <RegistrationForm eventId={id || 'evt-1'} />
          </div>
        </main>
      </div>
    </div>
  )
}
