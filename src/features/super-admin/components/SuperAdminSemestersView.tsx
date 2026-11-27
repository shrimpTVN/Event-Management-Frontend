import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminBadge } from './AdminDetails'
import { adminStatisticsService } from '../services/adminStatisticsService'
import type { SuperAdminSemester } from '../types/superAdmin.types'

const date = (value: string) =>
  value ? new Date(value + 'T00:00:00').toLocaleDateString('vi-VN') : 'Chưa cập nhật'
export function SuperAdminSemestersView({
  semesters,
  onOpenCreateModal,
  onOpenEditModal,
}: {
  semesters: SuperAdminSemester[]
  onOpenCreateModal: () => void
  onOpenEditModal: (semester: SuperAdminSemester) => void
}) {
  const [yearId, setYearId] = useState('ALL')
  const years = useQuery({
    queryKey: ['academic-years', 'admin-statistics'],
    queryFn: adminStatisticsService.getAcademicYears,
    staleTime: 60_000,
    retry: false,
  })
  const yearNames = new Map(years.data?.map((year) => [year.id, year.code]))
  const filtered = semesters
    .filter((item) => yearId === 'ALL' || item.academicYearId === Number(yearId))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.number - b.number)
  const current = semesters.find((item) => item.isCurrent)
  return (
    <div className="flex flex-col gap-5 text-left">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Dữ liệu danh mục</p>
          <h1 className="font-k2d text-2xl font-bold">Năm học & Học kỳ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các kỳ tính điểm rèn luyện và xét Sinh viên 5 tốt.
          </p>
        </div>
        <Button className="h-10 gap-2" onClick={onOpenCreateModal}>
          <Plus className="h-4 w-4" />
          Thêm học kỳ mới
        </Button>
      </header>
      {current && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-primary">Học kỳ hiện hành</p>
            <p className="text-sm font-semibold">
              Học kỳ {current.number} ·{' '}
              {yearNames.get(current.academicYearId!) || current.academicYear || 'Chưa có năm học'}
            </p>
            <p className="text-xs text-muted-foreground">
              {date(current.startDate)} – {date(current.endDate)}
            </p>
          </div>
          <Button variant="outline" className="h-9" onClick={() => onOpenEditModal(current)}>
            Chỉnh sửa
          </Button>
        </div>
      )}
      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select
            value={yearId}
            onValueChange={setYearId}
            disabled={years.isPending || years.isError}
          >
            <SelectTrigger aria-label="Lọc học kỳ theo năm học" className="h-10 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả năm học</SelectItem>
              {years.data?.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{filtered.length} học kỳ</p>
        </div>
        {years.isError && (
          <div role="alert" className="text-sm text-destructive">
            Không tải được danh mục năm học.
            <Button variant="ghost" onClick={() => void years.refetch()}>
              Thử lại
            </Button>
          </div>
        )}
        {filtered.length ? (
          <div className="overflow-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium">Học kỳ</th>
                  <th className="px-3 py-3 font-medium">Năm học</th>
                  <th className="px-3 py-3 font-medium">Thời gian</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                  <th className="px-3 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="px-3 py-4 font-medium">
                      Học kỳ {item.number}
                      {item.isCurrent && (
                        <span className="mt-1 block text-xs text-primary">Hiện hành</span>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      {yearNames.get(item.academicYearId!) || item.academicYear || 'Chưa cập nhật'}
                    </td>
                    <td className="px-3 py-4 text-xs text-muted-foreground">
                      {date(item.startDate)} – {date(item.endDate)}
                    </td>
                    <td className="px-3 py-4">
                      <AdminBadge
                        dot
                        tone={
                          item.status === 'ONGOING'
                            ? 'success'
                            : item.status === 'UPCOMING'
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {item.status === 'ONGOING'
                          ? 'Đang diễn ra'
                          : item.status === 'UPCOMING'
                            ? 'Sắp diễn ra'
                            : 'Đã kết thúc'}
                      </AdminBadge>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Chỉnh sửa học kỳ ${item.number}`}
                        onClick={() => onOpenEditModal(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Chưa có học kỳ trong năm học đã chọn.
          </p>
        )}
      </section>
    </div>
  )
}
