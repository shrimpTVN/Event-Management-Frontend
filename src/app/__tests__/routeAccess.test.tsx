import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { appRoutes } from '../router'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { User } from '@/features/auth/types/auth.types'

vi.mock('@/shared', () => ({ PageShell: () => <Outlet />, RootLayout: () => <Outlet /> }))
vi.mock('@/pages/HomePage', () => ({ HomePage: () => <p>Student home</p> }))
vi.mock('@/pages/LoginPage', () => ({ LoginPage: () => <p>Login</p> }))
vi.mock('@/pages/RegisterPage', () => ({ RegisterPage: () => <p>Register</p> }))
vi.mock('@/pages/VerifyOtpPage', () => ({ VerifyOtpPage: () => <p>OTP</p> }))
vi.mock('@/pages/StudentOnboardingPage', () => ({
  StudentOnboardingPage: () => <p>Student onboarding</p>,
}))
vi.mock('@/pages/StaffOnboardingPage', () => ({
  StaffOnboardingPage: () => <p>Staff onboarding</p>,
}))
vi.mock('@/pages/StaffFanpageHubPage', () => ({ StaffFanpageHubPage: () => <p>Staff hub</p> }))
vi.mock('@/pages/FanpageRegistrationPage', () => ({
  FanpageRegistrationPage: () => <p>Fanpage registration</p>,
}))
vi.mock('@/pages/FanpageAdminPage', () => ({ FanpageAdminPage: () => <p>Fanpage workspace</p> }))
vi.mock('@/pages/SuperAdminPage', () => ({ SuperAdminPage: () => <p>Super admin</p> }))
vi.mock('@/pages/ProfilePage', () => ({ ProfilePage: () => <p>Student profile</p> }))
vi.mock('@/pages/EventDetailPage', () => ({ EventDetailPage: () => <p>Student event</p> }))
vi.mock('@/pages/RegistrationPage', () => ({ RegistrationPage: () => <p>Student registration</p> }))
vi.mock('@/pages/CertificatePage', () => ({ CertificatePage: () => <p>Student certificate</p> }))
vi.mock('@/pages/EventHistoryPage', () => ({ EventHistoryPage: () => <p>Student history</p> }))
vi.mock('@/pages/FanpageDetailPage', () => ({ FanpageDetailPage: () => <p>Student fanpage</p> }))
vi.mock('@/pages/TrainingPointsPage', () => ({ TrainingPointsPage: () => <p>Student points</p> }))
vi.mock('@/pages/Sv5tPage', () => ({ Sv5tPage: () => <p>Student SV5T</p> }))
vi.mock('@/pages/SearchPage', () => ({ SearchPage: () => <p>Student search</p> }))
vi.mock('@/pages/SavedEventsPage', () => ({ SavedEventsPage: () => <p>Student saved</p> }))
vi.mock('@/pages/NotFoundPage', () => ({ NotFoundPage: () => <p>Not found</p> }))

const staff = {
  id: 'staff-1',
  role: 'FANPAGE_ADMIN',
  email: 'organizer@ctu.edu.vn',
  name: 'Staff',
} as User
const student = {
  id: 'student-1',
  role: 'STUDENT',
  email: 'b2300000@student.ctu.edu.vn',
  name: 'Student',
  isProfileComplete: true,
} as User
afterEach(() => useAuthStore.getState().clearAuth())

function open(path: string, user?: User) {
  useAuthStore.setState({ user: user || null, isAuthenticated: Boolean(user) })
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const studentPaths = [
  '/',
  '/events',
  '/events/search',
  '/search',
  '/events/19',
  '/events/19/register',
  '/profile',
  '/checkin',
  '/certificate',
  '/history',
  '/saved',
  '/events/saved',
  '/training-points',
  '/drl',
  '/sv5t',
  '/sinh-vien-5-tot',
  '/fanpage',
  '/fanpage/7',
  '/fanpages/7',
  '/unknown',
]

describe('access through actual application routes', () => {
  it.each(studentPaths)('requires login for %s', async (path) => {
    const router = open(path)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
  it.each(studentPaths)('keeps staff outside the student route %s', async (path) => {
    const router = open(path, staff)
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/fanpages'))
    expect(screen.getByText('Staff hub')).toBeInTheDocument()
  })
  it('keeps the full local destination when requesting login', async () => {
    const router = open('/events/19?tab=details')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(new URLSearchParams(router.state.location.search).get('redirect')).toBe(
      '/events/19?tab=details'
    )
  })
  it('allows a signed-in student into the home page', () => {
    open('/', student)
    expect(screen.getByText('Student home')).toBeInTheDocument()
  })
  it('preserves student access when they also manage a fanpage', () => {
    open('/', { ...student, role: 'FANPAGE_ADMIN' })
    expect(screen.getByText('Student home')).toBeInTheDocument()
  })
  it.each([student, staff])('allows fanpage workspace for $role', (user) => {
    open('/fanpage/workspace', user)
    expect(screen.getByText('Fanpage workspace')).toBeInTheDocument()
  })
  it('routes superadmin to system administration', async () => {
    const router = open('/history', { ...staff, role: 'ADMIN' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
  })
  it.each(['/login', '/register', '/dang-nhap', '/dang-ky', '/verify-otp'])(
    'keeps authentication route %s available',
    (path) => {
      expect(open(path).state.location.pathname).toBe(path)
    }
  )
  it.each([
    '/onboarding/student',
    '/onboarding/staff',
    '/staff/fanpages',
    '/register/fanpage',
    '/fanpage/admin',
    '/fanpage/workspace',
    '/admin',
    '/super-admin',
  ])('requires login outside the portal at %s', async (path) => {
    const router = open(path)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
  it('blocks staff from student onboarding', async () => {
    const router = open('/onboarding/student', staff)
    await waitFor(() => expect(router.state.location.pathname).toBe('/staff/fanpages'))
  })
  it('blocks a student from staff onboarding', async () => {
    const router = open('/onboarding/staff', student)
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
  it('rejects unrecognized roles from restricted workspaces', async () => {
    const router = open('/fanpage/workspace', {
      ...staff,
      role: 'UNKNOWN' as User['role'],
      email: 'unknown@example.com',
    })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
