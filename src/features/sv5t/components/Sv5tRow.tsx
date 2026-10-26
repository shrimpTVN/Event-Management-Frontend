import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { Sv5tSelfEvaluationModal } from './Sv5tSelfEvaluationModal'
import { Sv5tDetailModal } from './Sv5tDetailModal'
import type { CriteriaProgressNode } from '../types/sv5t.types'

interface Sv5tRowProps {
  node: CriteriaProgressNode
  criteriaCode: string
  isLeaf: boolean
  isGroupBanner?: boolean
  onSaveProgress: (criteriaId: number, completed: boolean, note: string) => Promise<void> | void
}

export const Sv5tRow: React.FC<Sv5tRowProps> = ({
  node,
  criteriaCode,
  isLeaf,
  isGroupBanner = false,
  onSaveProgress,
}) => {
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // 1. Group banner row (e.g. 1.3: Đạt thêm 01 trong 05 tiêu chí sau:)
  if (isGroupBanner) {
    return (
      <div className="flex items-stretch bg-[#ECFBFF] dark:bg-cyan-950/25 border-b border-[#E5E7EB] dark:border-border text-xs min-h-[38px] select-none">
        {/* Mã TC (86px) */}
        <div className="w-[86px] min-w-[86px] max-w-[86px] px-1 py-2 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border font-semibold text-[#065C85] dark:text-cyan-400 shrink-0 text-center">
          {criteriaCode}
        </div>
        {/* Nội dung gộp (căn giữa theo yêu cầu của giao diện) */}
        <div className="flex-1 px-3 py-2 flex items-center justify-center text-center font-medium text-[#065C85] dark:text-cyan-300">
          {node.name}
        </div>
      </div>
    )
  }

  const isEventRecorded = node.completionSource === 'EVENT_CHECKOUT' || node.completionSource === 'SYSTEM'
  const hasDetails = node.isCompleted || Boolean(node.note)

  return (
    <>
      <div className="flex items-stretch border-b border-[#E5E7EB] dark:border-border text-xs min-h-[40px] bg-white dark:bg-card hover:bg-muted/20 transition-colors">
        {/* 1. Mã TC (86px) */}
        <div className="w-[86px] min-w-[86px] max-w-[86px] px-1 py-2.5 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border font-medium text-foreground/80 shrink-0 text-center">
          {criteriaCode}
        </div>

        {/* 2. Tên tiêu chuẩn (flex-1) */}
        <div className="flex-1 min-w-[280px] px-3 py-2.5 flex flex-col justify-center border-r border-[#E5E7EB] dark:border-border">
          <span className="text-foreground/90 leading-relaxed font-normal">
            {node.name}
          </span>
          {node.note && (
            <span className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {node.note}
            </span>
          )}
        </div>

        {/* 3. Dữ liệu ghi nhận (136px) */}
        <div className="w-[136px] min-w-[136px] max-w-[136px] px-2 py-2.5 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border shrink-0 text-center">
          {isEventRecorded ? (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFF5FC] dark:bg-primary/20 text-[#1B4B8A] dark:text-primary">
              Đã ghi nhận
            </span>
          ) : (
            <span className="text-muted-foreground/50 font-medium">—</span>
          )}
        </div>

        {/* 4. SV đánh giá (136px) */}
        <div className="w-[136px] min-w-[136px] max-w-[136px] px-2 py-2.5 flex items-center justify-center border-r border-[#E5E7EB] dark:border-border shrink-0 text-center">
          {isLeaf ? (
            <button
              type="button"
              onClick={() => setIsSelfModalOpen(true)}
              title="Nhấp để tự đánh giá tiêu chuẩn và bổ sung minh chứng"
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              {node.isCompleted ? (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#EFF5FC] dark:bg-primary/20 text-[#1B4B8A] dark:text-primary border border-[#BDD7F0] dark:border-primary/40 block">
                  Đạt
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FFFEEB] dark:bg-amber-950/40 text-[#7D7716] dark:text-amber-400 border border-[#A89F1D]/40 block">
                  Chưa đánh giá
                </span>
              )}
            </button>
          ) : (
            <span className="text-muted-foreground/50 font-medium">—</span>
          )}
        </div>

        {/* 5. Chi tiết tổng hợp/Tổng (184px) */}
        <div className="w-[184px] min-w-[184px] max-w-[184px] px-2 py-2.5 flex items-center justify-center shrink-0 text-center">
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-[#1F5CA9] dark:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              title="Xem thông tin chi tiết và minh chứng"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem</span>
            </button>
          ) : (
            <span className="text-muted-foreground/50 font-medium">—</span>
          )}
        </div>
      </div>

      {/* Modal tự đánh giá */}
      {isSelfModalOpen && (
        <Sv5tSelfEvaluationModal
          isOpen={isSelfModalOpen}
          onClose={() => setIsSelfModalOpen(false)}
          criterionName={node.name}
          criteriaCode={criteriaCode}
          isCompleted={node.isCompleted}
          currentNote={node.note}
          onSave={(completed, note) => onSaveProgress(node.criteriaId, completed, note)}
        />
      )}

      {/* Modal chi tiết */}
      {isDetailModalOpen && (
        <Sv5tDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          node={node}
          criteriaCode={criteriaCode}
        />
      )}
    </>
  )
}
