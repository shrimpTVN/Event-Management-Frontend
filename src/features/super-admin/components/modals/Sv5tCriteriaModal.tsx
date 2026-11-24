import type { SuperAdminSv5tCriteria } from '../../types/superAdmin.types'
import { CatalogEditor } from './CatalogEditor'
interface Props {
  criteria: SuperAdminSv5tCriteria | null
  parentCriteria: SuperAdminSv5tCriteria | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<SuperAdminSv5tCriteria>) => Promise<void>
}
export function Sv5tCriteriaModal({ criteria, parentCriteria, isOpen, onClose, onSave }: Props) {
  if (!isOpen) return null
  return (
    <CatalogEditor
      kind="sv5t"
      item={criteria}
      parent={parentCriteria}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
