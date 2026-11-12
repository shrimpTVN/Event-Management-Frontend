import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StudentLeftSidebar } from '@/features/events'
import {
  sv5tService,
  Sv5tHeader,
  Sv5tNoticeBanner,
  Sv5tSummary,
  Sv5tTable,
  Sv5tRegulationModal,
  ensureSv5tHierarchy,
  type EvaluationScope,
} from '@/features/sv5t'

export const Sv5tPage: React.FC = () => {
  const queryClient = useQueryClient()

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
  const { data: criteriaProgress, isLoading } = useQuery({
    queryKey: ['student-criteria-progress', appliedYearId],
    queryFn: () => sv5tService.getStudentCriteriaProgress(appliedYearId),
    enabled: Boolean(appliedYearId),
  })

  // 2b. Fetch All Student Criteria Transactions for appliedYearId
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['student-criteria-transactions-all', appliedYearId],
    queryFn: () => sv5tService.getAllCriteriaTransactions(appliedYearId),
    enabled: Boolean(appliedYearId),
  })

  // Local state for optimistic update of self-evaluation
  const [localCompletedMap, setLocalCompletedMap] = useState<Record<number, boolean>>({})
  const [localNoteMap, setLocalNoteMap] = useState<Record<number, string>>({})

  // Reset local state when academic year changes
  useEffect(() => {
    setLocalCompletedMap({})
    setLocalNoteMap({})
  }, [appliedYearId])

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
      queryClient.invalidateQueries({ queryKey: ['student-criteria-transactions-all', appliedYearId] })
    },
  })

  // Mutation to delete self-evaluation transaction
  const deleteProgressMutation = useMutation({
    mutationFn: (criteriaTransactionId: number) =>
      sv5tService.deleteCriteriaTransaction(criteriaTransactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-criteria-progress', appliedYearId] })
      queryClient.invalidateQueries({ queryKey: ['student-criteria-transactions-all', appliedYearId] })
    },
  })

  const handleSaveProgress = async (criteriaId: number, completed: boolean, note: string) => {
    // Optimistically update UI
    setLocalCompletedMap((prev) => ({ ...prev, [criteriaId]: completed }))
    setLocalNoteMap((prev) => ({ ...prev, [criteriaId]: note }))
    try {
      await progressMutation.mutateAsync({ criteriaId, completed, note })
    } catch (err) {
      console.warn('API sync warning:', err)
    }
  }

  const handleDeleteProgress = async (criteriaTransactionId: number, criteriaId: number) => {
    // Optimistically update UI
    setLocalCompletedMap((prev) => ({ ...prev, [criteriaId]: false }))
    setLocalNoteMap((prev) => {
      const next = { ...prev }
      delete next[criteriaId]
      return next
    })
    try {
      await deleteProgressMutation.mutateAsync(criteriaTransactionId)
    } catch (err) {
      console.warn('Failed to delete criteria transaction:', err)
    }
  }

  // Handle clicking "Tìm" button
  const handleApplyFilter = () => {
    setAppliedYearId(selectedYearId)
    setAppliedScope(selectedScope)
  }

  // Build complete hierarchical criteria tree with all children and correct required counts
  const standards = useMemo(() => {
    return ensureSv5tHierarchy(criteriaProgress, localCompletedMap, localNoteMap, allTransactions)
  }, [criteriaProgress, localCompletedMap, localNoteMap, allTransactions])

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
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F0F2F5] dark:bg-background">
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-5 pl-1 pr-4 sm:pr-6 custom-scrollbar">
          <div className="w-full max-w-full flex flex-col gap-4 pb-16">
            {/* 1. Header with title, filter and regulation modal trigger */}
            <div className="shrink-0">
              <Sv5tHeader
                academicYears={academicYears}
                selectedYearId={selectedYearId}
                selectedScope={selectedScope}
                onYearChange={setSelectedYearId}
                onScopeChange={setSelectedScope}
                onSearch={handleApplyFilter}
                onOpenRegulation={() => setIsRegulationModalOpen(true)}
              />
            </div>

            {/* 2. Notice Warning Banner */}
            <div className="shrink-0">
              <Sv5tNoticeBanner />
            </div>

            {/* 3. Summary Overview Card matching Figma 12-col grid */}
            <div className="shrink-0">
              <Sv5tSummary
                academicYearLabel={academicYearLabel}
                completedStandardsCount={completedStandardsCount}
                totalStandardsCount={standards.length || 5}
                scope={appliedScope}
                isLoading={isLoading}
              />
            </div>

            {/* 4. Detailed Standards Evaluation Table */}
            <Sv5tTable
              standards={standards}
              academicYearId={appliedYearId || 2}
              onSaveProgress={handleSaveProgress}
              onDeleteProgress={handleDeleteProgress}
              isLoading={isLoading}
              resetKey={`${appliedYearId}-${appliedScope}`}
            />
          </div>
        </main>
      </div>

      {/* Regulation Modal */}
      <Sv5tRegulationModal
        isOpen={isRegulationModalOpen}
        onClose={() => setIsRegulationModalOpen(false)}
      />
    </div>
  )
}

export default Sv5tPage
