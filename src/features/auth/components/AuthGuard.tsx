import React from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types/auth.types'
import {
  getAccountHomePath,
  getLoginDestination,
  getNormalizedUserRoles,
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
    const fullPath = location.pathname + location.search + location.hash
    const isRoot = location.pathname === '/' && !location.search && !location.hash
    const targetUrl = isRoot
      ? '/login'
      : `/login?redirect=${encodeURIComponent(fullPath)}`
    return <Navigate to={targetUrl} replace />
  }

  const userRoles = getNormalizedUserRoles(user)

  const renderForbidden = (label?: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-bold text-destructive">Truy cập bị giới hạn</h2>
      <p className="mt-2 text-muted-foreground">
        {label ? `Bạn cần quyền ${label} để truy cập khu vực này.` : 'Bạn không có quyền truy cập khu vực này.'}
      </p>
    </div>
  )

  const safeRedirect = (target: string, forbiddenLabel?: string) => {
    if (target !== location.pathname) {
      return <Navigate to={target} replace />
    }
    const safeHome = isStudentUser(user) ? '/' : '/login'
    if (safeHome !== location.pathname) {
      return <Navigate to={safeHome} replace />
    }
    return renderForbidden(forbiddenLabel)
  }

  if (
    (audience === 'student' && (!isStudentUser(user) || isSuperAdminUser(user))) ||
    (audience === 'staff' && (!isStaffUser(user) || isSuperAdminUser(user)))
  ) {
    return safeRedirect(getAccountHomePath(user))
  }

  // Handle disallowed roles (e.g. staff disallowed on student home page)
  if (disallowedRoles && userRoles.length > 0) {
    const disallowedNormalized = disallowedRoles
      .map((r) => normalizeRole(r))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
    const isDisallowed = userRoles.some((role) => disallowedNormalized.includes(role))
    if (isDisallowed) {
      if (isSuperAdminUser(user)) {
        return safeRedirect('/admin')
      }
      const fallbackPath = isStaffUser(user) ? '/staff/fanpages' : '/'
      return safeRedirect(roleRedirectPath || fallbackPath)
    }
  }

  // Handle allowed roles whitelist across all assigned roles
  if (allowedRoles) {
    const allowedNormalized = allowedRoles
      .map((r) => normalizeRole(r))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
    const isAllowed = userRoles.some((role) => allowedNormalized.includes(role))
    if (!isAllowed) {
      if (isSuperAdminUser(user)) {
        return safeRedirect('/admin')
      }
      const fallbackPath = userRoles.length > 0 ? getAccountHomePath(user) : '/login'
      return safeRedirect(roleRedirectPath || fallbackPath)
    }
  }

  // Handle single requiredRole check across all assigned roles
  if (requiredRole) {
    const requiredNormalized = normalizeRole(requiredRole)
    if (!requiredNormalized || !userRoles.includes(requiredNormalized)) {
      if (isSuperAdminUser(user)) {
        return safeRedirect('/admin', requiredRole)
      }
      if (isStaffUser(user)) {
        return safeRedirect('/staff/fanpages', requiredRole)
      }
      return renderForbidden(requiredRole)
    }
  }

  return <>{children}</>
}

interface GuestRouteProps {
  children: React.ReactNode
  allowWithPendingRegistration?: boolean
}

export const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  allowWithPendingRegistration = false,
}) => {
  const { isAuthenticated, user } = useAuthStore()
  const [searchParams] = useSearchParams()

  if (isAuthenticated && user) {
    if (allowWithPendingRegistration && typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('pending_registration')) {
          return <>{children}</>
        }
      } catch {
        // Ignore storage read errors
      }
    }
    const redirect = searchParams.get('redirect')
    return <Navigate to={getLoginDestination(user, redirect)} replace />
  }

  return <>{children}</>
}

export const RoleHomeRedirect: React.FC = () => {
  const { user } = useAuthStore()
  return <Navigate to={getAccountHomePath(user)} replace />
}
