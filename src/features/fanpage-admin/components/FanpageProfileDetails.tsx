import { Building2 as FanpageIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FanpageSummary } from '../types/fanpageAdmin.types'
import { Label } from '@/components/ui/label'

function Detail({
  label,
  value,
  href,
  control,
  id,
}: {
  label: string
  value?: string
  href?: string
  control?: ReactNode
  id?: string
}) {
  if (!control && !value?.trim()) return null
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm leading-6 text-muted-foreground">
        {control ? (
          <Label htmlFor={id} className="font-normal leading-6 text-muted-foreground">
            {label}
          </Label>
        ) : (
          label
        )}
      </dt>
      <dd className="m-0 min-h-6 min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
        {control ||
          (href ? (
            <a
              href={href}
              className="rounded-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {value}
            </a>
          ) : (
            value
          ))}
      </dd>
    </div>
  )
}

interface FanpageProfileDetailsProps {
  fanpage: FanpageSummary
  actions?: ReactNode
  avatarControl?: ReactNode
  descriptionControl?: ReactNode
  emailControl?: ReactNode
  phoneControl?: ReactNode
}

const organizationTypeLabels: Record<string, string> = {
  YOUTH_UNION: 'Đoàn / Hội',
  CLUB: 'Câu lạc bộ',
}

export function FanpageProfileDetails({
  fanpage,
  actions,
  avatarControl,
  descriptionControl,
  emailControl,
  phoneControl,
}: FanpageProfileDetailsProps) {
  const displayName = fanpage.fullName?.trim() || fanpage.name
  const orgType = fanpage.orgType?.trim()
  const hasDetails = Boolean(
    fanpage.parentOrg?.trim() ||
    fanpage.description?.trim() ||
    fanpage.email?.trim() ||
    fanpage.phone?.trim() ||
    descriptionControl ||
    emailControl ||
    phoneControl
  )
  return (
    <article
      aria-label="Hồ sơ fanpage"
      className="w-full overflow-hidden rounded-xl border border-border bg-white p-5 text-left dark:bg-card sm:p-6"
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10">
              {fanpage.avatarUrl ? (
                <img
                  src={fanpage.avatarUrl}
                  alt={displayName || 'Logo fanpage'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <FanpageIcon className="h-8 w-8 text-primary" aria-hidden="true" />
              )}
            </div>
            {avatarControl && <div className="absolute -bottom-1 -right-1">{avatarControl}</div>}
          </div>
          <div className="flex min-w-0 flex-col items-start gap-2">
            <h2 className="break-words font-k2d text-xl font-semibold leading-snug text-foreground">
              {displayName || 'Chưa cập nhật'}
            </h2>
            {orgType && (
              <span className="rounded-md bg-primary/5 px-2 py-1 text-xs font-medium text-primary dark:bg-primary/10 dark:text-blue-300">
                {organizationTypeLabels[orgType] || orgType}
              </span>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">{actions}</div>
        )}
      </header>

      {hasDetails && (
        <dl className="mt-5 flex flex-col gap-5 border-t border-border pt-5 sm:mt-6 sm:gap-6 sm:pt-6">
          <Detail label="Đơn vị chủ quản" value={fanpage.parentOrg} />
          <Detail
            id="fp-desc"
            label="Giới thiệu"
            value={fanpage.description}
            control={descriptionControl}
          />
          <Detail
            id="fp-email"
            label="Email hỗ trợ"
            value={fanpage.email}
            href={`mailto:${fanpage.email}`}
            control={emailControl}
          />
          <Detail
            id="fp-phone"
            label="Số điện thoại"
            value={fanpage.phone}
            href={`tel:${fanpage.phone?.replace(/[^+\d]/g, '')}`}
            control={phoneControl}
          />
        </dl>
      )}
    </article>
  )
}
