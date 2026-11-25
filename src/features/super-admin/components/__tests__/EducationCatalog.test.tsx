import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SemesterModal } from '../modals/SemesterModal'
import { SchoolMajorModal } from '../modals/SchoolMajorModal'
import { adminStatisticsService } from '../../services/adminStatisticsService'
import type { SuperAdminSemester } from '../../types/superAdmin.types'

vi.mock('../../services/adminStatisticsService', () => ({
  adminStatisticsService: { getAcademicYears: vi.fn() },
}))
beforeEach(() => {
  vi.resetAllMocks()
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.mocked(adminStatisticsService.getAcademicYears).mockResolvedValue([
    { id: 77, code: '2030-2031', startDate: '2030-08-01', endDate: '2031-07-31', isActive: true },
  ])
})
function showSemester(
  onSave: (data: Partial<SuperAdminSemester>) => Promise<void>,
  semesters: SuperAdminSemester[] = []
) {
  const close = vi.fn()
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SemesterModal isOpen semester={null} semesters={semesters} onClose={close} onSave={onSave} />
    </QueryClientProvider>
  )
  return close
}
async function fillSemester() {
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Năm học của học kỳ' })).not.toBeDisabled()
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Năm học của học kỳ' }))
  fireEvent.click(await screen.findByRole('option', { name: '2030-2031' }))
  fireEvent.change(screen.getByLabelText('Ngày bắt đầu'), { target: { value: '2030-09-01' } })
  fireEvent.change(screen.getByLabelText('Ngày kết thúc'), { target: { value: '2030-12-31' } })
}
it('saves the real academic year ID and keeps the form open on API failure', async () => {
  const save = vi.fn().mockRejectedValue(new Error('Máy chủ từ chối lưu'))
  const close = showSemester(save)
  expect(screen.getByLabelText('Ngày bắt đầu')).toHaveValue('')
  await fillSemester()
  fireEvent.click(screen.getByRole('button', { name: 'Lưu học kỳ' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ từ chối lưu')
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ academicYearId: 77, academicYear: '2030-2031', number: 1 })
  )
  expect(close).not.toHaveBeenCalled()
})
it('rejects a duplicate semester within the same academic year', async () => {
  const save = vi.fn()
  showSemester(save, [{ id: 4, academicYearId: 77, number: 1 } as SuperAdminSemester])
  await fillSemester()
  fireEvent.click(screen.getByRole('button', { name: 'Lưu học kỳ' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('đã có học kỳ')
  expect(save).not.toHaveBeenCalled()
})
it('does not offer to create a major without a selected school', () => {
  const save = vi.fn()
  render(
    <SchoolMajorModal
      mode="major"
      school={null}
      major={null}
      isOpen
      onClose={vi.fn()}
      onSaveSchool={vi.fn()}
      onSaveMajor={save}
    />
  )
  expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
})
