import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SelfEvaluationModal } from '../SelfEvaluationModal'

afterEach(cleanup)

it('keeps the editor and score open when saving training points fails', async () => {
  const close = vi.fn()
  const save = vi.fn().mockRejectedValue(new Error('Network error'))
  render(
    <SelfEvaluationModal
      isOpen
      onClose={close}
      criterionName="Tham gia hoạt động tình nguyện"
      criteriaCode="I.1"
      maxPoints={10}
      currentScore={8}
      currentDescription="Đã tham gia đầy đủ 3 buổi"
      onSave={save}
    />
  )

  fireEvent.click(screen.getByRole('button', { name: 'Lưu đánh giá' }))
  expect(
    await screen.findByText('Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại.')
  ).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Sinh viên tự đánh giá' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Nội dung tự đánh giá / Minh chứng' })).toHaveValue(
    'Đã tham gia đầy đủ 3 buổi'
  )
  expect(close).not.toHaveBeenCalled()
})
