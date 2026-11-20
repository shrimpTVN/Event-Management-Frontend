export type AttendanceMethod = 'MANUAL' | 'STUDENT_PROOF'
export type AttendanceSessionType = 'START' | 'END' | 'BOTH'

type AttendanceConfig = {
  allowSelfCheck?: unknown
  attendanceMethod?: unknown
  attendanceSessionType?: unknown
}

export function canStudentSelfCheck(config: AttendanceConfig): boolean {
  // An explicit backend flag always wins over legacy client configuration.
  return typeof config.allowSelfCheck === 'boolean'
    ? config.allowSelfCheck
    : config.attendanceMethod === 'STUDENT_PROOF'
}

export function normalizeAttendanceConfig(config: AttendanceConfig) {
  const allowSelfCheck = canStudentSelfCheck(config)
  const attendanceMethod: AttendanceMethod = allowSelfCheck ? 'STUDENT_PROOF' : 'MANUAL'
  const session = config.attendanceSessionType
  const attendanceSessionType: AttendanceSessionType =
    session === 'START' || session === 'CHECK_IN'
      ? 'START'
      : session === 'END' || session === 'CHECK_OUT'
        ? 'END'
        : 'BOTH'
  return { allowSelfCheck, attendanceMethod, attendanceSessionType }
}
