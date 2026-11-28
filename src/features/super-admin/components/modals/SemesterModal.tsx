import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { resolveApiErrorMessage } from '@/shared/utils/apiError'
import { CatalogDialog } from '../CatalogDialog'
import { adminStatisticsService } from '../../services/adminStatisticsService'
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
import type { SuperAdminSemester } from '../../types/superAdmin.types'

export function SemesterModal({
  semester,
  semesters = [],
  isOpen,
  onClose,
  onSave,
}: {
  semester: SuperAdminSemester | null
  semesters?: SuperAdminSemester[]
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<SuperAdminSemester>) => void | Promise<void>
}) {
  const [yearId, setYearId] = useState('')
  const [number, setNumber] = useState('1')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const years = useQuery({
    queryKey: ['academic-years', 'admin-statistics'],
    queryFn: adminStatisticsService.getAcademicYears,
    enabled: isOpen,
    staleTime: 60_000,
    retry: false,
  })
  useEffect(() => {
    if (isOpen) {
      setYearId(semester?.academicYearId ? String(semester.academicYearId) : '')
      setNumber(String(semester?.number || 1))
      setStartDate(semester?.startDate || '')
      setEndDate(semester?.endDate || '')
      setError('')
    }
  }, [semester, isOpen])
  const year = years.data?.find((item) => String(item.id) === yearId)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!year || !startDate || !endDate) {
      setError('Vui lòng chọn năm học và nhập đủ thời gian học kỳ.')
      return
    }
    if (endDate <= startDate) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.')
      return
    }
    if (
      (year.startDate && startDate < year.startDate) ||
      (year.endDate && endDate > year.endDate)
    ) {
      setError('Thời gian học kỳ phải nằm trong năm học đã chọn.')
      return
    }
    if (
      semesters.some(
        (item) =>
          item.id !== semester?.id &&
          item.academicYearId === year.id &&
          item.number === Number(number)
      )
    ) {
      setError('Năm học này đã có học kỳ đã chọn.')
      return
    }
    if (
      semesters.some(
        (item) =>
          item.id !== semester?.id &&
          item.isActive &&
          item.startDate <= endDate &&
          item.endDate >= startDate
      )
    ) {
      setError('Thời gian học kỳ trùng với học kỳ khác.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: semester?.id,
        academicYearId: year.id,
        academicYear: year.code,
        number: Number(number),
        startDate,
        endDate,
        isActive: semester?.isActive ?? true,
      })
      onClose()
    } catch (err: any) {
      setError(resolveApiErrorMessage(err, 'Không thể lưu học kỳ. Vui lòng thử lại.'))
    } finally {
      setSaving(false)
    }
  }
  return (
    <CatalogDialog
      open={isOpen}
      title={semester ? 'Chỉnh sửa học kỳ' : 'Thêm học kỳ'}
      description="Tiến trình học kỳ được xác định theo ngày bắt đầu và kết thúc."
      onClose={onClose}
      busy={saving}
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        {years.isError ? (
          <div role="alert" className="text-sm text-destructive">
            Không tải được năm học.
            <Button type="button" variant="ghost" onClick={() => void years.refetch()}>
              Thử lại
            </Button>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Năm học</Label>
            <Select
              value={yearId}
              onValueChange={setYearId}
              disabled={years.isPending || years.isError}
            >
              <SelectTrigger aria-label="Năm học của học kỳ">
                <SelectValue placeholder="Chọn năm học" />
              </SelectTrigger>
              <SelectContent>
                {years.data?.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Học kỳ</Label>
            <Select value={number} onValueChange={setNumber}>
              <SelectTrigger aria-label="Số học kỳ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3].map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    Học kỳ {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="semester-start">Ngày bắt đầu</Label>
            <Input
              id="semester-start"
              type="date"
              required
              min={year?.startDate || undefined}
              max={year?.endDate || undefined}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="semester-end">Ngày kết thúc</Label>
            <Input
              id="semester-end"
              type="date"
              required
              min={startDate || year?.startDate || undefined}
              max={year?.endDate || undefined}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
        {!years.isPending && !years.isError && !years.data?.length && (
          <p className="text-sm text-muted-foreground">Chưa có năm học trong danh mục.</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={saving || !year}>
            {saving ? 'Đang lưu…' : 'Lưu học kỳ'}
          </Button>
        </div>
      </form>
    </CatalogDialog>
  )
}
