/**
 * Authentication and authorization utility functions for CTU domains
 */
import {
  RoleEnum,
  type UserRole,
  STAFF_ROLES,
  STUDENT_ROLES,
  ADMIN_ROLES,
} from '../types/auth.types'

/**
 * Normalizes any role string (e.g. 'ROLE_STUDENT', 'STUDENT', 'ROLE_FANPAGE_ADMIN', 'ROLE_ADMIN')
 * into the canonical base RoleEnum format ('STUDENT', 'FANPAGE_ADMIN', 'ADMIN').
 */
export const normalizeRole = (role?: UserRole | string | null): RoleEnum | null => {
  if (!role) return null
  const cleaned = role
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, '')
  if (cleaned === 'FANPAGE_ADMIN') return RoleEnum.FANPAGE_ADMIN
  if (cleaned === 'ADMIN') return RoleEnum.ADMIN
  if (cleaned === 'STUDENT') return RoleEnum.STUDENT
  return null
}

/**
 * Collects and normalizes all roles assigned to a user across both `user.role` and `user.roles`.
 */
export const getNormalizedUserRoles = (
  user?: { role?: UserRole | string | null; roles?: string[] | null } | null
): RoleEnum[] => {
  if (!user) return []
  const result = new Set<RoleEnum>()
  const primary = normalizeRole(user.role)
  if (primary) result.add(primary)
  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      const normalized = normalizeRole(r)
      if (normalized) result.add(normalized)
    })
  }
  return Array.from(result)
}

/**
 * Checks if a given role is the super admin role.
 */
export const isSuperAdminRole = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  const norm = normalizeRole(role)
  return norm === RoleEnum.ADMIN || ADMIN_ROLES.includes(role as UserRole)
}

/**
 * Checks if an email address belongs to Super Admin.
 * Supports dedicated email addresses outside the @ctu.edu.vn domain (e.g. superadmin@gmail.com, admin@gmail.com)
 * as well as legacy/system admin emails (admin@ctu.edu.vn, superadmin@ctu.edu.vn).
 */
export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (normalized.endsWith('@student.ctu.edu.vn')) return false
  return (
    normalized === 'superadmin@gmail.com' ||
    normalized === 'admin@gmail.com' ||
    normalized === 'superadmin@ctu.edu.vn' ||
    normalized === 'admin@ctu.edu.vn' ||
    normalized === 'superadmin' ||
    normalized === 'admin' ||
    normalized.startsWith('superadmin@')
  )
}

/**
 * Determines whether a user object is a Super Admin based on role, roles array, or email.
 */
export const isSuperAdminUser = (
  user?: { role?: UserRole | string | null; email?: string | null; roles?: string[] | null } | null
): boolean => {
  if (!user) return false
  if (isSuperAdminRole(user.role)) return true
  if (Array.isArray(user.roles) && user.roles.some((r) => isSuperAdminRole(r))) return true
  return isSuperAdminEmail(user.email)
}

/**
 * Checks if a given role is a staff/organizer/admin role.
 */
export const isStaffRole = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  const norm = normalizeRole(role)
  return (
    norm === RoleEnum.FANPAGE_ADMIN ||
    norm === RoleEnum.ADMIN ||
    STAFF_ROLES.includes(role as UserRole)
  )
}

/**
 * Checks if a given role is a student role.
 */
export const isStudentRole = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  const norm = normalizeRole(role)
  return norm === RoleEnum.STUDENT || STUDENT_ROLES.includes(role as UserRole)
}

/**
 * Checks whether a user is primarily a student (CTU student email, studentId, or student role).
 */
export const isStudentUser = (
  user?: {
    role?: UserRole | string | null
    email?: string | null
    roles?: string[] | null
    studentId?: string | null
  } | null
): boolean => {
  if (!user) return false
  const email = (user.email || '').trim().toLowerCase()
  if (email.endsWith('@student.ctu.edu.vn')) return true
  if (user.studentId) return true
  return getNormalizedUserRoles(user).includes(RoleEnum.STUDENT)
}

/**
 * Determines whether a user object is pure staff/organizer (excluding students who are collaborators/fanpage admins).
 */
export const isStaffUser = (
  user?: {
    role?: UserRole | string | null
    email?: string | null
    roles?: string[] | null
    studentId?: string | null
  } | null
): boolean => {
  if (!user) return false
  if (isStudentUser(user)) return false
  if (getNormalizedUserRoles(user).some((r) => isStaffRole(r))) return true
  return isStaffEmail(user.email)
}

/** Personal landing page, independent of fanpage membership. */
export const getAccountHomePath = (user: Parameters<typeof isStudentUser>[0]): string => {
  if (!user) return '/login'
  if (isSuperAdminUser(user)) return '/admin'
  if (isStaffUser(user)) return '/staff/fanpages'
  if (isStudentUser(user)) return '/'
  return '/login'
}

export const sanitizeRedirectPath = (
  redirect?: string | null,
  fallback: string = '/'
): string => {
  if (
    !redirect ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    /[\\\s]/.test(redirect)
  ) {
    return fallback
  }
  return redirect
}

export const getLoginDestination = (
  user: Parameters<typeof isStudentUser>[0] & { isProfileComplete?: boolean },
  redirect?: string | null
): string => {
  const home = getAccountHomePath(user)
  if (home !== '/') return home
  if (isStudentUser(user) && !user?.isProfileComplete) return '/onboarding/student'
  const safeRedirect = sanitizeRedirectPath(redirect, '')
  if (!safeRedirect) return home
  const pathname = safeRedirect.split(/[?#]/)[0]
  if (
    [
      '/login',
      '/register',
      '/dang-nhap',
      '/dang-ky',
      '/verify-otp',
      '/admin',
      '/super-admin',
      '/dashboard',
      '/onboarding/staff',
    ].includes(pathname)
  )
    return home
  return safeRedirect
}

/**
 * Checks if an email address belongs to CTU staff/organizers.
 * CTU staff emails typically end with '@ctu.edu.vn' (excluding student subdomains '@student.ctu.edu.vn'),
 * or contain mock keywords like 'canbo' or 'admin'.
 */
export const isStaffEmail = (email?: string | null): boolean => {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (normalized.endsWith('@student.ctu.edu.vn')) {
    return false
  }
  return (
    normalized.endsWith('@ctu.edu.vn') ||
    normalized.includes('canbo') ||
    normalized.includes('admin')
  )
}

/**
 * Checks if an email address belongs to CTU students (@student.ctu.edu.vn).
 */
export const isStudentEmail = (email?: string | null): boolean => {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return normalized.endsWith('@student.ctu.edu.vn')
}
