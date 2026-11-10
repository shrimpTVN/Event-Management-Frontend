import React, { useState, useEffect } from 'react'
import { X, Award } from 'lucide-react'
import type { SuperAdminPointCategory } from '../../types/superAdmin.types'

interface PointCategoryModalProps {
  category: SuperAdminPointCategory | null
  parentCategory: SuperAdminPointCategory | null
  isOpen: boolean
  onClose: () => void
  onSave: (categoryData: Partial<SuperAdminPointCategory>) => void
}

export const PointCategoryModal: React.FC<PointCategoryModalProps> = ({
  category,
  parentCategory,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [maximum, setMaximum] = useState(5)
  const [childrenOrder, setChildrenOrder] = useState(1)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setNote(category.note || '')
      setMaximum(category.maximum)
      setChildrenOrder(category.childrenOrder)
    } else {
      setName('')
      setNote('')
      setMaximum(5)
      setChildrenOrder(1)
    }
  }, [category, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: category ? category.id : undefined,
      name,
      note,
      maximum: Number(maximum),
      childrenOrder: Number(childrenOrder),
      level: category ? category.level : parentCategory ? parentCategory.level + 1 : 0,
      parentCategoryId: category ? category.parentCategoryId : parentCategory ? parentCategory.id : null,
      isActive: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-k2d font-bold text-foreground">
              {category ? 'Chỉnh Sửa Tiêu Chí ĐRL' : 'Thêm Tiêu Chí ĐRL Mới'}
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
          {parentCategory && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
              Thuộc danh mục cha: <strong>{parentCategory.name}</strong> (Tối đa {parentCategory.maximum}đ)
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Tên mục / Tiêu chí đánh giá</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Đi học đầy đủ, đúng giờ, nghiêm túc..."
              className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Điểm tối đa (Điểm cộng)</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={maximum}
                onChange={(e) => setMaximum(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border text-sm bg-[#F9FAFB] dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-hidden transition-all font-sans"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Thứ tự hiển thị</label>
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
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Ghi chú / Hướng dẫn minh chứng</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Mã tiêu chí I.a.1, mỗi vi phạm trừ 03 điểm..."
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
              Lưu Tiêu Chí
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
