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
  ensureSv5tHierarchy,
  getStoredEvaluations,
  setStoredEvaluations,
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
    queryKey: ['student-criteria-progress', appliedYearId],
    queryFn: () => sv5tService.getStudentCriteriaProgress(appliedYearId),
    enabled: Boolean(appliedYearId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  // 2b. Fetch All Student Criteria Transactions for appliedYearId
  const {
    data: allTransactions = [],
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['student-criteria-transactions-all', appliedYearId],
    queryFn: () => sv5tService.getAllCriteriaTransactions(appliedYearId),
    enabled: Boolean(appliedYearId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  // Local state for optimistic update and persistence of self-evaluation
  const [localCompletedMap, setLocalCompletedMap] = useState<Record<number, boolean>>(() => {
    return getStoredEvaluations(userKey, appliedYearId).completedMap
  })
  const [localNoteMap, setLocalNoteMap] = useState<Record<number, string>>(() => {
    return getStoredEvaluations(userKey, appliedYearId).noteMap
  })

  // Synchronize local state from localStorage when academic year or user changes
  useEffect(() => {
    if (appliedYearId) {
      const stored = getStoredEvaluations(userKey, appliedYearId)
      setLocalCompletedMap(stored.completedMap)
      setLocalNoteMap(stored.noteMap)
    } else {
      setLocalCompletedMap({})
      setLocalNoteMap({})
    }
  }, [appliedYearId, userKey])

  // Synchronize local state with real DB criteria progress when data arrives from backend
  useEffect(() => {
    if (criteriaProgress?.criteria?.length && appliedYearId) {
      const dbManualMap: Record<number, boolean> = {}
      const dbNoteMap: Record<number, string> = {}

      const traverse = (node: any) => {
        if (node.isSelfEvaluated || node.completionSource === 'MANUAL') {
          dbManualMap[node.criteriaId] = true
          if (node.selfEvaluationNote || node.note) {
            dbNoteMap[node.criteriaId] = node.selfEvaluationNote || node.note
          }
        }
        if (Array.isArray(node.children)) {
          node.children.forEach(traverse)
        }
      }
      criteriaProgress.criteria.forEach(traverse)

      if (Object.keys(dbManualMap).length > 0) {
        setLocalCompletedMap((prev) => {
          const next = { ...prev, ...dbManualMap }
          setStoredEvaluations(userKey, appliedYearId, {
            completedMap: next,
            noteMap: { ...localNoteMap, ...dbNoteMap },
          })
          return next
        })
        setLocalNoteMap((prev) => ({ ...prev, ...dbNoteMap }))
      }
    }
  }, [criteriaProgress, appliedYearId, userKey])

  // 3. Mutation to update self-evaluation / progress
  const progressMutation = useMutation({
    mutationFn: (payload: { criteriaId: number; completed: boolean; note: string }) =>
      sv5tService.toggleManualCriteriaProgress(payload.criteriaId, {
        academicYearId: appliedYearId || selectedYearId || academicYears[0]?.id || 1,
        completed: payload.completed,
        note: payload.note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-criteria-progress', appliedYearId] })
      queryClient.invalidateQueries({
        queryKey: ['student-criteria-transactions-all', appliedYearId],
      })
    },
  })

  // Mutation to delete self-evaluation transaction
  const deleteProgressMutation = useMutation({
    mutationFn: (criteriaTransactionId: number) =>
      sv5tService.deleteCriteriaTransaction(criteriaTransactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-criteria-progress', appliedYearId] })
      queryClient.invalidateQueries({
        queryKey: ['student-criteria-transactions-all', appliedYearId],
      })
    },
  })

  const handleSaveProgress = async (criteriaId: number, completed: boolean, note: string) => {
    const finalNote = completed ? note : ''
    const updatedCompletedMap = { ...localCompletedMap, [criteriaId]: completed }
    const updatedNoteMap = { ...localNoteMap }
    if (completed && finalNote) {
      updatedNoteMap[criteriaId] = finalNote
    } else {
      delete updatedNoteMap[criteriaId]
    }

    await progressMutation.mutateAsync({ criteriaId, completed, note: finalNote })
    setLocalCompletedMap(updatedCompletedMap)
    setLocalNoteMap(updatedNoteMap)
    setStoredEvaluations(userKey, appliedYearId, {
      completedMap: updatedCompletedMap,
      noteMap: updatedNoteMap,
    })
  }

  const handleDeleteProgress = async (criteriaTransactionId: number, criteriaId: number) => {
    const updatedCompletedMap = { ...localCompletedMap, [criteriaId]: false }
    const updatedNoteMap = { ...localNoteMap }
    delete updatedNoteMap[criteriaId]

    await deleteProgressMutation.mutateAsync(criteriaTransactionId)
    setLocalCompletedMap(updatedCompletedMap)
    setLocalNoteMap(updatedNoteMap)
    setStoredEvaluations(userKey, appliedYearId, {
      completedMap: updatedCompletedMap,
      noteMap: updatedNoteMap,
    })
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

  // Build complete hierarchical criteria tree with all children and correct required counts
  const standards = useMemo(() => {
    return ensureSv5tHierarchy(
      criteriaProgress,
      localCompletedMap,
      localNoteMap,
      allTransactions,
      appliedScope
    )
  }, [criteriaProgress, localCompletedMap, localNoteMap, allTransactions, appliedScope])

  // Count completed standards
  const completedStandardsCount = useMemo(() => {
    return standards.filter((s) => s.isCompleted).length
  }, [standards])

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
                totalStandardsCount={standards.length || 5}
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
              {transactionsError && (
                <div role="alert" className="flex items-center gap-3 text-sm text-muted-foreground">
                  Chưa tải được lịch sử ghi nhận SV5T.
                  <Button variant="outline" size="sm" onClick={() => void refetchTransactions()}>
                    Thử lại
                  </Button>
                </div>
              )}

              <Sv5tTable
                standards={standards}
                academicYearId={appliedYearId || 2}
                onSaveProgress={handleSaveProgress}
                onDeleteProgress={handleDeleteProgress}
                isLoading={isLoading}
                resetKey={`${appliedYearId}-${appliedScope}`}
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
