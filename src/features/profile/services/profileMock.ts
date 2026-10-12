import type { StudentProfile } from '../types/profile.types'

export const MOCK_STUDENT_PROFILE: StudentProfile = {
  id: 'std-b2009234',
  fullName: 'Nguyễn Văn A',
  status: 'Đang học',
  studentId: 'B2009234',
  classId: 'DI2096A1',
  cohort: 'K50 (2024 - 2028)',
  dateOfBirth: '23 Tháng 9, 2002',
  gender: 'Nam',
  bio: 'Morem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.',
  phoneNumber: '0912345678',
  email: 'nguyenvana@student.ctu.edu.vn',
  faculty: 'Trường Công nghệ Thông tin và Truyền thông',
  major: 'Công nghệ thông tin',
  majorCode: '7480201',
  academicProgram: 'Đại trà (Chương trình chuẩn)',
  youthUnionBranch: 'Chi hội sinh viên Mỹ Xuyên - Trần Đề',
  avatarUrl: '', // blank / placeholder circle as shown in Figma
}
