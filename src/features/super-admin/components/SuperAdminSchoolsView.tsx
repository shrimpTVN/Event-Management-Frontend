import { useState } from 'react'
import { Plus, Pencil, Search, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminBadge } from './AdminDetails'
import { matchesPageSearch } from '@/shared/components/layout/MobileSubpageHeader'
import type { SuperAdminSchool, SuperAdminMajor } from '../types/superAdmin.types'

export function SuperAdminSchoolsView({
  schools,
  onOpenCreateSchoolModal,
  onOpenEditSchoolModal,
  onOpenCreateMajorModal,
  onOpenEditMajorModal,
}: {
  schools: SuperAdminSchool[]
  onOpenCreateSchoolModal: () => void
  onOpenEditSchoolModal: (school: SuperAdminSchool) => void
  onOpenCreateMajorModal: (id: number) => void
  onOpenEditMajorModal: (major: SuperAdminMajor) => void
}) {
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [schoolSearch, setSchoolSearch] = useState('')
  const [majorSearch, setMajorSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const filteredSchools = schools.filter((school) => matchesPageSearch(schoolSearch, school.name))
  const selected = filteredSchools.find((school) => school.id === schoolId) || filteredSchools[0]
  const majors = (selected?.majors || []).filter(
    (major) =>
      major.schoolId === selected?.id &&
      matchesPageSearch(majorSearch, major.name, major.code) &&
      (status === 'ALL' || (major.isActive !== false) === (status === 'ACTIVE'))
  )
  return (
    <div className="flex flex-col gap-5 text-left">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Dữ liệu danh mục</p>
          <h1 className="font-k2d text-2xl font-bold">Khoa/Trường & Ngành học</h1>
          <p className="text-sm text-muted-foreground">
            {schools.length} khoa/trường · Danh mục dùng trong hồ sơ sinh viên
          </p>
        </div>
        <Button onClick={onOpenCreateSchoolModal} className="h-10 gap-2">
          <Plus className="h-4 w-4" />
          Thêm Khoa/Trường
        </Button>
      </header>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
        <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-4">
          <h2 className="font-heading text-base font-semibold">
            Khoa / Trường ({filteredSchools.length})
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Tìm khoa/trường"
              placeholder="Tìm khoa/trường…"
              value={schoolSearch}
              onChange={(event) => setSchoolSearch(event.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <div className="flex max-h-80 flex-col gap-1 overflow-auto lg:max-h-[600px]">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className={`flex items-center gap-1 rounded-lg ${selected?.id === school.id ? 'bg-primary/5' : ''}`}
              >
                <Button
                  variant="ghost"
                  className="h-auto min-w-0 flex-1 flex-col items-start gap-1 whitespace-normal px-3 py-3 text-left"
                  aria-pressed={selected?.id === school.id}
                  onClick={() => {
                    setSchoolId(school.id)
                    setMajorSearch('')
                    setStatus('ALL')
                  }}
                >
                  <span className="text-sm font-medium">{school.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {school.majors?.length ?? school.majorsCount ?? 0} ngành học
                    {school.isActive === false ? ' · Ngừng sử dụng' : ''}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={`Chỉnh sửa ${school.name}`}
                  onClick={() => onOpenEditSchoolModal(school)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {!filteredSchools.length && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Không có khoa/trường phù hợp.
            </p>
          )}
        </section>
        <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:p-5">
          {selected ? (
            <>
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-2">
                  <h2 className="font-k2d text-lg font-semibold">{selected.name}</h2>
                  <AdminBadge dot tone={selected.isActive === false ? 'neutral' : 'success'}>
                    {selected.isActive === false ? 'Ngừng sử dụng' : 'Đang hoạt động'}
                  </AdminBadge>
                </div>
                <Button
                  disabled={selected.isActive === false}
                  className="h-10 gap-2"
                  onClick={() => onOpenCreateMajorModal(selected.id)}
                >
                  <Plus className="h-4 w-4" />
                  Thêm ngành
                </Button>
              </header>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_160px]">
                <Input
                  aria-label="Tìm ngành học"
                  placeholder="Tìm tên hoặc mã ngành…"
                  value={majorSearch}
                  onChange={(event) => setMajorSearch(event.target.value)}
                  className="h-10"
                />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger aria-label="Trạng thái ngành học">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="ACTIVE">Đang đào tạo</SelectItem>
                    <SelectItem value="INACTIVE">Ngừng sử dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">{majors.length} ngành học</p>
              {majors.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="px-2 py-3 font-medium">Mã ngành</th>
                        <th className="px-2 py-3 font-medium">Tên ngành</th>
                        <th className="px-2 py-3 font-medium">Trạng thái</th>
                        <th className="px-2 py-3 text-right font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {majors.map((major) => (
                        <tr key={major.id} className="border-b border-border/50">
                          <td className="px-2 py-3 font-mono text-xs">{major.code || '—'}</td>
                          <td className="px-2 py-3 font-medium">{major.name}</td>
                          <td className="px-2 py-3">
                            <AdminBadge dot tone={major.isActive === false ? 'neutral' : 'success'}>
                              {major.isActive === false ? 'Ngừng sử dụng' : 'Đang đào tạo'}
                            </AdminBadge>
                          </td>
                          <td className="px-2 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Chỉnh sửa ngành ${major.name}`}
                              onClick={() => onOpenEditMajorModal(major)}
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
                <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                  <GraduationCap className="h-6 w-6" />
                  Chưa có ngành phù hợp trong khoa/trường này.
                </div>
              )}
            </>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Chọn khoa/trường để xem ngành trực thuộc.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
