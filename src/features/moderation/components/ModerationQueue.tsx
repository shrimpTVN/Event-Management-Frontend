import React, { useState } from 'react'
import { Check, X, ShieldAlert, UserCheck } from 'lucide-react'
import type { PendingApplicant } from '../types/moderation.types'

const initialApplicants: PendingApplicant[] = [
  {
    id: 'reg-1',
    name: 'Sarah Connor',
    email: 'sarah@skydefense.org',
    eventTitle: 'AI & Machine Learning Global Summit',
    step: 'STAGE_1_REVIEW',
  },
  {
    id: 'reg-2',
    name: 'Marcus Wright',
    email: 'marcus@cybernetics.io',
    eventTitle: 'AI & Machine Learning Global Summit',
    step: 'STAGE_2_FINAL_APPROVAL',
  },
]

export const ModerationQueue: React.FC = () => {
  const [applicants, setApplicants] = useState<PendingApplicant[]>(initialApplicants)

  const handleApprove = (id: string) => {
    setApplicants((prev) =>
      prev
        .map((app) =>
          app.id === id && app.step === 'STAGE_1_REVIEW'
            ? { ...app, step: 'STAGE_2_FINAL_APPROVAL' as const }
            : app
        )
        .filter((app) => !(app.id === id && app.step === 'STAGE_2_FINAL_APPROVAL'))
    )
  }

  const handleReject = (id: string) => {
    setApplicants((prev) => prev.filter((app) => app.id !== id))
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="border-b border-border bg-muted/40 p-4 font-semibold text-sm">
        Pending Moderation Queue ({applicants.length})
      </div>

      {applicants.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No applicants currently awaiting review.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {applicants.map((app) => (
            <div
              key={app.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{app.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      app.step === 'STAGE_1_REVIEW'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {app.step === 'STAGE_1_REVIEW' ? (
                      <>
                        <ShieldAlert className="h-3 w-3" /> Stage 1: Initial Review
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3" /> Stage 2: Final Approval
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{app.email}</p>
                <p className="text-xs font-medium text-foreground">{app.eventTitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(app.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  {app.step === 'STAGE_1_REVIEW' ? 'Pass to Stage 2' : 'Final Approve'}
                </button>
                <button
                  onClick={() => handleReject(app.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
