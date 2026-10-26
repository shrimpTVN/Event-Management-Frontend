import React from 'react'
import { Info } from 'lucide-react'

export const Sv5tNoticeBanner: React.FC = () => {
  return (
    <div className="w-full flex items-start sm:items-center gap-2.5 px-3.5 py-2.5 bg-[#FFFEEB] dark:bg-amber-950/30 border border-[#A89F1D] dark:border-amber-700/60 rounded-md text-xs text-[#7D7716] dark:text-amber-300 shadow-2xs leading-relaxed">
      <Info className="h-4 w-4 shrink-0 text-[#7D7716] dark:text-amber-400 mt-0.5 sm:mt-0" />
      <span>
        <strong>Lưu ý:</strong> Bảng tiêu chuẩn chỉ mang tính chất lưu lại các hoạt động và để sinh viên tự đánh giá,{' '}
        <strong>KHÔNG PHẢI KẾT QUẢ CHÍNH THỨC</strong>. Vui lòng đợi kết quả từ đơn vị xét duyệt.
      </span>
    </div>
  )
}
