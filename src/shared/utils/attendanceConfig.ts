export type AttendanceMethod = 'MANUAL' | 'STUDENT_PROOF'
export type AttendanceSessionType = 'START' | 'END' | 'BOTH'

export function normalizeAttendanceConfig(config: {
  attendanceMethod?: unknown
  attendanceSessionType?: unknown
}) {
  const attendanceMethod: AttendanceMethod =
    config.attendanceMethod === 'STUDENT_PROOF' ? 'STUDENT_PROOF' : 'MANUAL'
  const session = config.attendanceSessionType
  const attendanceSessionType: AttendanceSessionType =
    session === 'START' || session === 'CHECK_IN'
      ? 'START'
      : session === 'END' || session === 'CHECK_OUT'
        ? 'END'
        : 'BOTH'
  return { attendanceMethod, attendanceSessionType }
}
