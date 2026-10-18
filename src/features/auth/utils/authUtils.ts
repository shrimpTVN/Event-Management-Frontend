/**
 * Authentication and authorization utility functions for CTU domains
 */

/**
 * Checks if an email address belongs to CTU staff/organizers.
 * CTU staff emails typically end with '@ctu.edu.vn' (excluding student subdomains '@student.ctu.edu.vn'),
 * or contain mock keywords like 'canbo' or 'admin'.
 */
export const isStaffEmail = (email?: string | null): boolean => {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return (
    (normalized.endsWith('@ctu.edu.vn') && !normalized.endsWith('@student.ctu.edu.vn')) ||
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
