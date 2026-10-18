import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không đúng định dạng'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Vui lòng nhập email trường')
      .email('Email không đúng định dạng')
      .refine(
        (val) => val.endsWith('@ctu.edu.vn') || val.endsWith('@student.ctu.edu.vn'),
        {
          message: 'Vui lòng sử dụng email đuôi @ctu.edu.vn hoặc @student.ctu.edu.vn',
        }
      ),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z
      .string()
      .min(6, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Mã OTP gồm đúng 6 chữ số')
    .regex(/^\d+$/, 'Mã OTP chỉ bao gồm chữ số'),
})

export type OtpInput = z.infer<typeof otpSchema>

export const studentProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên không được để trống'),
  studentId: z.string().min(3, 'Mã sinh viên không được để trống'),
  gender: z.enum(['MALE', 'FEMALE'], {
    message: 'Vui lòng chọn giới tính',
  }),
  email: z.string().email('Email không hợp lệ'),
  faculty: z.string().min(1, 'Vui lòng chọn hoặc nhập Khoa / Trường thành viên'),
  major: z.string().min(1, 'Vui lòng chọn hoặc nhập Ngành học'),
  className: z.string().min(1, 'Vui lòng nhập Lớp học'),
  academicYear: z.string().min(1, 'Vui lòng chọn Khóa học'),
})

export type StudentProfileInput = z.infer<typeof studentProfileSchema>

export const staffProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên không được để trống'),
  staffId: z.string().min(2, 'Mã cán bộ không được để trống'),
  department: z.string().min(1, 'Vui lòng chọn Đơn vị / Khoa / Phòng ban'),
  position: z.string().min(1, 'Vui lòng chọn Chức vụ'),
  workEmail: z.string().email('Email công việc không hợp lệ'),
  phoneNumber: z
    .string()
    .min(10, 'Số điện thoại gồm ít nhất 10 số')
    .regex(/^[0-9+]+$/, 'Số điện thoại không hợp lệ'),
  termsAccepted: z.literal(true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng dành cho cán bộ',
  }),
})

export type StaffProfileInput = z.infer<typeof staffProfileSchema>
