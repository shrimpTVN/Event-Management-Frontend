import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StudentLeftSidebar } from '@/features/events'
import { historyService, normalizeHistoryStatus } from '@/features/registration-history'
import {
  trainingPointsService,
  buildPointCategoryTree,
  TrainingPointsHeader,
  TrainingPointsNoticeBanner,
  TrainingPointsSummary,
  TrainingPointsTable,
  formatYearLabel,
} from '@/features/training-points'

export const TrainingPointsPage: React.FC = () => {
  const queryClient = useQueryClient()

  // 1. Fetch Academic Years from mock data
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => trainingPointsService.getAcademicYears(),
  })

  // 2. Fetch Semesters from mock data
  const { data: semesters = [] } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => trainingPointsService.getSemesters(),
  })

  // Dropdown selected (draft) values
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')

  // Applied filter values (only updated when user clicks the "Tìm" button)
  const [appliedYear, setAppliedYear] = useState('')
  const [appliedSemester, setAppliedSemester] = useState('')

  // Set default active academic year when mock data arrives
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYear) {
      const activeYear = academicYears.find((y) => y.isActive) || academicYears[0]
      if (activeYear) {
        setSelectedYear(activeYear.code)
        setAppliedYear(activeYear.code)
      }
    }
  }, [academicYears, selectedYear])

  // Set default active semester when mock data arrives
  useEffect(() => {
    if (semesters.length > 0 && !selectedSemester) {
      const activeSem = semesters.find((s) => s.status === 'ACTIVE') || semesters[0]
      if (activeSem) {
        setSelectedSemester(String(activeSem.number))
        setAppliedSemester(String(activeSem.number))
      }
    }
  }, [semesters, selectedSemester])

  // Determine current active semester ID based on appliedYear and appliedSemester (committed via "Tìm" button)
  const currentSemesterId = useMemo(() => {
    const semNum = Number(appliedSemester) || 1
    const matchedYearObj = academicYears.find(
      (y) =>
        y.code === appliedYear ||
        y.code.replace(/\s+/g, '') === appliedYear.replace(/\s+/g, '')
    )
    const found = semesters.find(
      (s) =>
        s.number === semNum &&
        ((matchedYearObj && s.academicYearId === matchedYearObj.id) ||
          s.academicYear === appliedYear ||
          s.academicYear === matchedYearObj?.code)
    )
    return found ? found.id : 1
  }, [semesters, academicYears, appliedYear, appliedSemester])

  // 3. Fetch Point Categories (All levels)
  const { data: rawCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['point-categories'],
    queryFn: () => trainingPointsService.getPointCategories(),
  })

  // 4. Fetch Point Transactions (System & manual check-in points)
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['point-transactions', currentSemesterId],
    queryFn: () => trainingPointsService.getPointTransactions(currentSemesterId),
    enabled: Boolean(currentSemesterId),
  })

  // 5. Fetch Aggregate Semester Points
  const { data: _aggregatePoints = [] } = useQuery({
    queryKey: ['student-semester-points', currentSemesterId],
    queryFn: () => trainingPointsService.getStudentSemesterPoints(currentSemesterId),
    enabled: Boolean(currentSemesterId),
  })

  // 6. Fetch Registration History to get completed events count
  const { data: historyEvents = [] } = useQuery({
    queryKey: ['registrations', 'history'],
    queryFn: () => historyService.getMyHistory(),
  })

  // Build hierarchical category tree (Roots are Mục I -> V)
  const categoryTree = useMemo(() => {
    return buildPointCategoryTree(rawCategories)
  }, [rawCategories])

  // Track student self-evaluated scores and descriptions in local state
  const [studentScores, setStudentScores] = useState<Record<number, number>>({})
  const [studentDescriptions, setStudentDescriptions] = useState<Record<number, string>>({})

  // Initialize self-evaluated scores and descriptions from manual transactions in mock data
  useEffect(() => {
    if (transactions.length > 0) {
      const initialScores: Record<number, number> = {}
      const initialDescriptions: Record<number, string> = {}
      transactions.forEach((tx) => {
        if (tx.type === 'MANUAL') {
          initialScores[tx.pointCategoryId] = tx.points
          if (tx.description) {
            initialDescriptions[tx.pointCategoryId] = tx.description
          }
        }
      })
      setStudentScores(initialScores)
      setStudentDescriptions(initialDescriptions)
    }
  }, [transactions])

  // Mutation to save self evaluation
  const selfEvalMutation = useMutation({
    mutationFn: (payload: { categoryId: number; score: number; description?: string }) =>
      trainingPointsService.saveSelfEvaluation({
        semesterId: currentSemesterId,
        pointCategoryId: payload.categoryId,
        points: payload.score,
        description: payload.description || 'Sinh viên tự đánh giá',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-transactions', currentSemesterId] })
      queryClient.invalidateQueries({ queryKey: ['student-semester-points', currentSemesterId] })
    },
  })

  const handleSaveSelfScore = async (categoryId: number, score: number, description?: string) => {
    // Optimistically update local score & description
    setStudentScores((prev) => ({ ...prev, [categoryId]: score }))
    if (description !== undefined) {
      setStudentDescriptions((prev) => ({ ...prev, [categoryId]: description }))
    }
    await selfEvalMutation.mutateAsync({ categoryId, score, description })
  }

  // Calculate real total score as the exact sum of all 5 sections (capped at section maximums)
  const totalScore = useMemo(() => {
    if (categoryTree.length === 0) return 0

    // Map recorded event transactions (excluding manual self-evaluations)
    const recordedMap = new Map<number, number>()
    transactions.forEach((tx) => {
      if (tx.type !== 'MANUAL') {
        const cur = recordedMap.get(tx.pointCategoryId) || 0
        recordedMap.set(tx.pointCategoryId, cur + tx.points)
      }
    })

    let realSum = 0

    categoryTree.forEach((rootSection) => {
      let sectionLeavesSum = 0

      // Recursively sum leaf scores within this section
      const sumLeaves = (node: typeof rootSection) => {
        if (!node.children || node.children.length === 0) {
          const rec = recordedMap.get(node.id) || 0
          const self = studentScores[node.id] || 0
          sectionLeavesSum += rec + self
          return
        }
        node.children.forEach(sumLeaves)
      }

      sumLeaves(rootSection)

      // Final section score capped at root section maximum
      const finalSectionScore = Math.min(rootSection.maximum, sectionLeavesSum)
      realSum += finalSectionScore
    })

    return realSum
  }, [categoryTree, transactions, studentScores])

  // Hoạt động đã tham gia: lấy tổng số sự kiện đã hoàn thành từ lịch sử đăng ký của sinh viên
  const activitiesCount = useMemo(() => {
    return historyEvents.filter((e) => normalizeHistoryStatus(e.status) === 'COMPLETED').length
  }, [historyEvents])

  const handleApplyFilter = () => {
    // Only commit filter and trigger query updates when user clicks "Tìm"
    setAppliedYear(selectedYear)
    setAppliedSemester(selectedSemester)
  }

  const isLoading = isLoadingCategories || isLoadingTransactions

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto md:overflow-hidden py-3 sm:py-4 px-1 flex justify-center custom-scrollbar">
          <div className="w-full max-w-6xl h-full flex flex-col gap-3 min-h-0">
            {/* 1. Header with title and filter selectors from mock data */}
            <div className="shrink-0">
              <TrainingPointsHeader
                academicYears={academicYears}
                semesters={semesters}
                selectedYear={selectedYear}
                selectedSemester={selectedSemester}
                onYearChange={setSelectedYear}
                onSemesterChange={setSelectedSemester}
                onSearch={handleApplyFilter}
              />
            </div>

            {/* 2. Notice Warning Banner */}
            <div className="shrink-0">
              <TrainingPointsNoticeBanner />
            </div>

            {/* 3. Summary Overview Card with Real Computed Total Score based on applied filter */}
            <div className="shrink-0">
              <TrainingPointsSummary
                semesterLabel={`HK${appliedSemester || '1'}`}
                academicYearLabel={formatYearLabel(appliedYear)}
                totalScore={totalScore}
                activitiesCount={activitiesCount}
              />
            </div>

            {/* 4. Detailed Evaluation Table */}
            <TrainingPointsTable
              sections={categoryTree}
              transactions={transactions}
              studentScores={studentScores}
              studentDescriptions={studentDescriptions}
              onSaveSelfScore={handleSaveSelfScore}
              isLoading={isLoading}
              resetKey={`${appliedYear}-${appliedSemester}-${currentSemesterId}`}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default TrainingPointsPage
