import { useQuery } from '@tanstack/react-query'
import {
  educationCatalogService,
  type SchoolOption,
  type MajorOption,
} from '@/shared/services/educationCatalogService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function EducationFields({
  schoolId,
  majorId,
  onSchoolChange,
  onMajorChange,
  className = 'grid grid-cols-1 gap-5 md:grid-cols-2',
}: {
  className?: string
  schoolId?: number
  majorId?: number
  onSchoolChange: (school: SchoolOption) => void
  onMajorChange: (major: MajorOption) => void
}) {
  const schools = useQuery({
    queryKey: ['education', 'schools'],
    queryFn: educationCatalogService.getSchools,
    staleTime: 30_000,
    retry: false,
  })
  const majors = useQuery({
    queryKey: ['education', 'majors', schoolId],
    queryFn: () => educationCatalogService.getMajors(schoolId!),
    enabled: Boolean(schoolId),
    staleTime: 30_000,
    retry: false,
  })
  const schoolOptions = (schools.data || []).filter((item) => item.isActive || item.id === schoolId)
  const majorOptions = (majors.data || []).filter((item) => item.isActive || item.id === majorId)
  return (
    <div className={className}>
      <div className="flex min-w-0 flex-col gap-2">
        <Label>
          Khoa / Trường <span className="text-destructive">*</span>
        </Label>
        <Select
          value={schoolId ? String(schoolId) : ''}
          disabled={schools.isPending || schools.isError}
          onValueChange={(value) => {
            const item = schoolOptions.find((school) => school.id === Number(value))
            if (item) onSchoolChange(item)
          }}
        >
          <SelectTrigger aria-label="Khoa / Trường" className="h-11 w-full">
            <SelectValue
              placeholder={schools.isPending ? 'Đang tải khoa/trường…' : 'Chọn khoa/trường'}
            />
          </SelectTrigger>
          <SelectContent>
            {schoolOptions.map((school) => (
              <SelectItem key={school.id} value={String(school.id)} disabled={!school.isActive}>
                {school.name}
                {!school.isActive ? ' (Ngừng sử dụng)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {schools.isError && (
          <div role="alert" className="text-xs text-destructive">
            Không tải được khoa/trường.
            <Button variant="ghost" size="sm" type="button" onClick={() => void schools.refetch()}>
              Thử lại khoa/trường
            </Button>
          </div>
        )}
        {!schools.isPending && !schools.isError && !schoolOptions.length && (
          <p className="text-xs text-muted-foreground">Chưa có khoa/trường đang hoạt động.</p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <Label>
          Ngành học <span className="text-destructive">*</span>
        </Label>
        <Select
          value={majorId && majorOptions.some((item) => item.id === majorId) ? String(majorId) : ''}
          disabled={!schoolId || majors.isPending || majors.isError}
          onValueChange={(value) => {
            const item = majorOptions.find((major) => major.id === Number(value))
            if (item) onMajorChange(item)
          }}
        >
          <SelectTrigger aria-label="Ngành học" className="h-11 w-full">
            <SelectValue
              placeholder={
                !schoolId
                  ? 'Chọn khoa/trường trước'
                  : majors.isPending
                    ? 'Đang tải ngành học…'
                    : 'Chọn ngành học'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {majorOptions.map((major) => (
              <SelectItem key={major.id} value={String(major.id)} disabled={!major.isActive}>
                {major.code ? `${major.code} · ` : ''}
                {major.name}
                {!major.isActive ? ' (Ngừng sử dụng)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {schoolId && majors.isError && (
          <div role="alert" className="text-xs text-destructive">
            Không tải được ngành học.
            <Button variant="ghost" size="sm" type="button" onClick={() => void majors.refetch()}>
              Thử lại ngành học
            </Button>
          </div>
        )}
        {schoolId && !majors.isPending && !majors.isError && !majorOptions.length && (
          <p className="text-xs text-muted-foreground">
            Khoa/trường này chưa có ngành đang hoạt động.
          </p>
        )}
      </div>
    </div>
  )
}
