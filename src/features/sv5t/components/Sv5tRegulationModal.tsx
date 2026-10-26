import React from 'react'
import { Info, X, Calendar, CheckCircle2, Award, FileText } from 'lucide-react'

interface Sv5tRegulationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const Sv5tRegulationModal: React.FC<Sv5tRegulationModalProps> = ({
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
              Quy định xét chọn Sinh viên 5 tốt
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
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-blue-900 dark:text-blue-200 text-xs">
            Căn cứ Quyết định số 17/QĐ-HSV ngày 04/3/2026 của Ban Chấp hành Hội Sinh viên VN Đại học Cần Thơ về tiêu chuẩn xét chọn danh hiệu &quot;Sinh viên 5 tốt&quot;.
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">1. Thời gian nộp hồ sơ tự đánh giá</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Thời gian: Từ ngày 01/09 đến 20/09 hằng năm. Sinh viên tự rà soát hoạt động, đối chiếu và tải minh chứng tương ứng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">2. Xét chọn cấp Khoa / Cơ sở</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Thời gian: Từ ngày 21/09 đến 30/09. Hội đồng xét duyệt cấp cơ sở thẩm định và công nhận danh hiệu cấp Khoa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">3. Xét duyệt cấp Đại học Cần Thơ</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Thời gian: Tháng 10 hằng năm. Để được xét chọn cấp ĐHCT, sinh viên bắt buộc phải đạt danh hiệu cấp Khoa/cơ sở trước đó.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">4. Công bố kết quả chính thức</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Lễ tuyên dương và trao giấy chứng nhận diễn ra vào dịp Ngày truyền thống Học sinh - Sinh viên (09/01).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs md:text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
