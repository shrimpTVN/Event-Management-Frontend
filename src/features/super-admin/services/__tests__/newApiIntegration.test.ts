import { beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/shared', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))
import { apiClient } from '@/shared'
import { authService } from '@/features/auth/services/authService'
import { profileService } from '@/features/profile/services/profileService'
import { notificationPath, normalizeNotification } from '@/features/notifications/notificationPath'
import { fanpageStatisticsService } from '@/features/fanpage-admin/services/fanpageStatisticsService'
import { adminStatisticsService } from '../adminStatisticsService'
import { superAdminService } from '../superAdminService'
import { adminDashboard } from './fixtures/adminDashboard'
const staff = { userId: 7, firstName: 'Lộc', lastName: 'Đoàn Tài', email: 'loc@ctu.edu.vn', gender: 'MALE', avatarUrl: 'https://cdn/avatar.png', roles: ['FANPAGE_ADMIN'], staffProfile: { staffId: 'CB7', orgName: 'CTU', title: 'Cán bộ', dateOfBirth: '1990-01-01', phoneNumber: '0123456789' } }
beforeEach(() => vi.resetAllMocks())

it('creates the first password and changes an existing password using distinct requests', async () => {
  await authService.createPassword('new-password')
  await authService.changePassword('old-password', 'next-password')
  expect(apiClient.post).toHaveBeenNthCalledWith(1, '/auth/create-password', { newPassword: 'new-password' })
  expect(apiClient.post).toHaveBeenNthCalledWith(2, '/auth/change-password', { oldPassword: 'old-password', newPassword: 'next-password' })
})

it('reads nested staff profile and PATCHes only changed fields including explicit clearing', async () => {
  vi.mocked(apiClient.get).mockResolvedValue(staff)
  const current = await profileService.getMyStaffProfile()
  expect(current).toMatchObject({ id: '7', fullName: 'Đoàn Tài Lộc', staffId: 'CB7', title: 'Cán bộ', phoneNumber: '0123456789' })
  await profileService.updateMyStaffProfile({ fullName: current.fullName, gender: current.gender, phoneNumber: '', title: 'Bí thư' }, current)
  expect(apiClient.patch).toHaveBeenCalledExactlyOnceWith('/users/me/staff-profile', { staffProfile: { phoneNumber: null, title: 'Bí thư' } })
  expect(apiClient.get).toHaveBeenCalledTimes(2)
})

it('updates staff avatar independently and refetches the complete staff profile', async () => {
  vi.mocked(apiClient.get).mockResolvedValue(staff)
  const current = await profileService.getMyStaffProfile()
  await profileService.updateMyStaffProfile({ avatarUrl: 'https://cdn/new.png' }, current)
  expect(apiClient.patch).toHaveBeenCalledExactlyOnceWith('/users/me/profile/change-avatar', { avatarUrl: 'https://cdn/new.png' })
  expect(apiClient.get).toHaveBeenLastCalledWith('/users/me/staff-profile')
})

it('loads the admin dashboard with exact backend DTO fields and selected filters', async () => {
  vi.mocked(apiClient.get).mockResolvedValue(adminDashboard)
  expect(await adminStatisticsService.getDashboard(2026, '9')).toEqual(adminDashboard)
  expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/admin/statistics/dashboard', { params: { year: 2026, semesterId: '9' } })
})

it('sends an academic-year scope without a calendar-year cutoff', async () => {
  vi.mocked(apiClient.get).mockResolvedValue(adminDashboard)
  await adminStatisticsService.getDashboard('2026-2027', '9')
  expect(apiClient.get).toHaveBeenCalledWith('/admin/statistics/dashboard', { params: { academicYear: '2026-2027', semesterId: '9' } })
})

it('loads the year catalog directly and preserves semester academicYearId', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [{ id: 7, code: '2030-2031', isActive: true }] })
  expect(await adminStatisticsService.getAcademicYears()).toEqual([{ id: 7, code: '2030-2031', isActive: true }])
  expect(apiClient.get).toHaveBeenLastCalledWith('/academic-years')
  vi.mocked(apiClient.get).mockResolvedValueOnce([{ id: 91, number: 1, academicYearId: 7, academicYear: '2030-2031', status: 'ONGOING' }])
  expect((await superAdminService.getSemesters())[0]).toMatchObject({ id: 91, academicYearId: 7, academicYear: '2030-2031' })
})

it('rejects malformed dashboards and propagates authorization errors without fabricated counts', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ overview: {} })
  await expect(adminStatisticsService.getDashboard(2026)).rejects.toThrow()
  vi.mocked(apiClient.get).mockRejectedValue(new Error('Forbidden'))
  await expect(adminStatisticsService.getDashboard(2026)).rejects.toThrow('Forbidden')
})

it('sends semester filters for trends and absence, and uses numeric user IDs for alerts', async () => {
  vi.mocked(apiClient.get).mockResolvedValue([])
  await fanpageStatisticsService.getMonthlyTrends('7', 2026, '9')
  await fanpageStatisticsService.getAbsentRates('7', 2026, '9')
  await fanpageStatisticsService.getAbsentStudents('7', '9', 4)
  expect(apiClient.get).toHaveBeenNthCalledWith(1, '/fanpages/7/statistics/trends', { params: { year: 2026, semesterId: '9' } })
  expect(apiClient.get).toHaveBeenNthCalledWith(2, '/fanpages/7/statistics/absent-rate', { params: { year: 2026, semesterId: '9' } })
  expect(apiClient.get).toHaveBeenNthCalledWith(3, '/fanpages/7/statistics/absent-students', { params: { semesterId: '9', minAbsences: 4 } })
  await fanpageStatisticsService.alertAbsentStudents('7', '9', [81, 82], 'Nhắc nhở')
  expect(apiClient.post).toHaveBeenCalledWith('/fanpages/7/statistics/absent-students/alert', { semesterId: 9, studentUserIds: [81, 82], message: 'Nhắc nhở' })
})

it('routes absence alerts to the frontend fanpage path and supplies a missing title', () => {
  const item = { id: 1, type: 'EVENT_ABSENCE_ALERT', title: '', message: 'Vắng sự kiện', status: 'UNREAD' as const, createdAt: '', url: '/fanpages/7' }
  expect(normalizeNotification(item)).toMatchObject({ title: 'Nhắc nhở vắng mặt', url: '/fanpage/7' })
  expect(notificationPath({ ...item, url: '7' })).toBe('/fanpage/7')
  expect(notificationPath({ ...item, url: '/events/81' })).toBe('/events/81')
})
