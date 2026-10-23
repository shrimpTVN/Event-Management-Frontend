/**
 * Authentication and authorization utility functions for CTU domains
 */
import { RoleEnum, type UserRole, STAFF_ROLES, STUDENT_ROLES } from '../types/auth.types'

/**
 * Normalizes any role string (e.g. 'ROLE_STUDENT', 'STUDENT', 'ROLE_FANPAGE_ADMIN')
 * into the canonical base RoleEnum format ('STUDENT', 'FANPAGE_ADMIN', 'ADMIN').
 */
export const normalizeRole = (role?: UserRole | string | null): RoleEnum | null => {
  if (!role) return null
  const cleaned = role.trim().toUpperCase().replace(/^ROLE_/, '')
  if (cleaned === 'FANPAGE_ADMIN') return RoleEnum.FANPAGE_ADMIN
  if (cleaned === 'ADMIN') return RoleEnum.ADMIN
  if (cleaned === 'STUDENT') return RoleEnum.STUDENT
  return null
}

/**
 * Checks if a given role is a staff/organizer/admin role.
 */
export const isStaffRole = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  const norm = normalizeRole(role)
  return norm === RoleEnum.FANPAGE_ADMIN || norm === RoleEnum.ADMIN || STAFF_ROLES.includes(role as UserRole)
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
 * Determines whether a user object is a staff/organizer/admin based on role, roles array, and email.
 */
export const isStaffUser = (
  user?: { role?: UserRole | string | null; email?: string | null; roles?: string[] | null } | null
): boolean => {
  if (!user) return false
  if (isStaffRole(user.role)) return true
  if (Array.isArray(user.roles) && user.roles.some((r) => isStaffRole(r))) return true
  return isStaffEmail(user.email) && !isStudentRole(user.role)
}

/**
 * Checks if an email address belongs to CTU staff/organizers.
 * CTU staff emails typically end with '@ctu.edu.vn' (excluding student subdomains '@student.ctu.edu.vn'),
 * or contain mock keywords like 'canbo' or 'admin'.
 */
export const isStaffEmail = (email?: string | null): boolean => {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (normalized.startsWith('student') || normalized.endsWith('@student.ctu.edu.vn')) {
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
