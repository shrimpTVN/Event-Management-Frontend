import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CatalogDialog } from '../CatalogDialog'
import { catalogError } from '../catalogTree'
import type {
  SuperAdminPointCategory,
  SuperAdminSv5tCriteria,
  Sv5tScope,
} from '../../types/superAdmin.types'

export type CatalogFormData = Partial<
  Omit<SuperAdminPointCategory & SuperAdminSv5tCriteria, 'children'>
>

export function CatalogEditor({
  kind,
  item,
  parent,
  onSave,
  onClose,
}: {
  kind: 'points' | 'sv5t'
  item?: (CatalogFormData & { children?: unknown[] }) | null
  parent?: { id: number; name: string; level: number; scope?: Sv5tScope } | null
  onSave: (data: CatalogFormData) => Promise<void>
  onClose: () => void
}) {
  const hasChildren = Boolean(item?.children && item.children.length > 0)
  const points = kind === 'points'
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [name, setName] = useState(item?.name ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [maximum, setMaximum] = useState(String(item?.maximum ?? 5))
  const [dateApply, setDateApply] = useState(item?.dateApply ?? today)
  const [order, setOrder] = useState(String(item?.childrenOrder ?? 1))
  const [isMaxChild, setIsMaxChild] = useState(Boolean(item?.isMaxChild))
  const [scope, setScope] = useState<Sv5tScope>(item?.scope ?? parent?.scope ?? 'UNIVERSITY')
  const [requiredChildren, setRequiredChildren] = useState(
    item?.requiredChildren == null ? '' : String(item.requiredChildren)
  )
  const [requiredOccurrences, setRequiredOccurrences] = useState(
    String(item?.requiredOccurrences ?? 1)
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (!name.trim()) {
      setError('Vui lòng nhập tên tiêu chí.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({
        ...item,
        name: name.trim(),
        note: note.trim(),
        childrenOrder: Number(order),
        level: item?.level ?? (parent ? parent.level + 1 : 0),
        ...(points
          ? {
              maximum: Number(maximum),
              dateApply,
              parentCategoryId: item?.parentCategoryId ?? parent?.id ?? null,
              isMaxChild,
            }
          : {
              scope: parent?.scope ?? scope,
              parentId: item?.parentId ?? parent?.id ?? null,
              requiredChildren: requiredChildren ? Number(requiredChildren) : null,
              requiredOccurrences: Number(requiredOccurrences),
            }),
        isActive: item?.isActive ?? true,
      })
      onClose()
    } catch (err) {
      setError(catalogError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <CatalogDialog
      open
      title={`${item?.id ? 'Chỉnh sửa' : 'Thêm'} tiêu chí ${points ? 'ĐRL' : 'SV5T'}`}
      description={parent ? `Thuộc mục: ${parent.name}` : 'Mục gốc'}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="catalog-name">Tên tiêu chí</Label>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {name.length}/255
              </span>
            </div>
            <Textarea
              id="catalog-name"
              required
              rows={2}
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nhập tên tiêu chí"
              className="min-h-[60px] resize-y"
            />
          </div>
          {points ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:col-span-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-maximum">Điểm tối đa</Label>
                <Input
                  id="catalog-maximum"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  required
                  value={maximum}
                  onChange={(event) => setMaximum(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-order">Thứ tự hiển thị</Label>
                <Input
                  id="catalog-order"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-date">Ngày áp dụng</Label>
                <Input
                  id="catalog-date"
                  type="date"
                  required
                  value={dateApply}
                  onChange={(event) => setDateApply(event.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-scope">Phạm vi xét chọn</Label>
                <Select
                  value={parent?.scope ?? scope}
                  onValueChange={(value) => setScope(value as Sv5tScope)}
                  disabled={Boolean(parent)}
                >
                  <SelectTrigger id="catalog-scope">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIVERSITY">Cấp ĐHCT</SelectItem>
                    <SelectItem value="FACULTY">Cấp Trường CNTT&amp;TT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-occurrences">Số lần cần đạt</Label>
                <Input
                  id="catalog-occurrences"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={requiredOccurrences}
                  onChange={(event) => setRequiredOccurrences(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-children">Số điều kiện con cần đạt</Label>
                <Input
                  id="catalog-children"
                  required={item?.requiredChildren != null}
                  type="number"
                  min={1}
                  step={1}
                  value={requiredChildren}
                  onChange={(event) => setRequiredChildren(event.target.value)}
                  placeholder="Tất cả điều kiện con"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catalog-order">Thứ tự hiển thị</Label>
                <Input
                  id="catalog-order"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                />
              </div>
            </>
          )}
          {points && (
            <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-col gap-0.5 text-left">
                <Label htmlFor="catalog-is-max-child" className="cursor-pointer font-medium">
                  Lấy điểm cao nhất từ các mục con
                </Label>
                <p className="text-xs text-muted-foreground leading-snug">
                  Khi bật, mục này chỉ tính điểm của 01 tiêu chí con cao nhất thay vì cộng dồn
                  {!hasChildren ? ' (áp dụng khi có mục con).' : '.'}
                </p>
              </div>
              <button
                id="catalog-is-max-child"
                type="button"
                role="switch"
                aria-checked={isMaxChild}
                aria-label="Lấy điểm cao nhất từ các mục con"
                onClick={() => setIsMaxChild((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isMaxChild
                    ? 'border-primary bg-primary'
                    : 'border-border bg-muted-foreground/25'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    isMaxChild ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="catalog-note">Ghi chú / Hướng dẫn minh chứng</Label>
            <Textarea
              id="catalog-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nhập nội dung hướng dẫn"
              className="min-h-[64px] resize-y"
            />
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Đang lưu...' : 'Lưu tiêu chí'}
          </Button>
        </div>
      </form>
    </CatalogDialog>
  )
}
