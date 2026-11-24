import { Tooltip } from '@/components/ui/tooltip'
import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Bookmark, Clock, ClipboardList, Hand, ChevronDown, ChevronUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared'
import { useAuthStore } from '@/features/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { eventService } from '../services/eventService'
import type { Event } from '../types/event.types'

const getFanpageLastVisited = (fanpageId: string): number => {
  try {
    const val = localStorage.getItem(`fanpage_last_visited_${fanpageId}`)
    return val ? parseInt(val, 10) : 0
  } catch {
    return 0
  }
}

const markFanpageAsVisited = (fanpageId: string) => {
  try {
    localStorage.setItem(`fanpage_last_visited_${fanpageId}`, Date.now().toString())
  } catch {}
}

export interface FollowedOrg {
  id: string
  name: string
  avatarUrl: string
  hasUnread?: boolean
}

interface StudentLeftSidebarProps {
  followedOrgs?: FollowedOrg[]
  showHomeLink?: boolean
  mobile?: boolean
}

export const StudentLeftSidebar: React.FC<StudentLeftSidebarProps> = ({
  followedOrgs,
  showHomeLink = false,
  mobile = false,
}) => {
  const location = useLocation()
  const currentPath = location.pathname

  const [isExpanded, setIsExpanded] = useState(false)
  const [visitedTimes, setVisitedTimes] = useState<Record<string, number>>({})

  const { isAuthenticated } = useAuthStore()

  // Auto-mark active fanpage as visited if user is currently on /fanpage/:id
  useEffect(() => {
    const match = currentPath.match(/^\/fanpage\/([^/]+)/)
    if (match && match[1]) {
      const activeFpId = match[1]
      markFanpageAsVisited(activeFpId)
      setVisitedTimes((prev) => {
        if (prev[activeFpId]) return prev
        return { ...prev, [activeFpId]: Date.now() }
      })
    }
  }, [currentPath])

  // Fetch all published events to check for newly posted activities per fanpage
  const { data: allEvents = [] } = useQuery<Event[]>({
    queryKey: ['events', 'feed'],
    queryFn: () => eventService.getEvents(),
    staleTime: 60 * 1000,
  })

  // Map each fanpage ID to the timestamp of its latest published event
  const latestEventTimeMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const ev of allEvents) {
      const orgId = String(ev.organizerId || ev.fanpageId || '')
      if (!orgId) continue
      const timeStr = ev.createdAt || ev.dateOpen || ev.startTime
      const t = timeStr ? new Date(timeStr).getTime() : 0
      if (!isNaN(t) && t > 0) {
        const currentMax = map.get(orgId) || 0
        if (t > currentMax) {
          map.set(orgId, t)
        }
      }
    }
    return map
  }, [allEvents])

  // Determine whether a fanpage has a new event the user hasn't seen yet
  const isOrgUnread = (orgId: string): boolean => {
    if (currentPath === `/fanpage/${orgId}`) {
      return false
    }

    const latestEventTime = latestEventTimeMap.get(orgId)
    if (!latestEventTime) {
      return false
    }

    const lastVisited = visitedTimes[orgId] ?? getFanpageLastVisited(orgId)
    if (lastVisited > 0) {
      return latestEventTime > lastVisited
    }

    // If user has never visited this fanpage before, show blue dot if event was posted within the last 7 days
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
    return Date.now() - latestEventTime < SEVEN_DAYS_MS
  }

  const handleFanpageClick = (orgId: string) => {
    markFanpageAsVisited(orgId)
    setVisitedTimes((prev) => ({ ...prev, [orgId]: Date.now() }))
  }

  // Fetch fanpages from backend if not provided as prop (following when authenticated)
  const { data: apiFanpages, isLoading } = useQuery<FollowedOrg[]>({
    queryKey: ['fanpages', 'sidebar', isAuthenticated],
    queryFn: async () => {
      if (isAuthenticated) {
        try {
          const res: any = await apiClient.get('/fanpages/following', { params: { size: 50 } })
          const list = res?.content || res?.data || (Array.isArray(res) ? res : [])
          if (Array.isArray(list) && list.length > 0) {
            return list.map((fp: any) => ({
              id: String(fp.id),
              name: fp.orgName || fp.fullName || fp.name,
              avatarUrl:
                fp.avatarUrl ||
                (String(fp.id) === '1'
                  ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
                  : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'),
            }))
          }
          return []
        } catch {
          // If following endpoint fails, fallback to general fanpages
        }
      }
      const res: any = await apiClient.get('/fanpages', { params: { size: 50 } })
      const list = res?.content || res?.data || (Array.isArray(res) ? res : [])
      return list.map((fp: any) => ({
        id: String(fp.id),
        name: fp.orgName || fp.fullName || fp.name,
        avatarUrl:
          fp.avatarUrl ||
          (String(fp.id) === '1'
            ? 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/fanpages/u_2_14fdaacdf2da4081.jpg'
            : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'),
      }))
    },
    enabled: !followedOrgs,
  })

  const orgsToDisplay = followedOrgs || apiFanpages || []
  const collapsedLimit = mobile ? 4 : 6
  const hasMore = orgsToDisplay.length > collapsedLimit
  const visibleOrgs = isExpanded ? orgsToDisplay : orgsToDisplay.slice(0, collapsedLimit)

  // Auto-expand if current active fanpage is past index 5
  useEffect(() => {
    const activeIndex = orgsToDisplay.findIndex((org) => currentPath === `/fanpage/${org.id}`)
    if (!mobile && activeIndex >= collapsedLimit) {
      setIsExpanded(true)
    }
  }, [currentPath, orgsToDisplay, mobile, collapsedLimit])

  return (
    // add resize left size bar
    //refactor: add maximize button
    <aside
      className={`${mobile ? 'student-mobile-navigation gap-5' : 'gap-6'} w-full flex flex-col text-sm`}
    >
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
          <Home
            className={`h-5 w-5 ${currentPath === '/' ? 'text-primary' : 'text-muted-foreground'}`}
          />
          <span>Trang chủ</span>
        </Link>
      )}

      {/* 1. Trang đã theo dõi */}
      <div>
        <h3 className="font-medium text-sm text-[#9CA3AF] mb-2.5 px-1">Trang đã theo dõi</h3>

        {isLoading && !followedOrgs ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : orgsToDisplay.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {visibleOrgs.map((org) => {
              const isActive = currentPath === `/fanpage/${org.id}`
              const hasUnread =
                typeof org.hasUnread === 'boolean' && followedOrgs
                  ? org.hasUnread
                  : isOrgUnread(org.id)

              return (
                <Tooltip content={org.name} key={org.id}>
                  <Link
                    to={`/fanpage/${org.id}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleFanpageClick(org.id)}
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
                    {hasUnread && (
                      <Tooltip content="Có sự kiện mới">
                        <span
                          data-testid={`unread-dot-${org.id}`}
                          aria-label="Có sự kiện mới"
                          className="h-2 w-2 rounded-full bg-[#00AFF0] shrink-0"
                        />
                      </Tooltip>
                    )}
                  </Link>
                </Tooltip>
              )
            })}

            {/* Expand the remaining fanpages without changing their order. */}
            {hasMore && (
              <Button
                variant="ghost"
                aria-expanded={isExpanded}
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="h-auto w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1B4B8A] dark:text-blue-400 hover:bg-[#EFF5FC] dark:hover:bg-blue-950/40 transition-colors cursor-pointer group mt-0.5"
              >
                <span>
                  {isExpanded ? 'Thu gọn' : `Xem thêm (${orgsToDisplay.length - collapsedLimit})`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400 group-hover:-translate-y-0.5 transition-transform" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#1B4B8A] dark:text-blue-400 group-hover:translate-y-0.5 transition-transform" />
                )}
              </Button>
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
        <h3 className="font-medium text-sm text-[#9CA3AF] mb-2 px-1">Sự kiện</h3>
        <nav className="flex flex-col gap-1">
          <Link
            to="/events/saved"
            aria-current={['/events/saved', '/saved'].includes(currentPath) ? 'page' : undefined}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-xs transition-colors ${
              currentPath === '/events/saved' || currentPath === '/saved'
                ? 'bg-[#BDD7F0]/60 dark:bg-primary/20 text-[#1B406F] dark:text-primary font-semibold'
                : 'text-[#656565] dark:text-foreground/85 hover:bg-muted/80 hover:text-primary'
            }`}
          >
            <Bookmark
              className={`h-5 w-5 ${
                currentPath === '/events/saved' || currentPath === '/saved'
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-[#9CA3AF]'
              }`}
            />
            <span>Đã lưu</span>
          </Link>
          <Link
            to="/history"
            aria-current={currentPath === '/history' ? 'page' : undefined}
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
        <h3 className="font-medium text-sm text-[#9CA3AF] mb-2 px-1">Bạn</h3>
        <nav className="flex flex-col gap-1">
          <Link
            to="/training-points"
            aria-current={['/training-points', '/drl'].includes(currentPath) ? 'page' : undefined}
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
            <span>{mobile ? 'Điểm rèn luyện' : 'Quản lý điểm rèn luyện'}</span>
          </Link>
          <Link
            to="/sv5t"
            aria-current={['/sv5t', '/sinh-vien-5-tot'].includes(currentPath) ? 'page' : undefined}
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
            <span>{mobile ? 'Sinh viên 5 tốt' : 'Quản lý tiêu chí SV5T'}</span>
          </Link>
        </nav>
      </div>

      {/* 4. Footer Links matching Social Network Specs from screenshot */}
      {!mobile && (
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
          <div className="text-[11px] text-muted-foreground/70">Đại học Cần Thơ © 2026</div>
        </div>
      )}

      {/* Bottom spacer for sidebar scroll breathing room */}
      {!mobile && <div className="h-16 w-full shrink-0" aria-hidden="true" />}
    </aside>
  )
}
