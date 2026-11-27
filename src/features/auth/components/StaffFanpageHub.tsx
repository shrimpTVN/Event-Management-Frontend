import { Building2 as FanpageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Plus,
  Check,
  X,
  CheckCircle2,
  Mail,
  Building2,
  LogOut,
  ShieldCheck,
  Shield,
  User,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared'
import { profileService } from '@/features/profile'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

function getFanpageRoleBadge(role?: string) {
  const normalized = (role || 'ADMIN').toUpperCase()
  if (
    normalized.includes('ADMIN') ||
    normalized.includes('QUẢN TRỊ') ||
    normalized.includes('OWNER') ||
    normalized.includes('TRƯỞNG')
  ) {
    return {
      label: 'Quản trị viên',
      className:
        'bg-blue-50 text-[#1B4B8A] border-blue-200/90 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
      icon: ShieldCheck,
    }
  }
  if (
    normalized.includes('MOD') ||
    normalized.includes('BIÊN TẬP') ||
    normalized.includes('EDITOR') ||
    normalized.includes('PHÓ')
  ) {
    return {
      label: 'Biên tập viên',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
      icon: Shield,
    }
  }
  return {
    label: role && role !== 'MEMBER' ? role : 'Thành viên',
    className:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    icon: User,
  }
}

interface FanpageInvitation {
  id: string
  name: string
  inviter: string
  role?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  avatarUrl?: string
}

interface JoinedFanpage {
  id: string
  name: string
  orgName?: string
  role?: string
  followersCount?: number
  eventsCount?: number
  avatarUrl?: string
}

export const StaffFanpageHub: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, clearAuth } = useAuthStore()
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // Fetch real profile from backend to ensure avatar is loaded
  const { data: staffProfile } = useQuery({
    queryKey: ['profile', 'me', user?.id, 'staff'],
    queryFn: () => profileService.getMyStaffProfile(),
    enabled: Boolean(user?.email && !user?.avatarUrl),
  })

  React.useEffect(() => {
    if (staffProfile?.avatarUrl && staffProfile.avatarUrl !== user?.avatarUrl) {
      useAuthStore.getState().updateUser({
        avatarUrl: staffProfile.avatarUrl,
        name: staffProfile.fullName || user?.name,
      })
    }
  }, [staffProfile, user?.avatarUrl, user?.name])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch {
      // Proceed even if network request fails
    } finally {
      queryClient.clear()
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  const {
    data: invitations = [],
    isError: isInvitationsError,
    refetch: refetchInvitations,
  } = useQuery<FanpageInvitation[]>({
    queryKey: ['staff-fanpage-invitations'],
    queryFn: async () => {
      const res: any = await apiClient.get('/fanpages/fanpage-admin/invitations')
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((inv: any) => ({
        ...inv,
        avatarUrl: inv.avatarUrl,
      }))
    },
  })

  const {
    data: apiFanpages = [],
    isLoading: isLoadingFanpages,
    isError: isFanpagesError,
    refetch: refetchFanpages,
  } = useQuery<JoinedFanpage[]>({
    queryKey: ['staff-my-fanpages', user?.id],
    queryFn: async () => {
      let res: any
      try {
        res = await apiClient.get('/fanpages/my-fanpages')
      } catch (primaryErr: any) {
        const status = primaryErr?.response?.status
        if (status === 404 || status === 405) {
          res = await apiClient.get('/fanpages/fanpage-admin/my-fanpages')
        } else {
          throw primaryErr
        }
      }
      const list = Array.isArray(res) ? res : res?.data || []
      return list.map((fp: any) => {
        const id = String(fp.fanpageId ?? fp.id ?? '')
        const name = fp.fanpageName ?? fp.name ?? ''
        const orgName = fp.fanpageOrgName ?? fp.orgName ?? fp.parentOrg ?? ''
        const avatarUrl = fp.fanpageAvatarUrl ?? fp.avatarUrl ?? ''
        const role = fp.role ?? fp.memberRole ?? (fp.isAdmin === false ? 'MEMBER' : 'ADMIN')

        return {
          id,
          name,
          orgName,
          role,
          followersCount: fp.followersCount || fp.followerCount || 0,
          eventsCount: fp.eventsCount || fp.eventCount || 0,
          avatarUrl,
        }
      })
    },
  })

  const fanpagesList = apiFanpages

  const respondMutation = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      apiClient.patch(`/fanpages/fanpage-admin/invitations/${id}`, {
        status: accept ? 'ACCEPTED' : 'REJECTED',
      }),
    onSuccess: (_, { id, accept }) => {
      queryClient.setQueryData<FanpageInvitation[]>(['staff-fanpage-invitations'], (old = []) =>
        old.map((inv) =>
          inv.id === id ? { ...inv, status: accept ? 'ACCEPTED' : 'REJECTED' } : inv
        )
      )
      const target = invitations.find((i) => i.id === id)
      if (target) {
        setActionNotice(
          accept
            ? `Đã chấp nhận lời mời tham gia "${target.name}"`
            : `Đã từ chối lời mời "${target.name}"`
        )
        setTimeout(() => setActionNotice(null), 4000)
      }
    },
  })

  const handleRespondInvitation = (id: string, accept: boolean) => {
    respondMutation.mutate({ id, accept })
  }

  // Filter only pending invitations for display
  const pendingInvitations = invitations.filter((i) => i.status === 'PENDING')

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1040px] mx-auto w-full flex flex-col gap-4">
        {actionNotice && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Top bar with user info & quick logout */}
        {user && (
          <div className="flex items-center justify-between gap-3 px-1 text-xs text-[#6B7280] dark:text-muted-foreground">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Avatar'}
                  className="w-7 h-7 shrink-0 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-7 h-7 shrink-0 rounded-full bg-[#1B4B8A] text-white flex items-center justify-center font-bold text-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-foreground truncate">
                {user.name || user.email}
              </span>
              {user.email && (
                <span className="hidden sm:inline text-muted-foreground">({user.email})</span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        )}

        {/* Main Content Card */}
        <div className="w-full bg-white dark:bg-card rounded-xl border border-[#E5E7EB] dark:border-border p-5 sm:p-8 shadow-sm flex flex-col gap-6 text-left">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F3F4F6] dark:border-border">
            <div>
              <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
                Chọn fanpage quản lý
              </h1>
              <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-1.5 leading-relaxed">
                Chọn fanpage để quản lý sự kiện của đơn vị bạn.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <Link
                to="/register/fanpage"
                className="px-4 h-10 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-primary font-semibold text-sm transition-colors flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Đăng ký fanpage mới</span>
              </Link>
            </div>
          </div>

          {/* LỜI MỜI THAM GIA (Chỉ hiển thị khi có lời mời đang chờ - PENDING) */}
          {isInvitationsError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 flex items-center justify-between gap-3 text-xs text-destructive"
            >
              <span>Không tải được danh sách lời mời tham gia fanpage.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetchInvitations()}
                className="h-7 px-2.5 text-xs bg-background text-foreground"
              >
                Thử lại
              </Button>
            </div>
          )}

          {pendingInvitations.length > 0 && (
            <div className="rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-transparent dark:from-amber-950/25 dark:via-orange-950/15 dark:to-transparent p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Lời mời tham gia ({pendingInvitations.length})
                </h3>
              </div>

              <div className="flex flex-col gap-2.5">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-white dark:bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {inv.avatarUrl ? (
                        <img
                          src={inv.avatarUrl}
                          alt={inv.name}
                          className="h-11 w-11 rounded-full object-cover border border-[#E5E7EB] dark:border-border shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground font-k2d font-bold text-xs flex items-center justify-center shrink-0">
                          <FanpageIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {inv.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Người mời:{' '}
                          <span className="font-medium text-foreground">{inv.inviter}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        type="button"
                        disabled={respondMutation.isPending}
                        onClick={() => handleRespondInvitation(inv.id, true)}
                        className="h-8 px-3.5 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] active:scale-95 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>Chấp nhận</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={respondMutation.isPending}
                        onClick={() => handleRespondInvitation(inv.id, false)}
                        className="h-8 px-3 rounded-lg border border-[#D1D5DB] dark:border-border text-[#4B5563] dark:text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted active:scale-95 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5 shrink-0" />
                        <span>Từ chối</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANH SÁCH FANPAGE ĐANG QUẢN TRỊ (Dạng danh sách hàng ngang thanh lịch) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#0B1626] dark:text-foreground">
                Fanpage của bạn ({fanpagesList.length})
              </h2>
            </div>

            {isLoadingFanpages ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Đang tải danh sách fanpage...
              </div>
            ) : isFanpagesError ? (
              <div
                role="alert"
                className="p-8 sm:p-10 rounded-2xl border border-destructive/25 bg-destructive/5 text-center flex flex-col items-center justify-center gap-3"
              >
                <h3 className="font-k2d font-bold text-base sm:text-lg text-destructive">
                  Không tải được danh sách fanpage
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                  Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại để kiểm tra quyền quản trị
                  fanpage của bạn.
                </p>
                <Button
                  type="button"
                  onClick={() => void refetchFanpages()}
                  className="mt-1 px-4 py-2 text-xs font-semibold"
                >
                  Thử lại
                </Button>
              </div>
            ) : fanpagesList.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-[#D1D5DB] dark:border-border bg-[#F9FAFB]/70 dark:bg-card/50 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1B4B8A] dark:text-primary flex items-center justify-center shadow-2xs">
                  <Building2 className="h-8 w-8 stroke-[1.75]" />
                </div>
                <div className="max-w-md flex flex-col gap-1.5">
                  <h3 className="font-k2d font-bold text-lg text-foreground">
                    Hiện tại bạn chưa có fanpage nào
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Bạn hiện chưa tham gia hoặc sở hữu fanpage nào. Vui lòng đăng ký để tạo fanpage
                    và bắt đầu tổ chức sự kiện nhé!
                  </p>
                </div>
                <Link
                  to="/register/fanpage"
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Đăng ký tạo fanpage ngay</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {fanpagesList.map((fp) => {
                  const roleBadge = getFanpageRoleBadge(fp.role)
                  const RoleIcon = roleBadge.icon

                  return (
                    <Link
                      key={fp.id}
                      to={{
                        pathname:
                          getFanpageRoleBadge(fp.role).label === 'Quản trị viên'
                            ? '/fanpage/admin'
                            : '/fanpage/workspace',
                        search: `?fanpageId=${encodeURIComponent(String(fp.id))}`,
                      }}
                      state={{ fanpageId: fp.id }}
                      aria-label={`Vào quản lý ${fp.name}`}
                      className="group relative p-4 sm:p-5 rounded-xl border border-border bg-white dark:bg-card hover:border-primary hover:bg-primary/5 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <div className="flex w-full items-center gap-4 min-w-0 flex-1">
                        {fp.avatarUrl ? (
                          <img
                            src={fp.avatarUrl}
                            alt={fp.name}
                            className="h-12 w-12 rounded-full object-cover border border-[#E5E7EB] dark:border-border shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-slate-800 text-white font-k2d font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#1B4B8A] transition-colors">
                            <FanpageIcon className="h-6 w-6" aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0 flex flex-col gap-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-[#1B4B8A] dark:group-hover:text-primary transition-colors break-words">
                              {fp.name}
                            </h4>
                            <span
                              data-testid={`role-badge-${fp.id}`}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${roleBadge.className}`}
                            >
                              <RoleIcon className="h-3 w-3 shrink-0" />
                              <span>{roleBadge.label}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {fp.orgName && <span className="truncate">{fp.orgName}</span>}
                            {typeof fp.followersCount === 'number' && fp.followersCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{fp.followersCount.toLocaleString()} người theo dõi</span>
                              </>
                            )}
                            {typeof fp.eventsCount === 'number' && fp.eventsCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{fp.eventsCount} sự kiện</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="self-end sm:self-center shrink-0">
                        <span className="inline-flex items-center gap-2 px-2 py-2 rounded-lg text-primary text-sm font-semibold">
                          <span>Vào quản lý</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTU Portal Footer */}
      <footer className="mt-8 flex flex-col gap-2 text-center text-xs leading-relaxed text-muted-foreground">
        <p className="font-medium">Đại học Cần Thơ (CTU) • Hệ thống quản lý sự kiện</p>
        <p>
          Hỗ trợ:{' '}
          <a href="tel:02923832663" className="hover:text-primary hover:underline">
            (0292) 3832 663
          </a>
          {' · '}
          <a href="mailto:social-admin@ctu.edu.vn" className="hover:text-primary hover:underline">
            social-admin@ctu.edu.vn
          </a>
        </p>
      </footer>
    </div>
  )
}
