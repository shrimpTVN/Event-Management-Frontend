import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fanpageAdminService } from '../services/fanpageAdminService'
import type { AdminEvent, EventRegistrationItem } from '../types/fanpageAdmin.types'
import {
  isAttendanceComplete,
  isAttendanceStarted,
  isAttendanceAbsent,
  isAttendancePending,
} from '@/shared/utils/attendanceState'

type Stage = 0 | 1 | 2
const stageOf = (row: EventRegistrationItem): Stage =>
  isAttendanceComplete(row.status) ? 2 : isAttendanceStarted(row.status) ? 1 : 0
export const hasAttendanceProof = (row: EventRegistrationItem) =>
  Boolean(row.startEvidenceUrl || row.endEvidenceUrl || row.evidenceUrl)
export const isPhotoAttendance = (
  event: Pick<AdminEvent, 'attendanceMethod'>,
  rows: EventRegistrationItem[]
) =>
  event.attendanceMethod === 'STUDENT_PROOF' ||
  rows.some(
    (row) =>
      ['SELF_CHECKED_IN', 'SPENDING_CONFIRM', 'CONFIRMED'].includes(row.status) ||
      ((isAttendanceComplete(row.status) || isAttendanceAbsent(row.status)) &&
        hasAttendanceProof(row))
  )
const canAttend = (row: EventRegistrationItem) =>
  row.status !== 'CANCELLED' && !isAttendanceAbsent(row.status)

