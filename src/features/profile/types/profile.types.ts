export interface StudentProfile {
  id: string
  fullName: string
  status: 'Đang học' | 'Đã tốt nghiệp' | 'Tạm nghỉ'
  studentId: string // e.g. B2009234 or B2303827
  classId: string // e.g. DI2096A1 or DI2496A1
  cohort: string // e.g. K50 (2024 - 2028)
  dateOfBirth: string // e.g. 23 Tháng 9, 2002
  gender: 'Nam' | 'Nữ' | 'Khác'
  bio: string
  phoneNumber: string
  email: string
  faculty: string // e.g. Trường Công nghệ Thông tin và Truyền thông
  major: string // e.g. Công nghệ thông tin
  majorCode: string // e.g. 7480201
  academicProgram: string // e.g. Đại trà (Chương trình chuẩn)
  youthUnionBranch: string // e.g. Chi hội sinh viên Mỹ Xuyên - Trần Đề
  avatarUrl?: string
}
