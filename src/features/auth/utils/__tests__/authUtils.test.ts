import { describe, it, expect } from 'vitest'
import {
  normalizeRole,
  isStaffRole,
  isStudentRole,
  isStaffUser,
  isSuperAdminRole,
  isSuperAdminEmail,
  isSuperAdminUser,
} from '../authUtils'
import { RoleEnum } from '../../types/auth.types'

describe('authUtils with Spring Security ROLE_ prefix', () => {
  describe('normalizeRole', () => {
    it('normalizes roles with ROLE_ prefix', () => {
      expect(normalizeRole('ROLE_STUDENT')).toBe(RoleEnum.STUDENT)
      expect(normalizeRole('ROLE_FANPAGE_ADMIN')).toBe(RoleEnum.FANPAGE_ADMIN)
      expect(normalizeRole('ROLE_ADMIN')).toBe(RoleEnum.ADMIN)
    })

    it('normalizes roles without prefix', () => {
      expect(normalizeRole('STUDENT')).toBe(RoleEnum.STUDENT)
      expect(normalizeRole('FANPAGE_ADMIN')).toBe(RoleEnum.FANPAGE_ADMIN)
      expect(normalizeRole('ADMIN')).toBe(RoleEnum.ADMIN)
    })

    it('handles lowercase or mixed casing gracefully', () => {
      expect(normalizeRole('role_student')).toBe(RoleEnum.STUDENT)
      expect(normalizeRole('student')).toBe(RoleEnum.STUDENT)
    })

    it('returns null for invalid or null role', () => {
      expect(normalizeRole(null)).toBeNull()
      expect(normalizeRole(undefined)).toBeNull()
      expect(normalizeRole('INVALID_ROLE')).toBeNull()
    })
  })

  describe('isStaffRole and isStudentRole', () => {
    it('identifies staff roles correctly with and without prefix', () => {
      expect(isStaffRole('ROLE_FANPAGE_ADMIN')).toBe(true)
      expect(isStaffRole('FANPAGE_ADMIN')).toBe(true)
      expect(isStaffRole('ROLE_ADMIN')).toBe(true)
      expect(isStaffRole('ADMIN')).toBe(true)
      expect(isStaffRole('ROLE_STUDENT')).toBe(false)
      expect(isStaffRole('STUDENT')).toBe(false)
    })

    it('identifies student roles correctly with and without prefix', () => {
      expect(isStudentRole('ROLE_STUDENT')).toBe(true)
      expect(isStudentRole('STUDENT')).toBe(true)
      expect(isStudentRole('ROLE_FANPAGE_ADMIN')).toBe(false)
      expect(isStudentRole('ADMIN')).toBe(false)
    })
  })

  describe('isStaffUser', () => {
    it('recognizes staff user when role has ROLE_ prefix', () => {
      expect(
        isStaffUser({
          email: 'organizer@ctu.edu.vn',
          role: 'ROLE_FANPAGE_ADMIN' as any,
        })
      ).toBe(true)
    })

    it('recognizes staff user when roles array contains ROLE_FANPAGE_ADMIN', () => {
      expect(
        isStaffUser({
          email: 'organizer@ctu.edu.vn',
          role: 'ROLE_FANPAGE_ADMIN' as any,
          roles: ['ROLE_FANPAGE_ADMIN'],
        })
      ).toBe(true)
    })

    it('rejects student user even with ctu email if role is ROLE_STUDENT', () => {
      expect(
        isStaffUser({
          email: 'tva1@student.ctu.edu.vn',
          role: 'ROLE_STUDENT' as any,
          roles: ['ROLE_STUDENT'],
        })
      ).toBe(false)
    })
  })

  describe('isSuperAdmin utilities', () => {
    it('identifies super admin role correctly', () => {
      expect(isSuperAdminRole('ROLE_ADMIN')).toBe(true)
      expect(isSuperAdminRole('ADMIN')).toBe(true)
      expect(isSuperAdminRole('ROLE_FANPAGE_ADMIN')).toBe(false)
      expect(isSuperAdminRole('ROLE_STUDENT')).toBe(false)
    })

    it('identifies dedicated super admin emails without @ctu.edu.vn', () => {
      expect(isSuperAdminEmail('superadmin@gmail.com')).toBe(true)
      expect(isSuperAdminEmail('admin@gmail.com')).toBe(true)
      expect(isSuperAdminEmail('superadmin@ctu.edu.vn')).toBe(true)
      expect(isSuperAdminEmail('admin@ctu.edu.vn')).toBe(true)
      expect(isSuperAdminEmail('student@ctu.edu.vn')).toBe(false)
      expect(isSuperAdminEmail('user@gmail.com')).toBe(false)
    })

    it('identifies super admin user by role or email', () => {
      expect(
        isSuperAdminUser({
          email: 'superadmin@gmail.com',
          role: 'ROLE_STUDENT' as any,
        })
      ).toBe(true)

      expect(
        isSuperAdminUser({
          email: 'random@otherdomain.com',
          role: 'ROLE_ADMIN' as any,
        })
      ).toBe(true)

      expect(
        isSuperAdminUser({
          email: 'random@otherdomain.com',
          roles: ['ROLE_ADMIN'],
        })
      ).toBe(true)

      expect(
        isSuperAdminUser({
          email: 'student@ctu.edu.vn',
          role: 'ROLE_STUDENT' as any,
        })
      ).toBe(false)
    })
  })
})
