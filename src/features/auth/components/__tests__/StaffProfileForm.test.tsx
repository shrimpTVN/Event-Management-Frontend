import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { extractStaffIdFromEmail, normalizeOrgName, CTU_DEPARTMENTS } from '../../utils/staffProfileUtils'
import { PositionCombobox } from '../StaffProfileForm'

describe('normalizeOrgName', () => {
  it('ensures every CTU department normalizes to <= 20 characters matching backend constraint', () => {
    CTU_DEPARTMENTS.forEach((dept) => {
      const normalized = normalizeOrgName(dept)
      expect(normalized.length).toBeLessThanOrEqual(20)
    })
  })

  it('normalizes Truong Cong nghe Thong tin va Truyen thong to <= 20 characters', () => {
    const res = normalizeOrgName('Trường Công nghệ Thông tin và Truyền thông')
    expect(res).toBe('Trường CNTT & TT')
    expect(res.length).toBeLessThanOrEqual(20)
  })

  it('safely handles undefined or empty string', () => {
    expect(normalizeOrgName('')).toBe('Đoàn - Hội Trường')
    expect(normalizeOrgName(undefined)).toBe('Đoàn - Hội Trường')
  })
})

describe('extractStaffIdFromEmail', () => {
  it('extracts staff ID from email username with CB prefix', () => {
    expect(extractStaffIdFromEmail('cb02934@ctu.edu.vn')).toBe('CB02934')
    expect(extractStaffIdFromEmail('minhcb02934@ctu.edu.vn')).toBe('CB02934')
  })

  it('returns empty string when no staff code pattern found', () => {
    expect(extractStaffIdFromEmail('loc@ctu.edu.vn')).toBe('')
    expect(extractStaffIdFromEmail('')).toBe('')
  })
})

describe('PositionCombobox', () => {
  const ComboboxWrapper = ({ initialValue = '' }: { initialValue?: string }) => {
    const [val, setVal] = useState(initialValue)
    return <PositionCombobox value={val} onChange={setVal} />
  }

  it('renders input with placeholder and opens dropdown on click or focus', () => {
    render(<ComboboxWrapper />)
    const input = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập chức vụ...')
    expect(input).toBeInTheDocument()

    // Focus opens dropdown
    fireEvent.focus(input)
    expect(screen.getByText('Cán bộ Đoàn / Hội')).toBeInTheDocument()
    expect(screen.getByText('Cố vấn học tập')).toBeInTheDocument()
  })

  it('filters suggestions dynamically as user types', () => {
    render(<ComboboxWrapper />)
    const input = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập chức vụ...')
    fireEvent.change(input, { target: { value: 'Bí thư' } })

    expect(screen.getByText('Bí thư / Phó Bí thư Đoàn cơ sở')).toBeInTheDocument()
    expect(screen.queryByText('Cố vấn học tập')).not.toBeInTheDocument()
  })

  it('selects suggestion upon click and updates input value', () => {
    render(<ComboboxWrapper />)
    const input = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập chức vụ...') as HTMLInputElement
    fireEvent.focus(input)

    const option = screen.getByText('Giảng viên quản trị sự kiện')
    fireEvent.click(option)

    expect(input.value).toBe('Giảng viên quản trị sự kiện')
    expect(screen.queryByText('Cán bộ Đoàn / Hội')).not.toBeInTheDocument()
  })

  it('allows custom position typing and displays custom option pill', () => {
    render(<ComboboxWrapper />)
    const input = screen.getByPlaceholderText('Chọn gợi ý hoặc tự nhập chức vụ...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Trưởng nhóm Nghiên cứu AI' } })

    expect(screen.getByText(/Sử dụng chức vụ tự nhập/i)).toBeInTheDocument()
    expect(screen.getByText(/"Trưởng nhóm Nghiên cứu AI"/i)).toBeInTheDocument()
    expect(input.value).toBe('Trưởng nhóm Nghiên cứu AI')
  })
})
