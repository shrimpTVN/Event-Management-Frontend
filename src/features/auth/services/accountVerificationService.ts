import { apiClient } from '@/shared'

/**
 * Danh sách các tài khoản hệ thống mặc định (seed trong CSDL và mock data)
 */
export const DEFAULT_SYSTEM_EMAILS: readonly string[] = [
  'organizer@ctu.edu.vn',
  'admin@ctu.edu.vn',
  'loc@student.ctu.edu.vn',
  'anhlhb2100123@student.ctu.edu.vn',
  'bichtnb2100456@student.ctu.edu.vn',
  'minhnvb2200789@student.ctu.edu.vn',
  'thaoptb2200321@student.ctu.edu.vn',
  'huyvqb2300654@student.ctu.edu.vn',
  'khoaddb2109876@student.ctu.edu.vn',
  'canbo.fp4@ctu.edu.vn',
  'canbo.fp5@ctu.edu.vn',
  'canbo.fp6@ctu.edu.vn',
  'canbo.fp7@ctu.edu.vn',
  'canbo.fp8@ctu.edu.vn',
  'truongcntt@ctu.edu.vn',
  'software.club@ctu.edu.vn',
  'sports.club@ctu.edu.vn',
  'nongnghiep@ctu.edu.vn',
  'english.club@ctu.edu.vn',
  'social-admin@ctu.edu.vn',
  'student@ctu.edu.vn',
  'student1@example.com',
  'student2@example.com',
  'admin1@example.com',
]

const STORAGE_KEY = 'ctu_registered_emails'

/**
 * Lưu email vào danh sách đã đăng ký khi người dùng tạo tài khoản mới thành công
 */
export const addRegisteredEmail = (email: string): void => {
  if (!email || typeof window === 'undefined') return
  try {
    const normalized = email.trim().toLowerCase()
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    if (!list.includes(normalized)) {
      list.push(normalized)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    }
  } catch {
    // Ignore storage errors
  }
}

let cachedDynamicEmails: string[] | null = null
let fetchPromise: Promise<string[]> | null = null

/**
 * Lấy danh sách email thành viên fanpage qua public API để làm phong phú nguồn kiểm tra
 */
export const fetchFanpageMembersEmails = async (): Promise<string[]> => {
  if (cachedDynamicEmails) return cachedDynamicEmails
  if (fetchPromise) return fetchPromise

  fetchPromise = (async () => {
    try {
      const fanpagesRes: any = await apiClient.get('/fanpages?page=0&size=20')
      const fanpages = fanpagesRes?.content || fanpagesRes?.data?.content || []
      const emails = new Set<string>()

      if (Array.isArray(fanpages)) {
        await Promise.allSettled(
          fanpages.map(async (fp: any) => {
            if (!fp?.id) return
            try {
              const membersRes: any = await apiClient.get(`/fanpages/${fp.id}/members`)
              const members = membersRes?.data || membersRes || []
              if (Array.isArray(members)) {
                members.forEach((m: any) => {
                  if (m?.email) emails.add(m.email.toLowerCase().trim())
                })
              }
            } catch {
              // Ignore individual member fetch failures
            }
          })
        )
      }

      cachedDynamicEmails = Array.from(emails)
      return cachedDynamicEmails
    } catch {
      return []
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}

/**
 * Kiểm tra xem một email có tồn tại trong hệ thống hay không
 */
export const checkEmailRegistered = async (email: string): Promise<boolean> => {
  if (!email) return false
  const normalized = email.trim().toLowerCase()

  // 1. Kiểm tra danh sách tài khoản seed mặc định
  if (DEFAULT_SYSTEM_EMAILS.some((e) => e.toLowerCase() === normalized)) {
    return true
  }

  // 2. Kiểm tra danh sách đã đăng ký lưu trong LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const list: string[] = JSON.parse(raw)
        if (list.some((e) => e.toLowerCase() === normalized)) {
          return true
        }
      }
    } catch {
      // Ignore JSON parse error
    }
  }

  // 3. Kiểm tra danh sách thành viên fanpage từ backend
  try {
    const dynamicEmails = await fetchFanpageMembersEmails()
    if (dynamicEmails.some((e) => e.toLowerCase() === normalized)) {
      return true
    }
  } catch {
    // Ignore dynamic fetch errors
  }

  return false
}

