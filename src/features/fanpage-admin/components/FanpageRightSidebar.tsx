import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, ShieldCheck, ChevronRight, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import type { FanpageSummary, FanpageActivityStats, FanpageMember } from '../types/fanpageAdmin.types'
import { fanpageAdminService, MOCK_FANPAGE_MEMBERS } from '../services/fanpageAdminService'
import { FanpageActivityStatsCard } from './FanpageActivityStatsCard'

interface FanpageRightSidebarProps {
  currentFanpage: FanpageSummary
  stats: FanpageActivityStats
  onManageMembersClick?: () => void
}

export const FanpageRightSidebar: React.FC<FanpageRightSidebarProps> = ({
  currentFanpage,
  stats,
  onManageMembersClick,
}) => {
  const targetFpId = currentFanpage.id || '1'
  const { user } = useAuthStore()

  // Fetch real members of this fanpage
  const { data: serverMembers = [] } = useQuery<FanpageMember[]>({
    queryKey: ['fanpage-members', targetFpId],
    queryFn: () => fanpageAdminService.getFanpageMembers(targetFpId),
    enabled: Boolean(targetFpId),
  })

  const members: FanpageMember[] =
    serverMembers.length > 0 ? serverMembers : MOCK_FANPAGE_MEMBERS

  return (
    <div className="w-full flex flex-col gap-3.5 select-none text-left">
      {/* 1. Card Thành viên Ban Quản trị Fanpage */}
      <div className="w-full bg-white dark:bg-card border border-border/60 rounded-xl p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#1B4B8A] dark:text-blue-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-k2d font-bold text-sm text-foreground tracking-tight">
                Thành viên fanpage
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {members.length} thành viên tham gia
              </p>
            </div>
          </div>

          {onManageMembersClick && (
            <button
              type="button"
              onClick={onManageMembersClick}
              title="Quản lý thành viên"
              className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Members List (Compact cards) */}
        <div className="flex flex-col gap-2">
          {members.slice(0, 5).map((member) => {
            const isAdmin = member.role === 'ADMIN'

            // Hiển thị tên thay vì email theo yêu cầu người dùng
            const displayName =
              member.fullName ||
              [(member as any).lastName, (member as any).firstName].filter(Boolean).join(' ') ||
              (member.email ? member.email.split('@')[0] : 'Thành viên')

            // Xác định tài khoản của người dùng hiện tại
            const isCurrentUser = Boolean(
              (user?.id && (String(member.userId) === String(user.id) || String(member.id) === String(user.id))) ||
              (user?.email && member.email && user.email.toLowerCase() === member.email.toLowerCase()) ||
              (!user?.email && member.email === 'organizer@ctu.edu.vn')
            )

            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Left: Avatar + Tên thành viên + Badge vai trò Admin cùng ở trên tên */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {member.avatarText || displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex flex-col justify-center flex-1">
                    <span
                      className="text-xs font-semibold text-foreground truncate"
                      title={displayName}
                    >
                      {displayName}
                    </span>

                    {/* Dòng 2 dưới tên: Chữ Admin nằm riêng bên dưới để không che tên thành viên */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-[#1B4B8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 w-fit">
                          <ShieldCheck className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {member.role === 'COLLABORATOR' ? 'Cộng tác viên' : 'Thành viên'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Xác định bạn là tài khoản nào */}
                {isCurrentUser && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF5FC] text-[#1B4B8A] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 shrink-0 shadow-2xs">
                    Bạn
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* View all button - chỉnh lại màu sắc dịu nhẹ, êm mắt */}
        {onManageMembersClick && (
          <button
            type="button"
            onClick={onManageMembersClick}
            className="w-full mt-1 py-1.5 px-3 rounded-lg bg-slate-50/80 hover:bg-slate-100 dark:bg-muted/30 dark:hover:bg-muted/60 border border-border/50 hover:border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
          >
            <span>Quản lý tất cả thành viên</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* 2. Card Trạng thái hoạt động 7 ngày gần nhất */}
      <FanpageActivityStatsCard stats={stats} />
    </div>
  )
}
