import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Pencil, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { mediaService } from '@/shared'
import type { FanpageSummary } from '../types/fanpageAdmin.types'
import { fanpageAdminService } from '../services/fanpageAdminService'
import { FanpageProfileDetails } from './FanpageProfileDetails'

interface FanpageProfileEditViewProps {
  currentFanpage: FanpageSummary
  onSave?: (updated: Partial<FanpageSummary>) => void
  onCancel?: () => void
}

type EditableProfile = Pick<FanpageSummary, 'avatarUrl' | 'description' | 'email' | 'phone'>
const getEditableProfile = (fanpage: FanpageSummary): EditableProfile => ({
  avatarUrl: fanpage.avatarUrl || '',
  description: fanpage.description || '',
  email: fanpage.email || '',
  phone: fanpage.phone || '',
})

export const FanpageProfileEditView: React.FC<FanpageProfileEditViewProps> = ({
  currentFanpage,
  onSave,
  onCancel,
}) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = ['ADMIN', 'QUẢN TRỊ VIÊN'].includes(currentFanpage.role?.trim().toUpperCase())
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(() => getEditableProfile(currentFanpage))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const {
    data: detailData,
    isFetching,
    isPlaceholderData,
    isError,
    refetch,
  } = useQuery<FanpageSummary>({
    queryKey: ['fanpage-detail', currentFanpage.id],
    queryFn: async () => {
      const detail = await fanpageAdminService.getFanpageDetail(currentFanpage.id)
      if (!detail) throw new Error('Không tải được hồ sơ fanpage')
      return detail
    },
    placeholderData: currentFanpage,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const fanpage = detailData || currentFanpage

  useEffect(() => {
    setIsEditing(false)
    setAvatarFile(null)
    setFeedback(null)
  }, [currentFanpage.id, isAdmin])

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const updateMutation = useMutation({
    mutationFn: (payload: EditableProfile) =>
      fanpageAdminService.updateFanpageProfile(currentFanpage.id, payload),
    onSuccess: (_, payload) => {
      queryClient.setQueryData<FanpageSummary | null>(
        ['fanpage-detail', currentFanpage.id],
        (old) => ({ ...(old || fanpage), ...payload })
      )
      for (const key of [
        'fanpage-detail',
        'fanpage-detail-by-id',
        'admin-available-fanpages',
        'staff-my-fanpages',
        'admin-fanpages',
        'my-participating-fanpages',
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      setIsEditing(false)
      setFeedback({ type: 'success', message: 'Đã lưu thông tin fanpage.' })
      onSave?.(payload)
    },
    onError: () =>
      setFeedback({ type: 'error', message: 'Chưa lưu được thay đổi. Vui lòng thử lại.' }),
  })
  const busy = isUploading || updateMutation.isPending
  const editing = isAdmin && isEditing
  const avatar = previewUrl || draft.avatarUrl

  const startEdit = () => {
    setDraft(getEditableProfile(fanpage))
    setAvatarFile(null)
    setFeedback(null)
    setIsEditing(true)
  }
  const cancelEdit = () => {
    setAvatarFile(null)
    setIsEditing(false)
    setFeedback(null)
    onCancel?.()
  }
  const selectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFeedback({ type: 'error', message: 'Vui lòng chọn ảnh PNG, JPG hoặc WEBP.' })
      return
    }
    setFeedback(null)
    setAvatarFile(file)
    event.target.value = ''
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing || busy) return
    setFeedback(null)
    const payload: EditableProfile = {
      ...draft,
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    }
    if (avatarFile) {
      setIsUploading(true)
      try {
        payload.avatarUrl = await mediaService.uploadImage(avatarFile, 'FANPAGE')
        if (!payload.avatarUrl) throw new Error('Missing uploaded URL')
        setDraft(payload)
        setAvatarFile(null)
      } catch {
        setFeedback({ type: 'error', message: 'Chưa tải được ảnh đại diện. Vui lòng thử lại.' })
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }
    updateMutation.mutate(payload)
  }
  const actions = isAdmin ? (
    editing ? (
      <>
        <Button type="button" variant="ghost" onClick={cancelEdit} disabled={busy}>
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={busy}
          className="gap-2 bg-[#1B4B8A] text-white hover:bg-[#153D70] focus-visible:ring-primary/40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {isUploading
            ? 'Đang tải ảnh...'
            : updateMutation.isPending
              ? 'Đang lưu...'
              : 'Lưu thay đổi'}
        </Button>
      </>
    ) : (
      <Button
        type="button"
        variant="ghost"
        onClick={startEdit}
        disabled={isFetching || isError}
        className="gap-2 text-primary hover:bg-primary/5 hover:text-primary dark:text-blue-300 dark:hover:bg-primary/10"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Chỉnh sửa thông tin
      </Button>
    )
  ) : undefined

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-5 text-left">
      <h1 className="font-k2d text-2xl font-bold text-foreground">Thông tin fanpage</h1>
      {isFetching && isPlaceholderData && (
        <p role="status" className="text-sm text-muted-foreground">
          Đang tải thông tin fanpage...
        </p>
      )}
      {isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span>Chưa tải được đầy đủ thông tin fanpage.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </div>
      )}
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'border-destructive/20 bg-destructive/10 text-destructive'}`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Đóng thông báo"
            onClick={() => setFeedback(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <FanpageProfileDetails
        fanpage={editing ? { ...fanpage, ...draft, avatarUrl: avatar } : fanpage}
        actions={actions}
        avatarControl={
          editing ? (
            <>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label="Chọn logo fanpage"
                className="hidden"
                disabled={busy}
                onChange={selectLogo}
              />
              <Button
                type="button"
                size="icon"
                disabled={busy}
                aria-label="Đổi ảnh đại diện"
                title="Đổi ảnh đại diện (PNG, JPG, WEBP)"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 border-2 border-white bg-primary text-primary-foreground hover:bg-primary/90 dark:border-card"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          ) : undefined
        }
        descriptionControl={
          editing ? (
            <Textarea
              id="fp-desc"
              rows={4}
              disabled={busy}
              value={draft.description}
              onChange={(e) => setDraft((old) => ({ ...old, description: e.target.value }))}
              placeholder="Giới thiệu về fanpage..."
              className="resize-y text-sm leading-relaxed"
            />
          ) : undefined
        }
        emailControl={
          editing ? (
            <Input
              id="fp-email"
              type="email"
              disabled={busy}
              value={draft.email}
              onChange={(e) => setDraft((old) => ({ ...old, email: e.target.value }))}
              placeholder="contact@ctu.edu.vn"
              autoComplete="email"
            />
          ) : undefined
        }
        phoneControl={
          editing ? (
            <Input
              id="fp-phone"
              type="tel"
              disabled={busy}
              value={draft.phone}
              onChange={(e) => setDraft((old) => ({ ...old, phone: e.target.value }))}
              placeholder="0912 345 678"
              autoComplete="tel"
            />
          ) : undefined
        }
      />
    </form>
  )
}
