import React, { useState } from 'react'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { RegistrationFormData } from '../types/registration.types'

interface RegistrationFormProps {
  eventId: string
  onSubmitSuccess?: () => void
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmitSuccess }) => {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    organization: '',
    dietaryRestrictions: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    onSubmitSuccess?.()
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold">Registration Submitted!</h1>
        <p className="text-muted-foreground text-sm">
          Your registration is undergoing <strong>Stage 1 Initial Review</strong> by the event
          organizer. You will receive an email once approved.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Event Registration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete your information below to apply for admission.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-primary">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <span>
          This event requires a two-step moderation process. Registrations are vetted prior to
          ticket issuance.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Email Address</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="jane@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Organization / Company
          </label>
          <input
            type="text"
            value={formData.organization}
            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Acme Corp"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow"
        >
          Submit for Moderation
        </button>
      </form>
    </div>
  )
}
