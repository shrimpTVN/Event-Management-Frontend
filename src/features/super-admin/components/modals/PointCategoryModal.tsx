import type { SuperAdminPointCategory } from '../../types/superAdmin.types'
import { CatalogEditor } from './CatalogEditor'
interface Props {
  category: SuperAdminPointCategory | null
  parentCategory: SuperAdminPointCategory | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<SuperAdminPointCategory>) => Promise<void>
}
export function PointCategoryModal({ category, parentCategory, isOpen, onClose, onSave }: Props) {
  if (!isOpen) return null
  return (
    <CatalogEditor
      kind="points"
      item={category}
      parent={parentCategory}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
