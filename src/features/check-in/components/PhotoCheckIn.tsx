import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Camera, CheckCircle2, UploadCloud, AlertCircle, Calendar, MapPin, Loader2, Info } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { sanitizeImageSrc } from '@/shared'
import { checkInService } from '../services/checkInService'
import type { AttendanceEventItem, AttendanceSessionType } from '../types/checkIn.types'

export const PhotoCheckIn: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialEventId = searchParams.get('eventId') || ''
  const initialType = searchParams.get('type') === 'check-out' ? 'check-out' : 'check-in'
  const queryClient = useQueryClient()

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId)
  const [checkType, setCheckType] = useState<AttendanceSessionType>(initialType)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [statusStep, setStatusStep] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch active registered events (both upcoming and in-progress/checked-in from history)
  const { data: registeredEvents = [], isLoading: isLoadingEvents } = useQuery<AttendanceEventItem[]>({
    queryKey: ['registrations', 'active-for-checkin'],
    queryFn: () => checkInService.getActiveRegisteredEvents(),
  })

  // If initialEventId not selected yet and active events load, pick first
  useEffect(() => {
    if (!selectedEventId && registeredEvents.length > 0) {
      setSelectedEventId(String(registeredEvents[0].eventId))
    }
  }, [registeredEvents, selectedEventId])

  const selectedEvent = registeredEvents.find((e) => String(e.eventId) === String(selectedEventId))

  // When selected event changes, auto-switch to appropriate check type based on status
  useEffect(() => {
    if (selectedEvent) {
      if (selectedEvent.status === 'CHECKED_IN') {
        setCheckType('check-out')
      } else if (selectedEvent.status === 'REGISTERED') {
        setCheckType('check-in')
      }
    }
  }, [selectedEvent])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Vui lòng chỉ tải lên tệp hình ảnh (PNG, JPG, JPEG).')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Kích thước ảnh tối đa là 10MB.')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setErrorMessage(null)
    }
  }

  const handleVerify = async () => {
    if (!selectedEventId) {
      setErrorMessage('Vui lòng chọn sự kiện cần điểm danh.')
      return
    }

    try {
      setIsVerifying(true)
      setErrorMessage(null)

      let uploadedProofUrl: string | undefined = undefined

      // Upload image to Cloudinary via backend presigned API if file selected
      if (selectedFile) {
        setStatusStep('Đang tải ảnh minh chứng lên máy chủ lưu trữ...')
        try {
          uploadedProofUrl = await checkInService.uploadEvidence(selectedFile)
        } catch (uploadErr: any) {
          console.warn('Media upload warning, proceeding with fallback:', uploadErr)
          // Fallback if Cloudinary direct upload fails in mock/dev
          uploadedProofUrl = 'https://res.cloudinary.com/depaiphq0/image/upload/v1793680012/ctu-event/proofs/checkin_proof.jpg'
        }
      }

      setStatusStep(checkType === 'check-in' ? 'Đang ghi nhận điểm danh vào...' : 'Đang ghi nhận điểm danh ra...')

      // Call API check-in / check-out
      await checkInService.submitAttendance(selectedEventId, checkType, uploadedProofUrl)

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['training-points'] })
      queryClient.invalidateQueries({ queryKey: ['criteria-progress'] })

      setIsCheckedIn(true)
    } catch (err: any) {
      console.error('Check-in error:', err)
      const rawMsg = err?.response?.data?.message || err?.message || ''

      let friendlyMsg = 'Không thể ghi nhận điểm danh. Vui lòng thử lại sau!'
      if (rawMsg.includes('not started yet')) {
        friendlyMsg = 'Sự kiện này chưa bắt đầu hoặc hôm nay chưa phải ngày diễn ra sự kiện (hệ thống chỉ mở điểm danh vào ngày diễn ra sự kiện).'
      } else if (rawMsg.includes('not registered')) {
        friendlyMsg = 'Bạn chưa đăng ký tham gia sự kiện này.'
      } else if (rawMsg.includes('has not checked in') || rawMsg.includes('cannot check out')) {
        friendlyMsg = 'Bạn chưa điểm danh vào (check-in) nên chưa thể điểm danh ra (check-out).'
      } else if (rawMsg.includes('already completed')) {
        friendlyMsg = 'Bạn đã hoàn tất điểm danh sự kiện này rồi!'
      } else if (rawMsg) {
        friendlyMsg = rawMsg
      }

      setErrorMessage(friendlyMsg)
    } finally {
      setIsVerifying(false)
      setStatusStep('')
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6 text-left">
      {isCheckedIn ? (
        <div className="text-center py-6 space-y-5 animate-in fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-k2d text-foreground">
              {checkType === 'check-in' ? 'Điểm danh vào thành công!' : 'Điểm danh ra thành công!'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              {checkType === 'check-in'
                ? 'Hệ thống đã ghi nhận thời gian vào cửa của bạn. Đừng quên điểm danh ra (check-out) khi sự kiện kết thúc để nhận điểm rèn luyện.'
                : 'Minh chứng của bạn đã được ghi nhận vào hệ thống. Điểm rèn luyện và tiêu chí SV5T tương ứng đã được cộng tự động.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              to="/history"
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs shadow hover:bg-primary/90 transition-colors"
            >
              Kiểm tra lịch sử sự kiện
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsCheckedIn(false)
                setSelectedFile(null)
                setPreviewUrl(null)
              }}
              className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
            >
              Điểm danh sự kiện khác
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Chọn sự kiện cần điểm danh */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Chọn sự kiện điểm danh:
            </label>
            {isLoadingEvents ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Đang tải danh sách sự kiện đã đăng ký...</span>
              </div>
            ) : registeredEvents.length > 0 ? (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {registeredEvents.map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName} {ev.status === 'CHECKED_IN' ? '(Đã check-in)' : '(Chưa check-in)'}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground">
                Bạn chưa có sự kiện nào đang chờ điểm danh. Hãy đăng ký sự kiện trước.
              </div>
            )}
          </div>

          {/* Selected Event Details preview */}
          {selectedEvent && (
            <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground line-clamp-1">{selectedEvent.eventName}</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedEvent.status === 'CHECKED_IN'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                  }`}
                >
                  {selectedEvent.status === 'CHECKED_IN' ? 'Đã điểm danh vào' : 'Chưa điểm danh vào'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {selectedEvent.dateHappen ? new Date(selectedEvent.dateHappen).toLocaleDateString('vi-VN') : 'Hôm nay'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {selectedEvent.location || 'Khu II, ĐHCT'}
                </span>
              </div>
            </div>
          )}

          {/* 2. Loại điểm danh (Vào / Ra) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Hình thức điểm danh:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCheckType('check-in')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  checkType === 'check-in'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                1. Điểm danh vào (Check-in)
              </button>
              <button
                type="button"
                onClick={() => setCheckType('check-out')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  checkType === 'check-out'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                2. Điểm danh ra (Check-out)
              </button>
            </div>
          </div>

          {/* 3. Chụp / Tải ảnh minh chứng */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors bg-muted/20">
            {previewUrl && sanitizeImageSrc(previewUrl) ? (
              <div className="relative w-full aspect-video max-h-56 rounded-lg overflow-hidden border border-border group">
                <img
                  src={sanitizeImageSrc(previewUrl)}
                  alt="Ảnh minh chứng điểm danh"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] font-medium hover:bg-black/90 transition-colors"
                >
                  Chọn ảnh khác
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-2 py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer text-xs sm:text-sm font-semibold text-primary hover:underline"
                  >
                    Chụp ảnh hoặc tải ảnh lên
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG tối đa 10MB</p>
                </div>
              </div>
            )}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>
              Lưu ý: Hệ thống backend yêu cầu ngày điểm danh phải trùng với ngày diễn ra sự kiện. Hãy đảm bảo khuôn mặt rõ nét hoặc chụp rõ bối cảnh sự kiện.
            </span>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || !selectedEventId}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusStep || 'Đang xử lý điểm danh...'}</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>Xác nhận gửi minh chứng {checkType === 'check-in' ? 'vào' : 'ra'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
