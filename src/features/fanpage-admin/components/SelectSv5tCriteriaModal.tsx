import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Sv5tCriteriaItem } from '../types/fanpageAdmin.types'

export interface SelectedSv5tCriteria {
  id: number
  name: string
  code?: string
  standardName?: string
  scope?: string
  requiredOccurrences?: number
  note?: string | null
}
interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selected: SelectedSv5tCriteria[]) => void
  initialSelected?: SelectedSv5tCriteria[]
  criterias: Sv5tCriteriaItem[]
}
export const SCOPE_LABELS: Record<string, string> = {
  UNIVERSITY: 'Cấp trường',
  SCHOOL: 'Cấp cơ sở',
  FACULTY: 'Cấp khoa',
  DEPARTMENT: 'Cấp khoa',
  PROVINCE: 'Cấp tỉnh',
  CENTRAL: 'Cấp Trung ương',
  NATIONAL: 'Cấp Trung ương',
}

// Accept both API shapes without inventing selectable IDs when the catalogue is unavailable.
export function buildCriteriaTree(items: Sv5tCriteriaItem[]): Sv5tCriteriaItem[] {
  const map = new Map<number, Sv5tCriteriaItem>()
  const collect = (nodes: Sv5tCriteriaItem[], parentId: number | null = null, scope?: string) => {
    nodes.forEach((node) => {
      map.set(node.id, {
        ...node,
        parentId: node.parentId ?? parentId,
        scope: node.scope || scope,
        children: [],
      })
      collect(node.children || [], node.id, node.scope || scope)
    })
  }
  collect(items)
  const roots: Sv5tCriteriaItem[] = []
  map.forEach((node) => {
    if (node.isActive === false) return
    const parent = node.parentId == null ? undefined : map.get(node.parentId)
    if (parent && parent.isActive !== false) parent.children!.push(node)
    else if (!parent) roots.push(node)
  })
  const sort = (nodes: Sv5tCriteriaItem[]) => {
    nodes.sort((a, b) => a.childrenOrder - b.childrenOrder || a.id - b.id)
    nodes.forEach((node) => sort(node.children || []))
  }
  sort(roots)
  return roots.flatMap((node) =>
    node.level === 0 && node.children?.length ? node.children : [node]
  )
}

export function flattenCriteriaSelection(items: Sv5tCriteriaItem[]): SelectedSv5tCriteria[] {
  const result: SelectedSv5tCriteria[] = []
  const walk = (node: Sv5tCriteriaItem, standard: Sv5tCriteriaItem, code: string) => {
    if (node.children?.length)
      node.children.forEach((child) => walk(child, standard, `${code}.${child.childrenOrder}`))
    else if (node.id !== standard.id)
      result.push({
        id: node.id,
        name: node.name,
        code,
        standardName: standard.name,
        scope: node.scope || standard.scope,
        note: node.note,
        requiredOccurrences: node.requiredOccurrences || 1,
      })
  }
  buildCriteriaTree(items).forEach((standard) =>
    walk(standard, standard, String(standard.childrenOrder))
  )
  return result
}

