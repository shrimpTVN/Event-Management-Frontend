import React from 'react'
import { Info, X, Calendar, Clock, CheckCircle2 } from 'lucide-react'

interface EvaluationRegulationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const EvaluationRegulationModal: React.FC<EvaluationRegulationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base text-foreground font-heading">
              Quy định thời gian đánh giá ĐRL
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs md:text-sm text-foreground/90 leading-relaxed custom-scrollbar">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-amber-900 dark:text-amber-200 text-xs">
            Sinh viên thực hiện tự đánh giá kết quả rèn luyện của học kỳ theo đúng khung thời gian quy định của nhà trường.
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">1. Sinh viên tự đánh giá</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Thời gian: Từ tuần 15 đến tuần 17 của học kỳ chính thức. Sinh viên đối chiếu minh chứng và tự chấm điểm.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">2. Họp xét điểm tại Lớp & Cố vấn học tập</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Thời gian: Tuần 18 - 19 của học kỳ. Ban cán sự lớp phối hợp Cố vấn học tập tổ chức họp bình xét và duyệt điểm.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">3. Công bố kết quả chính thức</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Khoa/Trường thẩm định và công bố trên hệ thống Quản lý đào tạo trước khi bắt đầu học kỳ kế tiếp.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs md:text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
