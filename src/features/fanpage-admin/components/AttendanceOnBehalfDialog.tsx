import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AttendanceTick } from './AttendanceTick'
import type { EventRegistrationItem } from '../types/fanpageAdmin.types'

type Session = 'START' | 'END'
const eligible = (row: EventRegistrationItem, session: Session) =>
  session === 'START'
    ? row.status === 'REGISTERED'
    : row.status === 'CHECKED_IN' || row.status === 'SELF_CHECKED_IN'

export function AttendanceOnBehalfDialog({
  rows,
  busy,
  readOnly,
  error,
  onSave,
  onClose,
}: {
  rows: EventRegistrationItem[]
  busy: boolean
  readOnly: boolean
  error?: string
  onSave: (session: Session, ids: string[]) => Promise<boolean>
  onClose: () => void
}) {
  const [session, setSession] = useState<Session>(() =>
    rows.some((row) => eligible(row, 'START')) ? 'START' : 'END'
  )
  const [search, setSearch] = useState('')
  const [excluded, setExcluded] = useState<Record<Session, string[]>>({ START: [], END: [] })
  const candidates = rows.filter((row) => eligible(row, session))
  const selected = candidates.filter((row) => !excluded[session].includes(row.id))
  const visible = candidates.filter((row) =>
    `${row.fullName} ${row.studentId} ${row.major}`
      .toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi'))
  )
  const allVisibleSelected =
    visible.length > 0 && visible.every((row) => !excluded[session].includes(row.id))
  const someVisibleSelected = visible.some((row) => !excluded[session].includes(row.id))
  const disabled = busy || readOnly
  const setSelected = (ids: string[], value: boolean) => {
    setExcluded((previous) => ({
      ...previous,
      [session]: value
        ? previous[session].filter((id) => !ids.includes(id))
        : [...new Set([...previous[session], ...ids])],
    }))
  }
  return (
    <Dialog.Root open onOpenChange={(open) => !open && !busy && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-hidden rounded-xl border border-border bg-background p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="font-k2d text-lg font-semibold">Điểm danh thay</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                BTC điểm danh trực tiếp, không cần ảnh minh chứng.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={busy}
                aria-label="Đóng điểm danh thay"
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div
            role="tablist"
            aria-label="Lượt điểm danh thay"
            className="flex gap-1 self-start rounded-lg bg-muted p-1"
          >
            {(['START', 'END'] as const).map((step) => (
              <Button
                key={step}
                type="button"
                role="tab"
                size="sm"
                variant="ghost"
                aria-selected={session === step}
                tabIndex={session === step ? 0 : -1}
                disabled={disabled}
                className={
                  session === step
                    ? 'h-8 bg-background shadow-sm hover:bg-background'
                    : 'h-8 text-muted-foreground'
                }
                onKeyDown={(e) => {
                  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                    e.preventDefault()
                    const next =
                      e.key === 'Home'
                        ? 'START'
                        : e.key === 'End'
                          ? 'END'
                          : step === 'START'
                            ? 'END'
                            : 'START'
                    setSession(next)
                    const tabs =
                      e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                        '[role="tab"]'
                      )
                    tabs?.[next === 'START' ? 0 : 1]?.focus()
                  }
                }}
                onClick={() => setSession(step)}
              >
                {step === 'START' ? 'Check-in' : 'Check-out'} (
                {rows.filter((row) => eligible(row, step)).length})
              </Button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Tìm sinh viên điểm danh thay"
              placeholder="Tìm tên, MSSV, ngành..."
              value={search}
              disabled={busy}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs text-muted-foreground">
            <AttendanceTick
              compact
              label="Chọn tất cả"
              name="điểm danh thay đang lọc"
              disabled={disabled || visible.length === 0}
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onChange={() =>
                setSelected(
                  visible.map((row) => row.id),
                  !allVisibleSelected
                )
              }
            />
            <span>
              Đã chọn {selected.length}/{candidates.length}
            </span>
          </div>
          <div
            role="tabpanel"
            aria-label={session === 'START' ? 'Sinh viên chưa check-in' : 'Sinh viên đã check-in'}
            className="min-h-0 overflow-y-auto"
          >
            {visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {candidates.length === 0
                  ? 'Không có sinh viên cần ' + (session === 'START' ? 'check-in.' : 'check-out.')
                  : 'Không tìm thấy sinh viên phù hợp.'}
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {visible.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-2 rounded-lg px-1 py-2 hover:bg-muted/40"
                  >
                    <AttendanceTick
                      compact
                      label={session === 'START' ? 'Check-in thay' : 'Check-out thay'}
                      name={row.fullName}
                      disabled={disabled}
                      checked={!excluded[session].includes(row.id)}
                      onChange={() => setSelected([row.id], excluded[session].includes(row.id))}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.studentId}
                        {row.major ? ' · ' + row.major : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disabled || selected.length === 0}
              onClick={async () => {
                if (
                  await onSave(
                    session,
                    selected.map((row) => row.id)
                  )
                )
                  onClose()
              }}
            >
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {busy ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