export function SelectSv5tCriteriaModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelected,
  criterias,
}: Props) {
  const [selected, setSelected] = useState<SelectedSv5tCriteria[]>([])
  const [scope, setScope] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number[]>([])
  const standards = useMemo(() => buildCriteriaTree(criterias), [criterias])
  const leaves = useMemo(() => flattenCriteriaSelection(criterias), [criterias])
  const scopes = [...new Set(standards.map((node) => node.scope).filter(Boolean))] as string[]
  useEffect(() => {
    if (!isOpen) return
    setSelected(initialSelected || [])
    setScope('')
    setSearch('')
    setExpanded([])
  }, [isOpen, initialSelected])
  const toggle = (leaf: SelectedSv5tCriteria) =>
    setSelected((current) =>
      current.some((item) => item.id === leaf.id)
        ? current.filter((item) => item.id !== leaf.id)
        : [...current, leaf]
    )

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="font-k2d text-lg font-semibold text-foreground">
                Tiêu chí Sinh viên 5 tốt
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Chọn cấp xét, mở mục lớn và chọn các tiêu chí con phù hợp.
              </Dialog.Description>
            </div>
            <Button variant="ghost" size="icon" aria-label="Đóng" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sv5t-scope">Cấp xét</Label>
                  <Select
                    value={scope}
                    onValueChange={(value) => {
                      setScope(value)
                      setExpanded([])
                      setSearch('')
                    }}
                  >
                    <SelectTrigger id="sv5t-scope">
                      <SelectValue placeholder="Chọn cấp xét" />
                    </SelectTrigger>
                    <SelectContent>
                      {scopes.map((value) => (
                        <SelectItem key={value} value={value}>
                          {SCOPE_LABELS[value] || value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sv5t-search">Tìm tiêu chí</Label>
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      id="sv5t-search"
                      disabled={!scope}
                      className="pl-9"
                      placeholder="Tên hoặc mã tiêu chí"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>
              </div>
              {!standards.length && (
                <p role="status" className="text-sm text-muted-foreground">
                  Chưa tải được danh mục tiêu chí. Vui lòng đóng và thử lại.
                </p>
              )}
              {scope &&
                standards
                  .filter((standard) => standard.scope === scope)
                  .map((standard) => {
                    const rows = leaves.filter(
                      (leaf) => leaf.standardName === standard.name && leaf.scope === scope
                    )
                    const matches = rows.filter((leaf) =>
                      `${leaf.code} ${leaf.name} ${leaf.note || ''}`
                        .toLocaleLowerCase('vi')
                        .includes(search.toLocaleLowerCase('vi'))
                    )
                    if (search && !matches.length) return null
                    const open = expanded.includes(standard.id) || !!search
                    const count = rows.filter((leaf) =>
                      selected.some((item) => item.id === leaf.id)
                    ).length
                    return (
                      <div
                        key={standard.id}
                        className="overflow-hidden rounded-xl border border-border"
                      >
                        <Button
                          variant="ghost"
                          aria-expanded={open}
                          className="h-auto w-full justify-between gap-3 whitespace-normal rounded-none bg-card p-4 text-left"
                          onClick={() =>
                            setExpanded((current) =>
                              current.includes(standard.id)
                                ? current.filter((id) => id !== standard.id)
                                : [...current, standard.id]
                            )
                          }
                        >
                          <span>
                            {standard.name}
                            {count > 0 && (
                              <span className="ml-2 text-xs text-primary">{count} đã chọn</span>
                            )}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={`h-4 w-4 shrink-0 ${open ? 'rotate-180' : ''}`}
                          />
                        </Button>
                        {open && (
                          <div className="flex flex-col gap-1 border-t border-border p-2">
                            {matches.map((leaf) => {
                              const checked = selected.some((item) => item.id === leaf.id)
                              return (
                                <Button
                                  key={leaf.id}
                                  variant="ghost"
                                  role="checkbox"
                                  aria-checked={checked}
                                  onClick={() => toggle(leaf)}
                                  className={`h-auto items-start justify-start gap-3 whitespace-normal p-3 text-left font-normal ${checked ? 'bg-brand-subtle text-brand-subtle-foreground' : ''}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}
                                  >
                                    {checked && <Check className="h-3 w-3" />}
                                  </span>
                                  <span className="flex min-w-0 flex-col gap-1">
                                    <span className="text-sm">
                                      {leaf.code}. {leaf.name}
                                    </span>
                                    {leaf.note && leaf.note !== leaf.name && (
                                      <span className="text-xs text-muted-foreground">
                                        {leaf.note}
                                      </span>
                                    )}
                                    {(leaf.requiredOccurrences || 1) > 1 && (
                                      <span className="text-xs font-medium text-primary">
                                        Mỗi sự kiện hoàn tất ghi nhận 1 lần · Đủ{' '}
                                        {leaf.requiredOccurrences} lần trong năm học mới đạt
                                      </span>
                                    )}
                                  </span>
                                </Button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
              {!!selected.length && (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <p className="text-sm font-medium">Đã chọn ({selected.length})</p>
                  {selected.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span>
                        {SCOPE_LABELS[item.scope || ''] || item.scope} · {item.standardName} ·{' '}
                        {item.name}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Bỏ chọn ${item.name}`}
                        onClick={() => toggle(item)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card p-4">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                onConfirm(selected)
                onClose()
              }}
            >
              Xác nhận{selected.length > 0 ? ` (${selected.length})` : ''}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
