import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-background py-8 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} EventHub. AI-powered Event Management Platform.</p>
        <p className="mt-1 text-xs text-muted-foreground/80">
          Smart check-in with facial verification & instant e-certificates.
        </p>
      </div>
    </footer>
  )
}
