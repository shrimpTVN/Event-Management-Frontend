import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronRight, Edit2, Info, MoreHorizontal, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import { getMeaningfulCriterionNote } from '@/shared/utils/criterionNote'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CatalogDialog } from './CatalogDialog'
import { catalogError } from './catalogTree'
import { flattenTree } from './catalogTree'

interface Item {
  id: number
  name: string
  note?: string
  maximum?: number
  scope?: string
  isActive: boolean
  isMaxChild?: boolean
  parentCategoryId?: number | null
}
interface Props<T extends Item & { children?: T[] }> {
  items: T[]
  kind: 'points' | 'sv5t'
  onCreate: (parent?: T) => void
  onEdit: (item: T) => void
  onToggle: (id: number) => Promise<void>
  onToggleMaxChild?: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

function Actions({
  name,
  active,
  isMaxChild,
  maxChildUnavailable,
  disabled,
  toggleUnavailable,
  onToggle,
  onToggleMaxChild,
  onDelete,
}: {
  name: string
  active: boolean
  isMaxChild?: boolean
  maxChildUnavailable?: string
  disabled: boolean
  toggleUnavailable?: string
  onToggle: () => void
  onToggleMaxChild?: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus()
    const close = (event: PointerEvent) => {
      if (
        !ref.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      )
        setOpen(false)
    }
    const closeOnScroll = () => setOpen(false)
    document.addEventListener('pointerdown', close)
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnScroll)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnScroll)
    }
  }, [open])
  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node | null) &&
          !menuRef.current?.contains(event.relatedTarget as Node | null)
        )
          setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          ref.current?.querySelector<HTMLButtonElement>('[aria-haspopup]')?.focus()
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          const options = [
            ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
              '[role="menuitem"]:not(:disabled)'
            ) ?? []),
          ]
          if (!options.length) return
          event.preventDefault()
          const index = options.indexOf(document.activeElement as HTMLButtonElement)
          options[
            (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
          ]?.focus()
        }
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        aria-label={`Thao tác với ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({
            left: Math.max(8, rect.right - 208),
            top:
              rect.bottom + 92 > window.innerHeight ? Math.max(8, rect.top - 88) : rect.bottom + 4,
          })
          setOpen(!open)
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Thao tác với ${name}`}
            style={position}
            className="fixed z-40 w-52 rounded-lg border border-border bg-background p-1 shadow-lg"
          >
            <Button
              role="menuitem"
              disabled={Boolean(toggleUnavailable)}
              title={toggleUnavailable}
              variant="ghost"
              className="h-9 w-full justify-start text-xs"
              onClick={() => {
                setOpen(false)
                onToggle()
              }}
            >
              {active ? 'Tạm ngưng áp dụng' : 'Áp dụng trở lại'}
            </Button>
            {onToggleMaxChild && (
              <Button
                role="menuitem"
                disabled={Boolean(maxChildUnavailable)}
                title={maxChildUnavailable}
                variant="ghost"
                className="h-9 w-full justify-start text-xs"
                onClick={() => {
                  setOpen(false)
                  onToggleMaxChild()
                }}
              >
                {isMaxChild ? 'Tắt lấy điểm max mục con' : 'Bật lấy điểm max mục con'}
              </Button>
            )}
            <Button
              role="menuitem"
              variant="ghost"
              className="h-9 w-full justify-start text-xs text-destructive"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
            >
              Xóa tiêu chí
            </Button>
          </div>,
          document.body
        )}
    </div>
  )
}

