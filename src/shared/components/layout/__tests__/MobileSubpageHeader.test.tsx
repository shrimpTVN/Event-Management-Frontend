import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { MobilePageProvider, MobileSubpageHeader, mobileSubpageConfig, useMobilePageSearch, matchesPageSearch, matchesPageSearchTree } from '../MobileSubpageHeader'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => true) }))
function PageContent() {
  const { query } = useMobilePageSearch()
  const location = useLocation()
  return <><output aria-label="Nội dung đã lọc">{['Hội thảo AI', 'Ngày hội tình nguyện'].filter((name) => matchesPageSearch(query, name)).join('|')}</output>
    <output aria-label="Đường dẫn">{location.pathname}{location.search}</output>
    <Link to="/notifications">Mở thông báo</Link></>
}
function show(path = '/saved') {
  render(<MemoryRouter initialEntries={[path]}><MobilePageProvider><MobileSubpageHeader /><PageContent /></MobilePageProvider></MemoryRouter>)
}
beforeEach(() => {
  vi.mocked(useMediaQuery).mockReturnValue(true)
  window.history.replaceState({ idx: 0 }, '')
})
describe('mobile subpage navigation', () => {
  it('opens real page search and restores the list when closing search', () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Tìm sự kiện đã lưu' }))
    const input = screen.getByRole('searchbox')
    expect(input).toHaveFocus()
    fireEvent.change(input, { target: { value: 'hoi thao' } })
    expect(screen.getByLabelText('Nội dung đã lọc')).toHaveTextContent('Hội thảo AI')
    expect(screen.getByLabelText('Nội dung đã lọc')).not.toHaveTextContent('tình nguyện')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng tìm kiếm' }))
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nội dung đã lọc')).toHaveTextContent('Ngày hội tình nguyện')
  })
  it('falls back to home on direct entry and to the event from direct registration', () => {
    show('/events/42/register')
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại trang trước' }))
    expect(screen.getByLabelText('Đường dẫn')).toHaveTextContent('/events/42')
  })
  it('does not leak search terms when moving to another subpage', () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Tìm sự kiện đã lưu' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'AI' } })
    fireEvent.click(screen.getByRole('link', { name: 'Mở thông báo' }))
    expect(screen.getByRole('heading', { name: 'Thông báo' })).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nội dung đã lọc')).toHaveTextContent('Ngày hội tình nguyện')
  })
  it('keeps existing event filters when submitting search from a results page', () => {
    show('/events?eventTypeId=3')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'AI' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(screen.getByLabelText('Đường dẫn')).toHaveTextContent('/events?eventTypeId=3&keyword=AI')
  })
  it('does not apply phone-only search when resized to desktop', () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Tìm sự kiện đã lưu' }))
    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'AI' } })
    vi.mocked(useMediaQuery).mockReturnValue(false)
    fireEvent.change(input, { target: { value: 'hội thảo' } })
    expect(screen.getByLabelText('Nội dung đã lọc')).toHaveTextContent('Ngày hội tình nguyện')
  })
  it('recognizes aliases and leaves the home page header unchanged', () => {
    expect(mobileSubpageConfig('/')).toBeNull()
    expect(mobileSubpageConfig('/events/saved/')).toMatchObject({ title: 'Đã lưu', search: 'local' })
    expect(mobileSubpageConfig('/sinh-vien-5-tot')).toMatchObject({ title: 'Sinh viên 5 tốt' })
  })
  it('finds nested criteria while preserving the original data for score calculation', () => {
    const section = { name: 'Hoạt động cộng đồng', items: [{ name: 'Hiến máu tình nguyện' }] }
    expect(matchesPageSearchTree('hien mau', section)).toBe(true)
    expect(matchesPageSearchTree('học tập', section)).toBe(false)
    expect(section.items).toHaveLength(1)
  })
})
