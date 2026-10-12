import React from 'react'
import { CertificateCard } from '@/features/certificates'

export const CertificatePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your E-Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Official tamper-proof digital certificates of completion and attendance.
        </p>
      </div>

      <CertificateCard />
    </div>
  )
}
