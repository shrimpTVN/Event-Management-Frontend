import type { SuperAdminPointCategory } from '../types/superAdmin.types'
import { CatalogTreeView } from './CatalogTreeView'
interface Props {
  categories: SuperAdminPointCategory[]
  onOpenCreateModal: (parent?: SuperAdminPointCategory) => void
  onOpenEditModal: (category: SuperAdminPointCategory) => void
  onToggleActive: (id: number) => Promise<void>
  onToggleMaxChild?: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}
export function SuperAdminPointCategoriesView({
  categories,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleActive,
  onToggleMaxChild,
  onDelete,
}: Props) {
  return (
    <CatalogTreeView
      items={categories}
      kind="points"
      onCreate={onOpenCreateModal}
      onEdit={onOpenEditModal}
      onToggle={onToggleActive}
      onToggleMaxChild={onToggleMaxChild}
      onDelete={onDelete}
    />
  )
}
