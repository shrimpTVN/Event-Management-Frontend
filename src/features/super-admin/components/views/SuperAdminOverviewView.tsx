import React from 'react'
import {
  Users,
  Flag,
  CalendarDays,
  GraduationCap,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Award,
} from 'lucide-react'
import type { SuperAdminOverviewStats, SuperAdminTab } from '../../types/superAdmin.types'

interface SuperAdminOverviewViewProps {
  stats: SuperAdminOverviewStats
  onNavigateTab: (tab: SuperAdminTab) => void
}

export const SuperAdminOverviewView: React.FC<SuperAdminOverviewViewProps> = ({
  stats,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-foreground">
            Bảng điều khiển Super Admin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tổng quan số liệu người dùng, fanpage, sự kiện và phân quyền toàn trường Đại học Cần Thơ.
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Users */}
        <div
          onClick={() => onNavigateTab('users')}
          className="p-5 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Người dùng hệ thống</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-k2d font-bold text-3xl text-foreground">
              {stats.totalUsers}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
              <span>{stats.studentCount} Sinh viên</span>
              <span>·</span>
              <span>{stats.staffCount} Cán bộ</span>
              <span>·</span>
              <span>{stats.adminCount} Admin</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Fanpages */}
        <div
          onClick={() => onNavigateTab('fanpages')}
          className="p-5 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tổ chức & Fanpage</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Flag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-k2d font-bold text-3xl text-foreground">
              {stats.totalFanpages}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {stats.activeFanpages} Hoạt động
              </span>
              {stats.pendingFanpages > 0 && (
                <>
                  <span>·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {stats.pendingFanpages} Chờ duyệt
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Events */}
        <div
          onClick={() => onNavigateTab('events')}
          className="p-5 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Sự kiện toàn trường</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-k2d font-bold text-3xl text-foreground">
              {stats.totalEvents}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
              <span>{stats.publishedEvents} Công khai</span>
              <span>·</span>
              <span>{stats.draftEvents} Nháp</span>
              <span>·</span>
              <span>{stats.closedEvents} Đã đóng</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Semesters */}
        <div
          onClick={() => onNavigateTab('semesters')}
          className="p-5 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Học kỳ hiện tại</span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-k2d font-bold text-xl text-foreground truncate">
              {stats.ongoingSemester
                ? `Học kỳ ${stats.ongoingSemester.number}`
                : 'Đang cập nhật'}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground truncate">
              {stats.ongoingSemester?.academicYearName || 'Năm học 2026 - 2027'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending approvals alert card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/40 space-y-4 shadow-2xs lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <span>Phê duyệt Fanpage mới</span>
            </div>
            <h3 className="font-k2d font-bold text-xl text-foreground">
              {stats.pendingFanpages > 0
                ? `${stats.pendingFanpages} đơn đăng ký đang chờ xét duyệt`
                : 'Tất cả fanpage đã được xét duyệt'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Các tổ chức, câu lạc bộ, liên chi hội cần sự phê duyệt từ Super Admin để có quyền xuất bản sự kiện và cộng điểm rèn luyện.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('fanpages')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Xem danh sách phê duyệt</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-foreground font-heading">
              Lối tắt quản lý hệ thống
            </h3>
            <span className="text-xs text-muted-foreground">7 phân hệ cốt lõi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('users')}
              className="p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-primary shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Quản lý Người dùng
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Phân quyền Admin, Cán bộ, khóa/mở tài khoản
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('fanpages')}
              className="p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Flag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Quản lý Fanpage
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Xét duyệt đơn đăng ký, khóa / mở tổ chức
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('training-points')}
              className="p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Danh mục Điểm rèn luyện
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Cấu hình 5 điều quy chế ĐRL, mức điểm trần
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('sv5t')}
              className="p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left flex items-start gap-3 cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  Tiêu chí Sinh viên 5 Tốt
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  5 tiêu chuẩn cấp trường & phân cấp tiêu chí
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
