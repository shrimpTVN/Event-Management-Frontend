import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FanpageActivityStatsCard } from '../FanpageActivityStatsCard'
import { EMPTY_ACTIVITY_STATS } from '../../services/fanpageAdminService'

describe('FanpageActivityStatsCard', () => {
  it('shows real totals including zero without claiming a seven day period', () => {
    render(
      <FanpageActivityStatsCard
        stats={{
          ...EMPTY_ACTIVITY_STATS,
          available: true,
          eventsCount: 12,
          totalRegistrations: 52,
          totalAttendees: 0,
        }}
      />
    )
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('52')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Toàn thời gian')).toBeInTheDocument()
    expect(screen.queryByText('Theo dõi mới')).not.toBeInTheDocument()
  })
  it('shows an unavailable state instead of zeros after a request failure', () => {
    render(<FanpageActivityStatsCard stats={EMPTY_ACTIVITY_STATS} />)
    expect(screen.getByText('Chưa tải được số liệu.')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
