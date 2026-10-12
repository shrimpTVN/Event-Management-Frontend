import React from 'react'
import { Award, Download, CheckCircle, Shield } from 'lucide-react'

export const CertificateCard: React.FC = () => {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Certificate of Completion</h2>
            <p className="text-xs text-muted-foreground">AI & Machine Learning Global Summit</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
          <CheckCircle className="h-3.5 w-3.5" />
          Verified
        </span>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Issued to:</span>
          <span className="font-semibold text-foreground">John Doe</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Issue Date:</span>
          <span className="font-semibold text-foreground">November 17, 2026</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Credential ID:</span>
          <span className="font-mono text-primary font-semibold">EVT-2026-CERT-9821</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>Cryptographically signed</span>
        </div>

        <button
          onClick={() => alert('Certificate downloaded')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>
    </div>
  )
}
