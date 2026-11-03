import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  SuperAdminLayout,
  SuperAdminOverviewView,
  SuperAdminUsersView,
  SuperAdminFanpagesView,
  SuperAdminEventsView,
  SuperAdminSemestersView,
  SuperAdminTrainingPointsView,
  SuperAdminSv5tView,
  superAdminService,
  type SuperAdminTab,
  type SuperAdminOverviewStats,
} from '@/features/super-admin'

const DEFAULT_STATS: SuperAdminOverviewStats = {
  totalUsers: 0,
  studentCount: 0,
  staffCount: 0,
  adminCount: 0,
  totalFanpages: 0,
  activeFanpages: 0,
  pendingFanpages: 0,
  totalEvents: 0,
  publishedEvents: 0,
  draftEvents: 0,
  closedEvents: 0,
  ongoingSemester: null,
}

export const SuperAdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as SuperAdminTab) || 'overview'

  const { data: stats = DEFAULT_STATS } = useQuery({
    queryKey: ['superadmin-overview-stats'],
    queryFn: () => superAdminService.getOverviewStats(),
    staleTime: 1000 * 60 * 2,
  })

  const handleSelectTab = (tab: SuperAdminTab) => {
    setSearchParams({ tab })
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <SuperAdminOverviewView
            stats={stats}
            onNavigateTab={handleSelectTab}
          />
        )
      case 'users':
        return <SuperAdminUsersView />
      case 'fanpages':
        return <SuperAdminFanpagesView />
      case 'events':
        return <SuperAdminEventsView />
      case 'semesters':
        return <SuperAdminSemestersView />
      case 'training-points':
        return <SuperAdminTrainingPointsView />
      case 'sv5t':
        return <SuperAdminSv5tView />
      default:
        return (
          <SuperAdminOverviewView
            stats={stats}
            onNavigateTab={handleSelectTab}
          />
        )
    }
  }

  return (
    <SuperAdminLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      pendingFanpagesCount={stats.pendingFanpages}
    >
      {renderContent()}
    </SuperAdminLayout>
  )
}

export default SuperAdminPage
