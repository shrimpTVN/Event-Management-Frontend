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
import { ProfilePage } from '../pages/ProfilePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
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
        path: 'dashboard',
        element: (
          <AuthGuard requiredRole="ORGANIZER">
            <DashboardPage />
          </AuthGuard>
        ),
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