export function useAttendanceDraft(event: AdminEvent) {
  const queryClient = useQueryClient()
  const eventKey = `${event.fanpageId}:${event.id}`
  const queryKey = ['event-attendees', event.fanpageId, event.id]
  const query = useQuery({
    queryKey,
    queryFn: () => fanpageAdminService.getEventAttendees(event.fanpageId || '1', event.id),
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  })
  const source = query.data ?? []
  const [draftState, setDraftState] = useState<{ key: string; stages: Record<string, Stage> }>({
    key: eventKey,
    stages: {},
  })
  const overrides = draftState.key === eventKey ? draftState.stages : {}
  const [sessionState, setSessionState] = useState<{
    key: string
    session: 'START' | 'END'
  } | null>(null)
  const [selectionEnabled, setSelectionEnabled] = useState<{ key: string; enabled: boolean }>({
    key: eventKey,
    enabled: true,
  })
  const [closedKey, setClosedKey] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const effectiveStatus = closedKey === eventKey ? 'COMPLETED' : event.status
  const readOnly = effectiveStatus !== 'PUBLISHED'
  const manualStartRows =
    event.attendanceMethod === 'STUDENT_PROOF'
      ? []
      : source.filter((row) => row.status === 'REGISTERED')
  const manualEndRows =
    event.attendanceMethod === 'STUDENT_PROOF'
      ? []
      : source.filter((row) => row.status === 'CHECKED_IN')
  const manualSession =
    sessionState?.key === eventKey
      ? sessionState.session
      : manualStartRows.length
        ? 'START'
        : manualEndRows.length
          ? 'END'
          : 'START'
  useEffect(() => {
    if (query.isSuccess && sessionState?.key !== eventKey) {
      setSessionState({ key: eventKey, session: manualSession })
    }
  }, [query.isSuccess, eventKey, sessionState?.key, manualSession])
  const manualRows = manualSession === 'START' ? manualStartRows : manualEndRows
  const manualIds = new Set(manualRows.map((row) => row.id))
  const targetStage: Stage = manualSession === 'START' ? 1 : 2
  const defaultsEnabled =
    (selectionEnabled.key !== eventKey || selectionEnabled.enabled) &&
    !isPhotoAttendance(event, source)
  const drafts: Record<string, Stage> = {}
  if (!readOnly)
    source.forEach((row) => {
      if (isAttendancePending(row.status) && overrides[row.id] != null)
        drafts[row.id] = overrides[row.id]
      else if (manualIds.has(row.id)) {
        const value =
          overrides[`${manualSession}:${row.id}`] ?? (defaultsEnabled ? targetStage : stageOf(row))
        drafts[row.id] = value
      }
    })
  const [isSaving, setIsSaving] = useState(false)
  const savingLock = useRef(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const changedRows = source.filter(
    (row) => canAttend(row) && drafts[row.id] != null && drafts[row.id] > stageOf(row)
  )
  const registrations = source.map((row) => {
    const target = drafts[row.id]
    if (target == null || target <= stageOf(row)) return row
    return {
      ...row,
      status:
        target === 2
          ? isAttendancePending(row.status)
            ? ('CONFIRMED' as const)
            : ('COMPLETED' as const)
          : ('CHECKED_IN' as const),
    }
  })

  useEffect(() => {
    if (!changedRows.length) return
    const warnBeforeLeaving = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [changedRows.length])

  const setTargets = (targets: { id: string; stage: Stage }[], session = manualSession) => {
    if (isSaving || readOnly) return
    setNotice(null)
    setDraftState((previous) => {
      const stages = { ...(previous.key === eventKey ? previous.stages : {}) }
      targets.forEach(({ id, stage }) => {
        const row = source.find((item) => item.id === id)
        if (!row || !canAttend(row)) return
        stages[isAttendancePending(row.status) ? id : `${session}:${id}`] = stage
      })
      return { key: eventKey, stages }
    })
  }
  const toggleSession = (id: string, session: 'START' | 'END') => {
    const row = source.find((item) => item.id === id)
    if (!row) return
    if (
      !canAttend(row) ||
      isAttendancePending(row.status) ||
      (session === 'START' ? row.status !== 'REGISTERED' : row.status !== 'CHECKED_IN')
    )
      return
    const saved = stageOf(row)
    const current = drafts[id] ?? saved
    if (session === 'START') {
      if (saved >= 1) return
      setTargets([{ id, stage: current >= 1 ? 0 : 1 }], session)
    } else {
      if (saved >= 2) return
      setTargets([{ id, stage: current === 2 ? saved : 2 }], session)
    }
  }
  const toggleProof = (id: string) => {
    const row = source.find((item) => item.id === id)
    if (!row || !isAttendancePending(row.status)) return
    setTargets([{ id, stage: drafts[id] === 2 ? stageOf(row) : 2 }])
  }
  const setManualSession = (session: 'START' | 'END') => {
    if (isSaving || readOnly) return
    setSessionState({ key: eventKey, session })
    setSelectionEnabled({ key: eventKey, enabled: true })
    setNotice(null)
  }
  const discard = () => {
    if (isSaving) return
    setDraftState({ key: eventKey, stages: {} })
    setSelectionEnabled({ key: eventKey, enabled: false })
    setNotice(null)
  }
  const save = async (confirmationId?: string, mode?: 'PROOF' | 'MANUAL') => {
    if (savingLock.current || readOnly) return
    const selectedRows = confirmationId
      ? source.filter((row) => row.id === confirmationId && isAttendancePending(row.status))
      : changedRows.filter((row) =>
          mode === 'PROOF'
            ? isAttendancePending(row.status)
            : mode === 'MANUAL'
              ? !isAttendancePending(row.status)
              : true
        )
    if (!selectedRows.length) return
    const targets = new Map(
      selectedRows.map((row) => [row.id, confirmationId ? 2 : drafts[row.id]])
    )
    const rows = queryClient.getQueryData<EventRegistrationItem[]>(queryKey) ?? source
    const toConfirm = rows.filter(
      (row) => targets.get(row.id) === 2 && isAttendancePending(row.status)
    )
    const toCheckIn = rows.filter((row) => targets.get(row.id) === 1 && row.status === 'REGISTERED')
    const toCheckOut = rows.filter(
      (row) => targets.get(row.id) === 2 && row.status === 'CHECKED_IN'
    )
    if (
      [...toCheckIn, ...toCheckOut, ...toConfirm].some(
        (row) => !/^[1-9]\d*$/.test(row.userId) || !Number.isSafeInteger(Number(row.userId))
      )
    ) {
      setNotice({
        type: 'error',
        message: 'Chưa xác định được ID tài khoản của một số sinh viên. Chưa gửi cập nhật.',
      })
      return
    }
    savingLock.current = true
    setIsSaving(true)
    setNotice(null)
    let savedAny = false
    const acknowledge = (batch: EventRegistrationItem[], stage: Stage) => {
      savedAny = true
      const ids = new Set(batch.map((row) => row.id))
      queryClient.setQueryData<EventRegistrationItem[]>(queryKey, (current = []) =>
        current.map((row) =>
          ids.has(row.id)
            ? {
                ...row,
                status:
                  stage === 2
                    ? isAttendancePending(row.status)
                      ? 'CONFIRMED'
                      : 'COMPLETED'
                    : 'CHECKED_IN',
              }
            : row
        )
      )
      setDraftState((previous) => {
        if (previous.key !== eventKey) return previous
        const stages = { ...previous.stages }
        ids.forEach((id) => {
          if (targets.get(id) === stage) {
            delete stages[id]
            delete stages[`START:${id}`]
            delete stages[`END:${id}`]
          }
        })
        return { key: eventKey, stages }
      })
    }
    try {
      if (toCheckIn.length) {
        await fanpageAdminService.batchCheckInAttendees(
          event.id,
          toCheckIn.map((row) => row.userId)
        )
        acknowledge(toCheckIn, 1)
      }
      if (toCheckOut.length) {
        await fanpageAdminService.batchCheckOutAttendees(
          event.id,
          toCheckOut.map((row) => row.userId)
        )
        acknowledge(toCheckOut, 2)
      }
      if (toConfirm.length) {
        await fanpageAdminService.confirmAttendance(
          event.id,
          toConfirm.map((row) => row.userId)
        )
        acknowledge(toConfirm, 2)
      }
      setNotice({ type: 'success', message: `Đã lưu điểm danh cho ${targets.size} sinh viên.` })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['registrations'] }),
        queryClient.invalidateQueries({ queryKey: ['student-semester-points'] }),
        queryClient.invalidateQueries({ queryKey: ['point-transactions'] }),
      ])
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Không thể cập nhật điểm danh.'
      setNotice({
        type: 'error',
        message:
          confirmationId || mode === 'PROOF'
            ? `${detail} Nhấn Xác nhận để thử lại.`
            : `${savedAny ? 'Một phần đã được lưu. ' : ''}${detail} Các lựa chọn chưa lưu được giữ lại; nhấn Lưu để thử lại.`,
      })
      // A timeout can happen after the server committed a batch. Refresh before
      // allowing a retry so confirmed check-ins/check-outs are not submitted twice.
      await queryClient.invalidateQueries({ queryKey })
    } finally {
      savingLock.current = false
      setIsSaving(false)
    }
  }

  const attendOnBehalf = async (session: 'START' | 'END', ids: string[]) => {
    if (savingLock.current || readOnly || !ids.length) return false
    const current = queryClient.getQueryData<EventRegistrationItem[]>(queryKey) ?? source
    const rows = current.filter(
      (row) =>
        ids.includes(row.id) &&
        (session === 'START'
          ? row.status === 'REGISTERED'
          : row.status === 'CHECKED_IN' || row.status === 'SELF_CHECKED_IN')
    )
    if (
      rows.length !== new Set(ids).size ||
      rows.some(
        (row) => !/^[1-9]\d*$/.test(row.userId) || !Number.isSafeInteger(Number(row.userId))
      )
    ) {
      setNotice({
        type: 'error',
        message: 'Danh sách điểm danh đã thay đổi hoặc thiếu ID tài khoản. Vui lòng kiểm tra lại.',
      })
      return false
    }
    savingLock.current = true
    setIsSaving(true)
    setNotice(null)
    try {
      if (session === 'START')
        await fanpageAdminService.batchCheckInAttendees(
          event.id,
          rows.map((row) => row.userId)
        )
      else
        await fanpageAdminService.batchCheckOutAttendees(
          event.id,
          rows.map((row) => row.userId)
        )
      const updatedIds = new Set(rows.map((row) => row.id))
      queryClient.setQueryData<EventRegistrationItem[]>(queryKey, (previous = []) =>
        previous.map((row) =>
          updatedIds.has(row.id)
            ? { ...row, status: session === 'START' ? 'CHECKED_IN' : 'COMPLETED' }
            : row
        )
      )
      setDraftState((previous) => {
        if (previous.key !== eventKey) return previous
        const stages = { ...previous.stages }
        updatedIds.forEach((id) => {
          delete stages[id]
          delete stages[`START:${id}`]
          delete stages[`END:${id}`]
        })
        return { key: eventKey, stages }
      })
      setNotice({
        type: 'success',
        message: `Đã ${session === 'START' ? 'check-in' : 'check-out'} thay cho ${rows.length} sinh viên.`,
      })
      await queryClient.invalidateQueries({ queryKey })
      await queryClient.invalidateQueries({ queryKey: ['registrations'] })
      return true
    } catch (error) {
      setNotice({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Không lưu được điểm danh thay. Vui lòng thử lại.',
      })
      await queryClient.invalidateQueries({ queryKey })
      return false
    } finally {
      savingLock.current = false
      setIsSaving(false)
    }
  }

  const closeEvent = async () => {
    if (savingLock.current || readOnly) return false
    savingLock.current = true
    setIsClosing(true)
    try {
      await fanpageAdminService.completeEventAttendance(event.id)
      setClosedKey(eventKey)
      setDraftState({ key: eventKey, stages: {} })
      setNotice({ type: 'success', message: 'Đã kết thúc sự kiện và ghi nhận kết quả điểm danh.' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['registrations'] }),
        queryClient.invalidateQueries({ queryKey: ['student-semester-points'] }),
        queryClient.invalidateQueries({ queryKey: ['point-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['student-criteria-progress'] }),
        queryClient.invalidateQueries({ queryKey: ['student-criteria-transactions-all'] }),
      ])
      return true
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'Không kết thúc được sự kiện.',
      })
      return false
    } finally {
      savingLock.current = false
      setIsClosing(false)
    }
  }

  return {
    registrations,
    source,
    manualSession,
    setManualSession,
    manualStartCount: manualStartRows.length,
    manualEndCount: manualEndRows.length,
    effectiveStatus,
    isClosing,
    closeEvent,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: query.refetch,
    changedCount: changedRows.length,
    isSaving,
    readOnly,
    notice,
    clearNotice: () => setNotice(null),
    toggleSession,
    toggleProof,
    selectRows: (ids: string[], selected: boolean, mode: 'PROOF' | 'START' | 'END') => {
      const allowed =
        mode === 'PROOF'
          ? source.filter((row) => isAttendancePending(row.status))
          : mode === 'START'
            ? manualStartRows
            : manualEndRows
      setTargets(
        allowed
          .filter((row) => ids.includes(row.id))
          .map((row) => ({
            id: row.id,
            stage: selected ? (mode === 'START' ? 1 : 2) : stageOf(row),
          })),
        mode === 'PROOF' ? manualSession : mode
      )
    },
    discard,
    selectedIds: changedRows.map((row) => row.id),
    save: (mode?: 'PROOF' | 'MANUAL') => save(undefined, mode),
    confirmOne: (id: string) => save(id),
    attendOnBehalf,
  }
}
