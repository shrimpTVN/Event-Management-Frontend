import type { SuperAdminSv5tCriteria } from '../types/superAdmin.types'
import { CatalogTreeView } from './CatalogTreeView'
interface Props {
  criterias: SuperAdminSv5tCriteria[]
  onOpenCreateModal: (parent?: SuperAdminSv5tCriteria) => void
  onOpenEditModal: (criteria: SuperAdminSv5tCriteria) => void
  onToggleActive: (id: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}
export function SuperAdminSv5tCriteriasView({
  criterias,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleActive,
  onDelete,
}: Props) {
  return (
    <CatalogTreeView
      items={criterias}
      kind="sv5t"
      onCreate={onOpenCreateModal}
      onEdit={onOpenEditModal}
      onToggle={onToggleActive}
      onDelete={onDelete}
    />
  )
}
