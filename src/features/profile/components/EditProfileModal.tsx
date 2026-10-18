import React, { useState, useEffect } from 'react'
import { X, User, Phone, Image as ImageIcon } from 'lucide-react'
import type { StudentProfile } from '../types/profile.types'

interface EditProfileModalProps {
  isOpen: boolean
  profile: StudentProfile
  onClose: () => void
  onSave: (updatedProfile: StudentProfile) => void
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<StudentProfile>(profile)

  useEffect(() => {
    if (isOpen) {
      setFormData(profile)
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-5 custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-[#111827] dark:text-foreground">
            Cập nhật hồ sơ sinh viên
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          {/* Avatar Preview & URL */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 border border-border/60">
            <div className="relative shrink-0">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.fullName}
                  className="h-14 w-14 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-muted-foreground">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Đường dẫn ảnh đại diện (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.avatarUrl || ''}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 pl-8 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] dark:text-muted-foreground mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-muted-foreground mb-1">
                Số điện thoại cá nhân
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 pl-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Giới tính */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-muted-foreground mb-1">
                Giới tính
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' | 'Khác' })
                }
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Read-only synchronized fields banner */}
          <div className="rounded-lg bg-[#EFF5FC] dark:bg-[#162E4F]/60 border border-[#DBEAFE] dark:border-[#1E40AF]/40 p-3.5 text-xs text-[#1E40AF] dark:text-[#93C5FD] flex flex-col gap-1">
            <span className="font-semibold">Thông tin học vụ đồng bộ từ hệ thống:</span>
            <span>MSSV: <strong>{profile.studentId}</strong> — Lớp: <strong>{profile.classId}</strong> — {profile.major}</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#1B365D] hover:bg-[#1B4B8A] dark:bg-primary dark:hover:bg-primary/90 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

