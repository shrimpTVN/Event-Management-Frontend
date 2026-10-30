import React from 'react'
import { X, Award, Star, FileCheck } from 'lucide-react'
import type { AdminEvent } from '../types/fanpageAdmin.types'

interface EventBenefitsModalProps {
  isOpen: boolean
  onClose: () => void
  event: AdminEvent | null
}

export const EventBenefitsModal: React.FC<EventBenefitsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-border bg-[#F9FAFB] dark:bg-background/60">
          <div>
            <h3 className="font-k2d font-bold text-base text-foreground">
              Quyền lợi sinh viên tham gia
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">
              {event.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* 1. Điểm rèn luyện */}
          <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Điểm rèn luyện (ĐRL)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                +{event.trainingPoints || 0} ĐRL
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {event.trainingPointCategoryName || 'Theo quy định đánh giá kết quả rèn luyện của Nhà trường.'}
            </p>
          </div>

          {/* 2. Tiêu chí Sinh viên 5 tốt */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Tiêu chuẩn Sinh viên 5 Tốt
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                {event.sv5tCriteriaName ? 'Áp dụng' : 'Không'}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {event.sv5tCriteriaName || 'Sự kiện này không tính vào tiêu chí xét danh hiệu Sinh viên 5 tốt.'}
            </p>
          </div>

          {/* 3. Giấy chứng nhận */}
          <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Chứng nhận hoàn thành
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                {event.hasCertificate ? 'Có cấp giấy' : 'Không cấp'}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {event.hasCertificate
                ? 'Sinh viên tham gia và hoàn thành điểm danh sẽ được cấp Giấy chứng nhận điện tử từ ban tổ chức.'
                : 'Sự kiện ghi nhận minh chứng trực tiếp vào sổ tay rèn luyện của hệ thống.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-border bg-[#F9FAFB] dark:bg-background/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
