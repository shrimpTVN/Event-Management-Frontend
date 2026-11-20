import React from 'react'
import { Info } from 'lucide-react'

export const TrainingPointsNoticeBanner: React.FC = () => {
  return (
    <div
      role="note"
      className="flex items-start sm:items-center gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg bg-muted/40 border border-border shadow-2xs"
    >
      <Info aria-hidden="true" className="h-5 w-5 text-muted-foreground shrink-0" />
      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
        <span className="font-semibold">Lưu ý:</span> Bảng điểm chỉ mang tính tham khảo,{' '}
        <span className="font-semibold uppercase">không phải kết quả chính thức</span>. Vui lòng
        truy cập trang HTQL của trường để xem kết quả chính thức.
      </p>
    </div>
  )
}