export function CatalogTreeView<T extends Item & { children?: T[] }>({
  items,
  kind,
  onCreate,
  onEdit,
  onToggle,
  onToggleMaxChild,
  onDelete,
}: Props<T>) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [scope, setScope] = useState('ALL')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [expandAll, setExpandAll] = useState(true)
  const [pending, setPending] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<T | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const points = kind === 'points'
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
  const needle = normalize(search.trim())
  const filtering = Boolean(needle || status !== 'ALL' || scope !== 'ALL')
  const matches = (item: T) =>
    (!needle || normalize(`${item.name} ${item.note ?? ''}`).includes(needle)) &&
    (status === 'ALL' || item.isActive === (status === 'ACTIVE')) &&
    (scope === 'ALL' || item.scope === scope)
  const keep = (item: T): boolean => matches(item) || (item.children ?? []).some(keep)
  const visible = items.filter(keep)
  const isOpen = (id: number) => (expandAll ? !expanded.has(id) : expanded.has(id))
  const toggle = (id: number) =>
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const runToggle = async (item: T) => {
    setPending(item.id)
    setError('')
    try {
      await onToggle(item.id)
    } catch (err) {
      setError(catalogError(err))
    } finally {
      setPending(null)
    }
  }
  const runToggleMaxChild = async (item: T) => {
    if (!onToggleMaxChild) return
    setPending(item.id)
    setError('')
    try {
      await onToggleMaxChild(item.id)
    } catch (err) {
      setError(catalogError(err))
    } finally {
      setPending(null)
    }
  }
  const remove = async () => {
    if (!deleting) return
    if (flattenTree(deleting.children ?? []).some((item) => item.isActive)) {
      setDeleteError('Hãy ngừng áp dụng các tiêu chí con trước khi xóa mục này.')
      return
    }
    setPending(deleting.id)
    setDeleteError('')
    try {
      await onDelete(deleting.id)
      setDeleting(null)
    } catch (err) {
      setDeleteError(catalogError(err))
    } finally {
      setPending(null)
    }
  }
  const renderRow = (item: T, depth = 0) => {
    const rootPoint = points && item.parentCategoryId == null
    const editUnavailable = rootPoint
      ? 'API hiện tại chưa hỗ trợ chỉnh sửa mục gốc ĐRL.'
      : !points && !item.isActive
        ? 'Áp dụng lại tiêu chí trước khi chỉnh sửa.'
        : undefined
    const children = (item.children ?? []).filter(keep)
    const hasChildren = Boolean(item.children?.length)
    const opened = filtering || isOpen(item.id)
    const displayNote = getMeaningfulCriterionNote(item.name, item.note)
    return (
      <Fragment key={item.id}>
        <tr
          className={`group/row border-b border-border/60 transition-colors ${
            depth === 0
              ? 'bg-muted/35'
              : depth === 1
                ? 'bg-muted/15 hover:bg-muted/25'
                : 'hover:bg-muted/20'
          } ${filtering && !matches(item) ? 'text-muted-foreground' : ''}`}
        >
          <td className="px-4 py-2.5">
            <div className="flex items-start gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 shrink-0 p-0"
                  aria-label={`${opened ? 'Thu gọn' : 'Mở rộng'} ${item.name}`}
                  aria-expanded={opened}
                  disabled={filtering}
                  onClick={() => toggle(item.id)}
                >
                  {opened ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="w-7 shrink-0" />
              )}
              <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm leading-snug ${depth === 0 ? 'font-semibold' : 'font-medium'}`}>
                    {item.name}
                  </p>
                  {points && item.isMaxChild && (
                    <Tooltip content="Mục này lấy điểm cao nhất trong các tiêu chí con (không cộng dồn)">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 cursor-pointer">
                        <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>Max con</span>
                      </span>
                    </Tooltip>
                  )}
                </div>
                {displayNote && (
                  <p className="text-xs font-normal text-muted-foreground leading-snug">
                    {displayNote}
                  </p>
                )}
              </div>
            </div>
          </td>
          <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm tabular-nums">
            {points
              ? `${item.maximum ?? 0} điểm`
              : item.scope === 'FACULTY'
                ? 'Cấp Trường CNTT&TT'
                : 'Cấp ĐHCT'}
          </td>
          <td className="whitespace-nowrap px-4 py-2.5">
            <span className="inline-flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`}
              />
              {item.isActive ? 'Áp dụng' : 'Tạm ngưng'}
            </span>
          </td>
          <td className="px-4 py-2.5">
            <div className="flex justify-end gap-1 opacity-75 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={`Thêm tiêu chí con vào ${item.name}`}
                title="Thêm tiêu chí con"
                disabled={pending !== null || !item.isActive}
                onClick={() => onCreate(item)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={`Chỉnh sửa ${item.name}`}
                title={editUnavailable ?? 'Chỉnh sửa'}
                disabled={pending !== null || Boolean(editUnavailable)}
                onClick={() => onEdit(item)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Actions
                name={item.name}
                active={item.isActive}
                isMaxChild={item.isMaxChild}
                maxChildUnavailable={
                  rootPoint ? 'API hiện tại chưa hỗ trợ chỉnh sửa mục gốc ĐRL.' : undefined
                }
                disabled={pending !== null}
                toggleUnavailable={
                  rootPoint ? 'API hiện tại chưa hỗ trợ đổi trạng thái mục gốc ĐRL.' : undefined
                }
                onToggle={() => void runToggle(item)}
                onToggleMaxChild={
                  points && onToggleMaxChild ? () => void runToggleMaxChild(item) : undefined
                }
                onDelete={() => {
                  setDeleteError('')
                  setDeleting(item)
                }}
              />
            </div>
          </td>
        </tr>
        {opened && children.map((child) => renderRow(child, depth + 1))}
      </Fragment>
    )
  }
  return (
    <div className="flex w-full flex-col gap-5 text-left">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            Dữ liệu danh mục / {points ? 'Điểm rèn luyện' : 'Sinh viên 5 tốt'}
          </p>
          <h1 className="font-k2d text-2xl font-bold">
            {points ? 'Khung tiêu chí điểm rèn luyện' : 'Tiêu chí Sinh viên 5 tốt'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {points
              ? 'Quản lý nhóm điểm và tiêu chí đánh giá. Mục gốc hiện chỉ hỗ trợ thêm và xóa.'
              : 'Quản lý tiêu chuẩn và điều kiện xét chọn.'}
          </p>
        </div>
        <Button className="h-10 shrink-0 gap-2 self-start sm:self-auto" onClick={() => onCreate()}>
          <Plus className="h-4 w-4" />
          {points ? 'Thêm mục lớn' : 'Thêm tiêu chuẩn'}
        </Button>
      </header>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Tìm tiêu chí"
            placeholder="Tìm tên, mã tiêu chí..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Trạng thái" className="h-10 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Mọi trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang áp dụng</SelectItem>
            <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
          </SelectContent>
        </Select>
        {!points && (
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger aria-label="Phạm vi xét chọn" className="h-10 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi phạm vi</SelectItem>
              <SelectItem value="UNIVERSITY">Cấp ĐHCT</SelectItem>
              <SelectItem value="FACULTY">Cấp Trường CNTT&amp;TT</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button
          variant="ghost"
          className="h-10 text-primary"
          disabled={filtering}
          onClick={() => {
            setExpandAll(!expandAll)
            setExpanded(new Set())
          }}
        >
          {expandAll ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="rounded-xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tên tiêu chí / Nội dung đánh giá</th>
                <th className="px-4 py-3 text-right font-medium">
                  {points ? 'Điểm tối đa' : 'Phạm vi'}
                </th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => renderRow(item))}
              {!visible.length && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-muted-foreground">
                    {items.length ? 'Không tìm thấy tiêu chí phù hợp.' : 'Chưa có tiêu chí.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CatalogDialog
        open={Boolean(deleting)}
        title="Xóa tiêu chí?"
        description={deleting?.name ?? ''}
        busy={pending !== null}
        onClose={() => setDeleting(null)}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {points && deleting?.parentCategoryId == null
              ? 'Mục này sẽ ngừng áp dụng và vẫn được giữ trong lịch sử. API hiện tại chưa hỗ trợ khôi phục mục gốc ĐRL.'
              : 'Tiêu chí sẽ ngừng áp dụng và vẫn được giữ trong lịch sử. Bạn có thể áp dụng trở lại từ bộ lọc Tạm ngưng.'}
          </p>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={pending !== null} onClick={() => setDeleting(null)}>
              Hủy
            </Button>
            <Button variant="destructive" disabled={pending !== null} onClick={() => void remove()}>
              {pending !== null ? 'Đang xóa...' : 'Xóa tiêu chí'}
            </Button>
          </div>
        </div>
      </CatalogDialog>
    </div>
  )
}
