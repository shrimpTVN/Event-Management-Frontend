import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminStatisticsDashboard } from '@/features/super-admin/components/AdminStatisticsDashboard'
import { flattenTree } from '@/features/super-admin/components/catalogTree'
import {
  normalizeAdminRole,
  getSuperAdminRoles,
} from '@/features/super-admin/services/superAdminService'
import { Button } from '@/components/ui/button'
import React, { useState, useEffect, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SuperAdminLayout,
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
  UserRole,
  UserStatus,
  UserSystemRole,
  SuperAdminFanpage,
  FanpageStatus,
  SuperAdminEvent,
  AdminEventStatus,
  SuperAdminSemester,
  SuperAdminPointCategory,
  SuperAdminSv5tCriteria,
  SuperAdminSchool,
  SuperAdminMajor,
} from '@/features/super-admin'

const PAGE_SIZE = 20

export const SuperAdminPage: React.FC = () => {
  const queryClient = useQueryClient()
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<SuperAdminNavTab>('overview')
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [mutationError, setMutationError] = useState<string | null>(null)

  // Server pagination & tab filter states
  const [usersPage, setUsersPage] = useState(0)
  const [usersTab, setUsersTab] = useState<'ALL' | UserRole | UserStatus>('ALL')
  const [usersSearch, setUsersSearch] = useState('')
  const [debouncedUsersSearch, setDebouncedUsersSearch] = useState('')

  const [fanpagesPage, setFanpagesPage] = useState(0)
  const [fanpagesStatus, setFanpagesStatus] = useState<'ALL' | FanpageStatus>('ALL')
  const [fanpagesSearch, setFanpagesSearch] = useState('')
  const [debouncedFanpagesSearch, setDebouncedFanpagesSearch] = useState('')

  const [eventsPage, setEventsPage] = useState(0)
  const [eventsStatus, setEventsStatus] = useState<'ALL' | AdminEventStatus>('ALL')
  const [eventsSearch, setEventsSearch] = useState('')
  const [debouncedEventsSearch, setDebouncedEventsSearch] = useState('')

  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsersSearch(usersSearch.trim())
      setUsersPage(0)
    }, 250)
    return () => clearTimeout(timer)
  }, [usersSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFanpagesSearch(fanpagesSearch.trim()), 250)
    return () => clearTimeout(timer)
  }, [fanpagesSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEventsSearch(eventsSearch.trim()), 250)
    return () => clearTimeout(timer)
  }, [eventsSearch])

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
  const [currentSchoolIdForMajor, setCurrentSchoolIdForMajor] = useState<number | undefined>(
    undefined
  )
  const [isSchoolMajorModalOpen, setIsSchoolMajorModalOpen] = useState(false)

  // --- Tab-scoped Queries (never pull unused datasets on overview) ---
  const semestersQuery = useQuery({
    queryKey: ['super-admin', 'semesters'],
    queryFn: () => superAdminService.getSemesters(),
    enabled: activeTab === 'overview' || activeTab === 'semesters',
  })

  const pendingFanpagesQuery = useQuery({
    queryKey: ['super-admin', 'pending-fanpages'],
    queryFn: () => superAdminService.getFanpagesPage({ page: 0, size: PAGE_SIZE, status: 'PENDING' }),
    enabled: activeTab === 'overview' || activeTab === 'fanpages',
  })

  const violatedEventsQuery = useQuery({
    queryKey: ['super-admin', 'violated-events'],
    queryFn: () => superAdminService.getEventsPage({ page: 0, size: PAGE_SIZE, status: 'VIOLATED' }),
    enabled: activeTab === 'overview' || activeTab === 'events',
  })

  const usersQuery = useQuery({
    queryKey: ['super-admin', 'users', usersPage, usersTab, debouncedUsersSearch],
    queryFn: () =>
      superAdminService.getUsersPage({
        page: usersPage,
        size: PAGE_SIZE,
        role: usersTab,
        ...(usersTab === 'LOCKED' ? { isActive: false } : {}),
        ...(debouncedUsersSearch ? { keyword: debouncedUsersSearch } : {}),
      }),
    enabled: activeTab === 'users',
  })

  const fanpagesQuery = useQuery({
    queryKey: ['super-admin', 'fanpages', fanpagesPage, fanpagesStatus, debouncedFanpagesSearch],
    queryFn: () =>
      superAdminService.getFanpagesPage({
        page: fanpagesPage,
        size: PAGE_SIZE,
        status: fanpagesStatus,
        keyword: debouncedFanpagesSearch || undefined,
      }),
    enabled: activeTab === 'fanpages',
  })

  const eventsQuery = useQuery({
    queryKey: ['super-admin', 'events', eventsPage, eventsStatus, debouncedEventsSearch],
    queryFn: () =>
      superAdminService.getEventsPage({
        page: eventsPage,
        size: PAGE_SIZE,
        status: eventsStatus,
        keyword: debouncedEventsSearch || undefined,
      }),
    enabled: activeTab === 'events',
  })

  const pointCategoriesQuery = useQuery({
    queryKey: ['super-admin', 'point-categories'],
    queryFn: () => superAdminService.getPointCategories(),
    enabled: activeTab === 'point-categories',
  })

  const sv5tCriteriasQuery = useQuery({
    queryKey: ['super-admin', 'sv5t-criterias'],
    queryFn: () => superAdminService.getCriterias(),
    enabled: activeTab === 'sv5t-criterias',
  })

  const schoolsQuery = useQuery({
    queryKey: ['super-admin', 'schools'],
    queryFn: () => superAdminService.getSchoolsWithMajors(),
    enabled: activeTab === 'schools',
  })

  const schools = schoolsQuery.data ?? []
  const effectiveSchoolId = selectedSchoolId ?? schools[0]?.id ?? null

  const semesters = semestersQuery.data ?? []
  const pendingFanpages: SuperAdminFanpage[] = pendingFanpagesQuery.data?.content ?? []
  const violatedEvents: SuperAdminEvent[] = violatedEventsQuery.data?.content ?? []
  const users: SuperAdminUser[] = usersQuery.data?.content ?? []
  const fanpages: SuperAdminFanpage[] = fanpagesQuery.data?.content ?? []
  const events: SuperAdminEvent[] = eventsQuery.data?.content ?? []
  const pointCategories = pointCategoriesQuery.data ?? []
  const sv5tCriterias = sv5tCriteriasQuery.data ?? []

  const activeQuery = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return semestersQuery
      case 'users':
        return usersQuery
      case 'fanpages':
        return fanpagesQuery
      case 'events':
        return eventsQuery
      case 'semesters':
        return semestersQuery
      case 'point-categories':
        return pointCategoriesQuery
      case 'sv5t-criterias':
        return sv5tCriteriasQuery
      case 'schools':
        return schoolsQuery
    }
  }, [
    activeTab,
    semestersQuery,
    usersQuery,
    fanpagesQuery,
    eventsQuery,
    pointCategoriesQuery,
    sv5tCriteriasQuery,
    schoolsQuery,
  ])

  const isLoading = activeQuery.isLoading
  const loadError =
    mutationError ||
    (activeQuery.isError ? 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.' : null)

  const handleRetryActiveTab = () => {
    setMutationError(null)
    void activeQuery.refetch()
    if (activeTab === 'overview') {
      void pendingFanpagesQuery.refetch()
      void violatedEventsQuery.refetch()
    }
  }

  // --- Handlers: Users ---
  const handleOpenUserDetail = (user: SuperAdminUser) => {
    setSelectedUser(user)
    setIsUserModalOpen(true)
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setMutationError(null)
      await superAdminService.toggleUserStatus(userId)
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-statistics-dashboard'] })
    } catch (err) {
      console.warn('API error toggling user status:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, status: prev.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } : prev
      )
    }
  }

  const handleToggleUserSuperAdmin = async (userId: string, enabled: boolean): Promise<boolean> => {
    let roles: UserSystemRole[]
    try {
      setMutationError(null)
      const target = users.find((user) => user.id === userId) ?? selectedUser
      if (!target) return false
      roles = getSuperAdminRoles(target, enabled)
      await superAdminService.changeUserRoles(userId, roles)
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] })
    } catch (err) {
      console.warn('API error changing user role:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return false
    }

    const permissions = { role: normalizeAdminRole({ roles }), systemRoles: roles }
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
      setMutationError(null)
      await superAdminService.acceptFanpage(fanpageId)
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'fanpages'] })
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'pending-fanpages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-statistics-dashboard'] })
    } catch (err) {
      console.warn('API error approving fanpage:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    if (selectedFanpage?.id === fanpageId) {
      setSelectedFanpage((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null))
    }
  }

  const handleRejectFanpage = async (fanpageId: string, reason: string) => {
    try {
      setMutationError(null)
      await superAdminService.rejectFanpage(fanpageId, reason)
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'fanpages'] })
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'pending-fanpages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-statistics-dashboard'] })
    } catch (err) {
      console.warn('API error rejecting fanpage:', err)
      setMutationError('Không thể gửi lý do từ chối đăng ký. Vui lòng thử lại.')
      return
    }

    if (selectedFanpage?.id === fanpageId) {
      setSelectedFanpage((prev) =>
        prev ? { ...prev, status: 'REJECTED' as any, rejectionReason: reason } : null
      )
    }
  }

  const handleToggleLockFanpage = async (fanpageId: string) => {
    const currentFanpage =
      fanpages.find((f) => f.id === fanpageId) ??
      (selectedFanpage?.id === fanpageId ? selectedFanpage : undefined)
    try {
      setMutationError(null)
      if (currentFanpage?.status === 'ACTIVE') {
        await superAdminService.banFanpage(fanpageId)
      } else {
        await superAdminService.unbanFanpage(fanpageId)
      }
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'fanpages'] })
      void queryClient.invalidateQueries({ queryKey: ['super-admin', 'pending-fanpages'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-statistics-dashboard'] })
    } catch (err) {
      console.warn('API error toggling lock for fanpage:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      return
    }

    if (selectedFanpage?.id === fanpageId) {
      setSelectedFanpage((prev) =>
        prev ? { ...prev, status: prev.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } : null
      )
    }
  }

  // --- Handlers: Events ---
  const handleOpenEventModeration = (event: SuperAdminEvent) => {
    setSelectedEvent(event)
    setIsEventModalOpen(true)
  }

  const handleToggleHideEvent = async (eventId: string, reason?: string) => {
    void eventId
    void reason
    setMutationError('API hiện chưa hỗ trợ superadmin ẩn hoặc khôi phục sự kiện.')
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
      setMutationError(null)
      if (semesterData.id) {
        await superAdminService.updateSemester(semesterData.id, {
          number: semesterData.number || 1,
          startDate: semesterData.startDate || '',
          endDate: semesterData.endDate || '',
          academicYear: semesterData.academicYear || '',
          academicYearId: semesterData.academicYearId,
        })
      } else {
        await superAdminService.createSemester({
          number: semesterData.number || 1,
          startDate: semesterData.startDate || '',
          endDate: semesterData.endDate || '',
          academicYear: semesterData.academicYear || '',
          academicYearId: semesterData.academicYearId,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'semesters'] })
      return
    } catch (err) {
      console.warn('API error saving semester:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      throw err
    }
  }

  const handleSetCurrentSemester = async (_semesterId: number) => {
    setMutationError('Chưa thể thay đổi học kỳ hiện hành từ trang này.')
  }

  // --- Handlers: Point Categories ---
  const handleOpenCreatePointCategory = (parent?: SuperAdminPointCategory) => {
    setSelectedPointCategory(null)
    setParentPointCategory(parent || null)
    setIsPointCategoryModalOpen(true)
  }

  const handleOpenEditPointCategory = (cat: SuperAdminPointCategory) => {
    setSelectedPointCategory(cat)
    setParentPointCategory(
      flattenTree(pointCategories).find((item) => item.id === cat.parentCategoryId) ?? null
    )
    setIsPointCategoryModalOpen(true)
  }

  const handleSavePointCategory = async (catData: Partial<SuperAdminPointCategory>) => {
    if (catData.id) {
      await superAdminService.updatePointCategory(catData.id, catData)
    } else {
      await superAdminService.createPointCategory({
        name: catData.name!,
        maximum: catData.maximum!,
        dateApply: catData.dateApply!,
        level: catData.level ?? 0,
        note: catData.note ?? '',
        parentCategoryId: catData.parentCategoryId,
        childrenOrder: catData.childrenOrder,
        isMaxChild: catData.isMaxChild,
      })
    }
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'point-categories'] })
  }

  const handleTogglePointCategoryActive = async (categoryId: number) => {
    const target = flattenTree(pointCategories).find((item) => item.id === categoryId)
    if (!target) throw new Error('Không tìm thấy tiêu chí.')
    await superAdminService.updatePointCategory(categoryId, {
      ...target,
      isActive: !target.isActive,
    })
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'point-categories'] })
  }

  const handleTogglePointCategoryMaxChild = async (categoryId: number) => {
    const target = flattenTree(pointCategories).find((item) => item.id === categoryId)
    if (!target) throw new Error('Không tìm thấy tiêu chí.')
    await superAdminService.updatePointCategory(categoryId, {
      ...target,
      isMaxChild: !target.isMaxChild,
    })
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'point-categories'] })
  }

  const handleDeletePointCategory = async (id: number) => {
    await superAdminService.deletePointCategory(id)
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'point-categories'] })
  }

  // --- Handlers: SV5T Criteria ---
  const handleOpenCreateSv5tCriteria = (parent?: SuperAdminSv5tCriteria) => {
    setSelectedSv5tCriteria(null)
    setParentSv5tCriteria(parent || null)
    setIsSv5tCriteriaModalOpen(true)
  }

  const handleOpenEditSv5tCriteria = (crit: SuperAdminSv5tCriteria) => {
    setSelectedSv5tCriteria(crit)
    setParentSv5tCriteria(
      flattenTree(sv5tCriterias).find((item) => item.id === crit.parentId) ?? null
    )
    setIsSv5tCriteriaModalOpen(true)
  }

  const handleSaveSv5tCriteria = async (critData: Partial<SuperAdminSv5tCriteria>) => {
    if (critData.id) {
      await superAdminService.updateCriteria(critData.id, critData)
    } else {
      await superAdminService.createCriteria({
        name: critData.name!,
        level: critData.level ?? 0,
        parentId: critData.parentId,
        note: critData.note,
        scope: critData.scope,
        childrenOrder: critData.childrenOrder ?? 1,
        requiredChildren: critData.requiredChildren,
        requiredOccurrences: critData.requiredOccurrences,
      })
    }
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'sv5t-criterias'] })
  }

  const handleToggleSv5tCriteriaActive = async (criteriaId: number) => {
    await superAdminService.toggleCriteriaStatus(criteriaId)
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'sv5t-criterias'] })
  }

  const handleDeleteSv5tCriteria = async (id: number) => {
    const target = flattenTree(sv5tCriterias).find((item) => item.id === id)
    // Both endpoints soft-delete; changing status preserves the existing parent relation.
    if (target?.isActive) await superAdminService.toggleCriteriaStatus(id)
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'sv5t-criterias'] })
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
      setMutationError(null)
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
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      void queryClient.invalidateQueries({ queryKey: ['education'] })
      return
    } catch (err) {
      console.warn('API error saving school:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      throw err
    }
  }

  const handleSaveMajor = async (majorData: Partial<SuperAdminMajor>) => {
    const schoolId = majorData.schoolId
    if (!schoolId) throw new Error('Vui lòng chọn khoa/trường cho ngành học.')
    try {
      setMutationError(null)
      if (majorData.id) {
        await superAdminService.updateMajor(majorData.id, {
          code: majorData.code || '',
          name: majorData.name || '',
          schoolId,
          isActive: majorData.isActive,
        })
      } else {
        await superAdminService.createMajor({
          code: majorData.code || '',
          name: majorData.name || '',
          schoolId,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'schools'] })
      void queryClient.invalidateQueries({ queryKey: ['education'] })
      return
    } catch (err) {
      console.warn('API error saving major:', err)
      setMutationError('Không thể lưu thay đổi vào máy chủ. Vui lòng thử lại.')
      throw err
    }
  }

  return (
    <SuperAdminLayout
      activeTab={activeTab}
      onSelectTab={(tab) => {
        setMutationError(null)
        setActiveTab(tab)
      }}
      pendingFanpagesCount={pendingFanpagesQuery.data?.totalElements ?? pendingFanpages.length}
      violatedEventsCount={violatedEventsQuery.data?.totalElements ?? violatedEvents.length}
      searchQuery={globalSearchQuery}
      onSearchChange={setGlobalSearchQuery}
    >
      {!isLoading && loadError && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={handleRetryActiveTab}>
            Thử lại
          </Button>
        </div>
      )}
      {/* Loading state indicator */}
      {isLoading && activeTab !== 'overview' ? (
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
            <AdminStatisticsDashboard
              semesters={semesters}
              pendingFanpages={pendingFanpages}
              violatedEvents={violatedEvents}
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
              page={usersPage}
              totalPages={usersQuery.data?.totalPages ?? 1}
              totalElements={usersQuery.data?.totalElements ?? users.length}
              onPageChange={setUsersPage}
              roleFilter={usersTab}
              onRoleFilterChange={(nextTab) => {
                setUsersTab(nextTab)
                setUsersPage(0)
              }}
              searchQuery={usersSearch}
              onSearchChange={setUsersSearch}
            />
          )}

          {activeTab === 'fanpages' && (
            <SuperAdminFanpagesView
              fanpages={fanpages}
              onSelectFanpage={handleOpenFanpageReview}
              onApproveFanpage={handleApproveFanpage}
              onToggleLockFanpage={handleToggleLockFanpage}
              page={fanpagesPage}
              totalPages={fanpagesQuery.data?.totalPages ?? 1}
              totalElements={fanpagesQuery.data?.totalElements ?? fanpages.length}
              pendingCount={pendingFanpagesQuery.data?.totalElements}
              onPageChange={setFanpagesPage}
              statusFilter={fanpagesStatus}
              onStatusFilterChange={(nextStatus) => {
                setFanpagesStatus(nextStatus)
                setFanpagesPage(0)
              }}
              searchQuery={fanpagesSearch}
              onSearchChange={(kw) => {
                setFanpagesSearch(kw)
                setFanpagesPage(0)
              }}
            />
          )}

          {activeTab === 'events' && (
            <SuperAdminEventsView
              events={events}
              onSelectEvent={handleOpenEventModeration}
              onToggleHideEvent={handleToggleHideEvent}
              page={eventsPage}
              totalPages={eventsQuery.data?.totalPages ?? 1}
              totalElements={eventsQuery.data?.totalElements ?? events.length}
              violatedCount={violatedEventsQuery.data?.totalElements}
              onPageChange={setEventsPage}
              statusFilter={eventsStatus}
              onStatusFilterChange={(nextStatus) => {
                setEventsStatus(nextStatus)
                setEventsPage(0)
              }}
              searchQuery={eventsSearch}
              onSearchChange={(kw) => {
                setEventsSearch(kw)
                setEventsPage(0)
              }}
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
              onToggleMaxChild={handleTogglePointCategoryMaxChild}
              onDelete={handleDeletePointCategory}
            />
          )}

          {activeTab === 'sv5t-criterias' && (
            <SuperAdminSv5tCriteriasView
              criterias={sv5tCriterias}
              onOpenCreateModal={handleOpenCreateSv5tCriteria}
              onOpenEditModal={handleOpenEditSv5tCriteria}
              onToggleActive={handleToggleSv5tCriteriaActive}
              onDelete={handleDeleteSv5tCriteria}
            />
          )}

          {activeTab === 'schools' && (
            <SuperAdminSchoolsView
              schools={schools}
              onOpenCreateSchoolModal={handleOpenCreateSchoolModal}
              onOpenEditSchoolModal={handleOpenEditSchoolModal}
              onOpenCreateMajorModal={handleOpenCreateMajorModal}
              onOpenEditMajorModal={handleOpenEditMajorModal}
              selectedSchoolId={effectiveSchoolId}
              onSelectSchool={setSelectedSchoolId}
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
        semesters={semesters}
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
        currentSchoolName={schools.find((item) => item.id === currentSchoolIdForMajor)?.name}
        isOpen={isSchoolMajorModalOpen}
        onClose={() => setIsSchoolMajorModalOpen(false)}
        onSaveSchool={handleSaveSchool}
        onSaveMajor={handleSaveMajor}
      />
    </SuperAdminLayout>
  )
}

export default SuperAdminPage
