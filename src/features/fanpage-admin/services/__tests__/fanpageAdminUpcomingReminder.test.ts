import { describe, expect, it, vi, beforeEach } from 'vitest'
import { apiClient } from '@/shared'
import { fanpageAdminService, formatUpcomingEventReminder } from '../fanpageAdminService'

describe('formatUpcomingEventReminder & getUpcomingReminder', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('formats Option A backend payload (id, title, dateHappen, registrationsCount)', () => {
    const sampleDate = '2026-11-28T08:05:00Z'
    const expected = new Date(sampleDate)
    const pad = (n: number) => String(n).padStart(2, '0')

    const formatted = formatUpcomingEventReminder({
      id: 42,
      title: 'Hội thảo Kỹ năng Nghề nghiệp 2026',
      dateHappen: sampleDate,
      registrationsCount: 120,
    })

    expect(formatted).toEqual({
      id: '42',
      title: 'Hội thảo Kỹ năng Nghề nghiệp 2026',
      monthText: `TH${expected.getMonth() + 1}`,
      dayText: pad(expected.getDate()),
      registrationsCount: 120,
      dateText: `${pad(expected.getDate())}/${pad(expected.getMonth() + 1)}/${expected.getFullYear()} · ${pad(expected.getHours())}:${pad(expected.getMinutes())}`,
    })
  })

  it('returns null when backend returns null or empty', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce(null as any)
    const result = await fanpageAdminService.getUpcomingReminder('5')
    expect(apiClient.get).toHaveBeenCalledWith('/fanpages/5/upcoming-reminder')
    expect(result).toBeNull()
  })

  it('calls /fanpages/{id}/upcoming-reminder and formats response', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      id: 7,
      title: 'Ngày hội Việc làm',
      dateHappen: '2026-12-01T01:30:00Z',
      registrationsCount: 45,
    } as any)

    const result = await fanpageAdminService.getUpcomingReminder('7')
    expect(apiClient.get).toHaveBeenCalledWith('/fanpages/7/upcoming-reminder')
    expect(result?.id).toBe('7')
    expect(result?.title).toBe('Ngày hội Việc làm')
    expect(result?.registrationsCount).toBe(45)
    expect(result?.monthText).toMatch(/^TH\d+$/)
    expect(result?.dayText).toMatch(/^\d{2}$/)
  })
})
