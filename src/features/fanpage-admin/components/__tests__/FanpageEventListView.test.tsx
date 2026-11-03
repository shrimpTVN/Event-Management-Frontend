import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FanpageEventListView } from '../FanpageEventListView'
import type { AdminEvent } from '../../types/fanpageAdmin.types'

const mockEvents: AdminEvent[] = [
  {
    id: '4',
    code: 'EVT-0004',
    name: 'Workshop: Kỹ năng viết CV và phỏng vấn thành công',
    description: 'Chi tiết workshop',
    eventTypeId: 1,
    eventTypeName: 'Workshop',
    fanpageId: '1',
    organizerName: 'Đoàn Trường CNTT & TT',
    dateStart: '2026-10-08',
    dateEnd: '2026-10-08',
    timeStart: '07:00',
    timeEnd: '11:00',
    format: 'OFFLINE',
    location: 'Phòng Lab 3, Trường CNTT&TT',
    capacity: 80,
    registeredCount: 45,
    checkedInCount: 30,
    status: 'PUBLISHED',
    bannerUrl: '',
    requiresApproval: false,
    attendanceMethod: 'MANUAL',
    attendanceSessionType: 'BOTH',
    autoEmail: true,
    isPublic: true,
    trainingPoints: 3,
    trainingPointCategoryName: 'Đạo đức',
    trainingPointCategoryCode: 'I.a',
    sv5tCriteriaName: 'Tiêu chuẩn Hội nhập tốt',
    hasCertificate: false,
    tags: [],
    createdAt: '2026-10-01',
  },
  {
    id: '2',
    code: 'EVT-0002',
    name: 'Sự kiện chiếu phim gây quỹ',
    description: 'Xem phim gây quỹ',
    eventTypeId: 2,
    eventTypeName: 'Volunteer',
    fanpageId: '1',
    organizerName: 'Đoàn Trường CNTT & TT',
    dateStart: '2026-09-22',
    dateEnd: '2026-09-22',
    timeStart: '18:00',
    timeEnd: '21:00',
    format: 'OFFLINE',
    location: 'Hội trường Rùa',
    capacity: 500,
    registeredCount: 300,
    checkedInCount: 280,
    status: 'CLOSED',
    bannerUrl: '',
    requiresApproval: false,
    attendanceMethod: 'MANUAL',
    attendanceSessionType: 'BOTH',
    autoEmail: true,
    isPublic: true,
    trainingPoints: 3,
    trainingPointCategoryName: 'Tình nguyện',
    trainingPointCategoryCode: 'III.b',
    sv5tCriteriaName: 'Tiêu chuẩn Tình nguyện tốt',
    hasCertificate: false,
    tags: [],
    createdAt: '2026-09-15',
  },
]

describe('FanpageEventListView', () => {
  it('does NOT render fake hardcoded trend badge (25%)', () => {
    render(<FanpageEventListView events={mockEvents} />)

    // The hardcoded fake trend badge (25%) or invalid (-100%) should NEVER appear
    expect(screen.queryByText('25%')).toBeNull()
    expect(screen.queryByText('100%')).toBeNull()

    // Real event counts should be rendered correctly
    expect(screen.getByText('Tất cả sự kiện')).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThan(0) // Total 2 events
    expect(screen.getByText('+2 sự kiện so với học kỳ trước')).toBeInTheDocument()

    // Event title should be visible in the list table
    expect(
      screen.getByText('Workshop: Kỹ năng viết CV và phỏng vấn thành công')
    ).toBeInTheDocument()
    expect(screen.getByText('Sự kiện chiếu phim gây quỹ')).toBeInTheDocument()
  })

  it('renders cleanly without trend badges when events list is empty', () => {
    render(<FanpageEventListView events={[]} />)

    // Should display 0 events and no trend badges
    expect(screen.queryByText('▲')).toBeNull()
    expect(screen.queryByText('▼')).toBeNull()
    expect(screen.queryByText('25%')).toBeNull()
    expect(
      screen.getByText('Không tìm thấy sự kiện nào phù hợp với bộ lọc.')
    ).toBeInTheDocument()
  })

  it('renders muted event code, neutral benefits badges, and dimmed closed event row', () => {
    render(<FanpageEventListView events={mockEvents} />)

    // Event code should NOT be blue (text-primary)
    const codeEl = screen.getByText('EVT-0004')
    expect(codeEl.className).not.toContain('text-primary')
    expect(codeEl.className).toContain('text-muted-foreground')

    // Finished event row should be dimmed (opacity-70)
    const closedEventTitle = screen.getByText('Sự kiện chiếu phim gây quỹ')
    const closedRow = closedEventTitle.closest('.grid')
    expect(closedRow?.className).toContain('opacity-70')

    // Closed badge has softer text styling
    const closedBadge = screen.getByText('Kết thúc')
    expect(closedBadge.className).toContain('text-slate-500')

    // Benefits badge has neutral styling without loud colors
    const drlBadge = screen.getAllByText('+3 ĐRL')[0]
    expect(drlBadge.className).not.toContain('bg-emerald-50')
    expect(drlBadge.className).toContain('bg-muted/70')
  })

  it('correctly compares event count against previous semester when previous semester data exists', () => {
    const multiSemesterEvents: AdminEvent[] = [
      {
        ...mockEvents[0],
        id: '101',
        semesterId: 1, // Previous semester: 1 event
      },
      {
        ...mockEvents[1],
        id: '102',
        semesterId: 2, // Current semester: 2 events
      },
      {
        ...mockEvents[0],
        id: '103',
        semesterId: 2,
      },
    ]

    render(<FanpageEventListView events={multiSemesterEvents} />)

    // Current semester has 2 events, previous has 1 -> diff = +1 (+100%)
    expect(screen.getByText('+1 sự kiện so với học kỳ trước')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('▲')).toBeInTheDocument()
  })
})
