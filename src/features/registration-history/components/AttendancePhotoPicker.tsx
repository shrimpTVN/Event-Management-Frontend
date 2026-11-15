import { useEffect, useRef, useState } from 'react'
import { Camera, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AttendancePhotoPicker({
  disabled,
  onSelect,
}: {
  disabled: boolean
  onSelect: (file: File) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const captureInput = useRef<HTMLInputElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const request = useRef(0)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [opening, setOpening] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  const stopCamera = () => {
    request.current++
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    setCameraOpen(false)
    setOpening(false)
    setReady(false)
  }
  useEffect(
    () => () => {
      request.current++
      stream.current?.getTracks().forEach((track) => track.stop())
    },
    []
  )

  useEffect(() => {
    if (cameraOpen && video.current && stream.current) {
      video.current.srcObject = stream.current
      void video.current
        .play()
        .catch(() => setError('Chưa mở được camera. Bạn có thể chọn ảnh từ máy.'))
    }
  }, [cameraOpen])

  const openCamera = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      // Mobile browsers can offer their native camera even without getUserMedia.
      captureInput.current?.click()
      setError('Nếu camera không mở, hãy chọn ảnh từ máy hoặc mở trang bằng HTTPS.')
      return
    }
    const id = ++request.current
    setOpening(true)
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      if (id !== request.current) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = media
      setCameraOpen(true)
    } catch (err) {
      if (id !== request.current) return
      const denied =
        err instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(err.name)
      setError(
        denied
          ? 'Bạn chưa cho phép truy cập camera. Hãy cấp quyền hoặc chọn ảnh từ máy.'
          : 'Không tìm thấy hoặc không mở được camera. Bạn có thể chọn ảnh từ máy.'
      )
    } finally {
      if (id === request.current) setOpening(false)
    }
  }
  const takePhoto = () => {
    const frame = video.current
    if (!frame?.videoWidth || !frame.videoHeight) return
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1600 / Math.max(frame.videoWidth, frame.videoHeight))
    canvas.width = Math.round(frame.videoWidth * scale)
    canvas.height = Math.round(frame.videoHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      setError('Không chụp được ảnh. Hãy chọn ảnh từ máy.')
      return
    }
    context.drawImage(frame, 0, 0, canvas.width, canvas.height)
    const id = request.current
    canvas.toBlob(
      (blob) => {
        if (id !== request.current) return
        if (!blob) {
          setError('Chụp ảnh thất bại. Vui lòng thử lại.')
          return
        }
        onSelect(new File([blob], `diem-danh-${Date.now()}.jpg`, { type: 'image/jpeg' }))
        stopCamera()
      },
      'image/jpeg',
      0.85
    )
  }
  const selectFile = (input: HTMLInputElement) => {
    const file = input.files?.[0]
    input.value = ''
    if (file) {
      stopCamera()
      setError('')
      onSelect(file)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Tải ảnh minh chứng"
        className="hidden"
        disabled={disabled}
        onChange={(e) => selectFile(e.currentTarget)}
      />
      <Input
        ref={captureInput}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Chụp ảnh bằng thiết bị"
        className="hidden"
        disabled={disabled}
        onChange={(e) => selectFile(e.currentTarget)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || opening}
          onClick={() => fileInput.current?.click()}
          className="h-10 gap-2 px-2 text-xs rounded-lg"
        >
          <UploadCloud className="h-4 w-4" />
          Chọn ảnh từ máy
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || opening || cameraOpen}
          onClick={openCamera}
          className="h-10 gap-2 px-2 text-xs rounded-lg"
        >
          <Camera className="h-4 w-4" />
          {opening ? 'Đang mở camera...' : 'Mở camera'}
        </Button>
      </div>
      {opening && (
        <Button type="button" variant="ghost" onClick={stopCamera}>
          Hủy mở camera
        </Button>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {cameraOpen && (
        <div className="flex flex-col gap-2">
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            aria-label="Camera điểm danh"
            onLoadedData={() => setReady(true)}
            className="max-h-60 w-full rounded-lg bg-black object-contain"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={stopCamera}>
              Tắt camera
            </Button>
            <Button type="button" disabled={disabled || !ready} onClick={takePhoto}>
              Chụp ảnh
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
