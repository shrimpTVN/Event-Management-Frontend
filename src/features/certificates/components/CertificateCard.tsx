import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Award, Download, CheckCircle, Shield, Loader2, Building, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { isMockMode } from '@/shared'
import { certificateService } from '../services/certificateService'
import type { Certificate } from '../types/certificate.types'

export const CertificateCard: React.FC = () => {
  const [searchParams] = useSearchParams()
  const rawRegId = searchParams.get('regId')
  const registrationId = rawRegId || (isMockMode() ? 'reg-1-1' : '')
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: cert, isLoading } = useQuery<Certificate>({
    queryKey: ['certificate', registrationId],
    queryFn: () => certificateService.getCertificate(registrationId),
    enabled: Boolean(registrationId),
  })

  if (!registrationId) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-3">
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
    if (!cert?.id) return
    try {
      setIsDownloading(true)
      const blob = await certificateService.downloadCertificatePdf(cert.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Chung_Nhan_${cert?.verificationCode || 'CTU'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      // Fallback direct link
      window.open(`/api/certificates/${cert.id}/download`, '_blank')
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

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-left">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-k2d text-foreground">
              GIẤY CHỨNG NHẬN ĐIỆN TỬ
            </h2>
            <p className="text-xs text-muted-foreground">Đại học Cần Thơ — Hệ thống quản lý sự kiện & ĐRL</p>
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
          {cert?.eventTitle || 'HỘI THẢO CHUYÊN ĐỀ: TRÍ TUỆ NHÂN TẠO & XU HƯỚNG MÔ HÌNH NGÔN NGỮ LỚN (LLM)'}
        </h3>
      </div>

      {/* Recipient and Verification Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-[#F9FAFB] dark:bg-background/60 text-xs">
        <div>
          <span className="text-muted-foreground">Cấp cho sinh viên:</span>
          <p className="font-bold text-foreground text-sm mt-0.5">
            {cert?.attendeeName || 'Đoàn Tài Lộc'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Mã số sinh viên (MSSV):</span>
          <p className="font-bold text-foreground text-sm font-mono mt-0.5">
            {(cert as any)?.studentId || 'B2303827'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Ngày cấp chứng nhận:</span>
          <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {cert?.issueDate || '16/08/2026'}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Mã định danh chứng thực:</span>
          <p className="font-mono text-primary font-bold mt-0.5">
            {cert?.verificationCode || 'CTU-AI-883921'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span>Ký số bởi Hội đồng ĐRL & Đoàn Thanh niên ĐHCT</span>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow cursor-pointer"
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
        </button>
      </div>
    </div>
  )
}
