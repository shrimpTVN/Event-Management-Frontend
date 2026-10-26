import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PageShell } from '@/shared'
import { AuthGuard, STAFF_ROLES } from '@/features/auth'
import { HomePage } from '../pages/HomePage'
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
import { TrainingPointsPage } from '../pages/TrainingPointsPage'
import { Sv5tPage } from '../pages/Sv5tPage'
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
    element: (
      <AuthGuard allowedRoles={STAFF_ROLES} roleRedirectPath="/">
        <StaffFanpageHubPage />
      </AuthGuard>
    ),
  },
  {
    path: '/register/fanpage',
    element: (
      <AuthGuard allowedRoles={STAFF_ROLES} roleRedirectPath="/">
        <FanpageRegistrationPage />
      </AuthGuard>
    ),
  },
  {
    path: '/fanpage/admin',
    element: (
      <AuthGuard allowedRoles={STAFF_ROLES} roleRedirectPath="/">
        <FanpageAdminPage />
      </AuthGuard>
    ),
  },
  {
    path: '/admin/fanpage',
    element: (
      <AuthGuard allowedRoles={STAFF_ROLES} roleRedirectPath="/">
        <FanpageAdminPage />
      </AuthGuard>
    ),
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
    element: (
      <AuthGuard allowedRoles={STAFF_ROLES} roleRedirectPath="/">
        <FanpageRegistrationPage />
      </AuthGuard>
    ),
  },

  // 2. Application Routes (Wrapped in PageShell with Top Navbar & Main Container)
  {
    path: '/',
    element: <PageShell />,
    children: [
      {
        index: true,
        element: (
          <AuthGuard disallowedRoles={STAFF_ROLES} roleRedirectPath="/staff/fanpages">
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
        element: <Navigate to="/history" replace />,
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
        path: 'training-points',
        element: (
          <AuthGuard>
            <TrainingPointsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'drl',
        element: (
          <AuthGuard>
            <TrainingPointsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'sv5t',
        element: (
          <AuthGuard>
            <Sv5tPage />
          </AuthGuard>
        ),
      },
      {
        path: 'sinh-vien-5-tot',
        element: (
          <AuthGuard>
            <Sv5tPage />
          </AuthGuard>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <AuthGuard allowedRoles={STAFF_ROLES}>
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
