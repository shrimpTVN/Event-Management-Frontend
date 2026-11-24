import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogTreeView } from '../CatalogTreeView'
import { CatalogEditor } from '../modals/CatalogEditor'

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn()
})

const items = [
  {
    id: 812,
    name: 'Nhóm học tập',
    maximum: 20,
    isActive: true,
    children: [
      {
        id: 963,
        name: 'Nghiên cứu khoa học',
        note: 'Mã I.a.2',
        maximum: 8,
        isActive: false,
        children: [],
      },
    ],
  },
]

describe('catalog tree interactions', () => {
  it('disables unsupported root edits while allowing an inactive child to be restored', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    render(<CatalogTreeView kind="points" items={[
      { id: 3, name: 'Mục gốc', maximum: 20, isActive: true, parentCategoryId: null },
      { id: 4, name: 'Tiêu chí đã tắt', maximum: 5, isActive: false, parentCategoryId: 3 },
    ]} onCreate={vi.fn()} onEdit={vi.fn()} onToggle={onToggle} onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Chỉnh sửa Mục gốc' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Mục gốc' }))
    expect(screen.getByRole('menuitem', { name: 'Tạm ngưng áp dụng' })).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Tiêu chí đã tắt' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Áp dụng trở lại' }))
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(4))
  })
  it('expands arbitrary IDs and reveals matching descendants together with their parents', () => {
    render(
      <CatalogTreeView
        kind="points"
        items={items}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn tất cả' }))
    expect(screen.queryByText('Nghiên cứu khoa học')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng tất cả' }))
    expect(screen.getByText('Nghiên cứu khoa học')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn tất cả' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Tìm tiêu chí' }), {
      target: { value: 'nghien cuu' },
    })
    expect(screen.getByText('Nghiên cứu khoa học')).toBeInTheDocument()
    expect(screen.getByText('Nhóm học tập')).toBeInTheDocument()
  })

  it('filters SV5T scope and status instead of merely changing the select value', async () => {
    render(
      <CatalogTreeView
        kind="sv5t"
        items={[
          { id: 31, name: 'Tiêu chuẩn trường', scope: 'UNIVERSITY', isActive: true },
          { id: 47, name: 'Tiêu chuẩn khoa', scope: 'FACULTY', isActive: false },
        ]}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Phạm vi xét chọn' }), {
      key: 'ArrowDown',
    })
    fireEvent.click(await screen.findByRole('option', { name: 'Cấp Khoa / Đoàn' }))
    expect(screen.queryByText('Tiêu chuẩn trường')).not.toBeInTheDocument()
    expect(screen.getByText('Tiêu chuẩn khoa')).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Trạng thái' }), { key: 'ArrowDown' })
    fireEvent.click(await screen.findByRole('option', { name: 'Đang áp dụng' }))
    expect(screen.getByText('Không tìm thấy tiêu chí phù hợp.')).toBeInTheDocument()
  })

  it('confirms soft deletion and keeps the confirmation open on API failure', async () => {
    const onDelete = vi
      .fn()
      .mockRejectedValue({ response: { data: { message: 'Còn tiêu chí con đang áp dụng.' } } })
    render(
      <CatalogTreeView
        kind="points"
        items={items}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onToggle={vi.fn()}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Thao tác với Nhóm học tập' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xóa tiêu chí' }))
    expect(onDelete).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa tiêu chí' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Còn tiêu chí con đang áp dụng.')
    expect(onDelete).toHaveBeenCalledWith(812)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('catalog editor saving', () => {
  it('keeps entered data after a failure and only closes after a successful retry', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce({ response: { data: { message: 'Không lưu được tiêu chí.' } } })
      .mockResolvedValueOnce(undefined)
    const onClose = vi.fn()
    render(
      <CatalogEditor
        kind="points"
        item={{
          id: 42,
          name: 'Tiêu chí cũ',
          maximum: 10,
          isActive: false,
          dateApply: '2026-11-20',
        }}
        onSave={onSave}
        onClose={onClose}
      />
    )
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), { target: { value: 'Tiêu chí mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu tiêu chí' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được tiêu chí.')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Tên tiêu chí')).toHaveValue('Tiêu chí mới')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu tiêu chí' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'Tiêu chí mới',
        dateApply: '2026-11-20',
        isActive: false,
        parentCategoryId: null,
      })
    )
  })

  it('blocks duplicate submissions while saving and sends inherited scope and ordering', async () => {
    let finish!: () => void
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    const onClose = vi.fn()
    render(
      <CatalogEditor
        kind="sv5t"
        parent={{ id: 8, name: 'Nhóm khoa', level: 1, scope: 'FACULTY' }}
        onSave={onSave}
        onClose={onClose}
      />
    )
    fireEvent.change(screen.getByLabelText('Tên tiêu chí'), { target: { value: 'Tiêu chí con' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu tiêu chí' }))
    expect(screen.getByRole('button', { name: 'Đang lưu...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled()
    expect(onClose).not.toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        scope: 'FACULTY',
        parentId: 8,
        childrenOrder: 1,
        requiredOccurrences: 1,
      })
    )
    await act(async () => finish())
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
