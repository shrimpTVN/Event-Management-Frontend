import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Bookmark,
  Clock,
  ClipboardList,
  Hand,
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

  // Fetch fanpages from backend if not provided as prop
  const { data: apiFanpages } = useQuery<FollowedOrg[]>({
    queryKey: ['fanpages', 'sidebar'],
    queryFn: async () => {
      const res: any = await apiClient.get('/fanpages', { params: { size: 6 } })
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
            {orgsToDisplay.map((org) => (
              <Link
                key={org.id}
                to={`/fanpage/${org.id}`}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-muted/80 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={org.avatarUrl}
                    alt={org.name}
                    className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
                  />
                  <span className="font-medium text-xs text-[#656565] dark:text-foreground/90 truncate group-hover:text-primary transition-colors">
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
            ))}
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
            to="/events?saved=true"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary transition-colors"
          >
            <Bookmark className="h-5 w-5 text-[#9CA3AF]" />
            <span>Đã lưu</span>
          </Link>
          <Link
            to="/history"
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-colors ${
              currentPath === '/history' || location.search.includes('history=true')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary'
            }`}
          >
            <Clock
              className={`h-5 w-5 ${
                currentPath === '/history' || location.search.includes('history=true')
                  ? 'text-primary'
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
            to="/history"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary transition-colors"
          >
            <Hand className="h-5 w-5 text-[#9CA3AF]" />
            <span>Quản lý tiêu chí SV5T</span>
          </Link>
        </nav>
      </div>

      {/* 4. Footer Links */}
      <div className="pt-4 border-t border-border/60 text-xs font-medium text-[#6B7280] flex flex-col gap-1 px-1">
        <div className="flex items-center gap-2">
          <a href="#about" className="hover:underline">
            Giới thiệu
          </a>
          <span>·</span>
          <a href="#contact" className="hover:underline">
            Liên hệ
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a href="#terms" className="hover:underline">
            Điều khoản
          </a>
          <span>·</span>
          <a href="#privacy" className="hover:underline">
            Chính sách
          </a>
        </div>
      </div>
    </aside>
  )
}
