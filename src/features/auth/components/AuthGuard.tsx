import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/auth.types'
import {
  getAccountHomePath,
  isStaffRole,
  isStaffUser,
  isStudentUser,
  isSuperAdminUser,
  normalizeRole,
} from '../utils/authUtils'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  disallowedRoles?: UserRole[]
  roleRedirectPath?: string
  audience?: 'student' | 'staff'
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  allowedRoles,
  disallowedRoles,
  roleRedirectPath,
  audience,
}) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    const isRoot = location.pathname === '/'
    const targetUrl = isRoot
      ? '/login'
      : `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Navigate to={targetUrl} replace />
  }

  const userRoleNorm = normalizeRole(user?.role)

  if (
    (audience === 'student' && (!isStudentUser(user) || isSuperAdminUser(user))) ||
    (audience === 'staff' && (!isStaffUser(user) || isSuperAdminUser(user)))
  ) {
    return <Navigate to={getAccountHomePath(user)} replace />
  }

  // Handle disallowed roles (e.g. staff disallowed on student home page)
  if (disallowedRoles && userRoleNorm) {
    const isDisallowed = disallowedRoles.some((r) => normalizeRole(r) === userRoleNorm)
    if (isDisallowed) {
      if (isSuperAdminUser(user)) {
        return <Navigate to="/admin" replace />
      }
      const fallbackPath = isStaffRole(user?.role) ? '/staff/fanpages' : '/'
      return <Navigate to={roleRedirectPath || fallbackPath} replace />
    }
  }

  // Handle allowed roles whitelist
  if (allowedRoles) {
    const isAllowed = allowedRoles.some((r) => normalizeRole(r) === userRoleNorm)
    if (!isAllowed) {
      if (isSuperAdminUser(user)) {
        return <Navigate to="/admin" replace />
      }
      const fallbackPath = userRoleNorm ? getAccountHomePath(user) : '/login'
      return <Navigate to={roleRedirectPath || fallbackPath} replace />
    }
  }

  // Handle single requiredRole check
  if (requiredRole && normalizeRole(requiredRole) !== userRoleNorm) {
    if (isSuperAdminUser(user)) {
      return <Navigate to="/admin" replace />
    }
    if (isStaffRole(user?.role)) {
      return <Navigate to="/staff/fanpages" replace />
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Truy cập bị giới hạn</h2>
        <p className="mt-2 text-muted-foreground">
          Bạn cần quyền {requiredRole} để truy cập khu vực này.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
