import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { FanpageSearchItem } from '../services/fanpageSearchService'

const orgLabel = (type: string) =>
  ({ YOUTH_UNION: 'Đoàn / Hội', CLUB: 'Câu lạc bộ' })[type as 'YOUTH_UNION' | 'CLUB'] || type

export function FanpageSearchResults({
  items,
  followedIds,
}: {
  items: FanpageSearchItem[]
  followedIds: Set<string>
}) {
  return (
    <div className="flex flex-col gap-2" aria-label="Kết quả fanpage">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/fanpage/${item.id}`}
          className="group flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-background p-3 hover:bg-muted/50 sm:p-4"
        >
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="font-heading text-sm font-semibold text-foreground">{item.name}</h3>
            {item.orgType && (
              <p className="text-xs text-muted-foreground">{orgLabel(item.orgType)}</p>
            )}
            {followedIds.has(item.id) && <span className="text-xs text-primary">Đã theo dõi</span>}
          </div>
          <span aria-hidden="true" className="hidden text-xs text-primary group-hover:inline">
            Đi tới trang này →
          </span>
        </Link>
      ))}
    </div>
  )
}

export function FanpageSearchFilters({
  orgTypes,
  orgType,
  following,
  authenticated,
  onChange,
}: {
  orgTypes: string[]
  orgType: string
  following: string
  authenticated: boolean
  onChange: (orgType: string, following: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draftType, setDraftType] = useState(orgType)
  const [draftFollowing, setDraftFollowing] = useState(following)
  const count = Number(Boolean(orgType)) + Number(Boolean(following))
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        className="h-10 gap-2"
        aria-label="Bộ lọc fanpage"
        onClick={() => {
          setDraftType(orgType)
          setDraftFollowing(following)
          setOpen(true)
        }}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Bộ lọc{count > 0 ? ` · ${count}` : ''}
      </Button>
      {count > 0 && (
        <>
          {orgType && (
            <Button
              variant="ghost"
              aria-label="Bỏ lọc loại đơn vị"
              className="h-10 bg-primary/5 text-xs text-primary"
              onClick={() => onChange('', following)}
            >
              {orgLabel(orgType)} ×
            </Button>
          )}
          {following && (
            <Button
              variant="ghost"
              aria-label="Bỏ lọc theo dõi"
              className="h-10 bg-primary/5 text-xs text-primary"
              onClick={() => onChange(orgType, '')}
            >
              {following === 'yes' ? 'Đã theo dõi' : 'Chưa theo dõi'} ×
            </Button>
          )}
          <Button variant="ghost" className="h-10 text-xs" onClick={() => onChange('', '')}>
            Xóa lọc fanpage
          </Button>
        </>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-w-xl flex-col gap-5 rounded-t-xl px-4 pb-[max(20px,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>Bộ lọc fanpage</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-medium">Loại đơn vị</span>
              <Select
                value={draftType || 'all'}
                onValueChange={(value) => setDraftType(value === 'all' ? '' : value)}
              >
                <SelectTrigger aria-label="Loại đơn vị">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả đơn vị</SelectItem>
                  {orgTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {orgLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {authenticated && (
              <div className="flex min-w-0 flex-col gap-2">
                <span className="text-sm font-medium">Theo dõi</span>
                <Select
                  value={draftFollowing || 'all'}
                  onValueChange={(value) => setDraftFollowing(value === 'all' ? '' : value)}
                >
                  <SelectTrigger aria-label="Trạng thái theo dõi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả fanpage</SelectItem>
                    <SelectItem value="yes">Đã theo dõi</SelectItem>
                    <SelectItem value="no">Chưa theo dõi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDraftType('')
                setDraftFollowing('')
              }}
            >
              Đặt lại
            </Button>
            <Button
              onClick={() => {
                onChange(draftType, draftFollowing)
                setOpen(false)
              }}
            >
              Áp dụng
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
