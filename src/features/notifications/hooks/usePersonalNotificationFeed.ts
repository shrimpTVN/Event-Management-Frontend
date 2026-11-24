import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { fanpageService } from '@/features/fanpage/services/fanpageService'
import { useUserFanpagesStore } from '@/features/fanpage/store/userFanpagesStore'
import { notificationService } from '../services/notificationService'
import { useNotificationActions, useUnreadNotificationCount } from './useNotifications'
import { buildNotificationFeed, type FanpageInvitation } from '../utils/notificationFeed'
import { matchesPageSearch, useMobilePageSearch } from '@/shared/components/layout/MobileSubpageHeader'

export function usePersonalNotificationFeed(enabled = true) {
  const { query: searchQuery } = useMobilePageSearch()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const addFanpage = useUserFanpagesStore((s) => s.addFanpage)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL')
  const [feedback, setFeedback] = useState('')
  const busyInvitation = useRef(false)
  const invitationsQuery = useQuery<FanpageInvitation[]>({
    queryKey: ['my-fanpage-member-invitations', user?.email],
    queryFn: () => fanpageService.getMyInvitations(),
    enabled: enabled && Boolean(user), staleTime: 15_000,
  })
  const feedQuery = useInfiniteQuery({
    queryKey: ['notifications', 'personal-feed', user?.id, filter],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => notificationService.getMyNotifications(pageParam, 30, filter === 'UNREAD' ? 'UNREAD' : undefined),
    getNextPageParam: (page) => page.last || page.number + 1 >= page.totalPages ? undefined : page.number + 1,
    enabled: enabled && Boolean(user), staleTime: 30_000,
  })
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const actions = useNotificationActions()
  const invitations = invitationsQuery.data ?? []
  useEffect(() => {
    for (const invitation of invitations) {
      if (invitation.status === 'ACCEPTED') addFanpage({ id: String(invitation.fanpageId),
        name: invitation.fanpageName || 'Fanpage', role: 'Cộng tác viên', avatarUrl: invitation.fanpageAvatarUrl })
    }
  }, [invitationsQuery.data, addFanpage])

  const invitationMutation = useMutation({
    mutationFn: async ({ invitation, accept }: { invitation: FanpageInvitation; accept: boolean }) => {
      if (accept) await fanpageService.acceptInvitation(invitation.id)
      else await fanpageService.declineInvitation(invitation.id)
    },
    onSuccess: (_, { invitation, accept }) => {
      queryClient.setQueryData<FanpageInvitation[]>(['my-fanpage-member-invitations', user?.email],
        (previous) => previous?.map((i) => String(i.id) === String(invitation.id) ? { ...i, status: accept ? 'ACCEPTED' : 'REJECTED' } : i))
      if (accept) addFanpage({ id: String(invitation.fanpageId), name: invitation.fanpageName || 'Fanpage',
        role: 'Cộng tác viên', avatarUrl: invitation.fanpageAvatarUrl })
      void queryClient.invalidateQueries({ queryKey: ['my-fanpage-member-invitations'] })
      void queryClient.invalidateQueries({ queryKey: ['my-participating-fanpages'] })
      setFeedback(accept ? 'Đã chấp nhận lời mời.' : 'Đã từ chối lời mời.')
    },
    onError: () => setFeedback('Không thể xử lý lời mời. Vui lòng thử lại.'),
    onSettled: () => { busyInvitation.current = false },
  })
  const respond = (invitation: FanpageInvitation, accept: boolean, onAccepted?: (name: string) => void) => {
    if (busyInvitation.current) return
    busyInvitation.current = true
    setFeedback('')
    invitationMutation.mutate({ invitation, accept }, {
      onSuccess: () => { if (accept) onAccepted?.(invitation.fanpageName || 'Fanpage') },
    })
  }
  const entries = buildNotificationFeed(feedQuery.data?.pages.flatMap((p) => p.content) ?? [], invitations)
    .filter((entry) => filter === 'ALL' || entry.unread)
    .filter((entry) => matchesPageSearch(searchQuery, entry.notification?.title, entry.notification?.message,
      entry.invitation?.fanpageName, entry.invitation?.inviterName, entry.invitation?.createdByName))
  return { ...actions, entries, filter, setFilter, unreadCount, feedback, respond, searchQuery,
    pendingInvitation: invitationMutation.isPending ? invitationMutation.variables?.invitation.id : undefined,
    isLoading: feedQuery.isLoading || invitationsQuery.isLoading,
    isError: feedQuery.isError || invitationsQuery.isError,
    retry: () => { void feedQuery.refetch(); void invitationsQuery.refetch() },
    hasNextPage: feedQuery.hasNextPage, isFetchingNextPage: feedQuery.isFetchingNextPage,
    fetchNextPage: () => { void feedQuery.fetchNextPage() },
  }
}
