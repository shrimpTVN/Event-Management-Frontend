import { Button } from '@/components/ui/button'
import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StudentLeftSidebar } from '@/features/events'
import { useAuthStore } from '@/features/auth'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useScrollActivity } from '@/shared/hooks/useScrollActivity'
import {
  sv5tService,
  Sv5tHeader,
  Sv5tNoticeBanner,
  Sv5tSummary,
  Sv5tTable,
  Sv5tRegulationModal,
  type EvaluationScope,
} from '@/features/sv5t'

export const Sv5tPage: React.FC = () => {
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const handleScroll = useScrollActivity()
  const user = useAuthStore((s) => s.user)
  const userKey = user?.id || user?.email || 'current'

  // 1. Fetch Academic Years from mock data
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => sv5tService.getAcademicYears(),
  })

  // Selected filter values (draft in dropdowns)
  const [selectedYearId, setSelectedYearId] = useState<number>(0)
  const [selectedScope, setSelectedScope] = useState<EvaluationScope>('UNIVERSITY')

  // Applied filter values (only updated when user clicks the "Tìm" button)
  const [appliedYearId, setAppliedYearId] = useState<number>(0)
  const [appliedScope, setAppliedScope] = useState<EvaluationScope>('UNIVERSITY')

  // Regulation modal state
  const [isRegulationModalOpen, setIsRegulationModalOpen] = useState(false)

  // Set default active academic year when data arrives
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYearId) {
      const activeYear =
        academicYears.find((y) => y.isActive) ||
        academicYears.find((y) => y.code === '2026-2027') ||
        academicYears[academicYears.length - 1] ||
        academicYears[0]
      if (activeYear) {
        setSelectedYearId(activeYear.id)
        setAppliedYearId(activeYear.id)
      }
    }
  }, [academicYears, selectedYearId])

  // 2. Fetch Student Criteria Progress for appliedYearId
  const {
    data: criteriaProgress,
    isLoading,
    isError: progressError,
    refetch: refetchProgress,
  } = useQuery({
    queryKey: ['student-criteria-progress', userKey, appliedYearId, appliedScope],
    queryFn: () => sv5tService.getStudentCriteriaProgress(appliedYearId, appliedScope),
    enabled: Boolean(appliedYearId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  // 3. Mutation to update self-evaluation / progress
  const progressMutation = useMutation({
    mutationFn: (payload: { criteriaId: number; completed: boolean; note: string; transactionId?: number }) =>
      sv5tService.toggleManualCriteriaProgress(payload.criteriaId, {
        academicYearId: appliedYearId || selectedYearId || academicYears[0]?.id || 1,
        completed: payload.completed,
        note: payload.note,
        transactionId: payload.transactionId,
      }),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-criteria-progress'] })
    },
  })

  // Mutation to delete self-evaluation transaction
  const deleteProgressMutation = useMutation({
    mutationFn: (criteriaTransactionId: number) =>
      sv5tService.deleteCriteriaTransaction(criteriaTransactionId),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-criteria-progress'] })
    },
  })

  const handleSaveProgress = async (criteriaId: number, completed: boolean, note: string, transactionId?: number) => {
    await progressMutation.mutateAsync({ criteriaId, completed, note: completed ? note : '', transactionId })
  }

  const handleDeleteProgress = async (criteriaTransactionId: number, _criteriaId: number) => {
    await deleteProgressMutation.mutateAsync(criteriaTransactionId)
  }

  // Handle clicking "Tìm" button on desktop
  const handleApplyFilter = () => {
    setAppliedYearId(selectedYearId)
    setAppliedScope(selectedScope)
  }

  // Synchronous changes on mobile, draft on desktop
  const handleYearChange = (newYearId: number) => {
    setSelectedYearId(newYearId)
    if (isMobile) {
      setAppliedYearId(newYearId)
    }
  }

  const handleScopeChange = (newScope: EvaluationScope) => {
    setSelectedScope(newScope)
    if (isMobile) {
      setAppliedScope(newScope)
    }
  }

  const standards = progressError ? [] : (criteriaProgress?.criteria ?? [])
  const completedStandardsCount = criteriaProgress?.completedMainCriteria ?? 0

  // Academic year label
  const academicYearLabel = useMemo(() => {
    if (criteriaProgress?.academicYear) return criteriaProgress.academicYear
    const matched = academicYears.find((y) => y.id === appliedYearId)
    return matched ? matched.code : '2026 - 2027'
  }, [criteriaProgress, academicYears, appliedYearId])

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
            {/* 1. Header with title, filter and regulation modal trigger */}
            <div className="shrink-0 order-1">
              <Sv5tHeader
                academicYears={academicYears}
                selectedYearId={selectedYearId}
                selectedScope={selectedScope}
                onYearChange={handleYearChange}
                onScopeChange={handleScopeChange}
                onSearch={handleApplyFilter}
                onOpenRegulation={() => setIsRegulationModalOpen(true)}
              />
            </div>

            {/* 2. Summary Overview Card (Mobile order: 2, Desktop order: 3) */}
            <div className="shrink-0 order-2 md:order-3">
              <Sv5tSummary
                academicYearLabel={academicYearLabel}
                completedStandardsCount={completedStandardsCount}
                totalStandardsCount={criteriaProgress?.totalMainCriteria ?? 0}
                completionPercentage={criteriaProgress?.completionPercentage ?? 0}
                isEligible={criteriaProgress?.isEligible ?? false}
                scope={appliedScope}
                isLoading={isLoading}
                unavailable={progressError || !appliedYearId}
              />
            </div>

            {/* 3. Notice Warning Banner (Mobile order: 3, Desktop order: 2) */}
            <div className="shrink-0 order-3 md:order-2">
              <Sv5tNoticeBanner />
            </div>

            {/* 4. Detailed Standards Evaluation Table (Order: 4) */}
            <div className="shrink-0 order-4 flex flex-col gap-3">
              {progressError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-background p-3 text-sm"
                >
                  Không tải được tiêu chuẩn.{' '}
                  <Button variant="ghost" className="h-11" onClick={() => void refetchProgress()}>
                    Thử lại
                  </Button>
                </div>
              )}

              <Sv5tTable
                standards={standards}
                academicYearId={appliedYearId}
                onSaveProgress={handleSaveProgress}
                onDeleteProgress={handleDeleteProgress}
                isLoading={isLoading}
                resetKey={`${userKey}-${appliedYearId}-${appliedScope}`}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Regulation Modal */}
      <Sv5tRegulationModal
        isOpen={isRegulationModalOpen}
        onClose={() => setIsRegulationModalOpen(false)}
        scope={appliedScope}
      />
    </div>
  )
}

export default Sv5tPage
