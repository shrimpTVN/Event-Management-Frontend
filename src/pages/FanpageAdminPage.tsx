import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react'
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
  FanpageRightSidebar,
  FanpageAdminPersonalProfileView,
  fanpageAdminService,
  EMPTY_ACTIVITY_STATS,
  type FanpageFeedPost,
} from '@/features/fanpage-admin'
import type { FanpageSummary, AdminNavTab, AdminEvent } from '@/features/fanpage-admin'

const FanpageDashboardView = lazy(() => import('@/features/fanpage-admin/components/FanpageDashboardView').then(module => ({ default: module.FanpageDashboardView })))

export const FanpageAdminPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const locationFanpageId = (location.state as { fanpageId?: string } | undefined)?.fanpageId
  const urlFanpageId = searchParams.get('fanpageId')
  const [profileOverrides, setProfileOverrides] = useState<Record<string, Partial<FanpageSummary>>>({})

  // Các đường dẫn cũ truyền fanpageId qua navigation state. Chuyển ID sang URL
  // để việc đổi tab, back/forward và tải lại trang vẫn giữ đúng fanpage.
  useEffect(() => {
    if (!locationFanpageId || urlFanpageId) return
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('fanpageId', String(locationFanpageId))
      return next
    }, { replace: true, state: location.state })
  }, [locationFanpageId, urlFanpageId, location.state, setSearchParams])

  // Lấy danh sách Fanpage khả dụng mà người dùng có tham gia (Admin hoặc Thành viên/Cộng tác viên)
  const {
    data: availableFanpages = [],
    isLoading: isLoadingFanpages,
    isError: isFanpagesError,
    refetch: refetchFanpages,
  } = useQuery<FanpageSummary[]>({
    queryKey: ['admin-available-fanpages', user?.id, user?.email],
    queryFn: async () => {
      const pages = await fanpageAdminService.getAvailableFanpages()
      const fanpageMap = new Map<string, FanpageSummary>()
      if (Array.isArray(pages)) {
        for (const fp of pages) {
          fanpageMap.set(String(fp.id), fp)
        }
      }

      const result = Array.from(fanpageMap.values())

      // Chỉ đồng bộ store khi fetch thành công
      try {
        useUserFanpagesStore.getState().setMyFanpages(
          result.map((f) => ({
            id: f.id,
            name: f.fullName || f.name,
            role: f.role,
            avatarUrl: f.avatarUrl,
          }))
        )
      } catch (storeErr) {
        console.warn('Could not sync userFanpagesStore:', storeErr)
      }

      return result
    },
    staleTime: 60 * 1000,
  })

  // Xác định ID của fanpage đang hoạt động (active):
  // URL là nguồn ID ổn định; navigation state chỉ dùng cho đường dẫn cũ.
  const activeFanpageId =
    urlFanpageId ||
    locationFanpageId ||
    availableFanpages[0]?.id ||
    ''

  // Luôn tải thông tin chi tiết đầy đủ (mô tả, email, phone, địa chỉ, tổ chức trực thuộc) cho activeFanpageId:
  const { data: activeFanpageDetail } = useQuery<FanpageSummary | null>({
    queryKey: ['fanpage-detail-by-id', activeFanpageId, user?.id, user?.email],
    queryFn: async () => {
      if (!activeFanpageId) return null
      const fp = await fanpageService.getFanpageById(activeFanpageId)
      if (!fp) return null

      const matchedSummary = availableFanpages.find(
        (item) => String(item.id) === String(activeFanpageId)
      )

      return {
        id: String(fp.id),
        name: fp.orgName || fp.name,
        fullName: fp.orgName || fp.name,
        avatarUrl: fp.avatarUrl || '',
        role: matchedSummary?.role || '',
        isVerified: fp.isVerified ?? false,
        email: fp.email || '',
        phone: fp.phone || '',
        address: '',
        followersCount: fp.followerCount || 0,
        eventsCount: fp.eventCount || 0,
        description: fp.description || '',
        parentOrg: fp.parentOrg || '',
        orgType: fp.orgType || '',
      }
    },
    enabled: Boolean(activeFanpageId),
    staleTime: 30 * 1000,
  })

  const fallbackFanpage: FanpageSummary = {
    id: activeFanpageId, name: '', fullName: '', avatarUrl: '',
    role: 'Cộng tác viên', isVerified: false, email: '', phone: '', address: '',
    followersCount: 0, eventsCount: 0, description: '', parentOrg: '', orgType: '',
  }

  // Lấy dữ liệu tóm tắt từ availableFanpages để hiển thị ngay tức thì
  const baseSummary =
    availableFanpages.find((fp) => String(fp.id) === String(activeFanpageId)) ||
    fallbackFanpage

  // Kết hợp với activeFanpageDetail để luôn có đủ description, email, phone, address, parentOrg
  const currentFanpage: FanpageSummary = {
    ...baseSummary,
    ...(activeFanpageDetail || {}),
    ...(profileOverrides[activeFanpageId] || {}),
    role:
      profileOverrides[activeFanpageId]?.role ||
      baseSummary?.role ||
      activeFanpageDetail?.role ||
      'Quản trị viên',
  }

  const tabFromUrl = searchParams.get('tab') as AdminNavTab | null
  const [activeTab, setActiveTab] = useState<AdminNavTab | null>(tabFromUrl || null)

  const hasFanpage = Boolean(currentFanpage?.id)
  const isHomeTab = activeTab === null
  const needsEventsQuery =
    hasFanpage &&
    (isHomeTab ||
      activeTab === 'events' ||
      activeTab === 'create-event' ||
      activeTab === 'event-detail')

  const { data: rawFanpageEvents = [], isLoading: isLoadingEvents } = useQuery<any[]>({
    queryKey: ['fanpage-events', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getFanpageEventsRaw(currentFanpage?.id),
    enabled: needsEventsQuery,
    staleTime: 30 * 1000,
  })

  const posts = useMemo(
    () => fanpageAdminService.mapEventsToFeedPosts(rawFanpageEvents, currentFanpage?.id),
    [rawFanpageEvents, currentFanpage?.id]
  )
  const adminEvents = useMemo(
    () => fanpageAdminService.mapEventsToAdminEvents(rawFanpageEvents, currentFanpage?.id),
    [rawFanpageEvents, currentFanpage?.id]
  )
  const isLoadingPosts = isLoadingEvents
  const isLoadingAdminEvents = isLoadingEvents

  const { data: followerCount = 0 } = useQuery({
    queryKey: ['admin-follower-count', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getFanpageFollowerCount(currentFanpage?.id),
    enabled: hasFanpage && isHomeTab,
  })

  const rawEventsTotal = (rawFanpageEvents as { __totalElements?: number }).__totalElements
  const enrichedFanpage: FanpageSummary = {
    ...currentFanpage,
    eventsCount:
      typeof rawEventsTotal === 'number'
        ? rawEventsTotal
        : adminEvents.length > 0
          ? adminEvents.length
          : currentFanpage.eventsCount,
    followersCount: followerCount > 0 ? followerCount : (currentFanpage.followersCount || 0),
  }

  const { data: stats = EMPTY_ACTIVITY_STATS, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-activity-stats', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getActivityStats(currentFanpage?.id),
    enabled: hasFanpage && isHomeTab,
  })

  const { data: reminder = null } = useQuery({
    queryKey: ['admin-upcoming-reminder', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getUpcomingReminder(currentFanpage?.id),
    enabled: hasFanpage && isHomeTab,
  })

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
    const keepsEventId = nextTab === 'event-detail' || nextTab === 'create-event'
    if (!keepsEventId) {
      setSelectedEventId(null)
    }
    setActiveTab(nextTab)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (nextTab) {
        next.set('tab', nextTab)
      } else {
        next.delete('tab')
      }
      if (!keepsEventId) {
        next.delete('eventId')
      }
      return next
    })
  }
  const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
    return searchParams.get('eventId') || null
  })

  // Sync selectedEventId 2 chiều với URL searchParams
  useEffect(() => {
    const urlEventId = searchParams.get('eventId')
    setSelectedEventId(urlEventId || null)
  }, [searchParams])

  const currentSelectedEvent = selectedEventId
    ? adminEvents.find((e) => String(e.id) === String(selectedEventId)) || null
    : null

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
    setSelectedEventId(null)
    setActiveTab('profile')
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', 'profile')
      next.delete('eventId')
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
    queryClient.invalidateQueries({ queryKey: ['fanpage-events'] })
    queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    queryClient.invalidateQueries({ queryKey: ['admin-feed-posts'] })
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
    setProfileOverrides((prev) => ({
      ...prev,
      [activeFanpageId]: { ...(prev[activeFanpageId] || {}), ...updatedProfile },
    }))
    queryClient.invalidateQueries({ queryKey: ['admin-available-fanpages'] })
    queryClient.invalidateQueries({ queryKey: ['fanpage-detail'] })
    queryClient.invalidateQueries({ queryKey: ['fanpage-detail-by-id'] })
    queryClient.invalidateQueries({ queryKey: ['staff-my-fanpages'] })
    queryClient.invalidateQueries({ queryKey: ['fanpage-events'] })
    queryClient.invalidateQueries({ queryKey: ['admin-feed-posts'] })
    queryClient.invalidateQueries({ queryKey: ['admin-events'] })
    queryClient.invalidateQueries({ queryKey: ['admin-follower-count'] })
  }

  if (isLoadingFanpages) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-sm text-muted-foreground">Đang tải danh sách Fanpage...</p>
      </div>
    )
  }

  if (isFanpagesError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center p-12 text-center gap-3">
        <h2 className="text-lg font-bold text-destructive">Không tải được danh sách Fanpage</h2>
        <p className="text-sm text-muted-foreground">
          Đã xảy ra lỗi kết nối. Vui lòng thử lại.
        </p>
        <button
          type="button"
          onClick={() => void refetchFanpages()}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!currentFanpage.id) {
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
        setActiveTab(null) // Return to home on fanpage change
        setSelectedEventId(null)
        const isFpAdmin =
          fp.role === 'Quản trị viên' ||
          fp.role === 'ADMIN' ||
          (user?.role ? ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER'].includes(user.role) : false)
        const targetPath = isFpAdmin ? '/fanpage/admin' : '/fanpage/workspace'
        navigate(
          { pathname: targetPath, search: `?fanpageId=${encodeURIComponent(String(fp.id))}` },
          { state: { fanpageId: String(fp.id) }, replace: true }
        )
      }}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onCreateEventClick={handleCreateEventClick}
      onPersonalProfileClick={() => handleSelectTab('personal-profile')}
      onLogoClick={() => {
        setSelectedEventId(null)
        setActiveTab(null)
        const targetPath = isCurrentUserAdmin ? '/fanpage/admin' : '/fanpage/workspace'
        navigate(
          {
            pathname: targetPath,
            search: `?fanpageId=${encodeURIComponent(String(activeFanpageId))}`,
          },
          { state: activeFanpageId ? { fanpageId: String(activeFanpageId) } : undefined }
        )
      }}
      rightSidebar={
        activeTab === null ? (
          <FanpageRightSidebar
            currentFanpage={enrichedFanpage}
            stats={stats}
            statsLoading={statsLoading}
            onRetryStats={() => void refetchStats()}
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
            statsLoading={statsLoading}
            onRetryStats={() => void refetchStats()}
          reminder={reminder}
          posts={posts}
          isLoadingPosts={isLoadingPosts}
          onOpenEventRegistrations={handleEventClick}
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
      {activeTab === 'event-detail' &&
        (currentSelectedEvent ? (
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
        ) : (
          <div className="p-8 text-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
            {isLoadingEvents ? 'Đang tải thông tin sự kiện...' : 'Không tìm thấy sự kiện được chọn.'}
          </div>
        ))}

      {/* 5. Dashboard tổng quan fanpage */}
      {activeTab === 'overview' && (
        <Suspense fallback={<div role="status" className="min-h-80 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Đang tải thống kê...</div>}>
        <FanpageDashboardView
          currentFanpage={enrichedFanpage}
          onCreateEventClick={handleCreateEventClick}
          onEventClick={handleEventClick}
        />
        </Suspense>
      )}

      {/* 6. Quản lý thành viên fanpage */}
      {activeTab === 'members' && <FanpageMembersView currentFanpage={enrichedFanpage} />}

      {/* 7. Chỉnh sửa thông tin fanpage */}
      {activeTab === 'profile' && (
        <FanpageProfileEditView
          currentFanpage={enrichedFanpage}
          onSave={handleSaveFanpageProfile}
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
