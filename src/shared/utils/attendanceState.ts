// Registration statuses are shared by student history and fanpage attendance.
export const isAttendanceComplete = (status: string) =>
  status === 'COMPLETED' || status === 'CONFIRMED' || status === 'RECORDED'
export const isAttendanceStarted = (status: string) =>
  ['CHECKED_IN', 'SELF_CHECKED_IN', 'ENTRY_CHECKED', 'SPENDING_CONFIRM'].includes(status) ||
  isAttendanceComplete(status)
export const isAttendanceAbsent = (status: string) => status === 'ABSENT' || status === 'ABSENTED'
export const isAttendancePending = (status: string) => status === 'SPENDING_CONFIRM'
export const studentAttendanceStep = (status: string): 'check-in' | 'check-out' | null => {
  if (['REGISTERED', 'UPCOMING', 'APPROVED'].includes(status)) return 'check-in'
  if (['CHECKED_IN', 'SELF_CHECKED_IN', 'ENTRY_CHECKED'].includes(status)) return 'check-out'
  return null
}
export const studentAttendanceLabel = (status: string) => {
  if (isAttendancePending(status)) return 'Chờ xác nhận'
  if (status === 'CONFIRMED' || status === 'COMPLETED') return 'Chờ chốt kết quả'
  if (status === 'RECORDED') return 'Hoàn thành'
  if (isAttendanceStarted(status)) return 'Đã check-in'
  return 'Chờ điểm danh'
}
export const studentAttendanceBadgeClass = (status: string) => {
  if (isAttendancePending(status) || status === 'CONFIRMED' || status === 'COMPLETED')
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  if (status === 'RECORDED')
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  if (isAttendanceStarted(status))
    return 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
}
