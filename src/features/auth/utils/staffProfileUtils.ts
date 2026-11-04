export const CTU_DEPARTMENTS = [
  'Khoa Môi trường và Tài nguyên Thiên nhiên',
  'Trường Công nghệ Thông tin và Truyền thông',
  'Trường Bách Khoa',
  'Trường Kinh tế',
  'Trường Nông nghiệp',
  'Trường Thủy sản',
  'Khoa Khoa học Tự nhiên',
  'Khoa Khoa học Xã hội và Nhân văn',
  'Khoa Sư phạm',
  'Khoa Luật',
  'Viện Nghiên cứu và Phát triển Công nghệ sinh học',
  'Phòng Công tác Sinh viên (CTSV)',
  'Đoàn Thanh niên - Hội Sinh viên Trường',
  'Trung tâm Hỗ trợ Học sinh - Sinh viên',
]

export const CTU_POSITIONS = [
  'Cán bộ Đoàn / Hội',
  'Bí thư / Phó Bí thư Đoàn cơ sở',
  'Chủ tịch / Phó Chủ tịch Hội Sinh viên',
  'Cố vấn học tập',
  'Giảng viên quản trị sự kiện',
  'Chuyên viên phòng ban',
]

/**
 * Mapping các đơn vị / khoa / phòng ban sang tên viết tắt hoặc tên chuẩn (tối đa 20 ký tự)
 * để tương thích với trường org_name VARCHAR(20) trong bảng fanpage_admin_profiles của Backend
 */
export const CTU_DEPARTMENT_ORG_MAP: Record<string, string> = {
  'Trường Công nghệ Thông tin và Truyền thông': 'Trường CNTT & TT',
  'Khoa Môi trường và Tài nguyên Thiên nhiên': 'Khoa MT & TNTN',
  'Trường Bách Khoa': 'Trường Bách Khoa',
  'Trường Kinh tế': 'Trường Kinh tế',
  'Trường Nông nghiệp': 'Trường Nông nghiệp',
  'Trường Thủy sản': 'Trường Thủy sản',
  'Khoa Khoa học Tự nhiên': 'Khoa KHTN',
  'Khoa Khoa học Xã hội và Nhân văn': 'Khoa KHXH & NV',
  'Khoa Sư phạm': 'Khoa Sư phạm',
  'Khoa Luật': 'Khoa Luật',
  'Viện Nghiên cứu và Phát triển Công nghệ sinh học': 'Viện NC&PT CNSH',
  'Phòng Công tác Sinh viên (CTSV)': 'Phòng CTSV',
  'Đoàn Thanh niên - Hội Sinh viên Trường': 'Đoàn - Hội Trường',
  'Trung tâm Hỗ trợ Học sinh - Sinh viên': 'TT Hỗ trợ HSSV',
}

/**
 * Chuẩn hóa tên đơn vị để luôn <= 20 ký tự theo đúng constraint của CSDL Backend
 */
export function normalizeOrgName(rawName?: string): string {
  if (!rawName) return 'Đoàn - Hội Trường'
  const trimmed = rawName.trim()
  if (CTU_DEPARTMENT_ORG_MAP[trimmed]) {
    return CTU_DEPARTMENT_ORG_MAP[trimmed]
  }
  if (trimmed.length <= 20) {
    return trimmed
  }
  return trimmed.substring(0, 20).trim()
}

/**
 * Tự động trích xuất mã cán bộ từ email nếu có (ví dụ: cb02934@ctu.edu.vn => CB02934)
 */
export function extractStaffIdFromEmail(email: string): string {
  if (!email) return ''
  const username = email.split('@')[0].trim()

  // Khớp tiền tố mã cán bộ CB (ví dụ: cb02934 hoặc anhcb02934)
  const cbMatch = username.match(/(cb\d+)/i)
  if (cbMatch) {
    return cbMatch[1].toUpperCase()
  }

  return ''
}
