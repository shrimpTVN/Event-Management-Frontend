import {
  normalizeAdminRole,
  getSuperAdminRoles,
} from '@/features/super-admin/services/superAdminService'
import { Button } from '@/components/ui/button'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SuperAdminLayout,
  SuperAdminOverviewView,
  SuperAdminUsersView,
  SuperAdminFanpagesView,
  SuperAdminEventsView,
  SuperAdminSemestersView,
  SuperAdminPointCategoriesView,
  SuperAdminSv5tCriteriasView,
  SuperAdminSchoolsView,
  UserDetailModal,
  FanpageReviewModal,
  EventModerationModal,
  SemesterModal,
  PointCategoryModal,
  Sv5tCriteriaModal,
  SchoolMajorModal,
  superAdminService,
} from '@/features/super-admin'
import type {
  SuperAdminNavTab,
  SuperAdminUser,
  UserSystemRole,
  SuperAdminFanpage,
  SuperAdminEvent,
  SuperAdminSemester,
  SuperAdminPointCategory,
  SuperAdminSv5tCriteria,
  SuperAdminSchool,
  SuperAdminMajor,
  SuperAdminOverviewStats,
} from '@/features/super-admin'

export const SuperAdminPage: React.FC = () => {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<SuperAdminNavTab>('overview')
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Backend datasets; empty and failed responses never fall back to demo data
  const [overviewStats, setOverviewStats] = useState<SuperAdminOverviewStats>({
    totalUsers: 0,
    totalFanpages: 0,
    totalEvents: 0,
    totalParticipations: null,
    pendingFanpagesCount: 0,
    violationReportsCount: 0,
    userGrowthRate: null,
    eventGrowthRate: null,
  })
  const [users, setUsers] = useState<SuperAdminUser[]>([])
  const [fanpages, setFanpages] = useState<SuperAdminFanpage[]>([])
  const [events, setEvents] = useState<SuperAdminEvent[]>([])
  const [semesters, setSemesters] = useState<SuperAdminSemester[]>([])
  const [pointCategories, setPointCategories] = useState<SuperAdminPointCategory[]>([])
  const [sv5tCriterias, setSv5tCriterias] = useState<SuperAdminSv5tCriteria[]>([])
  const [schools, setSchools] = useState<SuperAdminSchool[]>([])

  // Modals & Selection States
  const [selectedUser, setSelectedUser] = useState<SuperAdminUser | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  const [selectedFanpage, setSelectedFanpage] = useState<SuperAdminFanpage | null>(null)
  const [isFanpageModalOpen, setIsFanpageModalOpen] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState<SuperAdminEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  const [selectedSemester, setSelectedSemester] = useState<SuperAdminSemester | null>(null)
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false)

  const [selectedPointCategory, setSelectedPointCategory] =
    useState<SuperAdminPointCategory | null>(null)
  const [parentPointCategory, setParentPointCategory] = useState<SuperAdminPointCategory | null>(
    null
  )
  const [isPointCategoryModalOpen, setIsPointCategoryModalOpen] = useState(false)

  const [selectedSv5tCriteria, setSelectedSv5tCriteria] = useState<SuperAdminSv5tCriteria | null>(
    null
  )
  const [parentSv5tCriteria, setParentSv5tCriteria] = useState<SuperAdminSv5tCriteria | null>(null)
  const [isSv5tCriteriaModalOpen, setIsSv5tCriteriaModalOpen] = useState(false)

  const [schoolMajorModalMode, setSchoolMajorModalMode] = useState<'school' | 'major'>('school')
  const [selectedSchool, setSelectedSchool] = useState<SuperAdminSchool | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<SuperAdminMajor | null>(null)
  const [currentSchoolIdForMajor, setCurrentSchoolIdForMajor] = useState<number>(1)
  const [isSchoolMajorModalOpen, setIsSchoolMajorModalOpen] = useState(false)

  // Derived counts for alerts & badges
  const pendingFanpages = useMemo(() => fanpages.filter((f) => f.status === 'PENDING'), [fanpages])
  const violatedEvents = useMemo(
    () => events.filter((e) => e.status === 'VIOLATED' || e.status === 'HIDDEN'),
    [events]
  )

  const dynamicRanksByEvents = useMemo(
    () =>
      [...fanpages]
        .filter((fanpage) => fanpage.eventsCount != null)
        .sort((a, b) => (b.eventsCount ?? 0) - (a.eventsCount ?? 0))
        .slice(0, 5)
        .map((fanpage) => ({
          id: fanpage.id,
          name: fanpage.name,
          eventsCount: fanpage.eventsCount ?? 0,
          participationsCount: 0,
          avatarUrl: fanpage.avatarUrl,
        })),
    [fanpages]
  )

  const dynamicRanksByParticipants = useMemo(
    () =>
      fanpages
        .map((fanpage) => {
          const ownEvents = events.filter((event) => event.fanpageId === fanpage.id)
          if (!ownEvents.length || ownEvents.some((event) => event.registeredCount == null))
            return null
          return {
            id: fanpage.id,
            name: fanpage.name,
            eventsCount: ownEvents.length,
            participationsCount: ownEvents.reduce(
              (total, event) => total + (event.registeredCount ?? 0),
              0
            ),
            avatarUrl: fanpage.avatarUrl,
          }
        })
        .filter((item) => item !== null)
        .sort((a, b) => b.participationsCount - a.participationsCount)
        .slice(0, 5),
    [fanpages, events]
  )

  const derivedOverviewStats = useMemo(
    () => ({
      ...overviewStats,
      pendingFanpagesCount: pendingFanpages.length,
      violationReportsCount: violatedEvents.length,
    }),
    [overviewStats, pendingFanpages, violatedEvents]
  )

  // Load real data from Backend APIs on mount
  const loadBackendData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const results = await Promise.allSettled([
        superAdminService.getUsers({ size: Number.MAX_SAFE_INTEGER }),
        superAdminService.getFanpages({ size: Number.MAX_SAFE_INTEGER }),
        superAdminService.getEvents({ size: Number.MAX_SAFE_INTEGER }),
        superAdminService.getSemesters(),
        superAdminService.getPointCategories(),
        superAdminService.getCriterias(),
        superAdminService.getSchools(),
      ])
      const [
        usersRes,
        fanpagesRes,
        eventsRes,
        semestersRes,
        pointCatsRes,
        criteriasRes,
        schoolsRes,
      ] = results
      const liveUsers = usersRes.status === 'fulfilled' ? usersRes.value.content : []
      const liveEvents = eventsRes.status === 'fulfilled' ? eventsRes.value.content : []
      const liveFanpages =
        fanpagesRes.status === 'fulfilled'
          ? fanpagesRes.value.content.map((fanpage) => ({
              ...fanpage,
              eventsCount:
                eventsRes.status === 'fulfilled'
                  ? liveEvents.filter((event) => event.fanpageId === fanpage.id).length
                  : null,
            }))
          : []
      setUsers(liveUsers)
      setFanpages(liveFanpages)
      setEvents(liveEvents)
      setSemesters(semestersRes.status === 'fulfilled' ? semestersRes.value : [])
      setPointCategories(pointCatsRes.status === 'fulfilled' ? pointCatsRes.value : [])
      setSv5tCriterias(criteriasRes.status === 'fulfilled' ? criteriasRes.value : [])
      setSchools(schoolsRes.status === 'fulfilled' ? schoolsRes.value : [])
      setOverviewStats({
        totalUsers: liveUsers.length,
        totalFanpages: liveFanpages.length,
        totalEvents: liveEvents.length,
        totalParticipations: null,
        pendingFanpagesCount: 0,
        violationReportsCount: 0,
        userGrowthRate: null,
        eventGrowthRate: null,
      })
      const names = [
        'người dùng / hồ sơ',
        'fanpage',
        'sự kiện',
        'học kỳ',
        'điểm rèn luyện',
        'tiêu chí SV5T',
        'khoa / ngành',
      ]
      const failed = results.flatMap((result, index) =>
        result.status === 'rejected' ? [names[index]] : []
      )
      if (failed.length)
        setLoadError('Không tải được dữ liệu: ' + failed.join(', ') + '. Vui lòng thử lại.')
    } catch (err: unknown) {
      console.warn('Super Admin API connection error:', err)
      setLoadError('Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBackendData()
  }, [loadBackendData])

  // --- Handlers: Users ---
  const handleOpenUserDetail = (user: SuperAdminUser) => {
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await superAdminService.toggleUserStatus(userId)
    } catch (err) {
      console.warn('API error toggling user status:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
          if (selectedUser?.id === userId) {
            setSelectedUser({ ...u, status: nextStatus })
          }
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
  }

  const handleToggleUserSuperAdmin = async (userId: string, enabled: boolean): Promise<boolean> => {
    let roles: UserSystemRole[]
    try {
      const target = users.find((user) => user.id === userId)
      if (!target) return false
      roles = getSuperAdminRoles(target, enabled)
      await superAdminService.changeUserRoles(userId, roles)
    } catch (err) {
      console.warn('API error changing user role:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return false
    }

    const permissions = { role: normalizeAdminRole({ roles }), systemRoles: roles }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...permissions } : u)))
    setSelectedUser((current) =>
      current?.id === userId ? { ...current, ...permissions } : current
    )
    return true
  }

  // --- Handlers: Fanpages ---
  const handleOpenFanpageReview = (fanpage: SuperAdminFanpage) => {
    setSelectedFanpage(fanpage)
    setIsFanpageModalOpen(true)
  }

  const handleApproveFanpage = async (fanpageId: string) => {
    try {
      await superAdminService.acceptFanpage(fanpageId)
    } catch (err) {
      console.warn('API error approving fanpage:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    setFanpages((prev) => prev.map((f) => (f.id === fanpageId ? { ...f, status: 'ACTIVE' } : f)))
    if (selectedFanpage?.id === fanpageId) {
      setSelectedFanpage((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null))
    }
  }

  const handleRejectFanpage = async (_fanpageId: string, _reason: string) => {
    setLoadError(
      'Chưa thể gửi lý do từ chối đăng ký từ trang này. Vui lòng dùng thao tác tạm khóa nếu cần.'
    )
  }

  const handleToggleLockFanpage = async (fanpageId: string) => {
    const currentFanpage = fanpages.find((f) => f.id === fanpageId)
    try {
      if (currentFanpage?.status === 'ACTIVE') {
        await superAdminService.banFanpage(fanpageId)
      } else {
        await superAdminService.unbanFanpage(fanpageId)
      }
    } catch (err) {
      console.warn('API error toggling lock for fanpage:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    setFanpages((prev) =>
      prev.map((f) => {
        if (f.id === fanpageId) {
          const nextStatus = f.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
          if (selectedFanpage?.id === fanpageId) {
            setSelectedFanpage({ ...f, status: nextStatus })
          }
          return { ...f, status: nextStatus }
        }
        return f
      })
    )
  }

  // --- Handlers: Events ---
  const handleOpenEventModeration = (event: SuperAdminEvent) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleToggleHideEvent = async (eventId: string, reason?: string) => {
    void eventId
    void reason
    setLoadError('API hiện chưa hỗ trợ superadmin ẩn hoặc khôi phục sự kiện.')
  }

  // --- Handlers: Semesters ---
  const handleOpenCreateSemester = () => {
    setSelectedSemester(null)
    setIsSemesterModalOpen(true)
  }

  const handleOpenEditSemester = (semester: SuperAdminSemester) => {
    setSelectedSemester(semester)
    setIsSemesterModalOpen(true)
  }

  const handleSaveSemester = async (semesterData: Partial<SuperAdminSemester>) => {
    try {
      if (semesterData.id) {
        await superAdminService.updateSemester(semesterData.id, {
          number: semesterData.number || 1,
          startDate: semesterData.startDate || '',
          endDate: semesterData.endDate || '',
          academicYear: semesterData.academicYear || '',
        })
      } else {
        await superAdminService.createSemester({
          number: semesterData.number || 1,
          startDate: semesterData.startDate || '',
          endDate: semesterData.endDate || '',
          academicYear: semesterData.academicYear || '',
        })
      }
      const refreshed = await superAdminService.getSemesters()
      setSemesters(refreshed)
      return
    } catch (err) {
      console.warn('API error saving semester:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }
  }

  const handleSetCurrentSemester = async (_semesterId: number) => {
    setLoadError('Chưa thể thay đổi học kỳ hiện hành từ trang này.')
  }

  // --- Handlers: Point Categories ---
  const handleOpenCreatePointCategory = (parent?: SuperAdminPointCategory) => {
    setSelectedPointCategory(null)
    setParentPointCategory(parent || null)
    setIsPointCategoryModalOpen(true)
  }

  const handleOpenEditPointCategory = (cat: SuperAdminPointCategory) => {
    setSelectedPointCategory(cat)
    setParentPointCategory(null)
    setIsPointCategoryModalOpen(true)
  }

  const handleSavePointCategory = async (catData: Partial<SuperAdminPointCategory>) => {
    try {
      if (catData.id) {
        await superAdminService.updatePointCategory(catData.id, catData)
      } else {
        await superAdminService.createPointCategory({
          name: catData.name || 'Tiêu chí mới',
          maximum: catData.maximum || 5,
          level: catData.level || 0,
          note: catData.note,
          parentCategoryId: catData.parentCategoryId,
          childrenOrder: catData.childrenOrder,
        })
      }
      const refreshed = await superAdminService.getPointCategories()
      setPointCategories(refreshed)
      return
    } catch (err) {
      console.warn('API error saving point category:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }
  }

  const handleTogglePointCategoryActive = async (categoryId: number) => {
    try {
      const target = pointCategories.find((c) => c.id === categoryId)
      await superAdminService.updatePointCategory(categoryId, {
        isActive: target ? !target.isActive : true,
      })
    } catch (err) {
      console.warn('API error toggling point category active:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    const toggleRecursive = (list: SuperAdminPointCategory[]): SuperAdminPointCategory[] =>
      list.map((c) => {
        if (c.id === categoryId) {
          return { ...c, isActive: !c.isActive }
        }
        if (c.children) {
          return { ...c, children: toggleRecursive(c.children) }
        }
        return c
      })
    setPointCategories((prev) => toggleRecursive(prev))
  }

  // --- Handlers: SV5T Criteria ---
  const handleOpenCreateSv5tCriteria = (parent?: SuperAdminSv5tCriteria) => {
    setSelectedSv5tCriteria(null)
    setParentSv5tCriteria(parent || null)
    setIsSv5tCriteriaModalOpen(true)
  }

  const handleOpenEditSv5tCriteria = (crit: SuperAdminSv5tCriteria) => {
    setSelectedSv5tCriteria(crit)
    setParentSv5tCriteria(null)
    setIsSv5tCriteriaModalOpen(true)
  }

  const handleSaveSv5tCriteria = async (critData: Partial<SuperAdminSv5tCriteria>) => {
    try {
      if (critData.id) {
        await superAdminService.updateCriteria(critData.id, critData)
      } else {
        await superAdminService.createCriteria({
          name: critData.name || 'Tiêu chuẩn mới',
          level: critData.level || 0,
          parentId: critData.parentId,
          note: critData.note,
          scope: critData.scope,
        })
      }
      const refreshed = await superAdminService.getCriterias()
      setSv5tCriterias(refreshed)
      return
    } catch (err) {
      console.warn('API error saving SV5T criteria:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }
  }

  const handleToggleSv5tCriteriaActive = async (criteriaId: number) => {
    try {
      await superAdminService.toggleCriteriaStatus(criteriaId)
      const refreshed = await superAdminService.getCriterias()
      setSv5tCriterias(refreshed)
      return
    } catch (err) {
      console.warn('API error toggling criteria status:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }
  }

  // --- Handlers: Schools & Majors ---
  const handleOpenCreateSchoolModal = () => {
    setSchoolMajorModalMode('school')
    setSelectedSchool(null)
    setSelectedMajor(null)
    setIsSchoolMajorModalOpen(true)
  }

  const handleOpenEditSchoolModal = (school: SuperAdminSchool) => {
    setSchoolMajorModalMode('school')
    setSelectedSchool(school)
    setSelectedMajor(null)
    setIsSchoolMajorModalOpen(true)
  }

  const handleOpenCreateMajorModal = (schoolId: number) => {
    setSchoolMajorModalMode('major')
    setSelectedSchool(null)
    setSelectedMajor(null)
    setCurrentSchoolIdForMajor(schoolId)
    setIsSchoolMajorModalOpen(true)
  }

  const handleOpenEditMajorModal = (major: SuperAdminMajor) => {
    setSchoolMajorModalMode('major')
    setSelectedSchool(null)
    setSelectedMajor(major)
    setCurrentSchoolIdForMajor(major.schoolId)
    setIsSchoolMajorModalOpen(true)
  }

  const handleSaveSchool = async (schoolData: Partial<SuperAdminSchool>) => {
    try {
      if (schoolData.id) {
        await superAdminService.updateSchool(schoolData.id, {
          name: schoolData.name || '',
          description: schoolData.description,
          isActive: schoolData.isActive,
        })
      } else {
        await superAdminService.createSchool({
          name: schoolData.name || '',
          description: schoolData.description,
        })
      }
      const refreshed = await superAdminService.getSchools()
      setSchools(refreshed)
      return
    } catch (err) {
      console.warn('API error saving school:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }
  }

  const handleSaveMajor = async (majorData: Partial<SuperAdminMajor>) => {
    try {
      if (majorData.id) {
        await superAdminService.updateMajor(majorData.id, {
          code: majorData.code || '',
          name: majorData.name || '',
          schoolId: currentSchoolIdForMajor,
          isActive: majorData.isActive,
        })
      } else {
        await superAdminService.createMajor({
          code: majorData.code || '',
          name: majorData.name || '',
          schoolId: currentSchoolIdForMajor,
        })
      }
      const refreshed = await superAdminService.getSchools()
      setSchools(refreshed)
      return
    } catch (err) {
      console.warn('API error saving major:', err)
      setLoadError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }
  }

  return (
    <SuperAdminLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      pendingFanpagesCount={pendingFanpages.length}
      violatedEventsCount={violatedEvents.length}
      searchQuery={globalSearchQuery}
      onSearchChange={setGlobalSearchQuery}
    >
      {!isLoading && loadError && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={loadBackendData}>
            Thử lại
          </Button>
        </div>
      )}
      {/* Loading state indicator */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-8 w-72 rounded" />
          </div>
          {/* 4 Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            ))}
          </div>
          {/* Tables / Content Blocks Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4"
              >
                <Skeleton className="h-5 w-44 rounded" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between p-3 border border-border/60 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 1. Main View Rendering based on activeTab */}
          {activeTab === 'overview' && (
            <SuperAdminOverviewView
              stats={derivedOverviewStats}
              pendingFanpages={pendingFanpages}
              violatedEvents={violatedEvents}
              ranksByEvents={dynamicRanksByEvents}
              ranksByParticipants={dynamicRanksByParticipants}
              onNavigateTab={setActiveTab}
              onReviewFanpage={handleOpenFanpageReview}
              onModerateEvent={handleOpenEventModeration}
            />
          )}

          {activeTab === 'users' && (
            <SuperAdminUsersView
              users={users}
              onSelectUser={handleOpenUserDetail}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {activeTab === 'fanpages' && (
            <SuperAdminFanpagesView
              fanpages={fanpages}
              onSelectFanpage={handleOpenFanpageReview}
              onApproveFanpage={handleApproveFanpage}
              onToggleLockFanpage={handleToggleLockFanpage}
            />
          )}

          {activeTab === 'events' && (
            <SuperAdminEventsView
              events={events}
              onSelectEvent={handleOpenEventModeration}
              onToggleHideEvent={handleToggleHideEvent}
            />
          )}

          {activeTab === 'semesters' && (
            <SuperAdminSemestersView
              semesters={semesters}
              onOpenCreateModal={handleOpenCreateSemester}
              onOpenEditModal={handleOpenEditSemester}
              onSetCurrentSemester={handleSetCurrentSemester}
            />
          )}

          {activeTab === 'point-categories' && (
            <SuperAdminPointCategoriesView
              categories={pointCategories}
              onOpenCreateModal={handleOpenCreatePointCategory}
              onOpenEditModal={handleOpenEditPointCategory}
              onToggleActive={handleTogglePointCategoryActive}
            />
          )}

          {activeTab === 'sv5t-criterias' && (
            <SuperAdminSv5tCriteriasView
              criterias={sv5tCriterias}
              onOpenCreateModal={handleOpenCreateSv5tCriteria}
              onOpenEditModal={handleOpenEditSv5tCriteria}
              onToggleActive={handleToggleSv5tCriteriaActive}
            />
          )}

          {activeTab === 'schools' && (
            <SuperAdminSchoolsView
              schools={schools}
              onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
              onOpenEditSchoolModal={handleOpenEditSchoolModal}
              onOpenCreateMajorModal={handleOpenCreateMajorModal}
              onOpenEditMajorModal={handleOpenEditMajorModal}
            />
          )}
        </>
      )}

      {/* 2. Global Modals for Management Actions */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onToggleStatus={handleToggleUserStatus}
        onToggleSuperAdmin={handleToggleUserSuperAdmin}
      />

      <FanpageReviewModal
        fanpage={selectedFanpage}
        isOpen={isFanpageModalOpen}
        onClose={() => setIsFanpageModalOpen(false)}
        onApprove={handleApproveFanpage}
        onReject={handleRejectFanpage}
        onToggleLock={handleToggleLockFanpage}
      />

      <EventModerationModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onToggleHideEvent={handleToggleHideEvent}
      />

      <SemesterModal
        semester={selectedSemester}
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        onSave={handleSaveSemester}
      />

      <PointCategoryModal
        category={selectedPointCategory}
        parentCategory={parentPointCategory}
        isOpen={isPointCategoryModalOpen}
        onClose={() => setIsPointCategoryModalOpen(false)}
        onSave={handleSavePointCategory}
      />

      <Sv5tCriteriaModal
        criteria={selectedSv5tCriteria}
        parentCriteria={parentSv5tCriteria}
        isOpen={isSv5tCriteriaModalOpen}
        onClose={() => setIsSv5tCriteriaModalOpen(false)}
        onSave={handleSaveSv5tCriteria}
      />

      <SchoolMajorModal
        mode={schoolMajorModalMode}
        school={selectedSchool}
        major={selectedMajor}
        currentSchoolId={currentSchoolIdForMajor}
        isOpen={isSchoolMajorModalOpen}
        onClose={() => setIsSchoolMajorModalOpen(false)}
        onSaveSchool={handleSaveSchool}
        onSaveMajor={handleSaveMajor}
      />
    </SuperAdminLayout>
  )
}

export default SuperAdminPage
