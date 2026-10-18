import { createBrowserRouter } from 'react-router-dom'
import { PageShell } from '@/shared'
import { AuthGuard } from '@/features/auth'
import { HomePage } from '../pages/HomePage'
import { EventListPage } from '../pages/EventListPage'
import { EventDetailPage } from '../pages/EventDetailPage'
import { RegistrationPage } from '../pages/RegistrationPage'
import { CheckInPage } from '../pages/CheckInPage'
import { CertificatePage } from '../pages/CertificatePage'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { VerifyOtpPage } from '../pages/VerifyOtpPage'
import { StudentOnboardingPage } from '../pages/StudentOnboardingPage'
import { StaffOnboardingPage } from '../pages/StaffOnboardingPage'
import { StaffFanpageHubPage } from '../pages/StaffFanpageHubPage'
import { FanpageRegistrationPage } from '../pages/FanpageRegistrationPage'
import { FanpageAdminPage } from '../pages/FanpageAdminPage'
import { ProfilePage } from '../pages/ProfilePage'
import { EventHistoryPage } from '../pages/EventHistoryPage'
import { FanpageDetailPage } from '../pages/FanpageDetailPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  // 1. Standalone Authentication & Onboarding Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/verify-otp',
    element: <VerifyOtpPage />,
  },
  {
    path: '/onboarding/student',
    element: <StudentOnboardingPage />,
  },
  {
    path: '/onboarding/staff',
    element: <StaffOnboardingPage />,
  },
  {
    path: '/staff/fanpages',
    element: <StaffFanpageHubPage />,
  },
  {
    path: '/register/fanpage',
    element: <FanpageRegistrationPage />,
  },
  {
    path: '/fanpage/admin',
    element: <FanpageAdminPage />,
  },
  {
    path: '/admin/fanpage',
    element: <FanpageAdminPage />,
  },
  {
    path: '/dang-nhap',
    element: <LoginPage />,
  },
  {
    path: '/dang-ky',
    element: <RegisterPage />,
  },
  {
    path: '/dang-ky-fanpage',
    element: <FanpageRegistrationPage />,
  },

  // 2. Application Routes (Wrapped in PageShell with Top Navbar & Main Container)
  {
    path: '/',
    element: <PageShell />,
    children: [
      {
        index: true,
        element: (
          <AuthGuard disallowedRoles={['ORGANIZER']} roleRedirectPath="/staff/fanpages">
            <HomePage />
          </AuthGuard>
        ),
      },
      {
        path: 'profile',
        element: (
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        ),
      },
      {
        path: 'events',
        element: <EventListPage />,
      },
      {
        path: 'events/:id',
        element: <EventDetailPage />,
      },
      {
        path: 'events/:id/register',
        element: (
          <AuthGuard>
            <RegistrationPage />
          </AuthGuard>
        ),
      },
      {
        path: 'checkin',
        element: (
          <AuthGuard>
            <CheckInPage />
          </AuthGuard>
        ),
      },
      {
        path: 'certificate',
        element: (
          <AuthGuard>
            <CertificatePage />
          </AuthGuard>
        ),
      },
      {
        path: 'history',
        element: (
          <AuthGuard>
            <EventHistoryPage />
          </AuthGuard>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <AuthGuard requiredRole="ORGANIZER">
            <DashboardPage />
          </AuthGuard>
        ),
      },
      {
        path: 'fanpage',
        element: <FanpageDetailPage />,
      },
      {
        path: 'fanpage/:id',
        element: <FanpageDetailPage />,
      },
      {
        path: 'fanpages/:id',
        element: <FanpageDetailPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
