import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Bookmark,
  Award,
  Sparkles,
} from 'lucide-react'
import type { Event } from '../types/event.types'
import { RegisterButton } from './RegisterButton'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

interface EventGridCardProps {
  event: Event
  onRegister?: (eventId: string) => void
  onCancelRegister?: (eventId: string) => void
  onToggleSave?: (eventId: string) => void
}

export const EventGridCard: React.FC<EventGridCardProps> = ({
  event,
  onRegister,
  onCancelRegister,
  onToggleSave,
}) => {
  const location = useLocation()
  const [isSaved, setIsSaved] = useState(event.isSaved ?? false)
  const [isRegistered, setIsRegistered] = useState(
    Boolean(event.isRegistered || (event.status as string) === 'REGISTERED')
  )

  useEffect(() => {
    setIsSaved(event.isSaved ?? false)
    setIsRegistered(Boolean(event.isRegistered || (event.status as string) === 'REGISTERED'))
  }, [event.isSaved, event.isRegistered, event.status])

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved((prev) => !prev)
    onToggleSave?.(event.id)
  }

  // Helper format short date: "29/09 · 19:30"
  const formatShortDateTime = (startStr?: string): string => {
    if (!startStr) return 'Đang cập nhật'
    const date = new Date(startStr)
    if (isNaN(date.getTime())) return startStr
    const pad = (n: number) => String(n).padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
    return `${day}/${month} · ${time}`
  }

  const address = event.location?.address || 'Đại học Cần Thơ'
  const locationDisplay =
    event.location?.type === 'ONLINE' ? 'Trực tuyến' : address

  // Registered percentage calculation
  const capacity = event.capacity || 100
  const registeredCount = event.registeredCount || 0
  const regPercent = Math.min(100, Math.round((registeredCount / capacity) * 100))
  const isFull = capacity > 0 && registeredCount >= capacity

  // Parse primary benefits
  const benefitsList = event.pointsReward
    ? event.pointsReward.split(' · ')
    : []

  return (
    <article className="w-full bg-white dark:bg-card border border-border/80 dark:border-border/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group text-left">
      {/* 1. Card Top Media (Poster 16:9 ratio with overlay badges) */}
      <div className="relative aspect-video w-full bg-[#0B1626]/90 overflow-hidden shrink-0">
        <Link
          to={`/events/${event.id}`}
          state={{ from: `${location.pathname}${location.search}` }}
          className="w-full h-full block"
        >
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gradient-to-br from-primary/30 to-brand-primary/60 p-4">
              <Sparkles className="h-8 w-8 mb-1 text-white/70" />
              <span className="text-xs font-semibold text-white/80">Sự kiện CTU</span>
            </div>
          )}
        </Link>

        {/* Date Time Badge floating top-left */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
          <CalendarIcon className="h-3 w-3 text-cyan-400 shrink-0" />
          <span>{formatShortDateTime(event.startTime)}</span>
        </div>

        {/* Bookmark Action top-right */}
        <button
          type="button"
          onClick={handleSaveClick}
          className="absolute top-2.5 right-2.5 z-10 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:text-amber-400 hover:scale-110 flex items-center justify-center transition-all cursor-pointer shadow-sm"
          title={isSaved ? 'Đã lưu' : 'Lưu sự kiện'}
        >
          <Bookmark
            className={`h-3.5 w-3.5 transition-colors ${
              isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'
            }`}
          />
        </button>

        {/* Status indicator bottom-left */}
        <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-1.5">
          {isFull ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold shadow-xs">
              Hết chỗ
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Đang mở đăng ký
            </span>
          )}
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          {/* Organizer Meta */}
          <div className="flex items-center gap-2 min-w-0">
            {event.organizerAvatarUrl ? (
              <img
                src={event.organizerAvatarUrl}
                alt={event.organizerName || 'BTC'}
                className="h-5 w-5 rounded-full object-cover shrink-0 border border-border/60"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {(event.organizerName || 'C').charAt(0)}
              </div>
            )}
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {event.organizerName || event.fanpageName || 'Đơn vị tổ chức'}
            </span>
            <VerifiedBadge className="h-3 w-3 shrink-0" />
          </div>

          {/* Event Title (2 Lines max) */}
          <h3 className="font-k2d font-bold text-sm sm:text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <Link
              to={`/events/${event.id}`}
              state={{ from: `${location.pathname}${location.search}` }}
            >
              {event.title}
            </Link>
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate" title={locationDisplay}>
              {locationDisplay}
            </span>
          </div>

          {/* Benefits Tags (Training Points / SV5T) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {benefitsList.length > 0 ? (
              benefitsList.map((benefit, idx) => {
                const isTrainingPoint = benefit.includes('ĐRL')
                const isSv5t = benefit.includes('SV5T')
                return (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap border ${
                      isTrainingPoint
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : isSv5t
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    <Award className="h-3 w-3 shrink-0" />
                    <span>{benefit}</span>
                  </span>
                )
              })
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
                Cộng điểm rèn luyện
              </span>
            )}
          </div>
        </div>

        {/* 3. Card Footer (Capacity & Register Action Button) */}
        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-3">
          {/* Capacity Progress */}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{registeredCount}/{capacity}</span>
              </span>
              <span className="font-semibold text-foreground">{regPercent}%</span>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFull ? 'bg-rose-500' : 'bg-primary'
                }`}
                style={{ width: `${regPercent}%` }}
              />
            </div>
          </div>

          {/* Quick Register Button */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <RegisterButton
              eventId={event.id}
              eventTitle={event.title}
              isRegistered={isRegistered}
              size="sm"
              disabled={event.status === 'CLOSED'}
              onRegisterSuccess={() => {
                setIsRegistered(true)
                onRegister?.(event.id)
              }}
              onCancelSuccess={() => {
                setIsRegistered(false)
                onCancelRegister?.(event.id)
              }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
