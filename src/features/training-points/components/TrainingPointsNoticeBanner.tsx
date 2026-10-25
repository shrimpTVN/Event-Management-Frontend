import React from 'react'
import { Info } from 'lucide-react'

export const TrainingPointsNoticeBanner: React.FC = () => {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-md bg-[#FFFEEB] dark:bg-amber-950/40 border border-[#A89F1D] dark:border-amber-700/60 shadow-2xs"
    >
      <Info className="h-5 w-5 text-[#7D7716] dark:text-amber-400 shrink-0" />
      <p className="text-xs font-medium text-[#7D7716] dark:text-amber-300 leading-snug">
        <span className="font-semibold">Lưu ý:</span> Bảng điểm chỉ mang tính tham khảo,{' '}
        <span className="font-semibold uppercase">không phải kết quả chính thức</span>. Vui lòng truy cập trang HTQL của trường để xem kết quả chính thức.
      </p>
    </div>
  )
}
