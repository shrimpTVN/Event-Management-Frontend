import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { SelectSv5tCriteriaModal, buildCriteriaTree } from '../SelectSv5tCriteriaModal'
import type { Sv5tCriteriaItem } from '../../types/fanpageAdmin.types'
const catalogue: Sv5tCriteriaItem[] = [
  { id: 1, name: 'Danh hiệu', scope: 'UNIVERSITY', level: 0, childrenOrder: 1, parentId: null },
  { id: 17, name: 'Tình nguyện tốt', scope: 'UNIVERSITY', level: 1, childrenOrder: 4, parentId: 1 },
  {
    id: 20,
    name: 'Hiến máu ít nhất 02 lần',
    scope: 'UNIVERSITY',
    level: 2,
    childrenOrder: 3,
    parentId: 17,
    requiredOccurrences: 2,
  },
  {
    id: 18,
    name: 'Tham gia chiến dịch tình nguyện',
    scope: 'UNIVERSITY',
    level: 2,
    childrenOrder: 1,
    parentId: 17,
  },
]
Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
afterEach(cleanup)
describe('SV5T event selection', () => {
  it('uses real IDs, handles root and flat data, and never invents fallback criteria', () => {
    expect(buildCriteriaTree([])).toEqual([])
    const tree = buildCriteriaTree(catalogue)
    expect(tree.map((item) => item.id)).toEqual([17])
    expect(tree[0].children?.map((item) => item.id)).toEqual([18, 20])
  })
  it('selects scope before a standard and confirms multiple children', async () => {
    const confirm = vi.fn()
    render(
      <SelectSv5tCriteriaModal isOpen onClose={vi.fn()} onConfirm={confirm} criterias={catalogue} />
    )
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByLabelText('Cấp xét'), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Cấp ĐHCT' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tình nguyện tốt' }))
    const choices = screen.getAllByRole('checkbox')
    expect(choices).toHaveLength(2)
    fireEvent.click(choices[0])
    fireEvent.click(choices[1])
    expect(screen.getByText(/Đủ 2 lần trong năm học mới đạt/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận (2)' }))
    expect(confirm).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 18, scope: 'UNIVERSITY' }),
        expect.objectContaining({ id: 20, requiredOccurrences: 2 }),
      ])
    )
  })
  it('cancelling discards pending selections', () => {
    const confirm = vi.fn(),
      close = vi.fn()
    render(
      <SelectSv5tCriteriaModal
        isOpen
        onClose={close}
        onConfirm={confirm}
        initialSelected={[{ id: 20, name: 'Hiến máu' }]}
        criterias={catalogue}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ chọn Hiến máu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(close).toHaveBeenCalledOnce()
    expect(confirm).not.toHaveBeenCalled()
  })
})
