import React, { useState, useEffect } from 'react'
import { X, School, GraduationCap } from 'lucide-react'
import type { SuperAdminSchool, SuperAdminMajor } from '../../types/superAdmin.types'

interface SchoolMajorModalProps {
  mode: 'school' | 'major'
  school: SuperAdminSchool | null
  major: SuperAdminMajor | null
  currentSchoolId?: number
  isOpen: boolean
  onClose: () => void
  onSaveSchool: (data: Partial<SuperAdminSchool>) => void
  onSaveMajor: (data: Partial<SuperAdminMajor>) => void
}

export const SchoolMajorModal: React.FC<SchoolMajorModalProps> = ({
  mode,
  school,
  major,
  currentSchoolId,
  isOpen,
  onClose,
  onSaveSchool,
  onSaveMajor,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')

  useEffect(() => {
    if (mode === 'school') {
      if (school) {
        setName(school.name)
        setDescription(school.description || '')
      } else {
        setName('')
        setDescription('')
      }
    } else {
      if (major) {
        setName(major.name)
        setCode(major.code)
      } else {
        setName('')
        setCode('')
      }
    }
  }, [mode, school, major, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'school') {
      onSaveSchool({
        id: school ? school.id : undefined,
        name,
        description,
        isActive: true,
      })
    } else {
      onSaveMajor({
        id: major ? major.id : undefined,
        name,
        code,
        schoolId: currentSchoolId || 1,
        isActive: true,
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            {mode === 'school' ? (
              <School className="w-5 h-5 text-primary" />
            ) : (
              <GraduationCap className="w-5 h-5 text-primary" />
            )}
            <h3 className="text-lg font-k2d font-bold text-foreground">
              {mode === 'school'
                ? school
                  ? 'Chỉnh Sửa Khoa/Trường'
                  : 'Thêm Mới Khoa/Trường'
                : major
                ? 'Chỉnh Sửa Chuyên Ngành'
                : 'Thêm Chuyên Ngành Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'major' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Mã ngành đào tạo</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: 7480103"
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {mode === 'school' ? 'Tên Khoa / Trường / Viện' : 'Tên Chuyên Ngành'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'school' ? 'VD: Trường CNTT & TT' : 'VD: Kỹ thuật phần mềm'}
              className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
            />
          </div>

          {mode === 'school' && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Mô tả / Thông tin tóm tắt</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu đơn vị đào tạo..."
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-card border border-border text-foreground hover:bg-[#F3F4F6] dark:hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-xs transition-colors cursor-pointer"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
