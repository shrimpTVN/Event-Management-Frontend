import { Tooltip } from '@/components/ui/tooltip'
import React from 'react'
import {
  Users,
  Flag,
  Calendar,
  Ticket,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import type {
  SuperAdminOverviewStats,
  SuperAdminFanpage,
  SuperAdminEvent,
  FanpageRankItem,
  SuperAdminNavTab,
} from '../types/superAdmin.types'

interface SuperAdminOverviewViewProps {
  stats: SuperAdminOverviewStats
  pendingFanpages: SuperAdminFanpage[]
  violatedEvents: SuperAdminEvent[]
  ranksByEvents: FanpageRankItem[]
  ranksByParticipants: FanpageRankItem[]
  onNavigateTab: (tab: SuperAdminNavTab) => void
  onReviewFanpage: (fanpage: SuperAdminFanpage) => void
  onModerateEvent: (event: SuperAdminEvent) => void
}

export const SuperAdminOverviewView: React.FC<SuperAdminOverviewViewProps> = ({
  stats,
  pendingFanpages,
  violatedEvents,
  ranksByEvents,
  ranksByParticipants,
  onNavigateTab,
  onReviewFanpage,
  onModerateEvent,
}) => {
  return (
    <div className="w-full space-y-6 text-left animate-in fade-in duration-300">
      {/* 1. Page Header with Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Quản trị hệ thống</span>
            <span>/</span>
            <span className="text-primary font-bold">Tổng quan</span>
          </p>
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">Tổng quan hệ thống</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trung tâm kiểm soát, phê duyệt và giám sát hoạt động tổ chức sự kiện toàn trường.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống đang vận hành ổn định
          </span>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Users */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Người dùng
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-k2d font-bold text-foreground">{stats.totalUsers}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Tài khoản sinh viên & cán bộ</p>
        </div>

        {/* Metric 2: Fanpages */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fanpage
            </span>
            <div className="w-10 h-10 rounded-xl bg-brand-subtle text-brand-subtle-foreground flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-k2d font-bold text-foreground">
              {String(stats.totalFanpages).padStart(2, '0')}
            </span>
            {pendingFanpages.length > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {pendingFanpages.length} chờ duyệt
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Đơn vị & CLB tổ chức</p>
        </div>

        {/* Metric 3: Events */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sự kiện
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-k2d font-bold text-foreground">{stats.totalEvents}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Sự kiện đã & đang tổ chức</p>
        </div>

        {/* Metric 4: Total Participations */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Lượt tham gia sự kiện
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-k2d font-bold text-foreground">
              {stats.totalParticipations?.toLocaleString() ?? '—'}
            </span>
            <span className="text-xs text-muted-foreground">lượt</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Check-in thành công vào sự kiện</p>
        </div>
      </div>

      {/* 4. Action Queues: Pending Approvals & Violation Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Fanpage Approvals */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-k2d font-bold text-foreground">
                Yêu cầu phê duyệt đang chờ ({pendingFanpages.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('fanpages')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingFanpages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Hiện không có đơn đăng ký Fanpage nào đang chờ duyệt.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {pendingFanpages.map((fp) => (
                <div key={fp.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        fp.avatarUrl ||
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={fp.name}
                      className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
                    />
                    <div className="truncate">
                      <Tooltip content={fp.name}>
                        <p className="text-sm font-bold text-foreground truncate">{fp.name}</p>
                      </Tooltip>
                      <p className="text-xs text-muted-foreground truncate">
                        Đại diện: {fp.representativeName} • {fp.schoolName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReviewFanpage(fp)}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    Kiểm duyệt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Violation Reports */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-k2d font-bold text-foreground">
                Báo cáo vi phạm ({violatedEvents.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('events')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {violatedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Không có sự kiện nào bị báo cáo vi phạm nội quy.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {violatedEvents.map((evt) => (
                <div key={evt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <Tooltip content={evt.title}>
                        <p className="text-sm font-bold text-foreground truncate">{evt.title}</p>
                      </Tooltip>
                      <p className="text-xs text-red-600 truncate font-medium">
                        {evt.violationReason || 'Nhiều sinh viên phản ánh vi phạm quy chế'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onModerateEvent(evt)}
                    className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                  >
                    Xử lý
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Fanpage Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking 1: Active Events */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-k2d font-bold text-foreground">
              Xếp hạng Fanpage hoạt động tích cực
            </h3>
            <span className="text-xs text-muted-foreground">Theo số sự kiện tổ chức</span>
          </div>
          <div className="space-y-2.5">
            {ranksByEvents.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] dark:bg-muted/30 border border-[#E5E7EB]/60 dark:border-border/60"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950'
                        : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary/10">
                  {item.eventsCount} SK
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking 2: Total Participation */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-k2d font-bold text-foreground">
              Xếp hạng lượt đăng ký sự kiện
            </h3>
            <span className="text-xs text-muted-foreground">Theo số lượt đăng ký</span>
          </div>
          <div className="space-y-2.5">
            {ranksByParticipants.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu đăng ký.
              </p>
            )}
            {ranksByParticipants.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] dark:bg-muted/30 border border-[#E5E7EB]/60 dark:border-border/60"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950'
                        : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950">
                  {item.participationsCount.toLocaleString()} lượt đăng ký
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
