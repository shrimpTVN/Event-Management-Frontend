import React, { useState, useEffect } from 'react'
import {
  X,
  HeartHandshake,
  Award,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import type {
  VolunteerRecruitmentPost,
  VolunteerRoleSlot,
} from '../types/fanpageAdmin.types'

interface VolunteerRecruitmentModalProps {
  isOpen: boolean
  onClose: () => void
  initialPost?: VolunteerRecruitmentPost | null
  eventName: string
  onSave: (post: VolunteerRecruitmentPost) => void
}

const DEFAULT_BENEFITS = [
  '+10 Điểm rèn luyện Ban tổ chức',
  'Cộng điểm tiêu chí Tình nguyện tốt (SV5T)',
  'Giấy chứng nhận CTV Ban tổ chức cấp Đoàn trường',
  'Hỗ trợ suất ăn nhẹ và teabreak tại sự kiện',
]

const DEFAULT_ROLE_SLOTS: VolunteerRoleSlot[] = [
  {
    role: 'CHECKIN',
    roleName: 'Điểm danh & Đón tiếp',
    targetCount: 4,
    description: 'Hỗ trợ kiểm tra thông tin MSSV tại cửa, hướng dẫn sinh viên vào hội trường',
  },
  {
    role: 'LOGISTICS',
    roleName: 'Hậu cần & Máy chiếu',
    targetCount: 3,
    description: 'Quản lý máy chiếu chiếu mã PIN, micro diễn giả, sắp xếp teabreak',
  },
  {
    role: 'RECEPTION',
    roleName: 'Lễ tân & Khách mời',
    targetCount: 2,
    description: 'Đón tiếp diễn giả từ doanh nghiệp, hỗ trợ trao hoa và kỷ niệm chương',
  },
  {
    role: 'MEDIA',
    roleName: 'Truyền thông & Chụp ảnh',
    targetCount: 1,
    description: 'Chụp hình kỷ niệm toàn cảnh sự kiện và hỗ trợ đăng bài recap',
  },
]

export const VolunteerRecruitmentModal: React.FC<VolunteerRecruitmentModalProps> = ({
  isOpen,
  onClose,
  initialPost,
  eventName,
  onSave,
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetCount, setTargetCount] = useState(10)
  const [deadline, setDeadline] = useState('2026-10-10')
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN')
  const [benefits, setBenefits] = useState<string[]>(DEFAULT_BENEFITS)
  const [newBenefit, setNewBenefit] = useState('')
  const [rolesNeeded, setRolesNeeded] = useState<VolunteerRoleSlot[]>(DEFAULT_ROLE_SLOTS)

  useEffect(() => {
    if (initialPost) {
      setTitle(initialPost.title)
      setDescription(initialPost.description)
      setTargetCount(initialPost.targetCount)
      setDeadline(initialPost.deadline.slice(0, 10))
      setStatus(initialPost.status)
      setBenefits(initialPost.benefits)
      setRolesNeeded(initialPost.rolesNeeded)
    } else {
      setTitle(`Tuyển Tình nguyện viên hỗ trợ ${eventName}`)
      setDescription(
        'Ban tổ chức cần tuyển các bạn Tình nguyện viên nhiệt tình, có tinh thần trách nhiệm hỗ trợ các khâu đón tiếp, check-in vào cửa và hậu cần sự kiện.'
      )
      setTargetCount(10)
      setDeadline('2026-10-10')
      setStatus('OPEN')
      setBenefits(DEFAULT_BENEFITS)
      setRolesNeeded(DEFAULT_ROLE_SLOTS)
    }
  }, [initialPost, eventName, isOpen])

  if (!isOpen) return null

  const handleAddBenefit = () => {
    const trimmed = newBenefit.trim()
    if (trimmed && !benefits.includes(trimmed)) {
      setBenefits([...benefits, trimmed])
      setNewBenefit('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const handleRoleCountChange = (index: number, count: number) => {
    const updated = [...rolesNeeded]
    updated[index].targetCount = Math.max(1, count)
    setRolesNeeded(updated)
    const newTotal = updated.reduce((sum, r) => sum + r.targetCount, 0)
    setTargetCount(newTotal)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const savedPost: VolunteerRecruitmentPost = {
      id: initialPost?.id || `vol-post-${Date.now()}`,
      eventId: initialPost?.eventId || 'current-event',
      title,
      description,
      benefits,
      targetCount,
      deadline: `${deadline} 23:59`,
      status,
      rolesNeeded,
      createdAt: initialPost?.createdAt || new Date().toISOString().slice(0, 10),
    }
    onSave(savedPost)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-k2d font-bold text-lg text-foreground">
                {initialPost ? 'Chỉnh sửa bài tuyển Tình nguyện viên' : 'Đăng tuyển Tình nguyện viên sự kiện'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Bài viết con trực thuộc sự kiện · Sinh viên sẽ đăng ký từ bài viết này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-left text-xs">
          {/* Tiêu đề bài viết con */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <span>Tiêu đề bài tuyển TNV</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tuyển Tình nguyện viên hỗ trợ Workshop AI & ML 2026"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary text-xs"
            />
          </div>

          {/* Mô tả công việc */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <span>Mô tả công việc & Yêu cầu</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt thời gian, vị trí tập trung, yêu cầu tác phong..."
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary text-xs resize-none"
            />
          </div>

          {/* Chỉ tiêu & Hạn nộp & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Tổng chỉ tiêu cần tuyển</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Hạn chót nộp đơn</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Trạng thái đợt tuyển</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'OPEN' | 'CLOSED')}
                className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary text-xs"
              >
                <option value="OPEN">🟢 Đang mở nhận đơn</option>
                <option value="CLOSED">🔴 Đã đóng nhận đơn</option>
              </select>
            </div>
          </div>

          {/* Quyền lợi riêng của Tình nguyện viên */}
          <div className="space-y-2 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Quyền lợi riêng biệt dành cho TNV (Khác với người tham dự thường)</span>
              </label>
              <span className="text-[10px] text-muted-foreground">{benefits.length} quyền lợi</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {benefits.map((b, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-card border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>{b}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(idx)}
                    className="text-muted-foreground hover:text-rose-500 transition-colors ml-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddBenefit()
                  }
                }}
                placeholder="Nhập thêm quyền lợi (VD: Hỗ trợ tiền xăng, Áo đồng phục...)"
                className="flex-1 h-8 px-3 rounded-lg border border-border bg-white dark:bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-3 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Phân bổ chỉ tiêu theo nhóm vai trò */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Các vị trí cần tuyển & Phân bổ chỉ tiêu</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                Tổng cộng: <strong className="text-foreground">{rolesNeeded.reduce((s, r) => s + r.targetCount, 0)}</strong> bạn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rolesNeeded.map((slot, index) => (
                <div
                  key={slot.role}
                  className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">
                      {slot.role === 'CHECKIN'
                        ? '🎟️ Điểm danh & Đón tiếp'
                        : slot.role === 'LOGISTICS'
                        ? '📦 Hậu cần & Máy chiếu'
                        : slot.role === 'RECEPTION'
                        ? '🤝 Lễ tân & Khách mời'
                        : '📸 Truyền thông & Media'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={slot.targetCount}
                        onChange={(e) => handleRoleCountChange(index, Number(e.target.value))}
                        className="w-14 h-7 text-center rounded border border-border bg-white dark:bg-card text-foreground font-bold text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground">bạn</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {slot.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer action buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-xl border border-border bg-white dark:bg-card hover:bg-muted text-xs font-medium text-foreground cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 h-9 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>{initialPost ? 'Lưu thay đổi' : 'Đăng bài tuyển TNV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
