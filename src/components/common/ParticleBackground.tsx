import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Container, Engine, ISourceOptions } from '@tsparticles/engine'

interface ParticleBackgroundProps {
  className?: string
  interactive?: boolean
}

// Bảng màu chính thức lấy trực tiếp từ Logo CTU Event (src/assets/logo.svg)
const LOGO_COLORS = [
  '#1F5CA9', // Xanh Dương CTU (Màu chữ "CTU" & viền biểu tượng hình thoi trong logo)
  '#00AFF0', // Xanh Da Trời Sáng (Màu chữ "Event" & hoa văn sáng trong logo)
  '#1B4B8A', // Xanh CTU đậm nhận diện chính
  '#0284C7', // Xanh biển trung tính chuyển tiếp
  '#38BDF8', // Xanh Sky Blue ánh ngọc
  '#60A5FA', // Xanh lam dịu mắt
]

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className = 'absolute inset-0 pointer-events-auto z-0',
  interactive = true,
}) => {
  const containerRef = useRef<Container | null>(null)
  const isMouseDownRef = useRef(false)
  const lastSpawnPosRef = useRef<{ x: number; y: number } | null>(null)

  const initEngine = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const handleParticlesLoaded = useCallback((container?: Container) => {
    if (container) {
      containerRef.current = container
    }
  }, [])

  // Khi nhấn chuột và di chuyển (click & drag trail): sinh hạt mới chuẩn xác ngay tại vị trí con trỏ chuột
  useEffect(() => {
    if (!interactive) return

    const getExactCanvasPosition = (clientX: number, clientY: number) => {
      const container = containerRef.current as any
      if (!container) return { x: clientX, y: clientY }

      // 1. Ưu tiên lấy tọa độ nội bộ canvas mà tsParticles đã tính toán cho chuột
      const mousePos = container.interactionManager?.interactivityData?.mouse?.position
      if (mousePos && typeof mousePos.x === 'number' && typeof mousePos.y === 'number') {
        return { x: mousePos.x, y: mousePos.y }
      }

      // 2. Tính toán quy đổi từ tọa độ Viewport sang tọa độ Retina Canvas
      const canvasEl = container.canvas?.element || container.canvas?.domElement
      const pxRatio = container.retina?.pixelRatio || window.devicePixelRatio || 1
      if (canvasEl && typeof canvasEl.getBoundingClientRect === 'function') {
        const rect = canvasEl.getBoundingClientRect()
        return {
          x: (clientX - rect.left) * pxRatio,
          y: (clientY - rect.top) * pxRatio,
        }
      }

      return {
        x: clientX * pxRatio,
        y: clientY * pxRatio,
      }
    }

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT'

      // Ngăn browser quét khối văn bản khi click kéo chuột ở background
      if (!isInput && e.cancelable && e.type === 'mousedown') {
        e.preventDefault()
      }

      isMouseDownRef.current = true

      const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX
      const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY

      if (clientX !== undefined && clientY !== undefined && containerRef.current) {
        lastSpawnPosRef.current = { x: clientX, y: clientY }
        const spawnPos = getExactCanvasPosition(clientX, clientY)
        containerRef.current.particles.push(1, spawnPos)
      }
    }

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isMouseDownRef.current || !containerRef.current) return

      const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX
      const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY

      if (clientX === undefined || clientY === undefined) return

      const last = lastSpawnPosRef.current
      if (!last) {
        lastSpawnPosRef.current = { x: clientX, y: clientY }
        const spawnPos = getExactCanvasPosition(clientX, clientY)
        containerRef.current.particles.push(1, spawnPos)
        return
      }

      // Giãn cách 25px giữa các hạt sinh ra để vệt rơi đều đặn, bám sát con trỏ chuột
      const dist = Math.hypot(clientX - last.x, clientY - last.y)
      if (dist >= 25) {
        lastSpawnPosRef.current = { x: clientX, y: clientY }
        const spawnPos = getExactCanvasPosition(clientX, clientY)
        containerRef.current.particles.push(1, spawnPos)
      }
    }

    const handleMouseUp = () => {
      isMouseDownRef.current = false
      lastSpawnPosRef.current = null
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchstart', handleMouseDown, { passive: true })
    window.addEventListener('touchmove', handleMouseMove, { passive: true })
    window.addEventListener('touchend', handleMouseUp, { passive: true })
    window.addEventListener('blur', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchstart', handleMouseDown)
      window.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('touchend', handleMouseUp)
      window.removeEventListener('blur', handleMouseUp)
    }
  }, [interactive])

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 120,
      fullScreen: { enable: false }, // Gói gọn trong container tuyệt đối
      interactivity: {
        events: {
          onHover: {
            enable: interactive,
            // Khi hover: làm sáng nhẹ hạt (bubble), hoàn toàn không hiện sợi dây liên kết
            mode: 'bubble',
          },
          onClick: {
            enable: false, // Tắt push ở click đơn để nhường cho vệt vẽ trail khi click & drag
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          bubble: {
            distance: 130,
            size: 10,
            duration: 0.3,
            opacity: 0.7,
          },
        },
      },
      particles: {
        // Khai báo paint chuẩn cho tsParticles v4 với độ mờ dịu nhẹ (opacity 0.45) tạo hiệu ứng pha lê mờ ảo
        paint: LOGO_COLORS.map((c) => ({
          color: { value: c },
          fill: { enable: true, opacity: 0.45 },
        })),
        // Dự phòng tương thích ngược
        color: {
          value: LOGO_COLORS,
        },
        // Hình thoi chuẩn nhận diện logo CTU (Square xoay 45 độ tạo nên 4 đỉnh kim cương)
        shape: {
          type: 'square',
        },
        rotate: {
          value: 45,
          direction: 'random',
          animation: {
            enable: true,
            speed: 5, // Tự xoay lơ lửng lấp lánh như tinh thể kim cương
            sync: false,
          },
        },
        // Mặc định tắt liên kết mạng nhện giữa các hạt để không gian thoáng đãng, tinh tế
        links: {
          enable: false,
          distance: 140,
          opacity: 0.35,
          width: 1.2,
        },
        move: {
          direction: 'none',
          enable: true,
          outModes: {
            default: 'bounce',
          },
          random: true,
          speed: 0.8, // Chuyển động êm ái, trôi bồng bềnh
          straight: false,
        },
        number: {
          density: {
            enable: true,
            width: 900,
            height: 900,
          },
          value: 26, // Giảm số lượng hạt mặc định xuống ít và tinh gọn hơn
          limit: {
            value: 65, // Giới hạn tối đa cả khi sinh hạt vệt kéo chuột, tránh quá tải màn hình
            mode: 'delete',
          },
        },
        // Độ mờ hạt nhẹ nhàng, dịu mắt (35% - 55%) thanh thoát và mềm mại
        opacity: {
          value: { min: 0.35, max: 0.55 },
        },
        size: {
          value: { min: 4.5, max: 9 }, // Kích thước hình thoi vừa vặn, sắc nét
        },
      },
      detectRetina: true,
    }),
    [interactive]
  )

  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="auth-tsparticles"
        className={className}
        options={options}
        particlesLoaded={handleParticlesLoaded}
      />
    </ParticlesProvider>
  )
}
