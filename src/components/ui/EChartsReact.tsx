import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface EChartsReactProps {
  option: echarts.EChartsOption
  style?: React.CSSProperties
  className?: string
  loading?: boolean
}

export const EChartsReact: React.FC<EChartsReactProps> = ({
  option,
  style = { height: '320px', width: '100%' },
  className = '',
  loading = false,
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    const chart = chartInstance.current

    if (loading) {
      chart.showLoading({
        text: 'Đang tải dữ liệu...',
        color: '#1B4B8A',
        textColor: '#6B7280',
        maskColor: 'rgba(255, 255, 255, 0.6)',
      })
    } else {
      chart.hideLoading()
      chart.setOption(option, true)
    }

    const handleResize = () => {
      chart.resize()
    }

    // Canvas labels need repainting after the web font finishes loading.
    let mounted = true
    void document.fonts?.ready.then(() => {
      if (mounted && !chart.isDisposed()) {
        chart.setOption(option, true)
        chart.resize()
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    resizeObserver.observe(chartRef.current)
    window.addEventListener('resize', handleResize)

    return () => {
      mounted = false
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [option, loading])

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [])

  return <div ref={chartRef} style={style} className={className} />
}
