export const CTU_FACULTIES = [
  'Trường Công nghệ Thông tin và Truyền thông',
  'Trường Bách Khoa',
  'Trường Kinh tế',
  'Trường Nông nghiệp',
  'Trường Thủy sản',
  'Khoa Khoa học Tự nhiên',
  'Khoa Khoa học Xã hội và Nhân văn',
  'Khoa Môi trường và Tài nguyên Thiên nhiên',
  'Khoa Sư phạm',
  'Khoa Luật',
  'Viện Nghiên cứu và Phát triển Công nghệ sinh học',
]

export const CTU_ACADEMIC_YEARS = [
  'Khóa 51 (2025 - 2029)',
  'Khóa 50 (2024 - 2028)',
  'Khóa 49 (2023 - 2027)',
  'Khóa 48 (2022 - 2026)',
  'Khóa 47 (2021 - 2025)',
]

/**
 * Tự động trích xuất mã số sinh viên (MSSV) từ email sinh viên CTU.
 * Ví dụ:
 *  - nghiab2303832@student.ctu.edu.vn => B2303832
 *  - locb2303827@student.ctu.edu.vn => B2303827
 *  - b2303827@student.ctu.edu.vn => B2303827
 */
export function extractStudentIdFromEmail(email: string): string {
  if (!email) return ''
  const username = email.split('@')[0].trim()

  // Pattern chuẩn mã sinh viên CTU: 1 chữ cái (B, C, M,...) + 7 chữ số (ví dụ: b2303832)
  const standardMatch = username.match(/([a-zA-Z]\d{7})/i)
  if (standardMatch) {
    return standardMatch[1].toUpperCase()
  }

  // Khớp định dạng chữ cái theo sau bởi chuỗi số bất kỳ ở cuối username
  const generalMatch = username.match(/([a-zA-Z]\d+.*)$/i)
  if (generalMatch) {
    return generalMatch[1].toUpperCase()
  }

  return ''
}

