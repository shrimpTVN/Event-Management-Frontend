import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageCreateEventView } from '../FanpageCreateEventView'
import { fanpageAdminService } from '../../services/fanpageAdminService'
import type { AdminEvent, FanpageSummary } from '../../types/fanpageAdmin.types'

vi.mock('@/shared', () => ({
  mediaService: { uploadImage: vi.fn().mockResolvedValue('https://example.com/poster.jpg') },
}))
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    placeholder,
  }: {
    id?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => (
    <input
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))
vi.mock('@/components/ui/time-select', () => ({
  TimeSelect: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => (
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  ),
}))
vi.mock('../../services/fanpageAdminService', () => ({
  MOCK_EVENT_TYPES: [{ id: 1, name: 'Tình nguyện' }],
  MOCK_SEMESTERS: [{ id: 1, name: 'Học kỳ 1' }],
  fanpageAdminService: {
    getEventTypes: vi.fn().mockResolvedValue([{ id: 1, name: 'Tình nguyện' }]),
    getPointCategories: vi.fn().mockResolvedValue([]),
    getSv5tCriterias: vi.fn().mockResolvedValue([]),
    createAdminEvent: vi.fn().mockResolvedValue({ id: 10 }),
    updateAdminEvent: vi.fn().mockResolvedValue({ id: 10 }),
    changeEventStatus: vi.fn(),
  },
}))

const fanpage: FanpageSummary = {
  id: '7',
  code: 'FP7',
  name: 'Đoàn trường',
  fullName: 'Đoàn trường',
  avatarText: 'ĐT',
  role: 'ADMIN',
  isVerified: true,
  email: '',
  phone: '',
  address: '',
  followersCount: 0,
  eventsCount: 0,
  description: '',
}
const existing: AdminEvent = {
  id: '10',
  code: 'EVT10',
  name: 'Sự kiện nộp ảnh',
  description: 'Nội dung',
  eventTypeId: 1,
  eventTypeName: 'Tình nguyện',
  fanpageId: '7',
  organizerName: fanpage.name,
  dateStart: '2030-01-03',
  dateEnd: '2030-01-03',
  timeStart: '08:00',
  timeEnd: '11:00',
  dateOpen: '2030-01-01T08:00:00+07:00',
  dateClose: '2030-01-02T08:00:00+07:00',
  format: 'OFFLINE',
  location: 'Hội trường',
  capacity: 100,
  registeredCount: 0,
  checkedInCount: 0,
  status: 'DRAFT',
  bannerUrl: 'https://example.com/poster.jpg',
  requiresApproval: false,
  attendanceMethod: 'STUDENT_PROOF',
  attendanceSessionType: 'END',
  autoEmail: false,
  isPublic: true,
  hasCertificate: false,
  tags: [],
  createdAt: '',
}
beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:poster'),
  })
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function open(initialEvent?: AdminEvent) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onSaveEvent = vi.fn()
  const view = render(
    <QueryClientProvider client={client}>
      <FanpageCreateEventView
        currentFanpage={fanpage}
        onBack={vi.fn()}
        onSaveEvent={onSaveEvent}
        initialEvent={initialEvent}
      />
    </QueryClientProvider>
  )
  return { ...view, onSaveEvent }
}

describe('attendance settings in the event form', () => {
  it('sends the selected photo mode and session when creating an event', async () => {
    const view = open()
    fireEvent.change(screen.getByLabelText(/Tên sự kiện/), { target: { value: 'Thử nộp ảnh' } })
    fireEvent.change(screen.getByLabelText(/Địa điểm tổ chức/), { target: { value: 'Hội trường' } })
    fireEvent.change(screen.getByLabelText(/Số lượng sinh viên tham gia/), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByPlaceholderText('Chọn ngày diễn ra...'), {
      target: { value: '2030-01-03' },
    })
    fireEvent.change(screen.getByPlaceholderText('Ngày mở cổng...'), {
      target: { value: '2030-01-01' },
    })
    fireEvent.change(screen.getByPlaceholderText('Ngày đóng cổng...'), {
      target: { value: '2030-01-02' },
    })
    fireEvent.change(view.container.querySelector('input[type=file]')!, {
      target: { files: [new File(['poster'], 'poster.jpg', { type: 'image/jpeg' })] },
    })
    fireEvent.keyDown(screen.getByLabelText(/Phương thức điểm danh/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: /Sinh viên tự nộp ảnh/ }))
    fireEvent.keyDown(screen.getByLabelText(/Phiên điểm danh bắt buộc/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Chỉ điểm danh đầu giờ' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.createAdminEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          attendanceMethod: 'STUDENT_PROOF',
          attendanceSessionType: 'START',
          fanpageId: 7,
        })
      )
    )
    expect(view.onSaveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        attendanceMethod: 'STUDENT_PROOF',
        attendanceSessionType: 'START',
      }),
      false
    )
  })

  it('retains photo mode and end-only session in the update payload', async () => {
    const view = open(existing)
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.updateAdminEvent).toHaveBeenCalledWith(
        '10',
        expect.objectContaining({ attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'END' })
      )
    )
    expect(view.onSaveEvent).toHaveBeenCalledWith(
      expect.objectContaining({ attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'END' }),
      false
    )
  })
})
