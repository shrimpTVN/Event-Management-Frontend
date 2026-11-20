import React, { useEffect, useState } from 'react'

interface DrlScoreGaugeProps {
  score: number
  maxScore?: number
  classification?: string
  size?: number
}

/**
 * DrlScoreGauge — Đồng hồ vòng tròn đo điểm rèn luyện với gradient xanh chuẩn CTU Event.
 * Sử dụng SVG thuần tối ưu GPU (zero-overhead, không tốn 3.7MB của ECharts),
 * hiệu ứng quét xoay mượt mà với cubic-bezier 1.2s, bo tròn đầu mút.
 */
export const DrlScoreGauge: React.FC<DrlScoreGaugeProps> = ({
  score,
  maxScore = 100,
  classification = 'Yếu',
  size = 112,
}) => {
  const [mounted, setMounted] = useState(false)

  // Bán kính và chu vi đường tròn SVG (đường kính 96px trên canvas 112px, độ dày viền 10px)
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.min(Math.max(score, 0), maxScore)
  const targetOffset = circumference - (clampedScore / maxScore) * circumference

  // Kích hoạt animation quét tròn mượt mà khi component mount hoặc điểm số thay đổi
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [score])

  return (
    <div
      className="relative flex items-center justify-center shrink-0 group cursor-default"
      style={{ width: size, height: size }}
      title={`Điểm rèn luyện: ${score}/${maxScore} (${Math.round((clampedScore / maxScore) * 100)}%) - Xếp loại: ${classification}`}
    >
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox="0 0 112 112"
      >
        <defs>
          {/* Gradient màu xanh thương hiệu hệ thống chuẩn CTU Event */}
          <linearGradient id="drlGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#008CCC" />
            <stop offset="100%" stopColor="#1F5CA9" />
          </linearGradient>
        </defs>

        {/* Vòng ray nền xám */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          className="stroke-[#D9D9D9] dark:stroke-slate-700"
          strokeWidth="10"
          fill="none"
        />

        {/* Vòng tiến trình gradient xanh CTU bo tròn mượt mà */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          stroke="url(#drlGaugeGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? targetOffset : circumference}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>

      {/* Điểm số chính giữa giữ nguyên typography chuẩn K2D */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
        <span className="font-k2d font-semibold text-[22.4px] text-black dark:text-foreground leading-none">
          {score}
        </span>
        <span className="text-[10.4px] font-medium text-[#6B7280] dark:text-muted-foreground mt-0.5">
          /{maxScore}
        </span>
      </div>
    </div>
  )
}
