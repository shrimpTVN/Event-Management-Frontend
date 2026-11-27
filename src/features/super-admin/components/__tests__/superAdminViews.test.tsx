import { superAdminService } from '../../services/superAdminService'
import { SuperAdminUsersView } from '../SuperAdminUsersView'
import { FanpageReviewModal } from '../modals/FanpageReviewModal'
import { apiClient } from '@/shared'
import { SuperAdminFanpagesView } from '../SuperAdminFanpagesView'
import { mapAdminFanpage } from '../../services/superAdminService'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), patch: vi.fn() } }))
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { SuperAdminEventsView } from '../SuperAdminEventsView'
import { EventModerationModal } from '../modals/EventModerationModal'
import { UserDetailModal } from '../modals/UserDetailModal'
import { mapAdminEvent, mapAdminUser } from '../../services/superAdminService'
afterEach(cleanup)

describe('superadmin table interactions', () => {
  it('shows the full poster, registrations and concise benefits in the event drawer', () => {
    render(
      <EventModerationModal
        event={mapAdminEvent({
          id: 10,
          name: 'Hiến máu tình nguyện',
          bannerUrl: '/poster.jpg',
          registeredCount: 0,
          capacity: 500,
          eventPoints: [
            {
              pointCategoryId: 41,
              point: 10,
              pointCategoryCode: 'IV.b',
              pointCategoryName: 'Mô tả dài không cần hiển thị',
            },
          ],
          criteriaName: 'Tình nguyện tốt (Hiến máu tình nguyện)',
        })}
        isOpen
        onClose={vi.fn()}
        onToggleHideEvent={vi.fn()}
      />
    )
    const drawer = screen.getByRole('dialog')
    expect(within(drawer).getByRole('img')).toHaveClass('h-auto', 'object-contain')
    expect(within(drawer).getByText('0 / 500')).toBeInTheDocument()
    expect(within(drawer).getByText('+10 điểm mục IV.b')).toBeInTheDocument()
    expect(within(drawer).queryByText('Mô tả dài không cần hiển thị')).not.toBeInTheDocument()
    expect(within(drawer).getByText('Tình nguyện tốt (Hiến máu tình nguyện)')).toBeInTheDocument()
  })
  it('opens benefits without opening the row drawer, preserving each reward', () => {
    const onSelectEvent = vi.fn()
    const event = mapAdminEvent(
      {
        id: 1,
        name: 'Tên sự kiện rất dài cần xem đầy đủ',
        fanpageName: 'Đơn vị tổ chức',
        capacity: 100,
        eventPoints: [{ pointCategoryId: 9, point: 5, pointCategoryCode: 'IV.b' }],
        criteriaName: 'Học tập tốt',
      },
      new Map([[9, 'Mục điểm thực tế']])
    )
    render(
      <SuperAdminEventsView
        events={[event]}
        onSelectEvent={onSelectEvent}
        onToggleHideEvent={vi.fn()}
      />
    )
    expect(screen.getByText(event.title)).toBeInTheDocument()
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument()
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem quyền lợi' }))
    const modal = screen.getByRole('dialog', { name: 'Quyền lợi tham gia' })
    expect(within(modal).queryByText('Mục điểm thực tế')).not.toBeInTheDocument()
    expect(within(modal).getByText('+5 điểm mục IV.b')).toBeInTheDocument()
    expect(within(modal).getByText('Học tập tốt')).toBeInTheDocument()
    expect(onSelectEvent).not.toHaveBeenCalled()
    fireEvent.click(within(modal).getByRole('button', { name: /^Đóng$/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('keeps zero registrations visible', () => {
    render(
      <SuperAdminEventsView
        events={[mapAdminEvent({ id: 1, name: 'Sự kiện', registeredCount: 0, capacity: 0 })]}
        onSelectEvent={vi.fn()}
        onToggleHideEvent={vi.fn()}
      />
    )
    expect(screen.queryByText('Chưa có dữ liệu')).not.toBeInTheDocument()
    expect(screen.getByText('Chỉ tiêu: 0')).toBeInTheDocument()
  })
  it('only offers promotion to superadmin instead of switching student and staff', () => {
    render(
      <UserDetailModal
        user={mapAdminUser({
          userId: 1,
          firstName: 'Nguyễn',
          lastName: 'An',
          email: 'a@ctu.edu.vn',
          roles: ['STUDENT'],
        })}
        isOpen
        onClose={vi.fn()}
        onToggleStatus={vi.fn()}
        onToggleSuperAdmin={vi.fn().mockResolvedValue(true)}
      />
    )
    expect(screen.getByRole('button', { name: 'Cấp quyền Super admin' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cán bộ' })).not.toBeInTheDocument()
    expect(screen.queryByText('Quản trị fanpage')).not.toBeInTheDocument()
  })
})

it('shows the full fanpage name and the contact phone without a separator dot', () => {
  const fanpage = mapAdminFanpage(
    { id: 7, name: 'Tên ngắn', orgName: 'Tên fanpage đầy đủ', helpPhone: '0292 3830 309' },
    { role: 'ADMIN', firstName: 'Nguyễn', lastName: 'An', email: 'admin@ctu.edu.vn' }
  )
  render(
    <SuperAdminFanpagesView
      fanpages={[fanpage]}
      onSelectFanpage={vi.fn()}
      onApproveFanpage={vi.fn()}
      onToggleLockFanpage={vi.fn()}
    />
  )
  expect(screen.getByText('Tên fanpage đầy đủ')).toBeInTheDocument()
  expect(screen.queryByText('Tên ngắn')).not.toBeInTheDocument()
  expect(screen.getByText('Nguyễn An')).toBeInTheDocument()
  expect(screen.getByText('0292 3830 309')).toHaveTextContent('0292 3830 309')
  expect(screen.queryByText('·')).not.toBeInTheDocument()
})

it('refreshes followers when opening fanpage details instead of displaying a cached zero', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ followerCount: 123 } as any)
  const fanpage = mapAdminFanpage({ id: 7, name: 'Fanpage' }, undefined, undefined, 0)
  render(
    <FanpageReviewModal
      fanpage={fanpage}
      isOpen
      onClose={vi.fn()}
      onApprove={vi.fn()}
      onReject={vi.fn()}
      onToggleLock={vi.fn()}
    />
  )
  expect(await screen.findByText('123')).toBeInTheDocument()
  expect(apiClient.get).toHaveBeenCalledWith('/fanpages/7/followers/count')
})

it('keeps student information for a student with fanpage management permission', async () => {
  const user = mapAdminUser(
    { userId: 1, email: 'student@student.ctu.edu.vn', roles: ['STUDENT', 'FANPAGE_ADMIN'] },
    {
      email: 'student@student.ctu.edu.vn',
      studentId: 'B123',
      schoolName: 'Khoa A',
      majorName: 'Ngành B',
      kNumber: '49',
    }
  )
  const onToggleSuperAdmin = vi.fn().mockResolvedValue(true)
  render(
    <UserDetailModal
      user={user}
      isOpen
      onClose={vi.fn()}
      onToggleStatus={vi.fn()}
      onToggleSuperAdmin={onToggleSuperAdmin}
    />
  )
  expect(screen.getByRole('heading', { name: 'Hồ sơ sinh viên' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Hồ sơ cán bộ' })).not.toBeInTheDocument()
  expect(screen.getByText('Mã số sinh viên')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cấp quyền Super admin' }))
  expect(onToggleSuperAdmin).toHaveBeenCalledWith('1', true)
})

it('shows staff information without student fields', () => {
  const user = mapAdminUser({
    userId: 2,
    email: 'staff@ctu.edu.vn',
    roles: ['FANPAGE_ADMIN'],
    staffProfile: {
      staffId: 'CB123',
      orgName: 'Phòng A',
      title: 'Chuyên viên',
      phoneNumber: '0901234567',
    },
  })
  render(
    <UserDetailModal
      user={user}
      isOpen
      onClose={vi.fn()}
      onToggleStatus={vi.fn()}
      onToggleSuperAdmin={vi.fn().mockResolvedValue(true)}
    />
  )
  expect(screen.getByRole('heading', { name: 'Hồ sơ cán bộ' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Hồ sơ sinh viên' })).not.toBeInTheDocument()
  expect(screen.getByText('CB123')).toBeInTheDocument()
  expect(screen.getByText('Chuyên viên')).toBeInTheDocument()
  expect(screen.queryByText('Chuyên ngành')).not.toBeInTheDocument()
})

it('does not call a student fanpage administrator a staff member in the table', () => {
  const user = mapAdminUser(
    { userId: 1, email: 'a@student.ctu.edu.vn', roles: ['STUDENT', 'FANPAGE_ADMIN'] },
    { email: 'a@student.ctu.edu.vn', studentId: 'B123', schoolName: 'Khoa A' }
  )
  render(<SuperAdminUsersView users={[user]} onSelectUser={vi.fn()} onToggleStatus={vi.fn()} />)
  expect(screen.getByText('MSSV: B123')).toBeInTheDocument()
  expect(screen.queryByText('Quản trị fanpage')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Cán bộ/ }))
  expect(screen.queryByText('MSSV: B123')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Sinh viên/ }))
  expect(screen.getByText('MSSV: B123')).toBeInTheDocument()
})

it('shows joined fanpages and distinguishes administrator from member', async () => {
  const spy = vi.spyOn(superAdminService, 'getUserFanpages').mockResolvedValue({
    items: [
      { id: '7', name: 'Fanpage A', role: 'ADMIN' },
      { id: '8', name: 'Fanpage B', role: 'MEMBER' },
    ],
    incomplete: false,
  })
  try {
    render(
      <UserDetailModal
        user={mapAdminUser({ userId: 1, email: 'a@ctu.edu.vn', roles: ['STUDENT'] })}
        isOpen
        onClose={vi.fn()}
        onToggleStatus={vi.fn()}
        onToggleSuperAdmin={vi.fn().mockResolvedValue(true)}
      />
    )
    expect(await screen.findByText('Fanpage A')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Fanpage A/ })).not.toBeInTheDocument()
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument()
    expect(screen.getByText('Thành viên')).toBeInTheDocument()
  } finally {
    spy.mockRestore()
  }
})

it('only offers removal of superadmin for an existing superadmin', () => {
  render(
    <UserDetailModal
      user={mapAdminUser({ userId: 1, email: 'a@ctu.edu.vn', roles: ['ADMIN', 'STUDENT'] })}
      isOpen
      onClose={vi.fn()}
      onToggleStatus={vi.fn()}
      onToggleSuperAdmin={vi.fn().mockResolvedValue(true)}
    />
  )
  expect(screen.getByRole('button', { name: 'Gỡ quyền Super admin' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'Cấp quyền Super admin' })).not.toBeInTheDocument()
})

it('does not display undefined IDs or allow mutations while an ID is unavailable', async () => {
  const spy = vi.spyOn(superAdminService, 'getUserFanpages').mockResolvedValue({
    items: [{ id: '7', name: 'Fanpage của tài khoản', role: 'ADMIN' }],
    incomplete: false,
  })
  try {
    render(
      <UserDetailModal
        user={mapAdminUser({
          email: 'organizer@ctu.edu.vn',
          firstName: 'Minh Anh',
          roles: ['FANPAGE_ADMIN'],
        })}
        isOpen
        onClose={vi.fn()}
        onToggleStatus={vi.fn()}
        onToggleSuperAdmin={vi.fn().mockResolvedValue(true)}
      />
    )
    expect(await screen.findByText('Fanpage của tài khoản')).toBeInTheDocument()
    expect(screen.queryByText(/ID tài khoản undefined/)).not.toBeInTheDocument()
    expect(spy).toHaveBeenCalledWith('', 'organizer@ctu.edu.vn')
    expect(screen.getByRole('button', { name: 'Cấp quyền Super admin' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Khóa tài khoản' })).toBeDisabled()
  } finally {
    spy.mockRestore()
  }
})

it('requires a reason when hiding an event and renders HIDDEN badge without reportCount', async () => {
  const onToggleHide = vi.fn().mockResolvedValue(true)
  const onClose = vi.fn()
  render(
    <EventModerationModal
      event={mapAdminEvent({
        id: 55,
        name: 'Sự kiện cần kiểm tra',
        fanpageName: 'CLB AI',
        status: 'PUBLISHED',
      })}
      isOpen
      initialHiding
      onClose={onClose}
      onToggleHideEvent={onToggleHide}
    />
  )
  const confirm = screen.getByRole('button', { name: 'Xác nhận ẩn sự kiện' })
  expect(confirm).toBeDisabled()

  fireEvent.change(screen.getByLabelText(/Lý do ẩn/), { target: { value: '  Sai quy định  ' } })
  expect(confirm).toBeEnabled()
  fireEvent.click(confirm)

  await vi.waitFor(() => {
    expect(onToggleHide).toHaveBeenCalledWith('55', 'Sai quy định')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  cleanup()
  render(
    <EventModerationModal
      event={mapAdminEvent({
        id: 56,
        name: 'Sự kiện đã ẩn',
        fanpageName: 'CLB AI',
        isActive: false,
        violationReason: 'Thông tin sai lệch',
      })}
      isOpen
      onClose={vi.fn()}
      onToggleHideEvent={vi.fn()}
    />
  )
  expect(screen.getByText('Sự kiện đang bị ẩn')).toBeInTheDocument()
  expect(screen.getByText('Thông tin sai lệch')).toBeInTheDocument()
  expect(screen.queryByText(/lượt báo cáo/)).not.toBeInTheDocument()
})

it('uses preloaded followersCount and displays rejectionReason in FanpageReviewModal without calling extra follower endpoint', () => {
  vi.mocked(apiClient.get).mockClear()
  const fp = mapAdminFanpage(
    {
      id: 33,
      orgName: 'CLB Test',
      status: 'REJECTED',
      isActive: false,
      eventsCount: 3,
      rejectionReason: 'Thiếu văn bản ủy quyền',
    },
    undefined,
    undefined,
    245
  )
  render(
    <FanpageReviewModal
      fanpage={fp}
      isOpen
      onClose={vi.fn()}
      onApprove={vi.fn()}
      onReject={vi.fn()}
      onToggleLock={vi.fn()}
    />
  )
  expect(screen.getByText('Thiếu văn bản ủy quyền')).toBeInTheDocument()
  expect(screen.getByText('245')).toBeInTheDocument()
  expect(apiClient.get).not.toHaveBeenCalled()
})
