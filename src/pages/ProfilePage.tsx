import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Edit3, Info } from 'lucide-react'
import { StudentLeftSidebar } from '@/features/events'
import {
  ProfileHeaderCard,
  PersonalInfoCard,
  ContactInfoCard,
  AcademicYouthUnionCard,
  EditProfileModal,
  MOCK_STUDENT_PROFILE,
  type StudentProfile,
} from '@/features/profile'

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile>(MOCK_STUDENT_PROFILE)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const handleSaveProfile = (updatedProfile: StudentProfile) => {
    setProfile(updatedProfile)
    setSuccessToast('Đã lưu thông tin hồ sơ sinh viên thành công!')
    setTimeout(() => setSuccessToast(null), 3000)
  }

  return (
    <div className="w-full">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {successToast}
        </div>
      )}

      {/* Main 2-Column Container: Sidebar Left + Profile Content */}
      <div className="flex items-start justify-center gap-6 lg:gap-8">
        {/* Left Sidebar (Desktop / Tablet) */}
        <div className="hidden md:block w-56 lg:w-64 shrink-0 sticky top-20 self-start">
          <StudentLeftSidebar />
        </div>

        {/* Right Main Content */}
        <main className="flex-1 min-w-0 max-w-5xl flex flex-col gap-6">
          {/* Breadcrumb & Action Header */}
          <div className="flex items-center justify-between gap-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                Trang chủ
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">Hồ sơ sinh viên</span>
            </nav>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold shadow hover:opacity-90 transition-opacity"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Cập nhật</span>
            </button>
          </div>

          {/* Profile Overview Header Card */}
          <ProfileHeaderCard profile={profile} />

          {/* Details 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Sub-Column: Personal Info + Contact Info */}
            <div className="flex flex-col gap-6">
              <PersonalInfoCard profile={profile} />
              <ContactInfoCard profile={profile} />
            </div>

            {/* Right Sub-Column: Academic & Youth Union Info */}
            <div className="flex flex-col gap-6">
              <AcademicYouthUnionCard profile={profile} />
            </div>
          </div>

          {/* Admin Verification Notice Box */}
          <div className="rounded-xl border border-border/70 bg-muted/50 p-4 text-xs text-muted-foreground flex items-center gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p>
              Mọi thay đổi hành chính sau khi xác nhận thông tin sẽ cần được duyệt bởi Văn phòng
              Đoàn khoa của bạn.
            </p>
          </div>
        </main>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        profile={profile}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  )
}
