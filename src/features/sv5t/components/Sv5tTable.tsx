import React from 'react'
import { Button } from '@/components/ui/button'
import { matchesPageSearchTree, useMobilePageSearch } from '@/shared/components/layout/MobileSubpageHeader'
import { Sv5tSectionAccordion } from './Sv5tSectionAccordion'
import { Skeleton } from '@/components/ui/skeleton'
import type { CriteriaProgressNode } from '../types/sv5t.types'

interface Sv5tTableProps {
  standards: CriteriaProgressNode[]
  academicYearId?: number
  onSaveProgress: (criteriaId: number, completed: boolean, note: string, transactionId?: number) => Promise<void> | void
  onDeleteProgress?: (criteriaTransactionId: number, criteriaId: number) => Promise<void> | void
  isLoading?: boolean
  resetKey?: string | number
}

export const Sv5tTable: React.FC<Sv5tTableProps> = ({
  standards,
  academicYearId,
  onSaveProgress,
  onDeleteProgress,
  isLoading,
  resetKey,
}) => {
  const { query, setQuery } = useMobilePageSearch()
  return (
    <div
      aria-busy={isLoading || undefined}
      className="w-full bg-background border border-border rounded-lg p-3 sm:p-4 flex flex-col gap-3 shadow-2xs"
    >
      {isLoading
        ? [1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="flex min-h-[49px] items-center justify-between gap-4 rounded-md border border-border bg-card p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-4 w-56 max-w-full rounded" />
              </div>
              <Skeleton className="h-4 w-24 shrink-0 rounded" />
            </div>
          ))
        : standards.map((std, idx) => matchesPageSearchTree(query, std) && (
            <Sv5tSectionAccordion
              key={`${std.criteriaId || idx + 1}-${resetKey ?? ''}-${query}`}
              standard={std}
              standardIndex={idx + 1}
              academicYearId={academicYearId}
              onSaveProgress={onSaveProgress}
              onDeleteProgress={onDeleteProgress}
              defaultExpanded={Boolean(query.trim())}
            />
          ))}
      {!isLoading && standards.length === 0 && (
        <p role="status" className="p-6 text-center text-sm text-muted-foreground">Chưa có tiêu chí cho phạm vi và năm học đã chọn.</p>
      )}
      {!isLoading && query.trim() && !standards.some((standard) => matchesPageSearchTree(query, standard)) && (
        <div role="status" className="p-6 text-center rounded-xl bg-card border border-border flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Không tìm thấy tiêu chuẩn nào phù hợp với từ khóa &ldquo;{query}&rdquo;.
          </p>
          {setQuery && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs"
              onClick={() => setQuery('')}
            >
              Xóa từ khóa tìm kiếm
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
