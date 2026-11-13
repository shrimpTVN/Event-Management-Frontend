import React, { useState } from 'react'
import type { FanpageSummary, AdminNavTab } from '../types/fanpageAdmin.types'
import { FanpageAdminTopNav } from './FanpageAdminTopNav'
import { FanpageAdminSidebar } from './FanpageAdminSidebar'

interface FanpageAdminLayoutProps {
  currentFanpage: FanpageSummary
  availableFanpages: FanpageSummary[]
  onSelectFanpage: (fanpage: FanpageSummary) => void
  activeTab?: AdminNavTab | null
  onSelectTab?: (tab: AdminNavTab) => void
  onLogoClick?: () => void
  onCreateEventClick?: () => void
  onPersonalProfileClick?: () => void
  rightSidebar?: React.ReactNode
  children: React.ReactNode
}

export const FanpageAdminLayout: React.FC<FanpageAdminLayoutProps> = ({
  currentFanpage,
  availableFanpages,
  onSelectFanpage,
  activeTab = null,
  onSelectTab,
  onLogoClick,
  onCreateEventClick,
  onPersonalProfileClick,
  rightSidebar,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background flex flex-col">
      {/* 1. Sticky Top Navigation Bar */}
      <FanpageAdminTopNav
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        currentFanpageId={currentFanpage?.id}
        currentFanpageRole={currentFanpage?.role}
        currentFanpageName={currentFanpage?.name}
        currentFanpageAvatarUrl={currentFanpage?.avatarUrl}
        availableFanpages={availableFanpages}
        onSelectFanpage={onSelectFanpage}
        onLogoClick={onLogoClick}
        onCreateEventClick={onCreateEventClick}
        onPersonalProfileClick={onPersonalProfileClick}
      />

      {/* 2. Admin Workspace (Sidebar + Main Content + Right Sidebar) */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Fixed/Sticky Left Sidebar - Attached right below TopNav (h-16 = 64px) with no gap */}
        <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] shrink-0 z-30">
          <FanpageAdminSidebar
            currentFanpage={currentFanpage}
            availableFanpages={availableFanpages}
            onSelectFanpage={onSelectFanpage}
            activeTab={activeTab}
            onSelectTab={onSelectTab}
          />
        </div>

        {/* Mobile / Tablet Drawer Sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Slide-out Sidebar Panel */}
            <div className="relative w-[280px] max-w-[80vw] h-full bg-white dark:bg-card shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <FanpageAdminSidebar
                currentFanpage={currentFanpage}
                availableFanpages={availableFanpages}
                onSelectFanpage={(fp) => {
                  onSelectFanpage(fp)
                  setIsSidebarOpen(false)
                }}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  onSelectTab?.(tab)
                  setIsSidebarOpen(false)
                }}
              />
            </div>
          </div>
        )}

        {/* Center Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-5 lg:py-5 lg:px-6 flex justify-center">
          <div className={`w-full ${activeTab === null ? 'max-w-5xl' : 'w-full'}`}>
            {children}
          </div>
        </main>

        {/* Right Sidebar Area (Card thành viên fanpage + Trạng thái hoạt động) */}
        {rightSidebar && (
          <aside className="hidden xl:block w-[280px] min-w-[280px] max-w-[280px] shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-5 pr-5 pl-0 sidebar-scrollbar">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
