import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ToastNotification {
  id: string
  title: string
  description?: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface UIStoreState {
  theme: ThemeMode
  isSidebarOpen: boolean
  notifications: ToastNotification[]
  setTheme: (theme: ThemeMode) => void
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
  addNotification: (notification: Omit<ToastNotification, 'id'>) => string
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIStoreState>((set) => ({
  theme: 'light',
  isSidebarOpen: false,
  notifications: [],

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }))
    return id
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
