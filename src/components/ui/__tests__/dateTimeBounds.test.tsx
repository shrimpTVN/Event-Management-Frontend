import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DatePicker } from '../date-picker'
import { TimeSelect } from '../time-select'
Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
afterEach(cleanup)
describe('date and time selection bounds', () => {
  it('disables calendar days outside the permitted registration range', () => {
    const change = vi.fn()
    render(
      <DatePicker value="2030-01-02" minDate="2030-01-02" maxDate="2030-01-03" onChange={change} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Mở lịch chọn ngày' }))
    screen.getAllByRole('button', { name: '1' }).forEach((day) => expect(day).toBeDisabled())
    const third = screen
      .getAllByRole('button', { name: '3' })
      .find((day) => !(day as HTMLButtonElement).disabled)!
    fireEvent.click(third)
    expect(change).toHaveBeenCalledWith('2030-01-03')
  })
  it('disables earlier hours and adjusts boundary-hour minutes to the allowed minimum', () => {
    const change = vi.fn()
    render(<TimeSelect value="10:00" minTime="10:01" maxTime="11:00" onChange={change} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn giờ và phút' }))
    expect(screen.getAllByRole('button', { name: '09' })[0]).toBeDisabled()
    fireEvent.click(screen.getAllByRole('button', { name: '10' })[0])
    expect(change).toHaveBeenCalledWith('10:01')
  })
})
