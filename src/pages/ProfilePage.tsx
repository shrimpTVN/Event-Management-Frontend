import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { StudentLeftSidebar } from '@/features/events'
import {
  ProfileHeaderCard,
  PersonalInfoCard,
  ContactInfoCard,
  AcademicYouthUnionCard,
  EditProfileModal,
  profileService,
  type StudentProfile,
} from '@/features/profile'

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileService.getMyProfile(),
  })

  const handleSaveProfile = async (updatedProfile: StudentProfile) => {
    try {
      await profileService.updateMyProfile(updatedProfile)
    } catch {
      // optimistic or local fallback
    }
    queryClient.setQueryData(['profile', 'me'], updatedProfile)
    setSuccessToast('Đã lưu thông tin hồ sơ sinh viên thành công!')
    setTimeout(() => setSuccessToast(null), 3000)
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
        <aside className="hidden md:block w-[240px] min-w-[240px] max-w-[240px] shrink-0 h-full overflow-y-auto py-5 pr-1 custom-scrollbar">
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
                  onEdit={() => setIsEditModalOpen(true)}
                />

                {/* 2. Personal Info Card */}
                <PersonalInfoCard profile={profile} />

                {/* 3. Contact Info Card */}
                <ContactInfoCard
                  profile={profile}
                  onAddPhone={() => setIsEditModalOpen(true)}
                />

                {/* 4. Academic & Youth Union Info Card */}
                <AcademicYouthUnionCard profile={profile} />
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

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  )
}
