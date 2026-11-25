import { useEffect, useState } from 'react'
import { CatalogDialog } from '../CatalogDialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SuperAdminSchool, SuperAdminMajor } from '../../types/superAdmin.types'

export function SchoolMajorModal({
  mode,
  school,
  major,
  currentSchoolId,
  currentSchoolName,
  isOpen,
  onClose,
  onSaveSchool,
  onSaveMajor,
}: {
  mode: 'school' | 'major'
  school: SuperAdminSchool | null
  major: SuperAdminMajor | null
  currentSchoolId?: number
  currentSchoolName?: string
  isOpen: boolean
  onClose: () => void
  onSaveSchool: (data: Partial<SuperAdminSchool>) => void | Promise<void>
  onSaveMajor: (data: Partial<SuperAdminMajor>) => void | Promise<void>
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setName(mode === 'school' ? school?.name || '' : major?.name || '')
    setCode(major?.code || '')
    setDescription(school?.description || '')
    setActive((mode === 'school' ? school?.isActive : major?.isActive) !== false)
    setError('')
  }, [mode, school, major, isOpen])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!name.trim() || (mode === 'major' && (!code.trim() || !currentSchoolId))) {
      setError('Vui lòng nhập đủ thông tin và chọn khoa/trường hợp lệ.')
      return
    }
    setSaving(true)
    try {
      if (mode === 'school')
        await onSaveSchool({
          id: school?.id,
          name: name.trim(),
          description: description.trim(),
          isActive: active,
        })
      else
        await onSaveMajor({
          id: major?.id,
          name: name.trim(),
          code: code.trim(),
          schoolId: currentSchoolId,
          isActive: active,
        })
      onClose()
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Không thể lưu danh mục. Vui lòng thử lại.'
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <CatalogDialog
      open={isOpen}
      onClose={onClose}
      title={
        mode === 'school'
          ? school
            ? 'Chỉnh sửa Khoa/Trường'
            : 'Thêm Khoa/Trường'
          : major
            ? 'Chỉnh sửa ngành học'
            : 'Thêm ngành học'
      }
      busy={saving}
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        {mode === 'major' && (
          <p className="rounded-lg bg-muted/50 p-3 text-sm">
            Khoa/Trường: <strong>{currentSchoolName || 'Chưa chọn đơn vị'}</strong>
          </p>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {mode === 'major' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="catalog-code">Mã ngành</Label>
              <Input
                id="catalog-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </div>
          )}
          <div className={`flex flex-col gap-2 ${mode === 'school' ? 'md:col-span-2' : ''}`}>
            <Label htmlFor="catalog-name">
              {mode === 'school' ? 'Tên Khoa/Trường' : 'Tên ngành'}
            </Label>
            <Input
              id="catalog-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          {mode === 'school' && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="catalog-description">Mô tả</Label>
              <Textarea
                id="catalog-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          )}
          {(school || major) && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Trạng thái sử dụng</Label>
              <Select
                value={active ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(value) => setActive(value === 'ACTIVE')}
              >
                <SelectTrigger aria-label="Trạng thái sử dụng">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Đang sử dụng</SelectItem>
                  <SelectItem value="INACTIVE">Ngừng sử dụng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={saving || (mode === 'major' && !currentSchoolId)}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </CatalogDialog>
  )
}
