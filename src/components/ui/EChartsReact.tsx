import React, { useEffect, useRef } from 'react'
import { init, use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { AriaComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts, EChartsOption } from 'echarts'

use([
  BarChart,
  PieChart,
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

interface EChartsReactProps {
  option: EChartsOption
  style?: React.CSSProperties
  className?: string
  loading?: boolean
  animateOnView?: boolean
}

export const EChartsReact: React.FC<EChartsReactProps> = ({
  option,
  style = { height: '320px', width: '100%' },
  className = '',
  loading = false,
  animateOnView = false,
}) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!chartInstance.current) {
      chartInstance.current = init(chartRef.current)
    }

    const chart = chartInstance.current
    const element = chartRef.current
    let mounted = true
    let visible = !animateOnView || typeof IntersectionObserver === 'undefined'
    let fontsReady = !document.fonts || document.fonts.status === 'loaded'
    let drawn = false
    let width = element.clientWidth
    let height = element.clientHeight
    const draw = () => {
      if (!mounted || loading || !visible || !fontsReady || drawn || chart.isDisposed()) return
      drawn = true
      chart.hideLoading()
      chart.setOption(
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
          ? { ...option, animation: false }
          : option,
        true
      )
    }

    if (loading) {
      chart.showLoading({
        text: 'Đang tải dữ liệu...',
        color: '#1B4B8A',
        textColor: '#6B7280',
        maskColor: 'rgba(255, 255, 255, 0.6)',
      })
    } else {
      chart.hideLoading()
      draw()
    }

    const handleResize = () => {
      const nextWidth = element.clientWidth
      const nextHeight = element.clientHeight
      // The initial ResizeObserver notification must not finish the entrance animation.
      if (nextWidth === width && nextHeight === height) return
      width = nextWidth
      height = nextHeight
      chart.resize()
    }

    // Wait for the font before drawing, so a second paint cannot interrupt the animation.
    void document.fonts?.ready.then(() => {
      fontsReady = true
      draw()
    })

    const intersectionObserver =
      animateOnView && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return
              visible = true
              draw()
              intersectionObserver?.disconnect()
            },
            { threshold: 0.15 }
          )
        : null
    intersectionObserver?.observe(element)

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    resizeObserver.observe(chartRef.current)
    window.addEventListener('resize', handleResize)

    return () => {
      mounted = false
      intersectionObserver?.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [option, loading, animateOnView])

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
