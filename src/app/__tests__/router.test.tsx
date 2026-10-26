import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter, Navigate } from 'react-router-dom'
import { AppProviders } from '../providers'
import { PageShell } from '@/shared'
import { HomePage } from '../../pages/HomePage'
import { NotFoundPage } from '../../pages/NotFoundPage'

describe('Router and Shell Integration', () => {
  it('renders HomePage on root path /', () => {
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '/',
          element: <PageShell />,
          children: [{ index: true, element: <HomePage /> }],
        },
      ],
      { initialEntries: ['/'] }
    )

    render(
      <AppProviders>
        <RouterProvider router={memoryRouter} />
      </AppProviders>
    )

    expect(screen.getAllByAltText(/CTU/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/Khám phá/i)).toBeInTheDocument()
  })

  it('redirects /events to /history', () => {
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '/',
          element: <PageShell />,
          children: [
            { path: 'events', element: <Navigate to="/history" replace /> },
            { path: 'history', element: <div>Mock History Page</div> },
          ],
        },
      ],
      { initialEntries: ['/events'] }
    )

    render(
      <AppProviders>
        <RouterProvider router={memoryRouter} />
      </AppProviders>
    )

    expect(screen.getByText(/Mock History Page/i)).toBeInTheDocument()
  })

  it('renders NotFoundPage on unknown route', () => {
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '/',
          element: <PageShell />,
          children: [{ path: '*', element: <NotFoundPage /> }],
        },
      ],
      { initialEntries: ['/unknown-path-123'] }
    )

    render(
      <AppProviders>
        <RouterProvider router={memoryRouter} />
      </AppProviders>
    )

    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument()
  })
})
