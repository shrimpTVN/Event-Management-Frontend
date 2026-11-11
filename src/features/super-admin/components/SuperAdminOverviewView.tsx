import React from 'react'
import {
  Users,
  Flag,
  Calendar,
  Ticket,
  TrendingUp,
  AlertTriangle,
  Clock,
  Award,
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
          <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
            Tổng quan hệ thống
          </h1>
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
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Người dùng</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-k2d font-bold text-foreground">
              {stats.totalUsers}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{stats.userGrowthRate}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Tài khoản sinh viên & cán bộ</p>
        </div>

        {/* Metric 2: Fanpages */}
        <div className="bg-white dark:bg-card p-5 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fanpage</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
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
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sự kiện</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-k2d font-bold text-foreground">
              {stats.totalEvents}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{stats.eventGrowthRate}%
            </span>
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
              {stats.totalParticipations.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">lượt</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Check-in thành công vào sự kiện</p>
        </div>
      </div>

      {/* 3. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Registration vs Actual Check-in Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-k2d font-bold text-foreground">
                Xu hướng Đăng ký vs Điểm danh thực tế
              </h3>
              <p className="text-xs text-muted-foreground">Thống kê theo 6 tuần gần nhất</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Đăng ký</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Điểm danh thực tế</span>
              </div>
            </div>
          </div>

          {/* Visual SVG bar / area mockup */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-border">
            {[
              { week: 'Tuần 1', reg: 180, check: 165 },
              { week: 'Tuần 2', reg: 240, check: 210 },
              { week: 'Tuần 3', reg: 310, check: 285 },
              { week: 'Tuần 4', reg: 220, check: 195 },
              { week: 'Tuần 5', reg: 390, check: 360 },
              { week: 'Tuần 6', reg: 450, check: 410 },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex justify-center items-end gap-1.5 h-full">
                  {/* Registration bar */}
                  <div
                    style={{ height: `${(item.reg / 500) * 100}%` }}
                    className="w-4 sm:w-6 bg-primary/80 group-hover:bg-primary rounded-t-sm transition-all relative"
                    title={`Đăng ký: ${item.reg}`}
                  />
                  {/* Checkin bar */}
                  <div
                    style={{ height: `${(item.check / 500) * 100}%` }}
                    className="w-4 sm:w-6 bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-sm transition-all"
                    title={`Thực tế: ${item.check}`}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">{item.week}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
            <span>Tỷ lệ tham dự trung bình: <strong className="text-emerald-600 font-bold">91.4%</strong></span>
            <span>Tổng lượt tiếp cận: <strong>1,790 sinh viên</strong></span>
          </div>
        </div>

        {/* Chart 2: Point Category Distribution */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-k2d font-bold text-foreground">
              Phân bổ sự kiện theo điểm rèn luyện
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Tỷ trọng các nhóm tiêu chí</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">I. Hoạt động học tập & NCKH</span>
                  <span className="text-primary font-bold">42% (12 SK)</span>
                </div>
                <div className="w-full h-2.5 bg-[#F3F4F6] dark:bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">III. Chính trị - Xã hội, Tình nguyện</span>
                  <span className="text-emerald-600 font-bold">35% (10 SK)</span>
                </div>
                <div className="w-full h-2.5 bg-[#F3F4F6] dark:bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">II. Chấp hành pháp luật & Nội quy</span>
                  <span className="text-indigo-600 font-bold">15% (4 SK)</span>
                </div>
                <div className="w-full h-2.5 bg-[#F3F4F6] dark:bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">IV & V. Phẩm chất & Công tác cán bộ</span>
                  <span className="text-amber-600 font-bold">8% (2 SK)</span>
                </div>
                <div className="w-full h-2.5 bg-[#F3F4F6] dark:bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('point-categories')}
            className="w-full mt-4 py-2.5 px-3 rounded-xl border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            Cấu hình khung điểm rèn luyện
          </button>
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
                      src={fp.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'}
                      alt={fp.name}
                      className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-sm font-bold text-foreground truncate">{fp.name}</p>
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
                      <p className="text-sm font-bold text-foreground truncate">{evt.title}</p>
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
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] dark:bg-muted/30 border border-[#E5E7EB]/60 dark:border-border/60">
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
              Xếp hạng số lượt tham gia sự kiện
            </h3>
            <span className="text-xs text-muted-foreground">Theo tổng lượt check-in</span>
          </div>
          <div className="space-y-2.5">
            {ranksByParticipants.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9FAFB] dark:bg-muted/30 border border-[#E5E7EB]/60 dark:border-border/60">
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
                  {item.participationsCount.toLocaleString()} lượt tham gia
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
