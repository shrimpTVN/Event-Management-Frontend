import React, { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'
import type { SuperAdminSv5tCriteria, Sv5tScope } from '../../types/superAdmin.types'

interface Sv5tCriteriaModalProps {
  criteria: SuperAdminSv5tCriteria | null
  parentCriteria: SuperAdminSv5tCriteria | null
  isOpen: boolean
  onClose: () => void
  onSave: (criteriaData: Partial<SuperAdminSv5tCriteria>) => void
}

export const Sv5tCriteriaModal: React.FC<Sv5tCriteriaModalProps> = ({
  criteria,
  parentCriteria,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [scope, setScope] = useState<Sv5tScope>('UNIVERSITY')
  const [childrenOrder, setChildrenOrder] = useState(1)

  useEffect(() => {
    if (criteria) {
      setName(criteria.name)
      setNote(criteria.note || '')
      setScope(criteria.scope)
      setChildrenOrder(criteria.childrenOrder)
    } else {
      setName('')
      setNote('')
      setScope(parentCriteria ? parentCriteria.scope : 'UNIVERSITY')
      setChildrenOrder(1)
    }
  }, [criteria, parentCriteria, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: criteria ? criteria.id : undefined,
      name,
      note,
      scope,
      childrenOrder: Number(childrenOrder),
      level: criteria ? criteria.level : parentCriteria ? parentCriteria.level + 1 : 0,
      parentId: criteria ? criteria.parentId : parentCriteria ? parentCriteria.id : null,
      isActive: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-k2d font-bold text-foreground">
              {criteria ? 'Chỉnh Sửa Tiêu Chí SV5T' : 'Thêm Tiêu Chí SV5T Mới'}
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
          {parentCriteria && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800">
              Thuộc tiêu chuẩn cha: <strong>{parentCriteria.name}</strong>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Tên Tiêu Chuẩn / Tiêu Chí Xét Chọn</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Điểm trung bình cộng năm học đạt từ 3.0 trở lên..."
              className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Cấp độ xét duyệt (Scope)</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as Sv5tScope)}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans cursor-pointer"
              >
                <option value="UNIVERSITY">Cấp Trường (UNIVERSITY)</option>
                <option value="FACULTY">Cấp Khoa/Đoàn (FACULTY)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Thứ tự ưu tiên</label>
              <input
                type="number"
                min={1}
                required
                value={childrenOrder}
                onChange={(e) => setChildrenOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Điều kiện đạt & Hướng dẫn minh chứng</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Điểm TBC học kỳ 3 năm trước, HK1 và HK2 năm học xét đạt từ 3.0 trở lên..."
              className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
            />
          </div>

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
              Lưu Tiêu Chí SV5T
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
