import React, { useState } from 'react'
import { Camera, CheckCircle2, UploadCloud, AlertCircle } from 'lucide-react'

export const PhotoCheckIn: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleVerify = () => {
    if (!selectedFile) return
    setIsVerifying(true)
    setTimeout(() => {
      setIsVerifying(false)
      setIsCheckedIn(true)
    }, 1500)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
      {isCheckedIn ? (
        <div className="text-center py-6 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Attendance Verified!</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Welcome to the event. Your e-certificate will be unlockable upon event conclusion.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            {previewUrl ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Check-in snapshot"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer text-sm font-semibold text-primary hover:underline"
                  >
                    Take a photo or upload
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
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

          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Ensure your face is well-lit and clearly visible for instant automated verification.
            </span>
          </div>

          <button
            onClick={handleVerify}
            disabled={!selectedFile || isVerifying}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow"
          >
            <UploadCloud className="h-4 w-4" />
            {isVerifying ? 'Verifying photo...' : 'Verify Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}
