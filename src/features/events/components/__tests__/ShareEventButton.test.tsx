import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ShareEventButton } from '../ShareEventButton'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it('offers a selectable link when native sharing is unavailable', async () => {
  render(<ShareEventButton eventId="42" title="Ngày hội sinh viên" />)
  fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ' }))
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Liên kết sự kiện' })).toHaveValue(
    new URL('/events/42', window.location.origin).href
  )
  fireEvent.click(screen.getByRole('button', { name: 'Sao chép liên kết' }))
  expect(await screen.findByText('Chạm giữ liên kết để sao chép.')).toBeInTheDocument()
})
it('does not show an error when native sharing is cancelled', async () => {
  const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
  vi.stubGlobal('navigator', { share })
  render(<ShareEventButton eventId="42" title="Ngày hội sinh viên" />)
  fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ' }))
  expect(share).toHaveBeenCalledWith({
    title: 'Ngày hội sinh viên',
    url: new URL('/events/42', window.location.origin).href,
  })
  await Promise.resolve()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
