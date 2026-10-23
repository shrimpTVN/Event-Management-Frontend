import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Camera, CheckCircle2, UploadCloud, AlertCircle, Calendar, MapPin, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared'

export const PhotoCheckIn: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialEventId = searchParams.get('eventId') || ''

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId)
  const [checkType, setCheckType] = useState<'check-in' | 'check-out'>('check-in')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch student's upcoming or checked in events
  const { data: upcomingEvents = [], isLoading: isLoadingEvents } = useQuery<any[]>({
    queryKey: ['registrations', 'upcoming'],
    queryFn: async () => {
      const res: any = await apiClient.get('/registrations/me/upcoming')
      const list = Array.isArray(res) ? res : res?.data || []
      return list
    },
  })

  // If initialEventId not selected yet and upcoming events load, pick first
  useEffect(() => {
    if (!selectedEventId && upcomingEvents.length > 0) {
      setSelectedEventId(String(upcomingEvents[0].eventId))
    }
  }, [upcomingEvents, selectedEventId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setErrorMessage(null)
    }
  }

  const handleVerify = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chụp ảnh hoặc tải lên ảnh minh chứng.')
      return
    }
    if (!selectedEventId) {
      setErrorMessage('Vui lòng chọn sự kiện cần điểm danh.')
      return
    }

    try {
      setIsVerifying(true)
      setErrorMessage(null)

      // Call API check-in / check-out
      await apiClient.patch(`/registrations/me/events/${selectedEventId}/${checkType}`, {
        proofUrl: previewUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      })

      setIsCheckedIn(true)
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || 'Không thể xác thực điểm danh. Vui lòng thử lại.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  const selectedEvent = upcomingEvents.find((e) => String(e.eventId) === String(selectedEventId))

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
              Minh chứng của bạn đã được ghi nhận vào hệ thống. Điểm rèn luyện sẽ được tổng kết sau khi ban tổ chức duyệt kết thúc sự kiện.
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
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
            ) : upcomingEvents.length > 0 ? (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {upcomingEvents.map((ev) => (
                  <option key={ev.eventId} value={ev.eventId}>
                    {ev.eventName}
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
            <div className="p-3.5 rounded-xl border border-border bg-muted/30 text-xs space-y-1">
              <p className="font-semibold text-foreground">{selectedEvent.eventName}</p>
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
            {previewUrl ? (
              <div className="relative w-full aspect-video max-h-56 rounded-lg overflow-hidden border border-border">
                <img
                  src={previewUrl}
                  alt="Ảnh minh chứng điểm danh"
                  className="w-full h-full object-cover"
                />
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

          <div className="flex items-center gap-2 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Hãy đảm bảo khuôn mặt rõ nét và bối cảnh sự kiện được chụp rõ ràng để hệ thống đối soát chính xác.
            </span>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!selectedFile || isVerifying || !selectedEventId}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải lên và xác thực...</span>
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
