import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PhotoCheckIn } from '../PhotoCheckIn'
import { checkInService } from '../../services/checkInService'
import { historyService } from '@/features/registration-history/services/historyService'
import { mediaService } from '@/shared/services/mediaService'
vi.mock('../../services/checkInService', () => ({
  checkInService: { getActiveRegisteredEvents: vi.fn() },
}))
vi.mock('@/features/registration-history/services/historyService', () => ({
  historyService: { submitAttendance: vi.fn() },
}))
vi.mock('@/shared/services/mediaService', () => ({ mediaService: { uploadImage: vi.fn() } }))
vi.mock('@/shared', () => ({ sanitizeImageSrc: (url: string) => url }))
beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:test'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})
function show(allowSelfCheck: boolean, status = 'REGISTERED') {
  vi.mocked(checkInService.getActiveRegisteredEvents).mockResolvedValue([
    { eventId: 10, eventName: 'Sự kiện', allowSelfCheck, status },
  ])
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/check-in?eventId=10']}>
        <PhotoCheckIn />
      </MemoryRouter>
    </QueryClientProvider>
  )
}
it('blocks direct-link self attendance when the event requires organizer attendance', async () => {
  show(false)
  expect(
    await screen.findByText('Sự kiện này do ban tổ chức điểm danh trực tiếp.')
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Điểm danh đầu buổi' })).toBeDisabled()
  expect(screen.queryByLabelText('Tải ảnh minh chứng')).not.toBeInTheDocument()
})
it('derives checkout from SELF_CHECKED_IN and allows submission without an optional photo', async () => {
  show(true, 'SELF_CHECKED_IN')
  fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh cuối buổi' }))
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận điểm danh' }))
  await waitFor(() =>
    expect(historyService.submitAttendance).toHaveBeenCalledWith('10', 'check-out', undefined)
  )
  expect(mediaService.uploadImage).not.toHaveBeenCalled()
})
it('does not send a fake proof or attendance request if uploading a chosen image fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(mediaService.uploadImage).mockRejectedValue(new Error('Tải ảnh thất bại'))
  show(true)
  fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh đầu buổi' }))
  fireEvent.change(screen.getByLabelText('Tải ảnh minh chứng'), {
    target: { files: [new File(['x'], 'proof.jpg', { type: 'image/jpeg' })] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi ảnh' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Tải ảnh thất bại')
  expect(historyService.submitAttendance).not.toHaveBeenCalled()
})
