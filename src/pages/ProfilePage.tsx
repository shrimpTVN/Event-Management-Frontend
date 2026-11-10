import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Check, X } from 'lucide-react'
import { StudentLeftSidebar } from '@/features/events'
import { useAuthStore } from '@/features/auth/store/authStore'
import {
  ProfileHeaderCard,
  PersonalInfoCard,
  ContactInfoCard,
  AcademicYouthUnionCard,
  profileService,
  type StudentProfile,
} from '@/features/profile'

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<StudentProfile | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getMyProfile(),
  })

  const handleStartEdit = () => {
    if (profile) {
      setFormData({ ...profile })
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setFormData(null)
    setIsEditing(false)
  }

  const handleFieldChange = (fields: Partial<StudentProfile>) => {
    setFormData((prev) => (prev ? { ...prev, ...fields } : null))
  }

  const handleSaveProfile = async () => {
    if (!formData) return
    setIsSaving(true)
    try {
      const saved = await profileService.updateMyProfile(formData)
      queryClient.setQueryData(['profile', 'me'], saved)
      useAuthStore.getState().updateUser({
        avatarUrl: saved.avatarUrl,
        name: saved.fullName,
      })
      setSuccessToast('Đã lưu thông tin hồ sơ sinh viên thành công!')
      setTimeout(() => setSuccessToast(null), 3000)
      setIsEditing(false)
      setFormData(null)
    } catch {
      setSuccessToast('Đã có lỗi khi lưu, vui lòng thử lại!')
      setTimeout(() => setSuccessToast(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {successToast}
        </div>
      )}

      {/* Main Container Layout: Left sidebar (240px) + Main Content (gap 24px) */}
      <div className="w-full flex-1 min-h-0 flex items-start justify-between px-4 sm:px-6 gap-6 overflow-hidden">
        {/* Left Column: Fixed Navigation Sidebar (Figma width: 240px) */}
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto pt-4 pb-28 sm:pb-36 px-0 sidebar-scrollbar">
          <StudentLeftSidebar />
        </aside>

        {/* Right Main Content: Vertical stack of full-width cards with 12px gap */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto pt-4 pb-12 px-1 sm:pl-8 custom-scrollbar flex flex-col items-center">
          <div className="w-full max-w-[1112px] flex flex-col gap-3">
            {isLoading ? (
              <div className="w-full rounded-2xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải hồ sơ sinh viên...</p>
              </div>
            ) : profile ? (
              <>
                {/* 1. Header Overview Card */}
                <ProfileHeaderCard
                  profile={profile}
                  isEditing={isEditing}
                  formData={formData}
                  onChange={handleFieldChange}
                  onEdit={handleStartEdit}
                  onSave={handleSaveProfile}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                />

                {/* 2. Personal Info Card */}
                <PersonalInfoCard
                  profile={profile}
                  isEditing={isEditing}
                  formData={formData}
                  onChange={handleFieldChange}
                />

                {/* 3. Contact Info Card */}
                <ContactInfoCard
                  profile={profile}
                  isEditing={isEditing}
                  formData={formData}
                  onChange={handleFieldChange}
                  onAddPhone={handleStartEdit}
                />

                {/* 4. Academic & Youth Union Info Card */}
                <AcademicYouthUnionCard
                  profile={profile}
                  isEditing={isEditing}
                  formData={formData}
                  onChange={handleFieldChange}
                />

                {/* Bottom Action Bar in Edit Mode */}
                {isEditing && (
                  <div className="w-full flex items-center justify-end gap-3 p-4 bg-card border border-border rounded-xl shadow-xs mt-1 animate-in fade-in">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                      <span>Hủy bỏ</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full rounded-2xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center gap-2">
                <h3 className="font-semibold text-foreground text-base">
                  Chưa có thông tin hồ sơ
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Vui lòng cập nhật hồ sơ để tiếp tục tham gia các hoạt động sinh viên.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
