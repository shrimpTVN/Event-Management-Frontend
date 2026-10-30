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
        onLogoClick={onLogoClick}
        onCreateEventClick={onCreateEventClick}
      />

      {/* 2. Admin Workspace (Sidebar + Main Content) */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Fixed/Sticky Sidebar */}
        <div className="hidden lg:block sticky top-[72px] h-[calc(100vh-72px)] shrink-0 z-30">
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

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:py-6 lg:px-8">
          <div className={`w-full ${activeTab === null ? 'max-w-7xl' : 'w-full'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
