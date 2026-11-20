import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageCreateEventView } from '../FanpageCreateEventView'
import { fanpageAdminService } from '../../services/fanpageAdminService'
import type { AdminEvent, FanpageSummary } from '../../types/fanpageAdmin.types'

vi.mock('@/features/training-points/services/trainingPointsService', () => ({
  trainingPointsService: {
    getAcademicYears: vi.fn().mockResolvedValue([
      { id: 7, code: '2029 - 2030' },
      { id: 8, code: '2030 - 2031' },
    ]),
    getSemesters: vi.fn().mockResolvedValue([
      { id: 1, number: 1, academicYearId: 7 },
      { id: 2, number: 1, academicYearId: 8 },
    ]),
  },
}))

vi.mock('@/shared', () => ({
  mediaService: { uploadImage: vi.fn().mockResolvedValue('https://example.com/poster.jpg') },
}))
vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: (props: import('@/components/ui/date-picker').DatePickerProps) => (
    <input
      id={props.id}
      value={props.value || ''}
      placeholder={props.placeholder}
      aria-invalid={props['aria-invalid']}
      aria-describedby={props['aria-describedby']}
      data-min-date={props.minDate}
      data-max-date={props.maxDate}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
  ),
}))
vi.mock('@/components/ui/time-select', () => ({
  TimeSelect: (props: import('@/components/ui/time-select').TimeSelectProps) => (
    <input
      id={props.id}
      value={props.value || ''}
      placeholder={props.placeholder}
      aria-invalid={props['aria-invalid']}
      aria-describedby={props['aria-describedby']}
      data-min-time={props.minTime}
      data-max-time={props.maxTime}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
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
  semesterId: 1,
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
  vi.useRealTimers()
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

describe('attendance settings in the event form', { timeout: 20000 }, () => {
  it('sends the selected photo mode and session when creating an event', async () => {
    const view = open()
    fireEvent.keyDown(await screen.findByLabelText(/Năm học/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: '2029 - 2030' }))
    fireEvent.keyDown(await screen.findByLabelText(/Học kỳ/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: /Học kỳ 1/ }))
    fireEvent.change(screen.getByPlaceholderText(/Nhập nội dung/), {
      target: { value: 'Nội dung thử nghiệm' },
    })
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
    fireEvent.click(await screen.findByRole('option', { name: /Sinh viên tự điểm danh/ }))
    fireEvent.keyDown(screen.getByLabelText(/Phiên điểm danh bắt buộc/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Chỉ điểm danh đầu giờ' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Xuất bản sự kiện' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.createAdminEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          allowSelfCheck: true,
          attendanceMethod: 'STUDENT_PROOF',
          attendanceSessionType: 'START',
          fanpageId: 7,
          format: 'OFFLINE',
          criteriaIds: [],
          dateEnd: new Date('2030-01-03T11:30:00').toISOString(),
          hasCertificate: false,
          tags: [],
        })
      )
    )
    expect(fanpageAdminService.changeEventStatus).toHaveBeenCalledWith('10', 'PUBLISHED')
    expect(view.onSaveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '10',
        attendanceMethod: 'STUDENT_PROOF',
        attendanceSessionType: 'START',
      }),
      true
    )
  })

  it('retains photo mode and end-only session in the update payload', async () => {
    const view = open({
      ...existing,
      sv5tCriteriaIds: [20, 6],
      format: 'ONLINE',
      tags: ['tình nguyện'],
      hasCertificate: true,
    })
    await waitFor(() => expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Học kỳ 1'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.updateAdminEvent).toHaveBeenCalledWith(
        '10',
        expect.objectContaining({
          allowSelfCheck: true,
          attendanceMethod: 'STUDENT_PROOF',
          attendanceSessionType: 'END',
          criteriaIds: [20, 6],
          format: 'ONLINE',
          tags: ['tình nguyện'],
          hasCertificate: true,
          dateHappen: new Date('2030-01-03T08:00:00').toISOString(),
          dateOpen: new Date(existing.dateOpen!).toISOString(),
        })
      )
    )
    expect(view.onSaveEvent).toHaveBeenCalledWith(
      expect.objectContaining({ attendanceMethod: 'STUDENT_PROOF', attendanceSessionType: 'END' }),
      false
    )
  })
  it('rejects registration closing after event start instead of changing the event time', async () => {
    open({ ...existing, dateClose: '2030-01-04T08:00:00+07:00' })
    await waitFor(() => expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Học kỳ 1'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    expect(
      screen.getByText('Thời gian đóng đăng ký không được sau giờ bắt đầu sự kiện.')
    ).toBeInTheDocument()
    expect(window.alert).not.toHaveBeenCalled()
    expect(fanpageAdminService.updateAdminEvent).not.toHaveBeenCalled()
  })
  it('defaults opening to the current local date and minute', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-15T17:42:00+07:00'))
    open()
    expect(screen.getByPlaceholderText('Ngày mở cổng...')).toHaveValue('2026-11-15')
    expect(screen.getByPlaceholderText('Giờ mở')).toHaveValue('17:42')
  })
  it('shows every required-field error inline without alert or upload', () => {
    open()
    fireEvent.click(screen.getAllByRole('button', { name: 'Xuất bản sự kiện' })[0])
    expect(screen.getByText('Vui lòng nhập tên sự kiện.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập nội dung sự kiện.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng tải lên ảnh bìa sự kiện.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên sự kiện/)).toHaveAttribute('aria-invalid', 'true')
    expect(window.alert).not.toHaveBeenCalled()
    expect(fanpageAdminService.createAdminEvent).not.toHaveBeenCalled()
  })
  it('revalidates closing immediately when opening changes, including equality', () => {
    open(existing)
    const openDate = screen.getByPlaceholderText('Ngày mở cổng...')
    fireEvent.change(openDate, { target: { value: '2030-01-02' } })
    fireEvent.change(screen.getByPlaceholderText('Giờ mở'), { target: { value: '08:00' } })
    expect(
      screen.getByText('Thời gian đóng đăng ký phải sau thời gian mở đăng ký.')
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Giờ đóng')).toHaveAttribute('data-min-time', '08:01')
    fireEvent.change(screen.getByPlaceholderText('Giờ đóng'), { target: { value: '08:01' } })
    expect(
      screen.queryByText('Thời gian đóng đăng ký phải sau thời gian mở đăng ký.')
    ).not.toBeInTheDocument()
  })
  it('shows server validation at the corresponding field and keeps the form open', async () => {
    vi.mocked(fanpageAdminService.updateAdminEvent).mockRejectedValueOnce({
      response: {
        data: { data: { name: 'Tên sự kiện đã tồn tại.' }, message: 'Validation error' },
      },
    })
    const view = open(existing)
    await waitFor(() => expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Học kỳ 1'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Cập nhật sự kiện' })[0])
    expect(await screen.findByText('Tên sự kiện đã tồn tại.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên sự kiện/)).toHaveAttribute(
      'aria-describedby',
      'event-error-name'
    )
    expect(view.onSaveEvent).not.toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalled()
  })
  it('keeps publication errors inline and allows retrying the saved draft', async () => {
    vi.mocked(fanpageAdminService.changeEventStatus).mockRejectedValueOnce(
      new Error('Máy chủ tạm thời không khả dụng.')
    )
    const view = open(existing)
    await waitFor(() => expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Học kỳ 1'))
    fireEvent.click(screen.getAllByRole('button', { name: 'Cập nhật sự kiện' })[0])
    expect(await screen.findByText(/Đã lưu sự kiện nhưng chưa xuất bản được/)).toBeInTheDocument()
    expect(view.onSaveEvent).not.toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cập nhật sự kiện' })[0])
    await waitFor(() =>
      expect(view.onSaveEvent).toHaveBeenCalledWith(
        expect.objectContaining({ id: '10', status: 'PUBLISHED' }),
        true
      )
    )
    expect(fanpageAdminService.createAdminEvent).not.toHaveBeenCalled()
  })
  it('reuses the newly saved event ID when publishing fails and is retried', async () => {
    vi.mocked(fanpageAdminService.changeEventStatus).mockRejectedValueOnce(
      new Error('Thử lại sau.')
    )
    const view = open()
    fireEvent.keyDown(await screen.findByLabelText(/Năm học/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: '2029 - 2030' }))
    fireEvent.keyDown(await screen.findByLabelText(/Học kỳ/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: /Học kỳ 1/ }))
    fireEvent.change(screen.getByLabelText(/Tên sự kiện/), { target: { value: 'Sự kiện thử' } })
    fireEvent.change(screen.getByLabelText(/Địa điểm tổ chức/), { target: { value: 'Hội trường' } })
    fireEvent.change(screen.getByPlaceholderText(/Nhập nội dung/), {
      target: { value: 'Nội dung' },
    })
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
    fireEvent.click(screen.getAllByRole('button', { name: 'Xuất bản sự kiện' })[0])
    expect(await screen.findByText(/Đã lưu sự kiện nhưng chưa xuất bản được/)).toBeInTheDocument()
    expect(view.onSaveEvent).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('button', { name: 'Xuất bản sự kiện' })[0])
    await waitFor(() =>
      expect(view.onSaveEvent).toHaveBeenCalledWith(
        expect.objectContaining({ id: '10', status: 'PUBLISHED' }),
        true
      )
    )
    expect(fanpageAdminService.createAdminEvent).toHaveBeenCalledTimes(1)
    expect(fanpageAdminService.updateAdminEvent).toHaveBeenCalledWith('10', expect.any(Object))
  })
  it('requires selecting a year before a semester and clears the previous semester on year change', async () => {
    const view = open(existing)
    await waitFor(() => expect(screen.getByLabelText(/Năm học/)).toHaveTextContent('2029 - 2030'))
    expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Học kỳ 1')
    fireEvent.keyDown(screen.getByLabelText(/Năm học/), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: '2030 - 2031' }))
    expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Chọn học kỳ áp dụng')
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    expect(screen.getByText('Vui lòng chọn học kỳ hợp lệ.')).toBeInTheDocument()
    expect(fanpageAdminService.updateAdminEvent).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByLabelText(/Học kỳ/), { key: 'ArrowDown' })
    expect(await screen.findAllByRole('option')).toHaveLength(1)
    fireEvent.click(screen.getByRole('option', { name: 'Học kỳ 1' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.updateAdminEvent).toHaveBeenCalledWith(
        '10',
        expect.objectContaining({ semesterId: 2 })
      )
    )
    expect(view.onSaveEvent).toHaveBeenCalledWith(
      expect.objectContaining({ semesterName: 'Học kỳ 1 · 2030 - 2031' }),
      false
    )
  })
  it('shows a compact point selector and keeps removal connected to the saved benefits', async () => {
    open({
      ...existing,
      eventPoints: [
        {
          pointCategoryId: 2,
          pointCategoryName: 'Tham gia hội thảo',
          pointCategoryCode: 'I.a',
          point: 2,
          maximum: 3,
        },
      ],
    })
    await waitFor(() => expect(screen.getByLabelText(/Năm học/)).toHaveTextContent('2029 - 2030'))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn Tham gia hội thảo' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu bản nháp' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.updateAdminEvent).toHaveBeenCalledWith(
        '10',
        expect.objectContaining({ eventPoints: [] })
      )
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chọn mục điểm rèn luyện' }))
    expect(await screen.findByRole('dialog', { name: 'Điểm rèn luyện' })).toBeInTheDocument()
  })
})

it.each([true, false])(
  'retains backend self attendance permission %s when saving unrelated edits',
  async (allowSelfCheck) => {
    open({
      ...existing,
      allowSelfCheck,
      attendanceMethod: allowSelfCheck ? 'MANUAL' : 'STUDENT_PROOF',
    })
    await waitFor(() => expect(screen.getByLabelText(/Học kỳ/)).toHaveTextContent('Học kỳ 1'))
    fireEvent.change(screen.getByLabelText(/Tên sự kiện/), { target: { value: 'Đổi tên sự kiện' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cập nhật sự kiện' })[0])
    await waitFor(() =>
      expect(fanpageAdminService.updateAdminEvent).toHaveBeenCalledWith(
        '10',
        expect.objectContaining({ name: 'Đổi tên sự kiện', allowSelfCheck })
      )
    )
  }
)
