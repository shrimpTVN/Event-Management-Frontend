import React, { useState } from 'react'
import { SuperAdminTopNav } from './SuperAdminTopNav'
import { SuperAdminSidebar } from './SuperAdminSidebar'
import type { SuperAdminTab } from '../types/superAdmin.types'

interface SuperAdminLayoutProps {
  activeTab: SuperAdminTab
  onSelectTab: (tab: SuperAdminTab) => void
  pendingFanpagesCount?: number
  children: React.ReactNode
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  activeTab,
  onSelectTab,
  pendingFanpagesCount = 0,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background flex flex-col text-left">
      {/* 1. Header Navigation */}
      <SuperAdminTopNav
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* 2. Admin Workspace */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] shrink-0 z-30">
          <SuperAdminSidebar
            activeTab={activeTab}
            onSelectTab={onSelectTab}
            pendingFanpagesCount={pendingFanpagesCount}
          />
        </div>

        {/* Mobile Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 bg-white dark:bg-card h-full shadow-2xl flex flex-col">
              <SuperAdminSidebar
                activeTab={activeTab}
                onSelectTab={(t) => {
                  onSelectTab(t)
                  setIsSidebarOpen(false)
                }}
                pendingFanpagesCount={pendingFanpagesCount}
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

