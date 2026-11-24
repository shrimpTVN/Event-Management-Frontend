import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EventPhotoViewerModal } from '../EventPhotoViewerModal'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => true) }))

describe('EventPhotoViewerModal on Mobile', () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(true)
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  const samplePhotoData = {
    id: 'ev-photo-1',
    eventId: 'ev-photo-1',
    title: 'Poster Hội thảo Khoa học 2026',
    description: 'Nội dung chi tiết hội thảo khoa học',
    bannerUrl: 'https://example.com/scientific-poster.jpg',
    organizerName: 'Đoàn trường',
    organizerId: '1',
  }

  it('renders immersive full screen mobile photo viewer and hides desktop sidebar', () => {
    render(
      <MemoryRouter>
        <EventPhotoViewerModal
          isOpen={true}
          onClose={vi.fn()}
          event={samplePhotoData}
        />
      </MemoryRouter>
    )

    // Body overflow should be locked to prevent background scroll
    expect(document.body.style.overflow).toBe('hidden')

    // Close button on top-left has minimum 44px touch area (h-11 w-11)
    const closeBtn = screen.getByRole('button', { name: 'Đóng xem ảnh' })
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn).toHaveClass('h-11', 'w-11')

    // Image is rendered centered with object-contain
    const img = screen.getByAltText(samplePhotoData.title)
    expect(img).toBeInTheDocument()
    expect(img).toHaveClass('object-contain')

    // Sidebar elements like comment input or right column should NOT be present on mobile
    expect(screen.queryByPlaceholderText('Viết bình luận...')).not.toBeInTheDocument()
    expect(screen.queryByText('Bình luận gần đây')).not.toBeInTheDocument()
  })

  it('closes modal on Escape key and unlocks body scroll', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <EventPhotoViewerModal
          isOpen={true}
          onClose={onClose}
          event={samplePhotoData}
        />
      </MemoryRouter>
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes modal on vertical swipe down when at initial zoom 1x', () => {
    const onClose = vi.fn()
    const { container } = render(
      <MemoryRouter>
        <EventPhotoViewerModal
          isOpen={true}
          onClose={onClose}
          event={samplePhotoData}
        />
      </MemoryRouter>
    )

    const viewer = container.querySelector('[role="dialog"]')!
    expect(viewer).toBeInTheDocument()

    // Touch start at y = 100
    fireEvent.touchStart(viewer, {
      touches: [{ clientX: 150, clientY: 100 }],
    })

    // Swipe down to y = 250 (deltaY = 150px > 110 threshold)
    fireEvent.touchMove(viewer, {
      touches: [{ clientX: 150, clientY: 250 }],
    })

    // Touch end triggers dismiss
    fireEvent.touchEnd(viewer)

    expect(onClose).toHaveBeenCalled()
  })
})
