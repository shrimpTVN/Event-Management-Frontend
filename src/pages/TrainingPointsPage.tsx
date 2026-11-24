import { Button } from '@/components/ui/button'
import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StudentLeftSidebar } from '@/features/events'
import { historyService, normalizeHistoryStatus } from '@/features/registration-history'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useScrollActivity } from '@/shared/hooks/useScrollActivity'
import {
  trainingPointsService,
  TrainingPointsHeader,
  TrainingPointsNoticeBanner,
  TrainingPointsSummary,
  TrainingPointsTable,
  formatYearLabel,
} from '@/features/training-points'

export const TrainingPointsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const handleScroll = useScrollActivity()

  // 1. Fetch Academic Years from server
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => trainingPointsService.getAcademicYears(),
  })

  // 2. Fetch Semesters from server
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => trainingPointsService.getSemesters(),
  })

  // Dropdown selected (draft) values
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')

  // Applied filter values (updated synchronously on mobile, or when clicking "Tìm" on desktop)
  const [appliedYear, setAppliedYear] = useState('')
  const [appliedSemester, setAppliedSemester] = useState('')

  // Helper to find valid semesters for a specific academic year
  const getSemestersForYear = (yearCode: string) => {
    if (!yearCode) return []
    const cleanYear = yearCode.replace(/\s+/g, '')
    const matchedYear = academicYears.find(
      (y) => (y.code || '').replace(/\s+/g, '') === cleanYear
    )

    return semesters.filter((s) => {
      if (matchedYear && s.academicYearId != null) {
        return s.academicYearId === matchedYear.id
      }
      if (s.academicYear) {
        return s.academicYear.replace(/\s+/g, '') === cleanYear
      }
      return false
    })
  }

  // Set default active academic year when data arrives
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const activeYear = academicYears.find((y) => y.isActive) || academicYears[0]
      if (activeYear) {
        setSelectedYear(activeYear.code)
        setAppliedYear(activeYear.code)
      }
    }
  }, [academicYears, selectedYear])

  // Set default active semester when data arrives
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      const activeSem =
        semesters.find((s) => s.status === 'ONGOING' || s.status === 'ACTIVE') || semesters[0]
      if (activeSem) {
        setSelectedSemester(String(activeSem.number))
        setAppliedSemester(String(activeSem.number))
      }
    }
  }, [semesters, selectedSemester])

  // Synchronous year change with valid semester preservation and fallback
  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear)

    const validSemesters = getSemestersForYear(newYear)
    let nextSemester = selectedSemester
    const hasCurrentSem = validSemesters.some((s) => String(s.number) === selectedSemester)
    if (!hasCurrentSem) {
      if (validSemesters.length > 0) {
        const activeSem =
          validSemesters.find((s) => s.status === 'ONGOING' || s.status === 'ACTIVE') ||
          validSemesters[0]
        nextSemester = activeSem ? String(activeSem.number) : '1'
      } else {
        nextSemester = ''
      }
    }

    setSelectedSemester(nextSemester)

    if (isMobile) {
      setAppliedYear(newYear)
      setAppliedSemester(nextSemester)
    }
  }

  const handleSemesterChange = (newSemester: string) => {
    setSelectedSemester(newSemester)
    if (isMobile) {
      setAppliedSemester(newSemester)
    }
  }

  const handleApplyFilter = () => {
    setAppliedYear(selectedYear)
    setAppliedSemester(selectedSemester)
  }

  // Determine current active semester ID based on appliedYear and appliedSemester
  const currentSemesterId = useMemo(() => {
    if (!appliedSemester || !appliedYear) return undefined
    const semNum = Number(appliedSemester)
    if (isNaN(semNum) || semNum <= 0) return undefined

    const cleanYear = appliedYear.replace(/\s+/g, '')
    const matchedYearObj = academicYears.find(
      (y) => (y.code || '').replace(/\s+/g, '') === cleanYear
    )
    const found = semesters.find(
      (s) =>
        s.number === semNum &&
        ((matchedYearObj && s.academicYearId === matchedYearObj.id) ||
          (s.academicYear && s.academicYear.replace(/\s+/g, '') === cleanYear))
    )
    return found?.id
  }, [semesters, academicYears, appliedYear, appliedSemester])

  // 3. Fetch Grouped Tree Semester Points (API MỚI: GET /student-semester-points/grouped-tree/{semesterId})
  const {
    data: groupedTree = [],
    isLoading: isLoadingTree,
    isError: treeError,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ['student-semester-points-tree', currentSemesterId],
    queryFn: () => trainingPointsService.getSemesterPointGroupedTree(currentSemesterId!),
    enabled: Boolean(currentSemesterId),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  // 4. Fallback to standard point categories grouped tree if student has no tree records yet
  const { data: fallbackCategories = [] } = useQuery({
    queryKey: ['point-categories-grouped-tree'],
    queryFn: () => trainingPointsService.getPointCategoriesGroupedTree(),
    enabled: groupedTree.length === 0,
  })

  // Normalize sections: prefer groupedTree, fallback to categories
  const sections = useMemo(() => {
    if (groupedTree && groupedTree.length > 0) return groupedTree
    if (fallbackCategories && fallbackCategories.length > 0) return fallbackCategories
    return []
  }, [groupedTree, fallbackCategories])

  // 5. Fetch Registration History to get completed events count
  const { data: historyEvents = [] } = useQuery({
    queryKey: ['registrations', 'history'],
    queryFn: () => historyService.getMyHistory(),
  })

  // Track student self-evaluated scores and descriptions in local state
  const [studentScores, setStudentScores] = useState<Record<number, number>>({})
  const [studentDescriptions, setStudentDescriptions] = useState<Record<number, string>>({})

  useEffect(() => {
    setStudentScores({})
    setStudentDescriptions({})
  }, [currentSemesterId])

  // Mutation to save self evaluation
  const selfEvalMutation = useMutation({
    mutationFn: (payload: { categoryId: number; score: number; description?: string }) =>
      trainingPointsService.saveSelfEvaluation({
        semesterId: currentSemesterId!,
        pointCategoryId: payload.categoryId,
        points: payload.score,
        description: payload.description || 'Sinh viên tự đánh giá',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-semester-points-tree', currentSemesterId],
      })
      queryClient.invalidateQueries({ queryKey: ['student-semester-points', currentSemesterId] })
      queryClient.invalidateQueries({ queryKey: ['point-transactions', currentSemesterId] })
    },
  })

  // Mutation to delete self evaluation
  const deleteSelfEvalMutation = useMutation({
    mutationFn: (transactionId: number) =>
      trainingPointsService.deletePointTransaction(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['student-semester-points-tree', currentSemesterId],
      })
      queryClient.invalidateQueries({ queryKey: ['student-semester-points', currentSemesterId] })
      queryClient.invalidateQueries({ queryKey: ['point-transactions', currentSemesterId] })
    },
  })

  const handleSaveSelfScore = async (categoryId: number, score: number, description?: string) => {
    await selfEvalMutation.mutateAsync({ categoryId, score, description })
    // Update local values only after saving successfully.
    setStudentScores((prev) => ({ ...prev, [categoryId]: score }))
    if (description !== undefined) {
      setStudentDescriptions((prev) => ({ ...prev, [categoryId]: description }))
    }
  }

  const handleDeleteSelfScore = async (transactionId: number, categoryId: number) => {
    let targetTxId = transactionId
    if (!targetTxId || targetTxId <= 0) {
      try {
        const txs = await trainingPointsService.getPointTransactionsByCategory(
          currentSemesterId!,
          categoryId
        )
        const manual = txs.find((t) => t.type === 'MANUAL')
        if (manual) targetTxId = manual.id
      } catch (err) {
        console.warn('Could not find manual transaction to delete:', err)
      }
    }

    if (targetTxId && targetTxId > 0) {
      await deleteSelfEvalMutation.mutateAsync(targetTxId)
      // Clear local values only after deletion succeeds.
      setStudentScores((prev) => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
      setStudentDescriptions((prev) => {
        const next = { ...prev }
        delete next[categoryId]
        return next
      })
    }
  }

  // The shared service caps each section before the page and sidebar sum their scores.
  const totalScore = useMemo(() => {
    if (groupedTree && groupedTree.length > 0) {
      return groupedTree.reduce((sum, root) => sum + (root.totalPoint || 0), 0)
    }
    return 0
  }, [groupedTree])

  // Hoạt động đã tham gia: lấy tổng số sự kiện đã hoàn thành từ lịch sử đăng ký của sinh viên
  const activitiesCount = useMemo(() => {
    return historyEvents.filter((e) => normalizeHistoryStatus(e.status) === 'COMPLETED').length
  }, [historyEvents])

  const isLoading = isLoadingTree && fallbackCategories.length === 0

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-muted/40 font-sans">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-4 md:gap-6 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden xl:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Main Content */}
        <main
          data-student-scroll
          onScroll={handleScroll}
          className="flex-1 min-w-0 h-full overflow-y-auto py-4 md:py-5 pl-0 md:pl-1 pr-1 md:pr-6 student-scrollbar"
        >
          <div className="w-full max-w-full flex flex-col gap-4 pb-16">
            {/* 1. Header with title and filter selectors */}
            <div className="shrink-0 order-1">
              <TrainingPointsHeader
                academicYears={academicYears}
                semesters={semesters}
                selectedYear={selectedYear}
                selectedSemester={selectedSemester}
                onYearChange={handleYearChange}
                onSemesterChange={handleSemesterChange}
                onSearch={handleApplyFilter}
              />
            </div>

            {/* 2. Summary Overview Card (Mobile order: 2, Desktop order: 3) */}
            <div className="shrink-0 order-2 md:order-3">
              <TrainingPointsSummary
                unavailable={treeError || !currentSemesterId}
                semesterLabel={`HK${appliedSemester || '1'}`}
                academicYearLabel={formatYearLabel(appliedYear)}
                totalScore={totalScore}
                activitiesCount={activitiesCount}
                isLoading={isLoading}
              />
            </div>

            {/* 3. Notice Warning Banner (Mobile order: 3, Desktop order: 2) */}
            <div className="shrink-0 order-3 md:order-2">
              <TrainingPointsNoticeBanner />
            </div>

            {/* 4. Detailed Evaluation Table (Order: 4) */}
            <div className="shrink-0 order-4 flex flex-col gap-3">
              {treeError && (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3 text-sm"
                >
                  <p>Không tải được điểm rèn luyện.</p>
                  <Button variant="outline" size="sm" onClick={() => void refetchTree()}>
                    Thử lại
                  </Button>
                </div>
              )}
              {!currentSemesterId && !isLoading && !treeError && (
                <div className="p-6 text-center rounded-xl bg-card border border-border text-sm text-muted-foreground">
                  Năm học {formatYearLabel(appliedYear)} chưa có học kỳ nào được cấu hình.
                </div>
              )}
              <TrainingPointsTable
                sections={sections}
                studentScores={studentScores}
                studentDescriptions={studentDescriptions}
                semesterId={currentSemesterId}
                onSaveSelfScore={handleSaveSelfScore}
                onDeleteSelfScore={handleDeleteSelfScore}
                isLoading={isLoading}
                resetKey={`${appliedYear}-${appliedSemester}-${currentSemesterId}`}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TrainingPointsPage
