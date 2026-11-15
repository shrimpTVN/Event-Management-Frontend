import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FanpageEventDetailAdminView } from '../FanpageEventDetailAdminView'
import { fanpageAdminService } from '../../services/fanpageAdminService'
import type { AdminEvent, EventRegistrationItem } from '../../types/fanpageAdmin.types'

vi.mock('../../services/fanpageAdminService', () => ({
  fanpageAdminService: {
    getEventAttendees: vi.fn(),
    getPointCategories: vi.fn().mockResolvedValue([]),
    getSv5tCriterias: vi.fn().mockResolvedValue([]),
    batchCheckInAttendees: vi.fn(),
    batchCheckOutAttendees: vi.fn(),
    confirmAttendance: vi.fn(),
    checkInAttendee: vi.fn(),
    checkOutAttendee: vi.fn(),
    finalizeAttendance: vi.fn(),
    changeEventStatus: vi.fn(),
    completeEventAttendance: vi.fn(),
    exportAttendeesCsv: vi.fn(),
  },
}))

const event: AdminEvent = {
  id: '10',
  code: 'EVT-0010',
  name: 'Ngày hội tình nguyện',
  description: '',
  eventTypeId: 1,
  eventTypeName: 'Tình nguyện',
  fanpageId: '7',
  organizerName: 'Đoàn trường',
  dateStart: '2026-11-13',
  dateEnd: '2026-11-13',
  dateOpen: '2026-11-10T08:30:00+07:00',
  dateClose: '2026-11-12T17:00:00+07:00',
  timeStart: '07:00',
  timeEnd: '11:00',
  format: 'OFFLINE',
  location: 'Hội trường Rùa',
  capacity: 100,
  registeredCount: 2,
  checkedInCount: 1,
  status: 'PUBLISHED',
  bannerUrl: '/poster.jpg',
  requiresApproval: false,
  autoEmail: false,
  isPublic: true,
  trainingPoints: 3,
  trainingPointCategoryCode: 'V.b',
  sv5tCriteriaName: 'Tình nguyện tốt (Hiến máu)',
  hasCertificate: false,
  tags: [],
  createdAt: '',
}
const attendees: EventRegistrationItem[] = [
  {
    id: '1',
    userId: '11',
    studentId: 'B123',
    fullName: 'Nguyễn An',
    major: 'Kỹ thuật phần mềm',
    kNumber: 49,
    email: '',
    phone: '',
    registeredAt: '',
    status: 'COMPLETED',
  },
  {
    id: '2',
    userId: '12',
    studentId: 'B456',
    fullName: 'Trần Bình',
    major: 'Khoa học máy tính',
    kNumber: 49,
    email: '',
    phone: '',
    registeredAt: '',
    status: 'REGISTERED',
    startEvidenceUrl: '/proof.jpg',
  },
]

let serverRows: EventRegistrationItem[]
beforeEach(() => {
  vi.resetAllMocks()
  serverRows = attendees.map((row) => ({ ...row }))
  vi.mocked(fanpageAdminService.getEventAttendees).mockImplementation(async () =>
    serverRows.map((row) => ({ ...row }))
  )
  vi.mocked(fanpageAdminService.batchCheckInAttendees).mockImplementation(async (_eventId, ids) => {
    serverRows = serverRows.map((row) =>
      ids.includes(row.userId) ? { ...row, status: 'CHECKED_IN' } : row
    )
  })
  vi.mocked(fanpageAdminService.batchCheckOutAttendees).mockImplementation(
    async (_eventId, ids) => {
      serverRows = serverRows.map((row) =>
        ids.includes(row.userId) ? { ...row, status: 'COMPLETED' } : row
      )
    }
  )
  vi.mocked(fanpageAdminService.confirmAttendance).mockImplementation(async (_id, ids) => {
    serverRows = serverRows.map((row) =>
      ids.includes(row.userId) ? { ...row, status: 'CONFIRMED' } : row
    )
  })
  vi.mocked(fanpageAdminService.getPointCategories).mockResolvedValue([])
  vi.mocked(fanpageAdminService.getSv5tCriterias).mockResolvedValue([])
})
afterEach(cleanup)

