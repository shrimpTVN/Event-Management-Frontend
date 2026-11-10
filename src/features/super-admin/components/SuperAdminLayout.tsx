import React, { useState } from 'react'
import type { SuperAdminNavTab } from '../types/superAdmin.types'
import { SuperAdminTopNav } from './SuperAdminTopNav'
import { SuperAdminSidebar } from './SuperAdminSidebar'

interface SuperAdminLayoutProps {
  activeTab: SuperAdminNavTab
  onSelectTab: (tab: SuperAdminNavTab) => void
  pendingFanpagesCount?: number
  violatedEventsCount?: number
  searchQuery?: string
  onSearchChange?: (q: string) => void
  children: React.ReactNode
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  pendingFanpagesCount = 2,
  violatedEventsCount = 1,
  searchQuery = '',
  onSearchChange,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background flex flex-col font-sans">
      {/* 1. Sticky Top Navigation */}
      <SuperAdminTopNav
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        unreadNotificationsCount={pendingFanpagesCount + violatedEventsCount}
      />

      {/* 2. Admin Workspace */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:block sticky top-[72px] h-[calc(100vh-72px)] shrink-0 z-30">
          <SuperAdminSidebar
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            pendingFanpagesCount={pendingFanpagesCount}
            violatedEventsCount={violatedEventsCount}
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
              <SuperAdminSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  onSelectTab(tab)
                  setIsSidebarOpen(false)
                }}
                pendingFanpagesCount={pendingFanpagesCount}
                violatedEventsCount={violatedEventsCount}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1300px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
