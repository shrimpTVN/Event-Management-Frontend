import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Crown } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import type { FanpageSummary, FanpageActivityStats } from '../types/fanpageAdmin.types'
import { fanpageAdminService } from '../services/fanpageAdminService'
import { FanpageActivityStatsCard } from './FanpageActivityStatsCard'

interface Props {
  currentFanpage: FanpageSummary
  stats: FanpageActivityStats
  statsLoading?: boolean
  onRetryStats?: () => void
  onManageMembersClick?: () => void
}
export const FanpageRightSidebar = ({
  currentFanpage,
  stats,
  statsLoading,
  onRetryStats,
  onManageMembersClick,
}: Props) => {
  const { user } = useAuthStore()
  const {
    data: members = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['fanpage-members', currentFanpage.id],
    queryFn: () => fanpageAdminService.getFanpageMembers(currentFanpage.id),
    enabled: Boolean(currentFanpage.id),
  })
  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <section className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-k2d text-sm font-semibold text-foreground">Thành viên fanpage</h3>
          {!isLoading && !isError && (
            <span className="text-xs tabular-nums text-muted-foreground">{members.length}</span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : isError ? (
          <div className="flex flex-col items-start gap-1" role="status">
            <p className="text-xs text-muted-foreground">Chưa tải được thành viên.</p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        ) : members.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có thành viên.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {members.slice(0, 5).map((member) => {
              const name = member.fullName || member.email.split('@')[0] || 'Thành viên'
              const isCurrentUser = Boolean(
                (user?.id && member.userId && String(member.userId) === String(user.id)) ||
                (user?.email &&
                  member.email &&
                  user.email.toLowerCase() === member.email.toLowerCase())
              )
              return (
                <li key={member.id} className="flex min-w-0 items-center gap-2.5">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {member.avatarText || name.slice(0, 2)}
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <Tooltip content={name}>
                        <span className="min-w-0 truncate text-xs font-medium text-foreground">
                          {name}
                        </span>
                      </Tooltip>
                      {isCurrentUser && (
                        <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                          Bạn
                        </span>
                      )}
                    </div>
                    <p
                      className={
                        member.role === 'ADMIN'
                          ? 'flex items-center gap-1 text-xs font-semibold text-primary'
                          : 'text-xs text-muted-foreground'
                      }
                    >
                      {member.role === 'ADMIN' && (
                        <Crown aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {member.role === 'ADMIN' ? 'Quản trị viên' : 'Cộng tác viên'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {onManageMembersClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageMembersClick}
            className="h-10 w-full justify-between border-t border-border py-2 text-muted-foreground font-medium"
          >
            Xem tất cả thành viên
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </section>
      <FanpageActivityStatsCard stats={stats} isLoading={statsLoading} onRetry={onRetryStats} />
    </div>
  )
}
