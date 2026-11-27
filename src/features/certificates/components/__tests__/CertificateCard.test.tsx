import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CertificateCard } from '../CertificateCard'
import { certificateService } from '../../services/certificateService'

vi.mock('../../services/certificateService', () => ({
  certificateService: {
    getCertificate: vi.fn(),
    downloadCertificatePdf: vi.fn(),
  },
}))

const renderCard = (search = '?regId=reg-10') => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/certificate${search}`]}>
        <CertificateCard />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CertificateCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders verified certificate details when BE returns valid payload', async () => {
    vi.mocked(certificateService.getCertificate).mockResolvedValue({
      id: 'cert-1',
      registrationId: 'reg-10',
      eventId: 'evt-1',
      attendeeName: 'Nguyễn Văn A',
      eventTitle: 'Ngày hội Công nghệ CTU',
      issueDate: '2026-10-15T00:00:00Z',
      verificationCode: 'CTU-CERT-999',
      downloadUrl: '/api/certificates/cert-1/download',
    })

    renderCard()

    expect(await screen.findByText('Đã xác thực')).toBeInTheDocument()
    expect(screen.getByText('Ngày hội Công nghệ CTU')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('CTU-CERT-999')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tải chứng nhận PDF/i })).toBeEnabled()
  })

  it('shows error state without verified badge or mock data when API rejects with 500', async () => {
    vi.mocked(certificateService.getCertificate).mockRejectedValue({
      response: { status: 500 },
    })

    renderCard()

    expect(await screen.findByText('Không thể tải chứng nhận điện tử')).toBeInTheDocument()
    expect(screen.queryByText('Đã xác thực')).not.toBeInTheDocument()
    expect(screen.queryByText('Đoàn Tài Lộc')).not.toBeInTheDocument()
    expect(screen.queryByText('B2303827')).not.toBeInTheDocument()
    expect(screen.queryByText('CTU-AI-883921')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('shows not-found message without verified badge when API returns 404', async () => {
    vi.mocked(certificateService.getCertificate).mockRejectedValue({
      response: { status: 404 },
    })

    renderCard()

    expect(await screen.findByText('Chưa có chứng nhận điện tử')).toBeInTheDocument()
    expect(screen.queryByText('Đã xác thực')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tải chứng nhận PDF/i })).not.toBeInTheDocument()
  })

  it('rejects incomplete payload lacking required fields and blocks verified state', async () => {
    vi.mocked(certificateService.getCertificate).mockResolvedValue({
      id: '',
      registrationId: 'reg-10',
      eventId: 'evt-1',
      attendeeName: '',
      eventTitle: '',
      issueDate: '',
      verificationCode: '',
      downloadUrl: '',
    })

    renderCard()

    await waitFor(() => {
      expect(screen.getByText('Dữ liệu chứng nhận chưa đầy đủ')).toBeInTheDocument()
    })
    expect(screen.queryByText('Đã xác thực')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tải chứng nhận PDF/i })).not.toBeInTheDocument()
  })
})
