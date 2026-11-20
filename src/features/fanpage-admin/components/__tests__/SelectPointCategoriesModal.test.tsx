import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SelectPointCategoriesModal } from '../SelectPointCategoriesModal'
import type { PointCategoryItem } from '../../types/fanpageAdmin.types'
const categories: PointCategoryItem[] = [
  {
    id: 1,
    name: 'Ý thức học tập',
    maximum: 20,
    level: 0,
    childrenOrder: 1,
    parentCategoryId: null,
  },
  { id: 2, name: 'Tham gia hội thảo', maximum: 3, level: 1, childrenOrder: 1, parentCategoryId: 1 },
  {
    id: 3,
    name: 'Nghiên cứu khoa học',
    maximum: 10,
    level: 1,
    childrenOrder: 2,
    parentCategoryId: 1,
  },
]
afterEach(cleanup)
describe('point category modal', () => {
  it('selects multiple items and editing points does not toggle selection', () => {
    const confirm = vi.fn()
    render(
      <SelectPointCategoriesModal
        isOpen
        onClose={vi.fn()}
        onConfirm={confirm}
        initialSelected={[]}
        pointCategories={categories}
      />
    )
    const choices = screen.getAllByRole('checkbox')
    fireEvent.click(choices[0])
    fireEvent.click(choices[1])
    const points = screen.getByRole('spinbutton', { name: 'Điểm cộng cho I.a' })
    fireEvent.click(points)
    fireEvent.change(points, { target: { value: '2' } })
    expect(choices[0]).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận (2)' }))
    expect(confirm).toHaveBeenCalledWith([
      expect.objectContaining({ pointCategoryId: 2, pointCategoryCode: 'I.a', point: 2 }),
      expect.objectContaining({ pointCategoryId: 3, pointCategoryCode: 'I.b', point: 5 }),
    ])
  })
  it('uses the catalogue limit when an existing selection has no maximum', () => {
    const confirm = vi.fn()
    render(
      <SelectPointCategoriesModal
        isOpen
        onClose={vi.fn()}
        onConfirm={confirm}
        initialSelected={[{ pointCategoryId: 2, pointCategoryName: 'Tham gia hội thảo', point: 2 }]}
        pointCategories={categories}
      />
    )
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99' } })
    expect(screen.getByRole('spinbutton')).toHaveValue(3)
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận (1)' }))
    expect(confirm).toHaveBeenCalledWith([expect.objectContaining({ point: 3 })])
  })
  it('searches by code and cancels without applying pending changes', () => {
    const confirm = vi.fn(),
      close = vi.fn()
    render(
      <SelectPointCategoriesModal
        isOpen
        onClose={close}
        onConfirm={confirm}
        initialSelected={[]}
        pointCategories={categories}
      />
    )
    fireEvent.change(screen.getByLabelText('Tìm mục rèn luyện'), { target: { value: 'I.b' } })
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(close).toHaveBeenCalledOnce()
    expect(confirm).not.toHaveBeenCalled()
  })
})
