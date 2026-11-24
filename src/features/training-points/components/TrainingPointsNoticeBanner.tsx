import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'

export const TrainingPointsNoticeBanner: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [isExpanded, setIsExpanded] = useState(false)

  if (isMobile) {
    return (
      <div
        role="note"
        className="flex flex-col gap-1.5 px-3.5 py-2.5 rounded-lg bg-muted/40 border border-border shadow-2xs text-xs"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Info aria-hidden="true" className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex min-w-0 flex-col gap-0.5 leading-relaxed">
              <strong className="font-semibold">Kết quả tham khảo</strong>
              <span className="font-normal text-muted-foreground">Không phải kết quả chính thức</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:underline font-medium shrink-0 flex items-center gap-0.5 h-11 px-1 cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>

        {isExpanded && (
          <p className="text-muted-foreground leading-relaxed pl-6 pt-1 border-t border-border/60">
            Bảng điểm chỉ mang tính tham khảo để sinh viên theo dõi. Vui lòng truy cập trang HTQL của trường để xem kết quả chính thức.
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      role="note"
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-muted/40 border border-border shadow-2xs"
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
