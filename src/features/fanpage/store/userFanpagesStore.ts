import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserFanpageItem {
  id: string
  name: string
  code?: string
  role?: string
  avatarUrl?: string
  isVerified?: boolean
}

export interface StudentNotificationItem {
  id: string
  type: 'FANPAGE_INVITATION' | 'SYSTEM'
  inviterName: string
  inviterAvatar?: string
  fanpageName: string
  fanpageId: string
  message: string
  timeAgo: string
  isUnread: boolean
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

interface UserFanpagesState {
  myFanpages: UserFanpageItem[]
  activeFanpageId: string | null
  notifications: StudentNotificationItem[]
  setMyFanpages: (fanpages: UserFanpageItem[]) => void
  addFanpage: (fanpage: UserFanpageItem) => void
  removeFanpage: (fanpageId: string) => void
  setActiveFanpageId: (id: string | null) => void
  setNotifications: (notifications: StudentNotificationItem[]) => void
  acceptInvitation: (id: string) => void
  rejectInvitation: (id: string) => void
  markAllAsRead: () => void
}

export const useUserFanpagesStore = create<UserFanpagesState>()(
  persist(
    (set) => ({
      myFanpages: [],
      activeFanpageId: null,
      notifications: [],

      setMyFanpages: (fanpages) => set({ myFanpages: fanpages }),

      addFanpage: (fanpage) =>
        set((state) => {
          if (state.myFanpages.some((f) => f.id === fanpage.id)) {
            return state
          }
          return { myFanpages: [...state.myFanpages, fanpage] }
        }),

      removeFanpage: (fanpageId) =>
        set((state) => ({
          myFanpages: state.myFanpages.filter((f) => String(f.id) !== String(fanpageId)),
        })),

      setActiveFanpageId: (id) => set({ activeFanpageId: id }),

      setNotifications: (notifications) => set({ notifications }),

      acceptInvitation: (id) =>
        set((state) => {
          const notif = state.notifications.find((n) => n.id === id)
          if (!notif) return state

          const updatedNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'ACCEPTED' as const, isUnread: false } : n
          )

          const newFanpage: UserFanpageItem = {
            id: notif.fanpageId,
            name: notif.fanpageName,
            code: notif.fanpageName.slice(0, 3).toUpperCase(),
            role: 'Cộng tác viên',
          }

          const exists = state.myFanpages.some((f) => f.id === newFanpage.id)
          const updatedFanpages = exists ? state.myFanpages : [...state.myFanpages, newFanpage]

          return {
            notifications: updatedNotifications,
            myFanpages: updatedFanpages,
          }
        }),

      rejectInvitation: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'REJECTED' as const, isUnread: false } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isUnread: false })),
        })),
    }),
    {
      name: 'ctu-user-fanpages-store',
    }
  )
)
