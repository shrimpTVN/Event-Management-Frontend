import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { StudentAttendanceModal } from '../StudentAttendanceModal'
import { mediaService } from '@/shared/services/mediaService'
import { historyService } from '../../services/historyService'
import type { RegisteredEventItem } from '../../types/history.types'

vi.mock('@/shared', () => ({ sanitizeImageSrc: (url: string) => url }))
vi.mock('@/shared/services/mediaService', () => ({ mediaService: { uploadImage: vi.fn() } }))
vi.mock('../../services/historyService', () => ({ historyService: { submitAttendance: vi.fn() } }))

const event: RegisteredEventItem = {
  id: '1',
  eventId: 10,
  status: 'CHECKED_IN',
  title: 'Ngày hội nộp ảnh',
  allowSelfCheck: true,
  attendanceMethod: 'STUDENT_PROOF',
  attendanceSessionType: 'BOTH',
}
const onClose = vi.fn()
const onSuccess = vi.fn()
beforeEach(() => {
  vi.resetAllMocks()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test-proof'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.mocked(mediaService.uploadImage).mockResolvedValue('https://example.com/proof.jpg')
  vi.mocked(historyService.submitAttendance).mockResolvedValue(undefined)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function open(overrides: Partial<RegisteredEventItem> = {}) {
  return render(
    <StudentAttendanceModal
      isOpen
      event={{ ...event, ...overrides }}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
function chooseFile() {
  const file = new File(['photo'], 'selfie.jpg', { type: 'image/jpeg' })
  fireEvent.change(screen.getByLabelText('Tải ảnh minh chứng'), { target: { files: [file] } })
  return file
}

describe('student attendance photo form', () => {
  it.each([
    ['REGISTERED', 'check-in'],
    ['SELF_CHECKED_IN', 'check-out'],
    ['UPCOMING', 'check-in'],
    ['CHECKED_IN', 'check-out'],
  ] as const)(
    'sends the next allowed step for %s with the actual uploaded image',
    async (status, endpoint) => {
      open({ status, attendanceMethod: undefined, attendanceSessionType: undefined })
      const file = chooseFile()
      fireEvent.click(screen.getByRole('button', { name: 'Gửi ảnh' }))
      await waitFor(() =>
        expect(historyService.submitAttendance).toHaveBeenCalledWith(
          '10',
          endpoint,
          'https://example.com/proof.jpg'
        )
      )
      expect(mediaService.uploadImage).toHaveBeenCalledWith(file, 'EVIDENCE')
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onClose).toHaveBeenCalledOnce()
    }
  )

  it('selects check-out after a recorded check-in in BOTH mode', async () => {
    open({ checkInAt: '2026-11-13T01:00:00Z' })
    expect(screen.getByText('Điểm danh cuối buổi')).toBeInTheDocument()
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi ảnh' }))
    await waitFor(() =>
      expect(historyService.submitAttendance).toHaveBeenCalledWith(
        '10',
        'check-out',
        'https://example.com/proof.jpg'
      )
    )
  })

  it('does not submit a placeholder image when upload fails and retains the selected photo for retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(mediaService.uploadImage).mockRejectedValueOnce(new Error('Tải ảnh thất bại'))
    open()
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi ảnh' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Tải ảnh thất bại')
    expect(historyService.submitAttendance).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByAltText('Ảnh minh chứng điểm danh')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi ảnh' }))
    await waitFor(() => expect(historyService.submitAttendance).toHaveBeenCalledOnce())
  })

  it.each(['SPENDING_CONFIRM', 'CONFIRMED', 'COMPLETED', 'ABSENT', 'CANCELLED'])(
    'does not allow another upload for %s',
    (status) => {
      open({ status })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }
  )

  it('clears the previous photo and session when switching to another event', () => {
    const view = open()
    chooseFile()
    view.rerender(
      <StudentAttendanceModal
        isOpen
        event={{ ...event, id: '2', eventId: 20, attendanceSessionType: 'END' }}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    expect(screen.queryByAltText('Ảnh minh chứng điểm danh')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xác nhận điểm danh' })).toBeEnabled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-proof')
  })

  it('allows BE self-attendance without unsupported event configuration and rejects non-image files', () => {
    open({ attendanceMethod: undefined })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Tải ảnh minh chứng'), {
      target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Vui lòng chỉ tải lên tệp hình ảnh')
    expect(screen.getByRole('button', { name: 'Xác nhận điểm danh' })).toBeDisabled()
    expect(mediaService.uploadImage).not.toHaveBeenCalled()
  })
})

describe('self attendance permission', () => {
  it('blocks the modal when the backend disables self attendance, overriding legacy photo mode', () => {
    open({ allowSelfCheck: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mediaService.uploadImage).not.toHaveBeenCalled()
    expect(historyService.submitAttendance).not.toHaveBeenCalled()
  })
  it.each([
    ['REGISTERED', 'check-in'],
    ['SELF_CHECKED_IN', 'check-out'],
  ])('allows %s without an optional photo', async (status, step) => {
    open({ status })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận điểm danh' }))
    await waitFor(() =>
      expect(historyService.submitAttendance).toHaveBeenCalledWith('10', step, undefined)
    )
    expect(mediaService.uploadImage).not.toHaveBeenCalled()
  })
  it('unmounts the upload form if permission is revoked while it is open', () => {
    const view = open()
    chooseFile()
    view.rerender(
      <StudentAttendanceModal
        isOpen
        event={{ ...event, allowSelfCheck: false }}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(historyService.submitAttendance).not.toHaveBeenCalled()
  })
})
