import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { AppProviders } from '../providers'
import { PageShell } from '@/shared'
import { HomePage } from '../../pages/HomePage'
import { EventListPage } from '../../pages/EventListPage'
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

    expect(screen.getAllByText(/CTU/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Khám phá/i)).toBeInTheDocument()
  })

  it('renders EventListPage on /events path', () => {
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '/',
          element: <PageShell />,
          children: [{ path: 'events', element: <EventListPage /> }],
        },
      ],
      { initialEntries: ['/events'] }
    )

    render(
      <AppProviders>
        <RouterProvider router={memoryRouter} />
      </AppProviders>
    )

    expect(screen.getByText(/Upcoming Events/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Search events.../i)).toBeInTheDocument()
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
