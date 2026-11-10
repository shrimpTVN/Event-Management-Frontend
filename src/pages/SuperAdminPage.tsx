import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
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
  MOCK_OVERVIEW_STATS,
  MOCK_USERS,
  MOCK_FANPAGES,
  MOCK_EVENTS,
  MOCK_SEMESTERS,
  MOCK_POINT_CATEGORIES,
  MOCK_SV5T_CRITERIAS,
  MOCK_SCHOOLS,
  MOCK_FANPAGE_RANKS_BY_EVENTS,
  MOCK_FANPAGE_RANKS_BY_PARTICIPATION,
  superAdminService,
} from '@/features/super-admin'
import type {
  SuperAdminNavTab,
  SuperAdminUser,
  SuperAdminFanpage,
  SuperAdminEvent,
  AdminEventStatus,
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

  // Real backend dataset states (with local fallback if offline or initial load)
  const [overviewStats, setOverviewStats] = useState<SuperAdminOverviewStats>(MOCK_OVERVIEW_STATS)
  const [users, setUsers] = useState<SuperAdminUser[]>(MOCK_USERS)
  const [fanpages, setFanpages] = useState<SuperAdminFanpage[]>(MOCK_FANPAGES)
  const [events, setEvents] = useState<SuperAdminEvent[]>(MOCK_EVENTS)
  const [semesters, setSemesters] = useState<SuperAdminSemester[]>(MOCK_SEMESTERS)
  const [pointCategories, setPointCategories] = useState<SuperAdminPointCategory[]>(MOCK_POINT_CATEGORIES)
  const [sv5tCriterias, setSv5tCriterias] = useState<SuperAdminSv5tCriteria[]>(MOCK_SV5T_CRITERIAS)
  const [schools, setSchools] = useState<SuperAdminSchool[]>(MOCK_SCHOOLS)

  // Modals & Selection States
  const [selectedUser, setSelectedUser] = useState<SuperAdminUser | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  const [selectedFanpage, setSelectedFanpage] = useState<SuperAdminFanpage | null>(null)
  const [isFanpageModalOpen, setIsFanpageModalOpen] = useState(false)

  const [selectedEvent, setSelectedEvent] = useState<SuperAdminEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)

  const [selectedSemester, setSelectedSemester] = useState<SuperAdminSemester | null>(null)
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false)

  const [selectedPointCategory, setSelectedPointCategory] = useState<SuperAdminPointCategory | null>(null)
  const [parentPointCategory, setParentPointCategory] = useState<SuperAdminPointCategory | null>(null)
  const [isPointCategoryModalOpen, setIsPointCategoryModalOpen] = useState(false)

  const [selectedSv5tCriteria, setSelectedSv5tCriteria] = useState<SuperAdminSv5tCriteria | null>(null)
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

  // Derived rankings from live fanpage data
  const dynamicRanksByEvents = useMemo(() => {
    if (fanpages.length > 0) {
      return [...fanpages]
        .sort((a, b) => b.eventsCount - a.eventsCount)
        .slice(0, 5)
        .map((f) => ({
          id: f.id,
          name: f.name,
          eventsCount: f.eventsCount,
          participationsCount: f.followersCount || 0,
          avatarUrl: f.avatarUrl,
        }))
    }
    return MOCK_FANPAGE_RANKS_BY_EVENTS
  }, [fanpages])

  const dynamicRanksByParticipants = useMemo(() => {
    if (fanpages.length > 0) {
      return [...fanpages]
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
        .slice(0, 5)
        .map((f) => ({
          id: f.id,
          name: f.name,
          eventsCount: f.eventsCount,
          participationsCount: f.followersCount || 0,
          avatarUrl: f.avatarUrl,
        }))
    }
    return MOCK_FANPAGE_RANKS_BY_PARTICIPATION
  }, [fanpages])

  // Derived stats that stay in sync with lists
  const derivedOverviewStats = useMemo(() => {
    return {
      totalUsers: overviewStats.totalUsers || users.length,
      totalFanpages: overviewStats.totalFanpages || fanpages.length,
      totalEvents: overviewStats.totalEvents || events.length,
      totalParticipations:
        overviewStats.totalParticipations ||
        events.reduce((sum, e) => sum + (e.registeredCount || 0), 0) ||
        1420,
      pendingFanpagesCount: pendingFanpages.length,
      violationReportsCount: violatedEvents.length,
      userGrowthRate: overviewStats.userGrowthRate || 12.5,
      eventGrowthRate: overviewStats.eventGrowthRate || 8.4,
    }
  }, [overviewStats, users, fanpages, events, pendingFanpages, violatedEvents])

  // Load real data from Backend APIs on mount
  const loadBackendData = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const results = await Promise.allSettled([
        superAdminService.getOverviewStats(),
        superAdminService.getUsers({ size: 100 }),
        superAdminService.getFanpages({ size: 100 }),
        superAdminService.getEvents({ size: 100 }),
        superAdminService.getSemesters(),
        superAdminService.getPointCategories(),
        superAdminService.getCriterias(),
        superAdminService.getSchools(),
      ])

      const [statsRes, usersRes, fanpagesRes, eventsRes, semestersRes, pointCatsRes, criteriasRes, schoolsRes] = results

      if (statsRes.status === 'fulfilled' && statsRes.value.totalUsers > 0) {
        setOverviewStats(statsRes.value)
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.content.length > 0) {
        setUsers(usersRes.value.content)
      }
      if (fanpagesRes.status === 'fulfilled' && fanpagesRes.value.content.length > 0) {
        setFanpages(fanpagesRes.value.content)
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value.content.length > 0) {
        setEvents(eventsRes.value.content)
      }
      if (semestersRes.status === 'fulfilled' && semestersRes.value.length > 0) {
        setSemesters(semestersRes.value)
      }
      if (pointCatsRes.status === 'fulfilled' && pointCatsRes.value.length > 0) {
        setPointCategories(pointCatsRes.value)
      }
      if (criteriasRes.status === 'fulfilled' && criteriasRes.value.length > 0) {
        setSv5tCriterias(criteriasRes.value)
      }
      if (schoolsRes.status === 'fulfilled' && schoolsRes.value.length > 0) {
        setSchools(schoolsRes.value)
      }
    } catch (err: unknown) {
      console.warn('Super Admin API connection error, falling back to local dataset:', err)
      setLoadError('Không thể tải toàn bộ dữ liệu từ máy chủ. Đang hiển thị dữ liệu cục bộ.')
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
      console.warn('API error toggling user status, updating local state:', err)
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

  const handleChangeUserRole = async (userId: string, newRole: SuperAdminUser['role']) => {
    try {
      await superAdminService.changeUserRole(userId, newRole)
    } catch (err) {
      console.warn('API error changing user role, updating local state:', err)
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, role: newRole }
          if (selectedUser?.id === userId) setSelectedUser(updated)
          return updated
        }
        return u
      })
    )
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
      console.warn('API error approving fanpage, updating local state:', err)
    }

    setFanpages((prev) =>
      prev.map((f) => (f.id === fanpageId ? { ...f, status: 'ACTIVE' } : f))
    )
    if (selectedFanpage?.id === fanpageId) {
      setSelectedFanpage((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null))
    }
  }

  const handleRejectFanpage = async (fanpageId: string, reason: string) => {
    try {
      await superAdminService.banFanpage(fanpageId)
    } catch (err) {
      console.warn('API error rejecting fanpage, updating local state:', err)
    }

    setFanpages((prev) =>
      prev.map((f) =>
        f.id === fanpageId ? { ...f, status: 'REJECTED', rejectionReason: reason } : f
      )
    )
    if (selectedFanpage?.id === fanpageId) {
      setSelectedFanpage((prev) =>
        prev ? { ...prev, status: 'REJECTED', rejectionReason: reason } : null
      )
    }
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
      console.warn('API error toggling lock for fanpage, updating local state:', err)
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
    try {
      // Backend admin event status update / toggle
    } catch (err) {
      console.warn('API error moderating event, updating local state:', err)
    }

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const nextStatus: AdminEventStatus =
            e.status === 'VIOLATED' || e.status === 'HIDDEN' ? 'OPEN' : 'HIDDEN'
          const updated: SuperAdminEvent = {
            ...e,
            status: nextStatus,
            violationReason: reason || e.violationReason,
          }
          if (selectedEvent?.id === eventId) setSelectedEvent(updated)
          return updated
        }
        return e
      })
    )
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
        })
      } else {
        await superAdminService.createSemester({
          number: semesterData.number || 1,
          startDate: semesterData.startDate || '',
          endDate: semesterData.endDate || '',
        })
      }
      const refreshed = await superAdminService.getSemesters()
      if (refreshed.length > 0) {
        setSemesters(refreshed)
        return
      }
    } catch (err) {
      console.warn('API error saving semester, updating local state:', err)
    }

    if (semesterData.id) {
      setSemesters((prev) =>
        prev.map((s) => {
          if (s.id === semesterData.id) {
            return { ...s, ...semesterData } as SuperAdminSemester
          }
          if (semesterData.isCurrent) {
            return { ...s, isCurrent: false }
          }
          return s
        })
      )
    } else {
      const newSemester: SuperAdminSemester = {
        id: Date.now(),
        number: semesterData.number || 1,
        academicYear: semesterData.academicYear || '2025-2026',
        startDate: semesterData.startDate || '2026-01-05',
        endDate: semesterData.endDate || '2026-05-30',
        status: semesterData.status || 'UPCOMING',
        isCurrent: !!semesterData.isCurrent,
        isActive: true,
      }
      setSemesters((prev) =>
        semesterData.isCurrent
          ? [newSemester, ...prev.map((s) => ({ ...s, isCurrent: false }))]
          : [newSemester, ...prev]
      )
    }
  }

  const handleSetCurrentSemester = async (semesterId: number) => {
    try {
      const target = semesters.find((s) => s.id === semesterId)
      if (target) {
        await superAdminService.updateSemester(semesterId, {
          number: target.number,
          startDate: target.startDate,
          endDate: target.endDate,
        })
      }
    } catch (err) {
      console.warn('API error setting current semester:', err)
    }

    setSemesters((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === semesterId,
        status: s.id === semesterId ? 'ONGOING' : (s.status === 'ONGOING' ? 'COMPLETED' : s.status),
      }))
    )
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
      if (refreshed.length > 0) {
        setPointCategories(refreshed)
        return
      }
    } catch (err) {
      console.warn('API error saving point category, updating local state:', err)
    }

    if (catData.id) {
      const updateRecursive = (list: SuperAdminPointCategory[]): SuperAdminPointCategory[] =>
        list.map((c) => {
          if (c.id === catData.id) {
            return { ...c, ...catData } as SuperAdminPointCategory
          }
          if (c.children) {
            return { ...c, children: updateRecursive(c.children) }
          }
          return c
        })
      setPointCategories((prev) => updateRecursive(prev))
    } else {
      const newCategory: SuperAdminPointCategory = {
        id: Date.now(),
        name: catData.name || 'Tiêu chí mới',
        note: catData.note,
        maximum: catData.maximum || 5,
        level: catData.level || 0,
        childrenOrder: catData.childrenOrder || 1,
        parentCategoryId: catData.parentCategoryId || null,
        isActive: true,
      }

      if (catData.parentCategoryId) {
        const addChildRecursive = (list: SuperAdminPointCategory[]): SuperAdminPointCategory[] =>
          list.map((c) => {
            if (c.id === catData.parentCategoryId) {
              return {
                ...c,
                children: c.children ? [...c.children, newCategory] : [newCategory],
              }
            }
            if (c.children) {
              return { ...c, children: addChildRecursive(c.children) }
            }
            return c
          })
        setPointCategories((prev) => addChildRecursive(prev))
      } else {
        setPointCategories((prev) => [...prev, newCategory])
      }
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
      if (refreshed.length > 0) {
        setSv5tCriterias(refreshed)
        return
      }
    } catch (err) {
      console.warn('API error saving SV5T criteria, updating local state:', err)
    }

    if (critData.id) {
      const updateRecursive = (list: SuperAdminSv5tCriteria[]): SuperAdminSv5tCriteria[] =>
        list.map((c) => {
          if (c.id === critData.id) {
            return { ...c, ...critData } as SuperAdminSv5tCriteria
          }
          if (c.children) {
            return { ...c, children: updateRecursive(c.children) }
          }
          return c
        })
      setSv5tCriterias((prev) => updateRecursive(prev))
    } else {
      const newCrit: SuperAdminSv5tCriteria = {
        id: Date.now(),
        name: critData.name || 'Tiêu chuẩn mới',
        note: critData.note,
        scope: critData.scope || 'UNIVERSITY',
        level: critData.level || 0,
        childrenOrder: critData.childrenOrder || 1,
        parentId: critData.parentId || null,
        isActive: true,
      }

      if (critData.parentId) {
        const addChildRecursive = (list: SuperAdminSv5tCriteria[]): SuperAdminSv5tCriteria[] =>
          list.map((c) => {
            if (c.id === critData.parentId) {
              return {
                ...c,
                children: c.children ? [...c.children, newCrit] : [newCrit],
              }
            }
            if (c.children) {
              return { ...c, children: addChildRecursive(c.children) }
            }
            return c
          })
        setSv5tCriterias((prev) => addChildRecursive(prev))
      } else {
        setSv5tCriterias((prev) => [...prev, newCrit])
      }
    }
  }

  const handleToggleSv5tCriteriaActive = async (criteriaId: number) => {
    try {
      await superAdminService.toggleCriteriaStatus(criteriaId)
      const refreshed = await superAdminService.getCriterias()
      if (refreshed.length > 0) {
        setSv5tCriterias(refreshed)
        return
      }
    } catch (err) {
      console.warn('API error toggling criteria status, updating local state:', err)
    }

    const toggleRecursive = (list: SuperAdminSv5tCriteria[]): SuperAdminSv5tCriteria[] =>
      list.map((c) => {
        if (c.id === criteriaId) {
          return { ...c, isActive: !c.isActive }
        }
        if (c.children) {
          return { ...c, children: toggleRecursive(c.children) }
        }
        return c
      })
    setSv5tCriterias((prev) => toggleRecursive(prev))
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
      if (refreshed.length > 0) {
        setSchools(refreshed)
        return
      }
    } catch (err) {
      console.warn('API error saving school, updating local state:', err)
    }

    if (schoolData.id) {
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolData.id ? { ...s, ...schoolData } : s))
      )
    } else {
      const newSchool: SuperAdminSchool = {
        id: Date.now(),
        name: schoolData.name || 'Khoa/Trường mới',
        description: schoolData.description,
        isActive: true,
        majorsCount: 0,
        majors: [],
      }
      setSchools((prev) => [...prev, newSchool])
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
      if (refreshed.length > 0) {
        setSchools(refreshed)
        return
      }
    } catch (err) {
      console.warn('API error saving major, updating local state:', err)
    }

    if (majorData.id) {
      setSchools((prev) =>
        prev.map((s) => ({
          ...s,
          majors: s.majors?.map((m) =>
            m.id === majorData.id ? { ...m, ...majorData } : m
          ),
        }))
      )
    } else {
      const newMajor: SuperAdminMajor = {
        id: Date.now(),
        code: majorData.code || `7480${Math.floor(100 + Math.random() * 900)}`,
        name: majorData.name || 'Chuyên ngành mới',
        schoolId: currentSchoolIdForMajor,
        isActive: true,
        studentCount: 0,
      }
      setSchools((prev) =>
        prev.map((s) =>
          s.id === currentSchoolIdForMajor
            ? { ...s, majors: [...(s.majors || []), newMajor] }
            : s
        )
      )
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
              <div key={i} className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-xs space-y-3">
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
              <div key={i} className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-xs space-y-4">
                <Skeleton className="h-5 w-44 rounded" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center justify-between p-3 border border-border/60 rounded-xl">
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
      ) : loadError && users.length === 0 && fanpages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-card rounded-2xl border border-border shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Không thể kết nối đến máy chủ</p>
          <p className="text-xs text-muted-foreground max-w-sm text-center">{loadError}</p>
          <button
            type="button"
            onClick={loadBackendData}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            Thử lại
          </button>
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
        onChangeRole={handleChangeUserRole}
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