function renderDetail(overrides: Partial<AdminEvent> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const onBack = vi.fn()
  const onEditClick = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <FanpageEventDetailAdminView
        event={{ ...event, ...overrides }}
        onBack={onBack}
        onEditClick={onEditClick}
      />
    </QueryClientProvider>
  )
  return { onBack, onEditClick, client }
}

describe('event management layout', () => {
  it('sorts registration dates without changing attendance selections', async () => {
    serverRows[0].registeredAt = '11:00:00 12/11/2026'
    serverRows[0].registeredAtRaw = '2026-11-12T04:00:00Z'
    serverRows[1].registeredAt = '08:00:00 11/12/2026'
    serverRows[1].registeredAtRaw = '2026-12-11T01:00:00Z'
    renderDetail()
    await screen.findByText('Trần Bình')
    const before = (a: string, b: string) =>
      Boolean(
        screen.getByText(a).compareDocumentPosition(screen.getByText(b)) &
        Node.DOCUMENT_POSITION_FOLLOWING
      )
    fireEvent.click(screen.getByRole('button', { name: 'Thời gian & Lịch sử: chưa sắp xếp' }))
    expect(before('Trần Bình', 'Nguyễn An')).toBe(true)
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Thời gian & Lịch sử: mới nhất trước' }))
    expect(before('Nguyễn An', 'Trần Bình')).toBe(true)
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
  })
  it.each(['RECORDED', 'ABSENT'] as const)(
    'keeps the photo layout after finalization changes all registrations to %s',
    async (status) => {
      serverRows[0].status = status
      serverRows[0].startEvidenceUrl = '/check-in.jpg'
      serverRows[0].endEvidenceUrl = '/check-out.jpg'
      serverRows[1].status = status
      serverRows[1].startEvidenceUrl = undefined
      renderDetail({ status: 'COMPLETED', attendanceMethod: undefined })
      await screen.findByText('Trần Bình')
      expect(screen.getAllByRole('button', { name: 'Xem ảnh' })).toHaveLength(1)
      expect(screen.getByText('Chưa gửi hình')).toBeInTheDocument()
      expect(screen.queryByText(/^Check-in:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Check-out:/)).not.toBeInTheDocument()
    }
  )

  it('retains manual progress for ended manual attendance without photo evidence', async () => {
    serverRows.forEach((row) => {
      row.status = 'RECORDED'
      row.startEvidenceUrl = undefined
    })
    renderDetail({ status: 'COMPLETED', attendanceMethod: undefined })
    await screen.findByText('Trần Bình')
    expect(screen.getAllByText('Check-in: Đã vào')).toHaveLength(2)
    expect(screen.getAllByText('Check-out: Đã ra')).toHaveLength(2)
    expect(screen.queryByText('Chưa gửi hình')).not.toBeInTheDocument()
  })
  it('checks in on behalf with default ticks, excludes unchecked students and never chains checkout', async () => {
    serverRows[0].status = 'SELF_CHECKED_IN'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Lê Chi',
      status: 'REGISTERED',
    })
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    const onBehalf = await screen.findByRole('button', { name: 'Điểm danh thay' })
    await waitFor(() => expect(onBehalf).toBeEnabled())
    fireEvent.click(onBehalf)
    const dialog = screen.getByRole('dialog', { name: 'Điểm danh thay' })
    expect(within(dialog).getByRole('checkbox', { name: 'Check-in thay Trần Bình' })).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: 'Check-in thay Lê Chi' })).toBeChecked()
    expect(
      within(dialog).queryByRole('checkbox', { name: 'Check-in thay Nguyễn An' })
    ).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Check-in thay Lê Chi' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã check-in thay cho 1 sinh viên.')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fanpageAdminService.batchCheckInAttendees).toHaveBeenCalledExactlyOnceWith('10', ['12'])
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.confirmAttendance).not.toHaveBeenCalled()
  })

  it('checks out both self and manual check-ins on behalf without confirming pending photos', async () => {
    serverRows[0].status = 'SELF_CHECKED_IN'
    serverRows[1].status = 'CHECKED_IN'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Đang chờ duyệt',
      status: 'SPENDING_CONFIRM',
    })
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    const onBehalf = await screen.findByRole('button', { name: 'Điểm danh thay' })
    await waitFor(() => expect(onBehalf).toBeEnabled())
    fireEvent.click(onBehalf)
    const dialog = screen.getByRole('dialog', { name: 'Điểm danh thay' })
    expect(within(dialog).getByRole('tab', { name: 'Check-out (2)' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(within(dialog).getByRole('checkbox', { name: 'Check-out thay Nguyễn An' })).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: 'Check-out thay Trần Bình' })).toBeChecked()
    expect(within(dialog).queryByText('Đang chờ duyệt')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã check-out thay cho 2 sinh viên.')
    expect(fanpageAdminService.batchCheckOutAttendees).toHaveBeenCalledExactlyOnceWith('10', [
      '11',
      '12',
    ])
    expect(fanpageAdminService.confirmAttendance).not.toHaveBeenCalled()
    expect(fanpageAdminService.completeEventAttendance).not.toHaveBeenCalled()
  })

  it('keeps on-behalf selections on failure and only changes visible rows with the header checkbox', async () => {
    serverRows[0].status = 'SELF_CHECKED_IN'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Lê Chi',
      status: 'REGISTERED',
    })
    vi.mocked(fanpageAdminService.batchCheckInAttendees).mockRejectedValueOnce(
      new Error('Mất kết nối')
    )
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    const onBehalf = await screen.findByRole('button', { name: 'Điểm danh thay' })
    await waitFor(() => expect(onBehalf).toBeEnabled())
    fireEvent.click(onBehalf)
    const dialog = screen.getByRole('dialog', { name: 'Điểm danh thay' })
    const search = within(dialog).getByRole('textbox', { name: 'Tìm sinh viên điểm danh thay' })
    fireEvent.change(search, { target: { value: 'Lê Chi' } })
    fireEvent.click(
      within(dialog).getByRole('checkbox', { name: 'Chọn tất cả điểm danh thay đang lọc' })
    )
    fireEvent.change(search, { target: { value: '' } })
    expect(within(dialog).getByRole('checkbox', { name: 'Check-in thay Lê Chi' })).not.toBeChecked()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Mất kết nối')
    expect(within(dialog).getByRole('checkbox', { name: 'Check-in thay Trần Bình' })).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: 'Check-in thay Lê Chi' })).not.toBeChecked()
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Lưu' })).toBeEnabled())
    const save = within(dialog).getByRole('button', { name: 'Lưu' })
    fireEvent.click(save)
    fireEvent.click(save)
    await screen.findByText('Đã check-in thay cho 1 sinh viên.')
    expect(fanpageAdminService.batchCheckInAttendees).toHaveBeenCalledTimes(2)
  })

  it('hides on-behalf attendance for ended events', async () => {
    serverRows[1].status = 'SELF_CHECKED_IN'
    renderDetail({ status: 'COMPLETED', attendanceMethod: 'STUDENT_PROOF' })
    await screen.findByText('Trần Bình')
    expect(screen.queryByRole('button', { name: 'Điểm danh thay' })).not.toBeInTheDocument()
  })
  it('warns that pending confirmation becomes absent and shows counts from saved data before finalizing', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc sự kiện' }))
    const dialog = screen.getByRole('dialog', { name: 'Kết thúc sự kiện?' })
    expect(within(dialog).getByText(/kể cả đang chờ xác nhận/)).toBeInTheDocument()
    expect(
      within(dialog).getByText(/1 sinh viên được ghi nhận · 1 sinh viên sẽ bị tính vắng/)
    ).toBeInTheDocument()
    expect(fanpageAdminService.completeEventAttendance).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kết thúc sự kiện' }))
    await screen.findByText('Đã kết thúc sự kiện và ghi nhận kết quả điểm danh.')
    expect(fanpageAdminService.completeEventAttendance).toHaveBeenCalledExactlyOnceWith('10')
    expect(fanpageAdminService.confirmAttendance).not.toHaveBeenCalled()
  })

  it('keeps recorded attendance complete and a completed event locked after loading from BE', async () => {
    serverRows[0].status = 'RECORDED'
    serverRows[1].status = 'ABSENT'
    renderDetail({ status: 'COMPLETED' })
    await screen.findByText('Trần Bình')
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument()
    expect(screen.getByText('Vắng mặt')).toBeInTheDocument()
    expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kết thúc sự kiện' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
  it('selects only eligible filtered photo rows, preserves hidden selections and clears them without submitting', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Người khác',
      status: 'SPENDING_CONFIRM',
    })
    serverRows.push({
      ...attendees[1],
      id: '4',
      userId: '14',
      fullName: 'Mới gửi ảnh đầu buổi',
      status: 'SELF_CHECKED_IN',
    })
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    await screen.findByText('Trần Bình')
    expect(screen.queryByRole('button', { name: /^Xác nhận \(/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Chọn Mới gửi ảnh đầu buổi' })).toBeDisabled()
    const search = screen.getByPlaceholderText('Tìm kiếm sinh viên, MSSV, ngành...')
    fireEvent.change(search, { target: { value: 'Trần Bình' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' }))
    expect(screen.getByRole('button', { name: 'Xác nhận (1)' })).toBeEnabled()
    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getByRole('checkbox', { name: 'Chọn Người khác' })).not.toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' })
    ).toHaveAttribute('aria-checked', 'mixed')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Người khác' }))
    fireEvent.change(search, { target: { value: 'Trần Bình' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' }))
    expect(screen.getByRole('button', { name: 'Xác nhận (1)' })).toBeEnabled()
    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Chọn Người khác' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn' }))
    expect(screen.queryByRole('button', { name: /^Xác nhận \(/ })).not.toBeInTheDocument()
    expect(fanpageAdminService.confirmAttendance).not.toHaveBeenCalled()
  })

  it('limits manual header selection to filtered eligible students and supports keyboard session switching', async () => {
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Lê Chi',
      status: 'REGISTERED',
    })
    renderDetail()
    await screen.findByText('Trần Bình')
    const search = screen.getByPlaceholderText('Tìm kiếm sinh viên, MSSV, ngành...')
    fireEvent.change(search, { target: { value: 'Trần Bình' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' }))
    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Check-in Lê Chi' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.batchCheckInAttendees).toHaveBeenCalledExactlyOnceWith('10', ['13'])
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Check-in (1)' }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Check-out (1)' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('checkbox', { name: 'Check-out Lê Chi' })).toBeChecked()
  })

  it('hides evidence buttons when BE has not returned photo URLs', async () => {
    serverRows.forEach((row) => {
      row.status = 'COMPLETED'
      row.startEvidenceUrl = undefined
    })
    renderDetail()
    await screen.findByText('Trần Bình')
    expect(screen.queryByRole('button', { name: 'Check-in (0)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ảnh minh chứng' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xem ảnh' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Minh chứng điểm danh' })).not.toBeInTheDocument()
  })
  it('shows photos from BE even for a completed response without photo mode', async () => {
    serverRows[0].startEvidenceUrl = '/actual-check-in.jpg'
    serverRows[0].endEvidenceUrl = '/actual-check-out.jpg'
    renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getAllByRole('button', { name: 'Xem ảnh' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Minh chứng điểm danh' })
    expect(
      within(dialog)
        .getAllByRole('img')
        .map((img) => img.getAttribute('src'))
    ).toEqual(['/actual-check-in.jpg', '/actual-check-out.jpg'])
  })
  it('exports through BE once and preserves the downloaded blob and CSV filename', async () => {
    const csv = new Blob(['server CSV'], { type: 'text/csv' })
    vi.mocked(fanpageAdminService.exportAttendeesCsv).mockResolvedValueOnce(csv)
    const createUrl = vi.fn(() => 'blob:export-csv')
    const revokeUrl = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeUrl })
    const downloads: string[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push(this.download)
    })
    renderDetail()
    await screen.findByText('Trần Bình')
    const exportButton = screen.getByRole('button', { name: 'Xuất CSV' })
    fireEvent.click(exportButton)
    fireEvent.click(exportButton)
    await waitFor(() => expect(createUrl).toHaveBeenCalledExactlyOnceWith(csv))
    expect(fanpageAdminService.exportAttendeesCsv).toHaveBeenCalledExactlyOnceWith('7', '10')
    expect(downloads).toEqual(['attendees-event-10.csv'])
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:export-csv')
    click.mockRestore()
  })
  it('reports failed CSV exports without pretending a local export succeeded', async () => {
    vi.mocked(fanpageAdminService.exportAttendeesCsv).mockRejectedValueOnce(
      new Error('Không có quyền xuất CSV')
    )
    renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('button', { name: 'Xuất CSV' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền xuất CSV')
    expect(screen.getByRole('button', { name: 'Xuất CSV' })).toBeEnabled()
  })
  it('keeps check-in exclusions separate from default checkout choices after an external update', async () => {
    const { client } = renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' }))
    serverRows[1].status = 'CHECKED_IN'
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['event-attendees'] })
    })
    fireEvent.click(await screen.findByRole('tab', { name: 'Check-out (1)' }))
    expect(screen.getByRole('checkbox', { name: 'Check-out Trần Bình' })).toBeChecked()
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
  })
  it('never defaults an unrelated manual check-in when confirming photo attendance', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Chưa gửi ảnh',
      status: 'REGISTERED',
    })
    renderDetail({ attendanceMethod: 'MANUAL' })
    await screen.findByText('Trần Bình')
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' }))
    fireEvent.click(screen.getByRole('button', { name: /^Xác nhận \(\d+\)$/ }))
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.confirmAttendance).toHaveBeenCalledExactlyOnceWith('10', ['12'])
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
  })
  it('keeps individual confirmation in the proof dialog instead of duplicating row actions', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    renderDetail()
    await screen.findByText('Trần Bình')
    expect(
      screen.queryByRole('button', { name: 'Xác nhận điểm danh Trần Bình' })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem ảnh' }))
    const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: 'Xác nhận' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.confirmAttendance).toHaveBeenCalledExactlyOnceWith('10', ['12'])
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Xác nhận điểm danh Trần Bình' })
      ).not.toBeInTheDocument()
    )
  })
  it('confirms directly from the proof dialog without saving selections or confirming other students', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Người khác',
      status: 'SPENDING_CONFIRM',
    })
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Người khác' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Xem ảnh' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Minh chứng điểm danh' })
    const confirm = within(dialog).getByRole('button', { name: 'Xác nhận' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(await within(dialog).findByRole('button', { name: 'Đã xác nhận' })).toBeDisabled()
    expect(fanpageAdminService.confirmAttendance).toHaveBeenCalledExactlyOnceWith('10', ['12'])
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
    expect(serverRows.find((row) => row.userId === '13')?.status).toBe('SPENDING_CONFIRM')
  })
  it('keeps the proof dialog open with an error and allows retrying confirmation', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    vi.mocked(fanpageAdminService.confirmAttendance).mockRejectedValueOnce(
      new Error('Không thể xác nhận')
    )
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('button', { name: 'Xem ảnh' }))
    const dialog = screen.getByRole('dialog', { name: 'Minh chứng điểm danh' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không thể xác nhận')
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Xác nhận' })).toBeEnabled()
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }))
    expect(await within(dialog).findByRole('button', { name: 'Đã xác nhận' })).toBeDisabled()
    expect(fanpageAdminService.confirmAttendance).toHaveBeenCalledTimes(2)
  })
  it('can confirm BE pending submissions when event mode and image fields are not returned', async () => {
    serverRows[0].status = 'CONFIRMED'
    serverRows[1].status = 'SPENDING_CONFIRM'
    serverRows[1].startEvidenceUrl = undefined
    renderDetail()
    await screen.findByText('Trần Bình')
    expect(screen.queryByRole('button', { name: 'Xem ảnh' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Chọn Nguyễn An' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' }))
    expect(fanpageAdminService.confirmAttendance).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Xác nhận \(\d+\)$/ }))
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.confirmAttendance).toHaveBeenCalledExactlyOnceWith('10', ['12'])
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' })).toBeDisabled()
    )
  })
  it('keeps full event information, attendance counts, search and page actions', async () => {
    const { onBack, onEditClick } = renderDetail()
    await screen.findByText('Nguyễn An')
    const breadcrumb = screen.getByRole('navigation', { name: 'Đường dẫn trang' })
    expect(within(breadcrumb).getByText('Quản trị fanpage')).toBeInTheDocument()
    expect(within(breadcrumb).getByText('Chi tiết sự kiện')).toHaveAttribute('aria-current', 'page')
    expect(
      within(breadcrumb).getByRole('button', { name: 'Quay lại danh sách sự kiện' })
    ).toHaveTextContent('Sự kiện')
    const summary = screen.getByRole('region', { name: 'Thông tin sự kiện' })
    expect(within(summary).getByRole('img')).toHaveClass('object-contain')
    expect(within(summary).getByText('+3 điểm mục V.b')).toBeInTheDocument()
    expect(within(summary).getByText(/08:30.*10\/11\/2026/)).toBeInTheDocument()
    expect(within(summary).getByText(/17:00.*12\/11\/2026/)).toBeInTheDocument()
    expect(within(summary).getByText(event.sv5tCriteriaName!)).toBeInTheDocument()
    expect(within(summary).queryByText('Không cấp chứng nhận')).not.toBeInTheDocument()
    const stats = screen.getByRole('region', { name: 'Thống kê tham gia' })
    expect(within(stats).getByText('2')).toBeInTheDocument()
    expect(within(stats).getAllByText('1')).toHaveLength(2)
    expect(within(stats).getByRole('progressbar', { name: 'Đã đăng ký' })).toHaveAttribute(
      'aria-valuenow',
      '2'
    )
    expect(within(stats).getByRole('progressbar', { name: 'Đã hoàn thành' })).toHaveAttribute(
      'aria-valuenow',
      '50'
    )
    expect(within(stats).getByRole('progressbar', { name: 'Chưa điểm danh' })).toHaveAttribute(
      'aria-valuenow',
      '50'
    )
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm sinh viên, MSSV, ngành...'), {
      target: { value: 'B456' },
    })
    expect(screen.queryByText('Nguyễn An')).not.toBeInTheDocument()
    expect(screen.getByText('Trần Bình')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa sự kiện' }))
    expect(onEditClick).toHaveBeenCalledWith(event)
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách sự kiện' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('uses category codes and the root/leaf SV5T label, preserving each reward', async () => {
    vi.mocked(fanpageAdminService.getPointCategories).mockResolvedValue([
      ...[1, 2, 3, 4, 5].map((id) => ({
        id,
        name: `Mục ${id}`,
        level: 0,
        childrenOrder: id,
        maximum: 30,
        parentCategoryId: null,
      })),
      { id: 50, name: 'Mục V.a', parentCategoryId: 5, level: 1, childrenOrder: 1, maximum: 10 },
      { id: 51, name: 'Mục V.b', parentCategoryId: 5, level: 1, childrenOrder: 2, maximum: 10 },
      {
        id: 511,
        name: 'Chi tiết dài không cần hiển thị',
        parentCategoryId: 51,
        level: 2,
        childrenOrder: 1,
        maximum: 10,
      },
    ])
    vi.mocked(fanpageAdminService.getSv5tCriterias).mockResolvedValue([
      { id: 1, name: 'Tình nguyện tốt', level: 0, childrenOrder: 1, parentId: null },
      { id: 2, name: 'Yêu cầu trung gian', parentId: 1, level: 1, childrenOrder: 1 },
      { id: 3, name: 'Tham gia tình nguyện', parentId: 2, level: 2, childrenOrder: 1 },
    ])
    renderDetail({
      sv5tCriteriaName: 'Tham gia tình nguyện',
      eventPoints: [
        { pointCategoryId: 511, pointCategoryName: 'Mô tả dài', point: 3 },
        { pointCategoryId: 50, pointCategoryName: 'Mô tả khác', point: 0 },
      ],
    })
    expect(await screen.findByText('+3 điểm mục V.b.1')).toBeInTheDocument()
    expect(screen.getByText('+0 điểm mục V.a')).toBeInTheDocument()
    expect(screen.getByText('Tình nguyện tốt (Tham gia tình nguyện)')).toBeInTheDocument()
    expect(screen.queryByText('Yêu cầu trung gian')).not.toBeInTheDocument()
  })

  it('handles missing registration dates and zero denominators without inventing values', async () => {
    vi.mocked(fanpageAdminService.getEventAttendees).mockResolvedValue([])
    renderDetail({ capacity: 0, dateOpen: undefined, dateClose: undefined })
    const summary = screen.getByRole('region', { name: 'Thông tin sự kiện' })
    expect(within(summary).getAllByText('Chưa cập nhật')).toHaveLength(2)
    screen
      .getAllByRole('progressbar')
      .forEach((bar) => expect(bar).toHaveAttribute('aria-valuenow', '0'))
  })

  it('opens available images and confirms only pending registrations through the confirmation API', async () => {
    serverRows[1].status = 'SPENDING_CONFIRM'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Không nộp ảnh',
      startEvidenceUrl: undefined,
    })
    serverRows.push({
      ...attendees[1],
      id: '4',
      userId: '14',
      fullName: 'Ảnh cũ',
      status: 'SPENDING_CONFIRM',
      startEvidenceUrl: undefined,
      evidenceUrl: '/legacy.jpg',
    })
    renderDetail({ attendanceMethod: 'STUDENT_PROOF' })
    await screen.findByText('Trần Bình')
    expect(screen.getByRole('checkbox', { name: 'Chọn Không nộp ảnh' })).toBeDisabled()
    fireEvent.click(screen.getAllByRole('button', { name: 'Xem ảnh' })[0])
    const dialog = screen.getByRole('dialog', { name: 'Minh chứng điểm danh' })
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/proof.jpg')
    expect(within(dialog).getByRole('img')).toHaveClass('object-contain')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' }))
    expect(screen.getByRole('checkbox', { name: 'Chọn Trần Bình' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Chọn Ảnh cũ' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Chọn Không nộp ảnh' })).not.toBeChecked()
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /^Xác nhận \(\d+\)$/ }))
    await screen.findByText('Đã lưu điểm danh cho 2 sinh viên.')
    expect(fanpageAdminService.confirmAttendance).toHaveBeenCalledExactlyOnceWith('10', [
      '12',
      '14',
    ])
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
  })

  it('defaults to all eligible check-ins, allows unchecking absent people and saves only those left selected', async () => {
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Lê Chi',
      status: 'REGISTERED',
    })
    renderDetail()
    await screen.findByText('Trần Bình')
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Check-in Lê Chi' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Check-out Trần Bình' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Check-in Nguyễn An' })).toBeDisabled()
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Check-in Lê Chi' }))
    expect(
      screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' })
    ).toHaveAttribute('aria-checked', 'mixed')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.batchCheckInAttendees).toHaveBeenCalledExactlyOnceWith('10', ['12'])
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
    expect(serverRows.find((row) => row.userId === '13')?.status).toBe('REGISTERED')
  })
  it('requires a saved check-in before showing checkout and only defaults eligible checkouts when switching phase', async () => {
    renderDetail()
    await screen.findByText('Trần Bình')
    expect(screen.getByRole('tab', { name: 'Check-out (0)' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(screen.queryByRole('checkbox', { name: 'Check-out Trần Bình' })).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('tab', { name: 'Check-out (1)' }))
    expect(screen.getByRole('checkbox', { name: 'Check-out Trần Bình' })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: 'Check-in Trần Bình' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await waitFor(() =>
      expect(fanpageAdminService.batchCheckOutAttendees).toHaveBeenCalledExactlyOnceWith('10', [
        '12',
      ])
    )
    expect(fanpageAdminService.batchCheckInAttendees).toHaveBeenCalledTimes(1)
  })
  it('defaults to checkout on reentry when only checked-in students remain, without chaining a new check-in', async () => {
    serverRows[1].status = 'CHECKED_IN'
    renderDetail()
    expect(await screen.findByRole('checkbox', { name: 'Check-out Trần Bình' })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckOutAttendees).toHaveBeenCalledExactlyOnceWith('10', ['12'])
  })
  it('selects all eligible checkouts after exclusions and never includes a student without check-in', async () => {
    serverRows[1].status = 'CHECKED_IN'
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Lê Chi',
      status: 'CHECKED_IN',
    })
    serverRows.push({
      ...attendees[1],
      id: '4',
      userId: '14',
      fullName: 'Chưa vào',
      status: 'REGISTERED',
    })
    renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('tab', { name: 'Check-out (2)' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Check-out Lê Chi' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả trong danh sách đang lọc' }))
    expect(screen.getByRole('checkbox', { name: 'Check-out Chưa vào' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    await screen.findByText('Đã lưu điểm danh cho 2 sinh viên.')
    expect(fanpageAdminService.batchCheckOutAttendees).toHaveBeenCalledExactlyOnceWith('10', [
      '12',
      '13',
    ])
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
  })
  it('preserves exclusions during background refresh and allows clearing the whole draft', async () => {
    const { client } = renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' }))
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['event-attendees'] })
    })
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).not.toBeChecked()
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hủy thay đổi' }))
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).not.toBeChecked()
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
  })
  it('retains the draft on failed check-in and prevents duplicate submissions', async () => {
    vi.mocked(fanpageAdminService.batchCheckInAttendees).mockRejectedValueOnce(
      new Error('Mất kết nối')
    )
    renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).toBeChecked()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu' })).toBeEnabled())
    const save = screen.getByRole('button', { name: 'Lưu' })
    fireEvent.click(save)
    fireEvent.click(save)
    await screen.findByText('Đã lưu điểm danh cho 1 sinh viên.')
    expect(fanpageAdminService.batchCheckInAttendees).toHaveBeenCalledTimes(2)
    expect(fanpageAdminService.batchCheckOutAttendees).not.toHaveBeenCalled()
  })
  it('does not submit missing user IDs, cancelled or absent registrations', async () => {
    serverRows[1].userId = ''
    serverRows.push({
      ...attendees[1],
      id: '3',
      userId: '13',
      fullName: 'Vắng',
      status: 'ABSENT',
      startEvidenceUrl: undefined,
    })
    serverRows.push({
      ...attendees[1],
      id: '4',
      userId: '14',
      fullName: 'Đã hủy',
      status: 'CANCELLED',
    })
    renderDetail()
    await screen.findByText('Trần Bình')
    expect(screen.getByRole('checkbox', { name: 'Check-in Vắng' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Check-in Đã hủy' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác định được ID tài khoản')
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
  })
  it('closes only after confirmation, discards unsaved selections and immediately locks attendance', async () => {
    renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc sự kiện' }))
    const dialog = screen.getByRole('dialog', { name: 'Kết thúc sự kiện?' })
    expect(within(dialog).getByText(/lựa chọn chưa lưu/)).toBeInTheDocument()
    expect(fanpageAdminService.completeEventAttendance).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kết thúc sự kiện' }))
    await screen.findByText('Đã kết thúc sự kiện và ghi nhận kết quả điểm danh.')
    expect(fanpageAdminService.completeEventAttendance).toHaveBeenCalledExactlyOnceWith('10')
    expect(fanpageAdminService.changeEventStatus).not.toHaveBeenCalled()
    expect(fanpageAdminService.batchCheckInAttendees).not.toHaveBeenCalled()
    expect(screen.queryByRole('checkbox', { name: 'Check-in Trần Bình' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kết thúc sự kiện' })).not.toBeInTheDocument()
    expect(screen.getByText('Đã kết thúc')).toBeInTheDocument()
  })
  it('keeps an event open and preserves the selection if closing fails', async () => {
    vi.mocked(fanpageAdminService.completeEventAttendance).mockRejectedValueOnce(
      new Error('Đóng thất bại')
    )
    renderDetail()
    await screen.findByText('Trần Bình')
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc sự kiện' }))
    const dialog = screen.getByRole('dialog', { name: 'Kết thúc sự kiện?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Kết thúc sự kiện' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Đóng thất bại')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }))
    expect(screen.getByRole('checkbox', { name: 'Check-in Trần Bình' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeEnabled()
  })
  it('keeps closed events read-only without default selections or closing actions', async () => {
    renderDetail({ status: 'CLOSED' })
    await screen.findByText('Trần Bình')
    expect(screen.queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Check-in Trần Bình' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Kết thúc sự kiện' })).not.toBeInTheDocument()
  })
})
