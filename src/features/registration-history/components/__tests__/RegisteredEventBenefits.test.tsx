import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { RegisteredEventBenefits } from '../RegisteredEventBenefits'
import { normalizeRegisteredEvent } from '../../services/historyService'

afterEach(cleanup)

describe('participation history benefits', () => {
  it('shows each full point category name in the modal while keeping compact list labels', () => {
    const event = normalizeRegisteredEvent({ eventInfo: {
      id: 25, eventPoints: [
        { pointCategoryId: 511, point: 3 },
        { pointCategoryId: 512, point: 3, pointCategoryName: 'Tham gia hoạt động phong trào' },
      ],
    } }, undefined, undefined, [{
      id: 51, name: 'Mục lớn', children: [{ id: 511, name: 'Tham gia hoạt động tình nguyện' }],
    }])
    render(<RegisteredEventBenefits event={event} />)
    expect(screen.getByRole('button', { name: 'Xem quyền lợi: +3 điểm mục V.b' })).toBeInTheDocument()
    expect(screen.queryByText(/\(Tham gia hoạt động/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem 1 quyền lợi khác' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('+3 điểm mục V.b (Tham gia hoạt động tình nguyện)')).toBeInTheDocument()
    expect(dialog.getByText('+3 điểm mục V.b (Tham gia hoạt động phong trào)')).toBeInTheDocument()
  })

  it('keeps the list label short and shows the full child name in the modal', () => {
    const detail = 'Tình nguyện tốt (4.3. Tham gia ít nhất 02 lần hiến máu tình nguyện trong năm học)'
    render(<RegisteredEventBenefits event={{
      id: '23', eventId: 23, status: 'COMPLETED',
      criteriaSv5t: 'Tình nguyện tốt (4.3)', criteriaSv5tDetail: detail,
      benefits: ['Tiêu chuẩn SV5T: Tình nguyện tốt (4.3)'],
    }} />)
    expect(screen.queryByText(detail)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem quyền lợi: Tình nguyện tốt (4.3)' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText(detail)).toBeInTheDocument()
    expect(dialog.queryByText('Tình nguyện tốt (4.3)')).not.toBeInTheDocument()
  })

  it('shows the first benefit and the remaining count, then opens grouped benefits without opening the event row', () => {
    const onRowClick = vi.fn()
    const benefits = [
      '+3 ĐRL mục V.b',
      'Tiêu chuẩn SV5T: Tham gia tình nguyện',
      'Chứng nhận tham gia',
    ]
    render(
      <div onClick={onRowClick}>
        <RegisteredEventBenefits
          event={{ id: '1', eventId: 1, status: 'COMPLETED', title: 'Hội thảo', benefits }}
        />
      </div>
    )
    const trigger = screen.getByRole('button', { name: 'Xem 2 quyền lợi khác' })
    expect(trigger).toHaveTextContent('+2')
    expect(screen.getByText('+3 điểm mục V.b')).toBeInTheDocument()
    expect(screen.queryByText('Tham gia tình nguyện')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Quyền lợi tham gia' })
    expect(within(dialog).getByRole('heading', { name: 'Điểm rèn luyện' })).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'Sinh viên 5 tốt' })).toBeInTheDocument()
    expect(within(dialog).getByText('+3 điểm mục V.b')).toBeInTheDocument()
    expect(within(dialog).getByText('Tham gia tình nguyện')).toBeInTheDocument()
    expect(within(dialog).getByText('Chứng nhận tham gia')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByText('+3 điểm mục V.b'))
    expect(onRowClick).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: /^Đóng$/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('supports the existing separate point and SV5T fields', () => {
    render(
      <RegisteredEventBenefits
        event={{
          id: '2',
          eventId: 2,
          status: 'UPCOMING',
          pointsCategory: '+10 điểm mục IV.b',
          criteriaSv5t: 'Tình nguyện tốt',
        }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xem 1 quyền lợi khác' }))
    expect(within(screen.getByRole('dialog')).getByText('+10 điểm mục IV.b')).toBeInTheDocument()
    expect(screen.getByText('Tình nguyện tốt')).toBeInTheDocument()
  })

  it('shows only the available section and no extra count for one benefit', () => {
    render(
      <RegisteredEventBenefits
        event={{
          id: '4',
          eventId: 4,
          status: 'COMPLETED',
          benefits: ['Tiêu chuẩn SV5T: Tình nguyện tốt'],
        }}
      />
    )
    expect(screen.queryByRole('button', { name: /quyền lợi khác/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem quyền lợi: Tình nguyện tốt' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Sinh viên 5 tốt' })).toBeInTheDocument()
    expect(
      within(dialog).queryByRole('heading', { name: 'Điểm rèn luyện' })
    ).not.toBeInTheDocument()
  })

  it('does not invent a count when benefits are unavailable', () => {
    render(<RegisteredEventBenefits event={{ id: '3', eventId: 3, status: 'COMPLETED' }} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Theo thông báo BTC')).toBeInTheDocument()
  })
})
