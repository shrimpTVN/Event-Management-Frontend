import { Button } from '@/components/ui/button'
import { format, parseISO, isValid } from 'date-fns'
import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Award,
  Download,
  CheckCircle,
  Shield,
  Loader2,
  Building,
  Calendar,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { isMockMode } from '@/shared'
import { certificateService } from '../services/certificateService'
import type { Certificate } from '../types/certificate.types'

const displayDate = (value?: string) => {
  if (!value) return '—'
  const date = parseISO(value)
  return isValid(date) ? format(date, 'dd/MM/yyyy') : value
}

const isValidCertificate = (cert: Certificate | null | undefined): cert is Certificate => {
  if (!cert) return false
  return Boolean(
    String(cert.id || '').trim() &&
      String(cert.eventTitle || '').trim() &&
      String(cert.attendeeName || '').trim() &&
      String(cert.verificationCode || '').trim()
  )
}

export const CertificateCard: React.FC = () => {
  const [searchParams] = useSearchParams()
  const rawRegId = searchParams.get('regId')
  const registrationId = rawRegId || (isMockMode() ? 'reg-1-1' : '')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const {
    data: cert,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Certificate>({
    queryKey: ['certificate', registrationId],
    queryFn: () => certificateService.getCertificate(registrationId),
    enabled: Boolean(registrationId),
  })

  if (!registrationId) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
        <Award className="h-10 w-10 text-muted-foreground" />
        <h3 className="font-semibold text-foreground text-base">Chưa chọn chứng nhận</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Vui lòng chọn một sự kiện đã hoàn thành từ lịch sử đăng ký để xem chứng nhận điện tử.
        </p>
        <Link
          to="/history"
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Xem lịch sử sự kiện
        </Link>
      </div>
    )
  }

  const handleDownloadPdf = async () => {
    if (!isValidCertificate(cert)) return
    try {
      setDownloadError(null)
      setIsDownloading(true)
      const blob = await certificateService.downloadCertificatePdf(cert.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Chung_Nhan_${cert.verificationCode}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Không thể tải tệp PDF chứng nhận lúc này. Vui lòng thử lại sau.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs sm:text-sm text-muted-foreground">Đang tải chứng nhận điện tử...</p>
      </div>
    )
  }

  const statusCode = (error as { response?: { status?: number } } | null)?.response?.status
  if (isError) {
    const isNotFound = statusCode === 404
    return (
      <div
        role="alert"
        className="rounded-2xl border border-border bg-card p-6 sm:p-10 text-center flex flex-col items-center justify-center gap-3"
      >
        <AlertCircle
          className={isNotFound ? 'h-10 w-10 text-muted-foreground' : 'h-10 w-10 text-destructive'}
        />
        <h3 className="font-semibold text-foreground text-base">
          {isNotFound ? 'Chưa có chứng nhận điện tử' : 'Không thể tải chứng nhận điện tử'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md">
          {isNotFound
            ? 'Chứng nhận cho lượt đăng ký này chưa được phát hành hoặc không tồn tại trên hệ thống.'
            : 'Đã xảy ra lỗi khi xác thực chứng nhận với máy chủ. Vui lòng thử lại.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {!isNotFound && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          )}
          <Link
            to="/history"
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Quay lại lịch sử sự kiện
          </Link>
        </div>
      </div>
    )
  }

  if (!isValidCertificate(cert)) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-border bg-card p-6 sm:p-10 text-center flex flex-col items-center justify-center gap-3"
      >
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <h3 className="font-semibold text-foreground text-base">
          Dữ liệu chứng nhận chưa đầy đủ
        </h3>
        <p className="text-xs text-muted-foreground max-w-md">
          Không thể xác thực thông tin chứng nhận từ máy chủ. Vui lòng thử lại sau hoặc kiểm tra lại
          lịch sử đăng ký.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-1.5 text-xs mt-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Thử lại</span>
        </Button>
      </div>
    )
  }

  const studentCode = (cert as Certificate & { studentId?: string }).studentId || '—'

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-left">
      {/* Top Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-k2d text-foreground">
              GIẤY CHỨNG NHẬN ĐIỆN TỬ
            </h2>
            <p className="text-xs text-muted-foreground">
              Đại học Cần Thơ — Hệ thống quản lý sự kiện & ĐRL
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <CheckCircle className="h-3.5 w-3.5" />
          Đã xác thực
        </span>
      </div>

      {/* Event Title Banner */}
      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1.5">
        <span className="text-[11px] font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5" />
          Hoạt động hoàn thành
        </span>
        <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
          {cert.eventTitle}
        </h3>
      </div>

      {/* Recipient and Verification Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-[#F9FAFB] dark:bg-background/60 text-xs">
        <div>
          <span className="text-muted-foreground">Cấp cho sinh viên:</span>
          <p className="font-bold text-foreground text-sm mt-0.5">{cert.attendeeName}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Mã số sinh viên (MSSV):</span>
          <p className="font-bold text-foreground text-sm font-mono mt-0.5">{studentCode}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Ngày cấp chứng nhận:</span>
          <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {displayDate(cert.issueDate)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Mã định danh chứng thực:</span>
          <p className="font-mono text-primary font-bold mt-0.5">{cert.verificationCode}</p>
        </div>
      </div>

      {downloadError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span>Ký số bởi Hội đồng ĐRL & Đoàn Thanh niên ĐHCT</span>
        </div>

        <Button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading || !cert.id}
          className="h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow cursor-pointer"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tải tệp PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Tải chứng nhận PDF</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
