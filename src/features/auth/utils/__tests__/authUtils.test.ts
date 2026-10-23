import { describe, it, expect } from 'vitest'
import {
  normalizeRole,
  isStaffRole,
  isStudentRole,
  isStaffUser,
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
})
