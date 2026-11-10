import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth'
import { fanpageService } from '@/features/fanpage/services/fanpageService'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'
import {
  FanpageAdminLayout,
  FanpageHomeView,
  FanpageEventListView,
  FanpageCreateEventView,
  FanpageEventDetailAdminView,
  FanpageMembersView,
  FanpageProfileEditView,
  FanpageDashboardView,
  FanpageRightSidebar,
  FanpageAdminPersonalProfileView,
  fanpageAdminService,
  EMPTY_ACTIVITY_STATS,
  type FanpageFeedPost,
} from '@/features/fanpage-admin'
import type { FanpageSummary, AdminNavTab, AdminEvent } from '@/features/fanpage-admin'

export const FanpageAdminPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const initialFanpageId = (location.state as { fanpageId?: string } | undefined)?.fanpageId

  // Lấy danh sách Fanpage khả dụng mà người dùng có tham gia (Admin hoặc Thành viên/Cộng tác viên)
  const { data: availableFanpages = [] } = useQuery<FanpageSummary[]>({
    queryKey: ['admin-available-fanpages', user?.id, user?.email],
    queryFn: async () => {
      const fanpageMap = new Map<string, FanpageSummary>()

      // 1. Fanpages do user làm Admin hoặc Thành viên từ API chuẩn xác trong DB
      try {
        const pages = await fanpageAdminService.getAvailableFanpages()
        if (Array.isArray(pages)) {
          for (const fp of pages) {
            fanpageMap.set(String(fp.id), fp)
          }
        }
      } catch (err) {
        console.warn('Could not fetch fanpages:', err)
      }

      const result = Array.from(fanpageMap.values())

      // Tự động đồng bộ và dọn dẹp các fanpage không còn thuộc về người dùng khỏi userFanpagesStore
      try {
        useUserFanpagesStore.getState().setMyFanpages(
          result.map((f) => ({
            id: f.id,
            name: f.name,
            role: f.role,
            avatarUrl: f.avatarUrl,
          }))
        )
      } catch (storeErr) {
        console.warn('Could not sync userFanpagesStore:', storeErr)
      }

      return result
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // Nếu có initialFanpageId cụ thể được truyền vào từ URL / state, tải thông tin chi tiết của Fanpage đó
  const { data: targetFanpage } = useQuery<FanpageSummary | null>({
    queryKey: ['fanpage-detail-by-id', initialFanpageId, user?.id, user?.email],
    queryFn: async () => {
      if (!initialFanpageId) return null
      try {
        const fp = await fanpageService.getFanpageById(initialFanpageId)
        if (fp) {
          let userRole = 'Cộng tác viên'
          try {
            const members = await fanpageAdminService.getFanpageMembers(initialFanpageId)
            const myMem = members.find((m) => m.id === user?.id || m.email === user?.email)
            if (myMem?.role === 'ADMIN') {
              userRole = 'Quản trị viên'
            }
          } catch {}

          const fpCode = (fp as any)?.code || (fp.name || 'FP').slice(0, 3).toUpperCase()
          return {
            id: String(fp.id),
            code: fpCode,
            name: fp.name,
            fullName: fp.fullName || fp.orgName || fp.name,
            avatarText: fpCode,
            avatarUrl: fp.avatarUrl || '',
            role: userRole,
            isVerified: fp.isVerified ?? true,
            email: fp.email || '',
            phone: fp.phone || '',
            address: fp.address || '',
            followersCount: fp.followerCount || 0,
            eventsCount: fp.eventCount || 0,
            description: fp.description || '',
            parentOrg: fp.orgName || '',
          }
        }
      } catch (e) {
        console.warn('Failed to fetch target fanpage:', e)
      }
      return null
    },
    enabled: Boolean(initialFanpageId),
    staleTime: 30 * 1000,
  })

  const [selectedFanpage, setSelectedFanpage] = useState<FanpageSummary | null>(null)

  const fallbackFanpage: FanpageSummary = {
    id: '1',
    code: 'CNTT',
    name: 'Đoàn Trường CNTT & TT',
    fullName: 'Đoàn Trường CNTT & TT',
    avatarText: 'CNT',
    avatarUrl: '',
    role: 'Cộng tác viên',
    isVerified: true,
    email: 'doanit@ctu.edu.vn',
    phone: '0292.3832.663',
    address: 'Khu II, Đại học Cần Thơ',
    followersCount: 1200,
    eventsCount: 1,
    description: 'Trang thông tin chính thức của Đoàn TNCS Hồ Chí Minh Khoa CNTT & TT - Trường Đại học Cần Thơ',
    parentOrg: 'Đoàn Thanh niên - Hội Sinh viên ĐH Cần Thơ',
  }

  const currentFanpage: FanpageSummary =
    selectedFanpage ||
    targetFanpage ||
    (initialFanpageId ? availableFanpages.find((fp) => fp.id === initialFanpageId) : undefined) ||
    availableFanpages[0] ||
    fallbackFanpage

  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['admin-feed-posts', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getFeedPosts(currentFanpage?.id),
    enabled: Boolean(currentFanpage?.id),
  })

  const { data: adminEvents = [], isLoading: isLoadingAdminEvents } = useQuery({
    queryKey: ['admin-events', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getAdminEvents(currentFanpage?.id),
    enabled: Boolean(currentFanpage?.id),
  })

  const { data: followerCount = 0 } = useQuery({
    queryKey: ['admin-follower-count', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getFanpageFollowerCount(currentFanpage?.id),
    enabled: Boolean(currentFanpage?.id),
  })

  const enrichedFanpage: FanpageSummary = {
    ...currentFanpage,
    eventsCount: adminEvents.length,
    followersCount: followerCount > 0 ? followerCount : (currentFanpage.followersCount || 0),
  }

  const { data: stats = EMPTY_ACTIVITY_STATS } = useQuery({
    queryKey: ['admin-activity-stats', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getActivityStats(currentFanpage?.id),
    enabled: Boolean(currentFanpage?.id),
  })

  const { data: reminder = null } = useQuery({
    queryKey: ['admin-upcoming-reminder', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getUpcomingReminder(currentFanpage?.id),
    enabled: Boolean(currentFanpage?.id),
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as AdminNavTab | null
  const [activeTab, setActiveTab] = useState<AdminNavTab | null>(tabFromUrl || null)

  const isCurrentUserAdmin =
    currentFanpage?.role === 'Quản trị viên' ||
    currentFanpage?.role === 'ADMIN' ||
    (user?.role ? ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER'].includes(user.role) : false)

  // Tự động điều hướng URL phù hợp theo vai trò:
  // - Nếu không phải Quản trị viên (là Sinh viên / Cộng tác viên) mà URL đang là /fanpage/admin:
  //   chuyển ngay sang /fanpage/workspace để URL chính xác.
  useEffect(() => {
    if (!isCurrentUserAdmin && location.pathname === '/fanpage/admin') {
      navigate(
        {
          pathname: '/fanpage/workspace',
          search: location.search,
        },
        { replace: true, state: location.state }
      )
    }
  }, [isCurrentUserAdmin, location.pathname, location.search, location.state, navigate])

  // Synchronize state when tab query param in URL changes
  useEffect(() => {
    setActiveTab(tabFromUrl || null)
  }, [tabFromUrl])

  const handleSelectTab = (tab: AdminNavTab) => {
    const nextTab = activeTab === tab ? null : tab
    setActiveTab(nextTab)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (nextTab) {
        next.set('tab', nextTab)
      } else {
        next.delete('tab')
      }
      return next
    })
  }
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    return searchParams.get('eventId') || null
  })

  // Sync selectedEventId with URL searchParams if present
  useEffect(() => {
    const urlEventId = searchParams.get('eventId')
    if (urlEventId && urlEventId !== selectedEventId) {
      setSelectedEventId(urlEventId)
    }
  }, [searchParams])

  const currentSelectedEvent =
    adminEvents.find((e) => String(e.id) === String(selectedEventId)) || adminEvents[0]

  const currentEventId = selectedEventId || searchParams.get('eventId')
  const editingEvent = currentEventId
    ? adminEvents.find((e) => String(e.id) === String(currentEventId)) || null
    : null

  const handleCreateEventClick = () => {
    setSelectedEventId(null)
    setActiveTab('create-event')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'create-event')
      next.delete('eventId')
      return next
    })
  }

  const handleEditEventClick = (event: AdminEvent) => {
    setSelectedEventId(String(event.id))
    setActiveTab('create-event')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'create-event')
      next.set('eventId', String(event.id))
      return next
    })
  }

  const handleEditFeedPost = (post: FanpageFeedPost) => {
    const rawId = post.eventId || post.id.replace('post-', '')
    const targetEvent = adminEvents.find((e) => String(e.id) === String(rawId))
    if (targetEvent) {
      handleEditEventClick(targetEvent)
    } else {
      setSelectedEventId(String(rawId))
      setActiveTab('create-event')
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', 'create-event')
        next.set('eventId', String(rawId))
        return next
      })
    }
  }

  const handleEditProfileClick = () => {
    setActiveTab('profile')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'profile')
      return next
    })
  }

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId)
    setActiveTab('event-detail')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'event-detail')
      next.set('eventId', eventId)
      return next
    })
  }

  const handleSaveNewEvent = (_newEvent: Partial<AdminEvent>, _isPublished: boolean) => {
    queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    setSelectedEventId(null)
    setActiveTab('events')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'events')
      next.delete('eventId')
      return next
    })
  }

  const handleSaveFanpageProfile = (updatedProfile: Partial<FanpageSummary>) => {
    setSelectedFanpage((prev) => {
      const base = prev || currentFanpage
      return { ...base, ...updatedProfile }
    })
    queryClient.invalidateQueries({ queryKey: ['admin-available-fanpages'] })
    queryClient.invalidateQueries({ queryKey: ['fanpage-detail'] })
    queryClient.invalidateQueries({ queryKey: ['fanpage-detail-by-id'] })
    queryClient.invalidateQueries({ queryKey: ['staff-my-fanpages'] })
    queryClient.invalidateQueries({ queryKey: ['admin-feed-posts'] })
    queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    queryClient.invalidateQueries({ queryKey: ['admin-follower-count'] })
    setActiveTab(null)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('tab')
      return next
    })
  }

  if (!currentFanpage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-bold text-foreground">Chưa có Fanpage được chỉ định</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bạn chưa có quyền quản trị fanpage nào hoặc chưa chọn fanpage làm việc.
        </p>
        <Link
          to="/staff/fanpages"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Về Trung tâm Fanpage
        </Link>
      </div>
    )
  }

  return (
    <FanpageAdminLayout
      currentFanpage={enrichedFanpage}
      availableFanpages={availableFanpages}
      onSelectFanpage={(fp) => {
        setSelectedFanpage(fp)
        setActiveTab(null) // Return to home on fanpage change
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('tab')
          return next
        })
        const isFpAdmin =
          fp.role === 'Quản trị viên' ||
          fp.role === 'ADMIN' ||
          (user?.role ? ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER'].includes(user.role) : false)
        const targetPath = isFpAdmin ? '/fanpage/admin' : '/fanpage/workspace'
        navigate({ pathname: targetPath }, { state: { fanpageId: fp.id }, replace: true })
      }}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onCreateEventClick={handleCreateEventClick}
      onPersonalProfileClick={() => handleSelectTab('personal-profile')}
      onLogoClick={() => {
        setActiveTab(null)
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('tab')
          return next
        })
        const targetPath = isCurrentUserAdmin ? '/fanpage/admin' : '/fanpage/workspace'
        navigate(targetPath, { state: { fanpageId: currentFanpage.id } })
      }}
      rightSidebar={
        activeTab === null ? (
          <FanpageRightSidebar
            currentFanpage={enrichedFanpage}
            stats={stats}
            onManageMembersClick={() => handleSelectTab('members')}
          />
        ) : undefined
      }
    >
      {/* 1. Trang chủ fanpage — quản trị (Mặc định khi activeTab === null) */}
      {activeTab === null && (
        <FanpageHomeView
          currentFanpage={enrichedFanpage}
          stats={stats}
          reminder={reminder}
          posts={posts}
          isLoadingPosts={isLoadingPosts}
          onOpenEventsTab={() => {
            setActiveTab('events')
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.set('tab', 'events')
              return next
            })
          }}
          onCreateEventClick={handleCreateEventClick}
          onEditProfileClick={isCurrentUserAdmin ? handleEditProfileClick : undefined}
          onEditEvent={handleEditFeedPost}
        />
      )}

      {/* 2. Quản lý sự kiện (Khi click vào mục 'Sự kiện' trong sidebar) */}
      {activeTab === 'events' && (
        <FanpageEventListView
          events={adminEvents}
          isLoading={isLoadingAdminEvents}
          onCreateEventClick={handleCreateEventClick}
          onEventClick={handleEventClick}
          onEditClick={handleEditEventClick}
        />
      )}

      {/* 3. Tạo / Chỉnh sửa sự kiện */}
      {activeTab === 'create-event' && (
        <FanpageCreateEventView
          key={editingEvent ? `edit-${editingEvent.id}` : 'create-new'}
          currentFanpage={enrichedFanpage}
          initialEvent={editingEvent}
          onBack={() => {
            setSelectedEventId(null)
            setActiveTab('events')
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.set('tab', 'events')
              next.delete('eventId')
              return next
            })
          }}
          onSaveEvent={handleSaveNewEvent}
        />
      )}

      {/* 4. Chi tiết sự kiện */}
      {activeTab === 'event-detail' && currentSelectedEvent && (
        <FanpageEventDetailAdminView
          event={currentSelectedEvent}
          onBack={() => {
            setActiveTab('events')
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.set('tab', 'events')
              next.delete('eventId')
              return next
            })
          }}
          onEditClick={handleEditEventClick}
        />
      )}

      {/* 5. Dashboard tổng quan fanpage */}
      {activeTab === 'overview' && (
        <FanpageDashboardView
          currentFanpage={enrichedFanpage}
          onCreateEventClick={handleCreateEventClick}
          onEventClick={handleEventClick}
        />
      )}

      {/* 6. Quản lý thành viên fanpage */}
      {activeTab === 'members' && <FanpageMembersView currentFanpage={enrichedFanpage} />}

      {/* 7. Chỉnh sửa thông tin fanpage */}
      {activeTab === 'profile' && (
        <FanpageProfileEditView
          currentFanpage={enrichedFanpage}
          onSave={handleSaveFanpageProfile}
          onCancel={() => setActiveTab(null)}
        />
      )}

      {activeTab === 'settings' && (
        <div className="w-full space-y-6 text-left animate-in fade-in">
          <div className="pb-4 border-b border-border">
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              Cài đặt quyền và thông báo
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Phân quyền thành viên ban tổ chức và thiết lập thông báo tự động.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4">
            <h3 className="font-bold text-sm text-foreground">Thành viên ban quản trị</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Nguyễn Minh Anh (Bạn)</p>
                  <p className="text-muted-foreground">canbo@ctu.edu.vn · Trưởng ban quản trị</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  Chủ sở hữu
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Trần Hoàng Nam</p>
                  <p className="text-muted-foreground">namth@ctu.edu.vn · Cán bộ hỗ trợ sự kiện</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                  Biên tập viên
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 8. Thông tin tài khoản cá nhân (Cán bộ hoặc Sinh viên) */}
      {activeTab === 'personal-profile' && (
        <FanpageAdminPersonalProfileView
          currentFanpage={enrichedFanpage}
          onBack={() => {
            setActiveTab(null)
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.delete('tab')
              return next
            })
          }}
        />
      )}
    </FanpageAdminLayout>
  )
}
