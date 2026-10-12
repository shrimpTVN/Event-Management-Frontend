import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { RegistrationForm } from '@/features/registration'

export const RegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        to={`/events/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event Details
      </Link>

      <RegistrationForm eventId={id || 'evt-1'} />
    </div>
  )
}
