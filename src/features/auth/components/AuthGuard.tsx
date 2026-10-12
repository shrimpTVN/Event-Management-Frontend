import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/auth.types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Access Restricted</h2>
        <p className="mt-2 text-muted-foreground">
          You need {requiredRole} privileges to view this section.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
