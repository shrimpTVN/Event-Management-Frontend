import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Bookmark,
  Clock,
  ClipboardList,
  Hand,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared'

export interface FollowedOrg {
  id: string
  name: string
  avatarUrl: string
  hasUnread?: boolean
}

interface StudentLeftSidebarProps {
  followedOrgs?: FollowedOrg[]
  showHomeLink?: boolean
}

export const StudentLeftSidebar: React.FC<StudentLeftSidebarProps> = ({
  followedOrgs,
  showHomeLink = false,
}) => {
  const location = useLocation()
  const currentPath = location.pathname

  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredOrg, setHoveredOrg] = useState<{ id: string; name: string; x: number; y: number } | null>(null)

  // Fetch fanpages from backend if not provided as prop
  const { data: apiFanpages } = useQuery<FollowedOrg[]>({
    queryKey: ['fanpages', 'sidebar'],
    queryFn: async () => {
      const res: any = await apiClient.get('/fanpages', { params: { size: 50 } })
      const list = res?.content || res?.data || (Array.isArray(res) ? res : [])
      return list.map((fp: any, idx: number) => ({
        id: String(fp.id),
        name: fp.name,
        avatarUrl: fp.avatarUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100',
        hasUnread: idx < 2, // Mark top 2 as having recent activity
      }))
    },
    enabled: !followedOrgs,
  })

  const orgsToDisplay = followedOrgs || apiFanpages || []
  const hasMore = orgsToDisplay.length > 6
  const visibleOrgs = isExpanded ? orgsToDisplay : orgsToDisplay.slice(0, 6)

  // Auto-expand if current active fanpage is past index 5
  useEffect(() => {
    const activeIndex = orgsToDisplay.findIndex((org) => currentPath === `/fanpage/${org.id}`)
    if (activeIndex >= 6) {
      setIsExpanded(true)
    }
  }, [currentPath, orgsToDisplay])

  return (
    <aside className="w-full flex flex-col gap-6 text-sm">
      {/* 0. Home Link (Optional - for profile or inner pages) */}
      {showHomeLink && (
        <Link
          to="/"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition-colors ${
            currentPath === '/'
              ? 'bg-muted/90 text-foreground shadow-sm'
              : 'text-foreground/80 hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          <Home className={`h-5 w-5 ${currentPath === '/' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span>Trang chủ</span>
        </Link>
      )}

      {/* 1. Trang đã theo dõi */}
      <div>
        <h3 className="font-medium text-sm text-[#9CA3AF] mb-2.5 px-1">
          Trang đã theo dõi
        </h3>

        {orgsToDisplay.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {visibleOrgs.map((org) => {
              const isActive = currentPath === `/fanpage/${org.id}`
              return (
                <Link
                  key={org.id}
                  to={`/fanpage/${org.id}`}
                  onMouseMove={(e) => {
                    setHoveredOrg({
                      id: org.id,
                      name: org.name,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }}
                  onMouseLeave={() => setHoveredOrg(null)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl transition-colors text-left group ${
                    isActive
                      ? 'bg-[#BDD7F0]/60 dark:bg-primary/20 text-[#1B406F] dark:text-primary font-semibold'
                      : 'text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={org.avatarUrl}
                      alt={org.name}
                      className={`h-5 w-5 rounded-full object-cover shrink-0 transition-all ${
                        isActive
                          ? 'border border-[#1B406F] dark:border-primary shadow-xs'
                          : 'border border-border'
                      }`}
                    />
                    <span
                      className={`text-xs truncate transition-colors ${
                        isActive
                          ? 'text-[#1B406F] dark:text-primary font-semibold'
                          : 'font-medium text-[#656565] dark:text-foreground/90 group-hover:text-primary'
                      }`}
                    >
                      {org.name}
                    </span>
                  </div>
                  {org.hasUnread && (
                    <span
                      className="h-2 w-2 rounded-full bg-[#00AFF0] shrink-0"
                      title="Có bài đăng mới"
                    />
                  )}
                </Link>
              )
            })}

            {/* Nút Xem thêm / Thu gọn khi có nhiều hơn 6 fanpage */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1B4B8A] dark:text-blue-400 hover:bg-[#EFF5FC] dark:hover:bg-blue-950/40 transition-colors cursor-pointer group mt-0.5"
              >
                <span>{isExpanded ? 'Thu gọn' : `Xem thêm (${orgsToDisplay.length - 6})`}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400 group-hover:-translate-y-0.5 transition-transform" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400 group-hover:translate-y-0.5 transition-transform" />
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-muted/60 px-4 py-3 text-center text-xs font-medium text-[#9CA3AF]">
            Hiện chưa có trang nào
          </div>
        )}
      </div>

      {/* 2. Sự kiện */}
      <div>
        <h3 className="font-medium text-sm text-[#9CA3AF] mb-2 px-1">
          Sự kiện
        </h3>
        <nav className="flex flex-col gap-1">
          <Link
            to="/history?saved=true"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary transition-colors"
          >
            <Bookmark className="h-5 w-5 text-[#9CA3AF]" />
            <span>Đã lưu</span>
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-colors ${
              currentPath === '/history' || location.search.includes('history=true')
                ? 'bg-[#BDD7F0]/60 dark:bg-primary/20 text-[#1B406F] dark:text-primary font-semibold'
                : 'text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary'
            }`}
          >
            <Clock
              className={`h-5 w-5 ${
                currentPath === '/history' || location.search.includes('history=true')
                  ? 'text-[#1B406F] dark:text-primary'
                  : 'text-[#9CA3AF]'
              }`}
            />
            <span>Lịch sử tham gia</span>
          </Link>
        </nav>
      </div>

      {/* 3. Bạn */}
      <div>
        <h3 className="font-medium text-sm text-[#9CA3AF] mb-2 px-1">
          Bạn
        </h3>
        <nav className="flex flex-col gap-1">
          <Link
            to="/training-points"
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-colors ${
              currentPath === '/training-points'
                ? 'bg-[#BDD7F0]/60 dark:bg-primary/20 text-[#1B406F] dark:text-primary font-semibold'
                : 'text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary'
            }`}
          >
            <ClipboardList
              className={`h-5 w-5 ${
                currentPath === '/training-points'
                  ? 'text-[#1B406F] dark:text-primary'
                  : 'text-[#9CA3AF]'
              }`}
            />
            <span>Quản lý điểm rèn luyện</span>
          </Link>
          <Link
            to="/sv5t"
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-colors ${
              currentPath === '/sv5t' || currentPath === '/sinh-vien-5-tot'
                ? 'bg-[#BDD7F0]/60 dark:bg-primary/20 text-[#1B406F] dark:text-primary font-semibold'
                : 'text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary'
            }`}
          >
            <Hand
              className={`h-5 w-5 ${
                currentPath === '/sv5t' || currentPath === '/sinh-vien-5-tot'
                  ? 'text-[#1B406F] dark:text-primary'
                  : 'text-[#9CA3AF]'
              }`}
            />
            <span>Quản lý tiêu chí SV5T</span>
          </Link>
        </nav>
      </div>

      {/* 4. Footer Links matching Social Network Specs from screenshot */}
      <div className="pt-4 border-t border-border/60 text-xs font-medium text-[#6B7280] flex flex-col gap-1.5 px-1 pb-4">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-relaxed text-[11px] text-muted-foreground">
          <a href="#privacy" className="hover:underline">
            Quyền riêng tư
          </a>
          <span>·</span>
          <a href="#terms" className="hover:underline">
            Điều khoản
          </a>
          <span>·</span>
          <a href="#ads" className="hover:underline">
            Quảng cáo
          </a>
          <span>·</span>
          <a href="#choices" className="hover:underline inline-flex items-center gap-0.5">
            <span>Lựa chọn quảng cáo</span>
            <span className="text-[9px]">▷</span>
          </a>
          <span>·</span>
          <a href="#cookie" className="hover:underline">
            Cookie
          </a>
          <span>·</span>
          <a href="#more" className="hover:underline">
            Xem thêm
          </a>
        </div>
        <div className="text-[11px] text-muted-foreground/70">
          Đại học Cần Thơ © 2026
        </div>
      </div>

      {/* Bottom spacer for sidebar scroll breathing room */}
      <div className="h-16 w-full shrink-0" aria-hidden="true" />

      {/* Floating tooltip on hover directly below mouse cursor */}
      {hoveredOrg && (
        <div
          className="fixed z-50 pointer-events-none px-2.5 py-1 text-xs font-medium text-white bg-[#0B1626] dark:bg-card dark:text-foreground dark:border-border rounded-md shadow-xl border border-white/10 animate-in fade-in duration-75 max-w-xs break-words"
          style={{
            top: hoveredOrg.y + 16,
            left: hoveredOrg.x + 8,
          }}
        >
          {hoveredOrg.name}
        </div>
      )}
    </aside>
  )
}
