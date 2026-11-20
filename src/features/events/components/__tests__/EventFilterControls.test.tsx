import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EventFilterButton } from '../EventFilterControls'
import { EventFilterModal } from '../EventFilterModal'
import { eventService } from '../../services/eventService'
import { useAuthStore } from '@/features/auth'

const options = {
  academicYears: [],
  semesters: [],
  eventTypes: [],
  fanpages: [{ id: 3, label: 'Đơn vị A' }],
  criterias: [],
  pointCategories: [
    { id: 10, label: 'Mục I', level: 0, childIds: [10, 11, 12, 111, 121] },
    { id: 11, label: 'Mục I.a', level: 1, parentCategoryId: 10, childIds: [11, 111] },
    { id: 12, label: 'Mục I.b', level: 1, parentCategoryId: 10, childIds: [12, 121] },
  ],
}
function provider(ui: React.ReactElement) {
  useAuthStore.setState({ isAuthenticated: false, user: null })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(['event-filter-options'], options)
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('event filter controls', () => {
  it('narrows the preview to the selected point child and applies only those descendant IDs', () => {
    const apply = vi.fn()
    provider(
      <EventFilterButton
        values={{}}
        onChange={apply}
        options={options}
        events={[
          { eventPoints: [{ pointCategoryId: 111 }] },
          { eventPoints: [{ pointCategoryId: 121 }] },
        ]}
        hideFanpageFilter
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    expect(screen.queryByText('Đơn vị tổ chức (Fanpage)')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mục I' }))
    expect(screen.getByRole('button', { name: 'Xem 2 sự kiện' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mục I.a' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem 1 sự kiện' }))
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ pointCategoryId: '10,11', childCategoryIds: ['11', '111'] })
    )
  })
  it('does not fetch unrelated public events when the fanpage has no posts', () => {
    const fallback = vi.spyOn(eventService, 'getEvents').mockResolvedValue([])
    provider(
      <EventFilterButton
        values={{}}
        onChange={vi.fn()}
        options={options}
        events={[]}
        hideFanpageFilter
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bộ lọc sự kiện' }))
    expect(screen.getByRole('button', { name: 'Xem 0 sự kiện' })).toBeInTheDocument()
    expect(fallback).not.toHaveBeenCalled()
    fallback.mockRestore()
  })
  it('blocks applying an inverted date range', () => {
    const apply = vi.fn()
    provider(
      <EventFilterModal
        isOpen
        onClose={vi.fn()}
        initialValues={{ dateHappenFrom: '2026-11-20', dateHappenTo: '2026-11-15' }}
        onApply={apply}
        events={[]}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.'
    )
    expect(screen.getByRole('button', { name: 'Xem 0 sự kiện' })).toBeDisabled()
    expect(apply).not.toHaveBeenCalled()
  })
})
