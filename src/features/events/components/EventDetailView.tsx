import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Award, ShieldCheck, Clock, Building } from 'lucide-react'
import { formatDate } from '@/shared'
import type { Event } from '../types/event.types'

interface EventDetailViewProps {
  event: Event
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ event }) => {
  const pointsRewardText =
    event.pointsReward ||
    (event.eventPoints && event.eventPoints.length > 0
      ? event.eventPoints.map((ep) => `+${ep.point}đ ${ep.pointCategoryName || 'ĐRL'}`).join(' • ')
      : 'Không áp dụng điểm rèn luyện')

  const criteriaText = event.criteriaName || 'Không áp dụng tiêu chí SV5T'
  const organizerName = event.organizerName || event.fanpageName || 'Ban Tổ Chức'
  const organizerAvatar =
    event.organizerAvatarUrl ||
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-left">
      {/* Category & Status Pill */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {event.category || 'WORKSHOP'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-medium">
          {event.status === 'PUBLISHED'
            ? 'Đang mở đăng ký'
            : event.status === 'COMPLETED' || (event.status as string) === 'CLOSED'
            ? 'Đã đóng'
            : 'Sắp diễn ra'}
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-3">
        <h1 className="font-k2d font-bold text-2xl sm:text-3xl text-foreground tracking-tight leading-snug">
          {event.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Organizer Card */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/40">
        <img
          src={organizerAvatar}
          alt={organizerName}
          className="h-12 w-12 rounded-full object-cover border border-border shrink-0"
        />
        <div className="min-w-0 flex-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Building className="h-3.5 w-3.5" />
            Đơn vị tổ chức
          </span>
          <p className="font-semibold text-sm text-foreground truncate">{organizerName}</p>
        </div>
      </div>

      {/* Training Points & SV5T Benefits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Points Reward */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/60 dark:bg-primary/10 dark:border-primary/20">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-primary">Quyền lợi Điểm rèn luyện</span>
            <p className="text-sm font-bold text-foreground">{pointsRewardText}</p>
          </div>
        </div>

        {/* SV5T Criteria */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/60 dark:bg-amber-500/10 dark:border-amber-500/20">
          <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Tiêu chí SV5T</span>
            <p className="text-sm font-bold text-foreground truncate">{criteriaText}</p>
          </div>
        </div>
      </div>

      {/* Metadata Overview: Date, Location, Quota */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border py-5 text-left">
        {/* Thời gian */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Thời gian diễn ra</p>
            <p className="text-sm font-semibold">{formatDate(event.startTime)}</p>
          </div>
        </div>

        {/* Địa điểm */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Địa điểm</p>
            <p className="text-sm font-semibold truncate max-w-[180px]">
              {event.location.type === 'ONLINE'
                ? 'Trực tuyến'
                : `${event.location.address || 'Đang cập nhật địa điểm'}`}
            </p>
          </div>
        </div>

        {/* Số lượng / Chỉ tiêu */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Số lượng tham gia</p>
            <p className="text-sm font-semibold">
              {event.registeredCount || 0} / {event.capacity} sinh viên
            </p>
          </div>
        </div>
      </div>

      {/* Registration Bottom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>Hạn đăng ký: Trước 1 ngày diễn ra sự kiện</span>
        </div>

        <Link
          to={`/events/${event.id}/register`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-semibold text-sm text-primary-foreground shadow hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Đăng ký tham gia ngay</span>
        </Link>
      </div>
    </div>
  )
}
