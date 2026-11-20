import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { canStudentSelfCheck } from '@/shared/utils/attendanceConfig'
import { studentAttendanceStep } from '@/shared/utils/attendanceState'
import { StudentAttendanceModal } from '@/features/registration-history/components/StudentAttendanceModal'
import { checkInService } from '../services/checkInService'

export function PhotoCheckIn() {
  const [params] = useSearchParams()
  const [selectedId, setSelectedId] = useState(params.get('eventId') || '')
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['registrations', 'active-for-checkin'],
    queryFn: () => checkInService.getActiveRegisteredEvents(),
  })
  const events = query.data ?? []
  const selected = selectedId
    ? events.find((item) => String(item.eventId) === selectedId)
    : events[0]
  const allowed =
    selected && canStudentSelfCheck(selected) && studentAttendanceStep(selected.status)
  const onSuccess = (message: string) => {
    setNotice(message)
    for (const key of [
      'registrations',
      'events',
      'student-semester-points',
      'point-transactions',
      'training-points',
      'criteria-progress',
    ]) {
      void client.invalidateQueries({ queryKey: [key] })
    }
  }
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      {notice && (
        <p role="status" className="text-sm text-foreground">
          {notice}
        </p>
      )}
      {query.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Đang tải sự kiện...
        </p>
      ) : query.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Không tải được danh sách sự kiện.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : events.length ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="attendance-event">Sự kiện điểm danh</Label>
            <Select
              value={selected ? String(selected.eventId) : ''}
              onValueChange={(value) => {
                setSelectedId(value)
                setNotice('')
                setOpen(false)
              }}
            >
              <SelectTrigger id="attendance-event">
                <SelectValue placeholder="Chọn sự kiện" />
              </SelectTrigger>
              <SelectContent>
                {events.map((item) => (
                  <SelectItem key={item.eventId} value={String(item.eventId)}>
                    {item.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-foreground">{selected.eventName}</p>
              {selected.location && <p className="text-muted-foreground">{selected.location}</p>}
            </div>
          )}
          {selected && !canStudentSelfCheck(selected) && (
            <p role="status" className="text-sm text-muted-foreground">
              Sự kiện này do ban tổ chức điểm danh trực tiếp.
            </p>
          )}
          {!selected && (
            <p className="text-sm text-muted-foreground">
              Sự kiện đã chọn không còn trong danh sách chờ điểm danh.
            </p>
          )}
          <Button className="self-start" disabled={!allowed} onClick={() => setOpen(true)}>
            {allowed === 'check-out' ? 'Điểm danh cuối buổi' : 'Điểm danh đầu buổi'}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có sự kiện đang chờ điểm danh.</p>
      )}
      <StudentAttendanceModal
        isOpen={open}
        onClose={() => setOpen(false)}
        event={
          selected ? { ...selected, id: String(selected.eventId), title: selected.eventName } : null
        }
        onSuccess={onSuccess}
      />
    </section>
  )
}
