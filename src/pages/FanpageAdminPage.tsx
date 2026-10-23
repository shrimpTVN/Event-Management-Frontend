import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { isMockMode } from '@/shared'
import {
  FanpageAdminLayout,
  FanpageHomeView,
  fanpageAdminService,
  EMPTY_ACTIVITY_STATS,
  MOCK_CURRENT_FANPAGE,
  MOCK_ACTIVITY_STATS,
  MOCK_UPCOMING_REMINDER,
} from '@/features/fanpage-admin'
import type { FanpageSummary, AdminNavTab } from '@/features/fanpage-admin'

export const FanpageAdminPage: React.FC = () => {
  const location = useLocation()
  const initialFanpageId = (location.state as { fanpageId?: string } | undefined)?.fanpageId

  const { data: availableFanpages = [] } = useQuery<FanpageSummary[]>({
    queryKey: ['admin-available-fanpages'],
    queryFn: () => fanpageAdminService.getAvailableFanpages(),
  })

  const [selectedFanpage, setSelectedFanpage] = useState<FanpageSummary | null>(null)

  const currentFanpage: FanpageSummary | undefined =
    selectedFanpage ||
    (initialFanpageId ? availableFanpages.find((fp) => fp.id === initialFanpageId) : undefined) ||
    availableFanpages[0] ||
    (isMockMode() ? MOCK_CURRENT_FANPAGE : undefined)

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-feed-posts', currentFanpage?.id],
    queryFn: () => fanpageAdminService.getFeedPosts(currentFanpage?.id),
    enabled: Boolean(currentFanpage?.id),
  })

  const [activeTab, setActiveTab] = useState<AdminNavTab | null>(null)

  if (!currentFanpage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-lg font-bold text-foreground">Chưa có Fanpage được chỉ định</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bạn chưa có quyền quản trị fanpage nào hoặc chưa chọn fanpage làm việc.
        </p>
        <Link
          to="/staff/fanpages"
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Về Trung tâm Fanpage
        </Link>
      </div>
    )
  }

  return (
    <FanpageAdminLayout
      currentFanpage={currentFanpage}
      availableFanpages={availableFanpages}
      onSelectFanpage={(fp) => {
        setSelectedFanpage(fp)
        setActiveTab(null) // Return to home on fanpage change
      }}
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab((prev) => (prev === tab ? null : tab))}
    >
      {/* 1. Trang chủ fanpage — quản trị (Mặc định khi activeTab === null) */}
      {activeTab === null && (
        <FanpageHomeView
          currentFanpage={currentFanpage}
          stats={isMockMode() ? MOCK_ACTIVITY_STATS : EMPTY_ACTIVITY_STATS}
          reminder={isMockMode() ? MOCK_UPCOMING_REMINDER : null}
          posts={posts}
        />
      )}

      {/* 2. Quản lý sự kiện (Khi click vào mục 'Sự kiện' trong sidebar) */}
      {activeTab === 'events' && (
        <div className="w-full space-y-6 text-left animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="hover:text-primary cursor-pointer"
                >
                  Trang chủ
                </button>
                <span>/</span>
                <span className="text-primary font-bold">Quản lý sự kiện</span>
              </p>
              <h1 className="font-k2d font-bold text-2xl text-foreground mt-1">
                Danh sách sự kiện đã đăng
              </h1>
              <p className="text-xs text-muted-foreground">
                Theo dõi tiến độ, số lượng đăng ký và trạng thái điểm danh của các sự kiện.
              </p>
            </div>

            <Link
              to="/events/create"
              className="px-4 h-9 rounded-xl bg-primary text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <span>+ Tạo sự kiện mới</span>
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4">
            <h3 className="font-bold text-sm text-foreground">Sự kiện gần nhất</h3>
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl border border-border bg-[#F9FAFB] dark:bg-background/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">{post.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Đăng lúc {post.timeAgo} · {post.likesCount} lượt thích · {post.commentsCount} bình luận
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      Đang mở đăng ký
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab(null)}
                      className="px-3 h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted cursor-pointer"
                    >
                      Xem bài viết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="w-full space-y-6 text-left animate-in fade-in">
          <div className="pb-4 border-b border-border">
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              Tổng quan quản trị fanpage
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Thống kê tổng hợp hoạt động, đối soát sinh viên và hiệu quả tổ chức sự kiện.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border">
              <span className="text-xs text-muted-foreground">Tổng sự kiện đã tổ chức</span>
              <p className="font-k2d font-bold text-3xl text-primary mt-1">18</p>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">4 sự kiện trong tháng này</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border">
              <span className="text-xs text-muted-foreground">Tổng lượt sinh viên tham gia</span>
              <p className="font-k2d font-bold text-3xl text-foreground mt-1">3.480</p>
              <span className="text-xs text-muted-foreground mt-1 block">Tỷ lệ điểm danh: 91.5%</span>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-card border border-border">
              <span className="text-xs text-muted-foreground">Điểm rèn luyện đã cấp</span>
              <p className="font-k2d font-bold text-3xl text-emerald-600 mt-1">12.650</p>
              <span className="text-xs text-muted-foreground mt-1 block">Đã đối soát với Đoàn trường</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">Danh sách chờ duyệt tham gia</h3>
              <Link to="/dashboard" className="text-xs text-primary font-medium hover:underline">
                Xem toàn bộ hàng đợi
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Có 14 sinh viên đang chờ duyệt đơn đăng ký tham gia sự kiện gần nhất.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="w-full space-y-6 text-left animate-in fade-in">
          <div className="pb-4 border-b border-border flex items-center justify-between">
            <div>
              <h1 className="font-k2d font-bold text-2xl text-foreground">
                Thông tin fanpage
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Xem và chỉnh sửa hồ sơ đơn vị, thông tin liên hệ và giấy phép hoạt động.
              </p>
            </div>
            <Link
              to="/register/fanpage"
              className="px-4 h-9 rounded-xl bg-primary text-white text-xs font-semibold flex items-center gap-2"
            >
              Cập nhật hồ sơ
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-white font-k2d font-bold text-xl flex items-center justify-center">
                {currentFanpage.code}
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{currentFanpage.fullName}</h3>
                <p className="text-xs text-primary font-medium">{currentFanpage.email}</p>
                <span className="text-xs text-muted-foreground">{currentFanpage.address}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="w-full space-y-6 text-left animate-in fade-in">
          <div className="pb-4 border-b border-border">
            <h1 className="font-k2d font-bold text-2xl text-foreground">
              Cài đặt quyền và thông báo
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Phân quyền thành viên ban tổ chức và thiết lập thông báo tự động.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-card border border-border space-y-4">
            <h3 className="font-bold text-sm text-foreground">Thành viên ban quản trị</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Nguyễn Minh Anh (Bạn)</p>
                  <p className="text-muted-foreground">canbo@ctu.edu.vn · Trưởng ban quản trị</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  Chủ sở hữu
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Trần Hoàng Nam</p>
                  <p className="text-muted-foreground">namth@ctu.edu.vn · Cán bộ hỗ trợ sự kiện</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                  Biên tập viên
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </FanpageAdminLayout>
  )
}
