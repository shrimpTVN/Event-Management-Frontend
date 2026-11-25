import { useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EducationFields } from '../EducationFields'
import { educationCatalogService } from '@/shared/services/educationCatalogService'

vi.mock('@/shared/services/educationCatalogService', () => ({
  educationCatalogService: { getSchools: vi.fn(), getMajors: vi.fn() },
}))
beforeEach(() => {
  vi.resetAllMocks()
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.mocked(educationCatalogService.getSchools).mockResolvedValue([
    { id: 7, name: 'Khoa A', isActive: true },
    { id: 8, name: 'Khoa B', isActive: true },
  ])
  vi.mocked(educationCatalogService.getMajors).mockImplementation(async (schoolId) =>
    schoolId === 7
      ? [
          { id: 71, name: 'Ngành A', code: 'A', schoolId, isActive: true },
          { id: 72, name: 'Ngành ngừng', code: 'X', schoolId, isActive: false },
        ]
      : [{ id: 81, name: 'Ngành B', code: 'B', schoolId, isActive: true }]
  )
})
function Form() {
  const [schoolId, setSchoolId] = useState<number>()
  const [majorId, setMajorId] = useState<number>()
  return (
    <>
      <EducationFields
        schoolId={schoolId}
        majorId={majorId}
        onSchoolChange={(school) => {
          setSchoolId(school.id)
          setMajorId(undefined)
        }}
        onMajorChange={(major) => setMajorId(major.id)}
      />
      <output aria-label="IDs">
        {schoolId}:{majorId || ''}
      </output>
    </>
  )
}
function show() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Form />
    </QueryClientProvider>
  )
}

it('loads majors for the selected school and clears the old major when switching schools', async () => {
  show()
  expect(screen.getByRole('combobox', { name: 'Ngành học' })).toBeDisabled()
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Khoa / Trường' })).not.toBeDisabled()
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Khoa / Trường' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Khoa A' }))
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Ngành học' })).not.toBeDisabled()
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Ngành học' }))
  fireEvent.click(await screen.findByRole('option', { name: 'A · Ngành A' }))
  expect(screen.getByLabelText('IDs')).toHaveTextContent('7:71')
  fireEvent.click(screen.getByRole('combobox', { name: 'Khoa / Trường' }))
  fireEvent.click(screen.getByRole('option', { name: 'Khoa B' }))
  expect(screen.getByLabelText('IDs')).toHaveTextContent('8:')
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Ngành học' })).not.toBeDisabled()
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Ngành học' }))
  expect(await screen.findByRole('option', { name: 'B · Ngành B' })).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: /Ngành A|Ngành ngừng/ })).not.toBeInTheDocument()
})

it('provides retry without a fallback catalog on request failure', async () => {
  vi.mocked(educationCatalogService.getSchools).mockRejectedValueOnce(new Error('offline'))
  show()
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được khoa/trường')
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại khoa/trường' }))
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Khoa / Trường' })).not.toBeDisabled()
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Khoa / Trường' }))
  expect(await screen.findByRole('option', { name: 'Khoa A' })).toBeInTheDocument()
})
