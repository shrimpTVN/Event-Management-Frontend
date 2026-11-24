import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Sv5tSelfEvaluationModal } from '../Sv5tSelfEvaluationModal'

afterEach(cleanup)
it('keeps the editor and evidence open when saving fails', async () => {
  const close = vi.fn()
  const save = vi.fn().mockRejectedValue(new Error('offline'))
  render(
    <Sv5tSelfEvaluationModal
      isOpen
      onClose={close}
      criterionName="Ngày tình nguyện"
      criteriaCode="4.2"
      isCompleted
      currentNote="Minh chứng đã nhập"
      onSave={save}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'Lưu đánh giá' }))
  expect(
    await screen.findByText('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.')
  ).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Sinh viên tự đánh giá' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Nội dung tự đánh giá / Minh chứng' })).toHaveValue(
    'Minh chứng đã nhập'
  )
  expect(close).not.toHaveBeenCalled()
})
