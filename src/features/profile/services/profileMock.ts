import type { StudentProfile } from '../types/profile.types'

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: 'std-b2303827',
  fullName: 'Đoàn Tài Lộc',
  status: 'Đang học',
  studentId: 'B2303827',
  classId: 'DI2396A1',
  cohort: 'K49 (2023 - 2027)',
  dateOfBirth: '20/10/2005',
  gender: 'Nam',
  bio: '',
  phoneNumber: '', // Trống để hiển thị "Chưa cập nhật. Thêm" theo thiết kế Figma
  email: 'locb2303827@student.ctu.edu.vn',
  faculty: 'Trường Công nghệ Thông tin và Truyền thông',
  major: 'Kỹ thuật phần mềm',
  majorCode: '7480103',
  academicProgram: 'Chính quy',
  youthUnionBranch: 'Đoàn trường CNTT & TT',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
}
