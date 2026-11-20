import { create } from 'zustand'

export interface PageTransitionState {
  isOpen: boolean
  isFadingOut: boolean
  title: string
  subtitle: string
  triggerTransition: (options?: { title?: string; subtitle?: string; duration?: number }) => void
  closeTransition: () => void
}

let activeTransitionTimer: ReturnType<typeof setTimeout> | null = null
let activeFadeTimer: ReturnType<typeof setTimeout> | null = null

export const usePageTransitionStore = create<PageTransitionState>((set) => ({
  isOpen: false,
  isFadingOut: false,
  title: 'Đang tải...',
  subtitle: 'Hệ thống Quản lý Sự kiện CTU Event',

  triggerTransition: (options) => {
    if (activeTransitionTimer) clearTimeout(activeTransitionTimer)
    if (activeFadeTimer) clearTimeout(activeFadeTimer)

    const title = options?.title || 'Đang chuẩn bị trang...'
    const subtitle = options?.subtitle || 'Hệ thống Quản lý Sự kiện CTU Event'
    const duration = options?.duration ?? 450

    set({ isOpen: true, isFadingOut: false, title, subtitle })

    activeTransitionTimer = setTimeout(() => {
      set({ isFadingOut: true })
      activeFadeTimer = setTimeout(() => {
        set({ isOpen: false, isFadingOut: false })
      }, 300)
    }, duration)
  },

  closeTransition: () => {
    if (activeTransitionTimer) clearTimeout(activeTransitionTimer)
    if (activeFadeTimer) clearTimeout(activeFadeTimer)

    set({ isFadingOut: true })
    activeFadeTimer = setTimeout(() => {
      set({ isOpen: false, isFadingOut: false })
    }, 300)
  },
}))

/**
 * Tiện ích kích hoạt màn hình chuyển cảnh toàn màn hình
 */
export const triggerMajorTransition = (title?: string, subtitle?: string, duration?: number) => {
  usePageTransitionStore.getState().triggerTransition({ title, subtitle, duration })
}
