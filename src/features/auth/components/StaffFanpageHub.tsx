import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, Check, X, CheckCircle2, Mail, Building2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared'

interface FanpageInvitation {
  id: string
  code: string
  name: string
  inviter: string
  role?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  avatarUrl?: string
}

interface JoinedFanpage {
  id: string
  code: string
  name: string
  orgName?: string
  followersCount?: number
  eventsCount?: number
  avatarUrl?: string
}

export const StaffFanpageHub: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  const { data: invitations = [] } = useQuery<FanpageInvitation[]>({
    queryKey: ['staff-fanpage-invitations'],
    queryFn: async () => {
      try {
        const res: any = await apiClient.get('/fanpages/fanpage-admin/invitations')
        const list = Array.isArray(res) ? res : res?.data || []
        return list.map((inv: any) => ({
          ...inv,
          avatarUrl: inv.avatarUrl,
        }))
      } catch {
        return []
      }
    },
  })

  const { data: apiFanpages = [] } = useQuery<JoinedFanpage[]>({
    queryKey: ['staff-my-fanpages'],
    queryFn: async () => {
      try {
        const res: any = await apiClient.get('/fanpages/fanpage-admin/my-fanpages')
        const list = Array.isArray(res) ? res : res?.data || []
        return list.map((fp: any) => ({
          id: String(fp.id),
          code:
            fp.code ||
            (fp.name?.includes('CNTT')
              ? 'CNTT'
              : fp.name?.includes('Cần Thơ') || fp.name?.includes('CTU')
                ? 'CTU'
                : fp.name?.includes('CLB')
                  ? 'CLB'
                  : (fp.name || 'FP').substring(0, 4).toUpperCase()),
          name: fp.name,
          orgName: fp.orgName || fp.parentOrg || 'Trường Đại học Cần Thơ',
          followersCount: fp.followersCount || fp.followerCount || 0,
          eventsCount: fp.eventsCount || fp.eventCount || 0,
          avatarUrl: fp.avatarUrl,
        }))
      } catch {
        return []
      }
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

  const handleGoToFanpage = (fanpageId: string) => {
    navigate('/fanpage/admin', { state: { fanpageId } })
  }

  // Filter only pending invitations for display
  const pendingInvitations = invitations.filter((i) => i.status === 'PENDING')

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-background py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-[1200px] mx-auto w-full space-y-4">
        {actionNotice && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Main Content Card */}
        <div className="w-full bg-white dark:bg-card rounded-2xl border border-[#E5E7EB] dark:border-border p-6 sm:p-10 shadow-sm space-y-8 text-left">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F3F4F6] dark:border-border">
            <div>
              <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-[#0B1626] dark:text-foreground tracking-tight">
                Chọn fanpage để quản lý sự kiện
              </h1>
              <p className="font-sans text-sm text-[#4B5563] dark:text-muted-foreground mt-1.5 leading-relaxed">
                Chọn fanpage bạn muốn làm việc để vào trang quản lý sự kiện, hoặc đăng ký fanpage mới.
              </p>
            </div>

            <Link
              to="/register/fanpage"
              className="self-start sm:self-center px-4 h-9 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Đăng ký fanpage mới</span>
            </Link>
          </div>

          {/* LỜI MỜI THAM GIA (Chỉ hiển thị khi có lời mời đang chờ - PENDING) */}
          {pendingInvitations.length > 0 && (
            <div className="rounded-2xl border border-amber-200/90 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-transparent dark:from-amber-950/25 dark:via-orange-950/15 dark:to-transparent p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Lời mời tham gia ({pendingInvitations.length})
                </h3>
              </div>

              <div className="space-y-2.5">
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
                          {inv.code}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {inv.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Người mời: <span className="font-medium text-foreground">{inv.inviter}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        disabled={respondMutation.isPending}
                        onClick={() => handleRespondInvitation(inv.id, true)}
                        className="h-8 px-3.5 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] active:scale-95 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>Chấp nhận</span>
                      </button>
                      <button
                        type="button"
                        disabled={respondMutation.isPending}
                        onClick={() => handleRespondInvitation(inv.id, false)}
                        className="h-8 px-3 rounded-lg border border-[#D1D5DB] dark:border-border text-[#4B5563] dark:text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted active:scale-95 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5 shrink-0" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANH SÁCH FANPAGE ĐANG QUẢN TRỊ (Dạng danh sách hàng ngang thanh lịch) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B1626] dark:text-foreground">
                Fanpage đang quản trị ({fanpagesList.length})
              </h2>
              {fanpagesList.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Rê chuột vào fanpage để mở trang quản lý
                </span>
              )}
            </div>

            {fanpagesList.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-[#D1D5DB] dark:border-border bg-[#F9FAFB]/70 dark:bg-card/50 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#1B4B8A] dark:text-primary flex items-center justify-center shadow-2xs">
                  <Building2 className="h-8 w-8 stroke-[1.75]" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="font-k2d font-bold text-lg text-foreground">
                    Hiện tại bạn chưa có fanpage nào
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tài khoản cán bộ của bạn hiện chưa tham gia hoặc sở hữu fanpage nào. Vui lòng đăng ký để tạo fanpage và bắt đầu tổ chức sự kiện nhé!
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
              <div className="space-y-3">
                {fanpagesList.map((fp) => (
                  <div
                    key={fp.id}
                    onClick={() => handleGoToFanpage(fp.id)}
                    className="group relative p-4 rounded-xl border border-[#E5E7EB] dark:border-border bg-white dark:bg-card hover:border-[#1B4B8A] dark:hover:border-primary hover:shadow-md hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {fp.avatarUrl ? (
                        <img
                          src={fp.avatarUrl}
                          alt={fp.name}
                          className="h-12 w-12 rounded-full object-cover border border-[#E5E7EB] dark:border-border shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-800 text-white font-k2d font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#1B4B8A] transition-colors">
                          {fp.code}
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-[#1B4B8A] dark:group-hover:text-primary transition-colors truncate">
                          {fp.name}
                        </h4>
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

                    {/* Nút hành động hiện khi hover */}
                    <div className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B4B8A] hover:bg-[#1E40AF] text-white text-xs font-semibold shadow-xs">
                        <span>Đi tới trang này</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTU Portal Footer */}
      <div className="mt-8 text-center text-xs text-[#6B7280] dark:text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/80">
          Đại học Cần Thơ (CTU) • Hệ thống quản lý sự kiện
        </p>
        <p>
          Quản trị hệ thống sự kiện CTU | Hotline:{' '}
          <span className="font-medium text-foreground/80">(0292) 3832 663</span> | Email:{' '}
          <span className="text-primary font-medium">social-admin@ctu.edu.vn</span>
        </p>
      </div>
    </div>
  )
}
