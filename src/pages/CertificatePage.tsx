import React from 'react'
import { CertificateCard } from '@/features/certificates'
import { StudentLeftSidebar } from '@/features/events'

export const CertificatePage: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Center / Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-2xl flex flex-col gap-6 pb-16">
            <div className="text-center space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
                Chứng nhận tham gia
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Giấy chứng nhận số chính thức xác nhận việc hoàn thành và điểm danh sự kiện
              </p>
            </div>

            <CertificateCard />
          </div>
        </main>
      </div>
    </div>
  )
}
