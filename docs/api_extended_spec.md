# Tài liệu Đặc tả API Mở rộng & Bổ sung (Extended Backend API Specification)

> **Mục đích tài liệu:**  
> Tài liệu này chuẩn hóa và đặc tả chi tiết toàn bộ các REST API đã được thiết kế, triển khai trong Mock Server (`mock/server.cjs`) và đang được các module Frontend (`src/features/`) sử dụng, nhưng **chưa có** hoặc **khác biệt** so với tài liệu gốc [docs/materials/api_documentation.md](file:///e:/CTU/KTPM%20K49/NienLuanNganh/Event-Management-Frontend/docs/materials/api_documentation.md).  
> Tài liệu này đóng vai trò là bản Hợp đồng Dữ liệu (API Contract) chính thức để đội ngũ phát triển Backend Spring Boot triển khai tương thích 100% với giao diện Frontend.

---

## 1. Chuẩn giao thức & Cấu trúc Dữ liệu chung

### 1.1 Base URL & Tiêu chuẩn Envelope
- **Local Dev URL (Mock)**: `http://localhost:8088/api` hoặc `/api/v1`
- **Backend Spring Boot**: `http://localhost:8080/api/v1` (hoặc mount root `/`)
- **Đóng gói phản hồi chuẩn (`BaseResponse<T>`)**:
Mọi endpoint trả về dữ liệu đều được đóng gói theo định dạng chuẩn:

```typescript
export interface BaseResponse<T> {
  data: T | null;
  message: string;
  exceptionCode: string | null;
}
```

- **Quy ước Phân trang (`PageResponse<T>`)**:
```typescript
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { sorted: boolean; empty: boolean; unsorted: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}
```

### 1.2 Xác thực & Phân quyền
- **Cơ chế xác thực chính**: HttpOnly Cookie (`ddd_jwt` và `ddd_refresh`).
- **Cơ chế dự phòng**: Header `Authorization: Bearer <accessToken>`.
- **Vai trò người dùng (Roles)**:
  - `ROLE_STUDENT`: Sinh viên
  - `ROLE_FANPAGE_ADMIN`: Cán bộ / Quản trị viên Fanpage
  - `ROLE_ADMIN`: Quản trị viên hệ thống

---

## 2. Nhóm Xác thực & Khởi tạo Hồ sơ (Auth & Onboarding)

### 2.1 Xác thực mã OTP qua Email (`POST /auth/verify-otp`)
* **Mục đích**: Xác thực mã OTP gồm 6 chữ số gửi về email sinh viên/cán bộ khi đăng ký tài khoản.
* **Quyền truy cập**: Public
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "email": "student@ctu.edu.vn",
  "otp": "123456"
}
```
* **Response Body (`BaseResponse<{ success: boolean; user?: UserDto }>`):**
```json
{
  "data": {
    "success": true
  },
  "message": "Xác thực OTP thành công",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Xác thực thành công.
  - `400 BAD REQUEST`: Mã OTP không chính xác, rỗng hoặc đã hết hạn (`AUTH_INVALID_OTP`).

---

### 2.2 Gửi lại mã OTP qua Email (`POST /auth/resend-otp`)
* **Mục đích**: Tạo và gửi lại mã OTP mới đến hộp thư người dùng khi mã cũ hết hạn hoặc bị thất lạc.
* **Quyền truy cập**: Public
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "email": "student@ctu.edu.vn"
}
```
* **Response Body (`BaseResponse<{ success: boolean }>`):**
```json
{
  "data": {
    "success": true
  },
  "message": "Mã OTP đã được gửi lại",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Đã phát mã OTP mới.
  - `429 TOO MANY REQUESTS`: Yêu cầu gửi lại quá nhanh trong vòng 60 giây (`AUTH_OTP_RATE_LIMIT`).

---

### 2.3 Đăng nhập qua Google OAuth (`POST /auth/google`)
* **Mục đích**: Tiếp nhận Google ID Token từ luồng đăng nhập một chạm Google Identity Services, xác minh danh tính và khởi tạo phiên làm việc JWT.
* **Quyền truy cập**: Public
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "role": "STUDENT"
}
```
* **Response Body (`BaseResponse<AuthResponseDto>`):**
*(Đồng thời Set-Cookie `ddd_jwt` và `ddd_refresh`)*
```json
{
  "data": {
    "userId": 1,
    "email": "locb2303827@student.ctu.edu.vn",
    "roles": ["ROLE_STUDENT"],
    "role": "ROLE_STUDENT",
    "user": {
      "id": "1",
      "email": "locb2303827@student.ctu.edu.vn",
      "name": "Đoàn Tài Lộc",
      "firstName": "Lộc",
      "lastName": "Đoàn Tài",
      "studentId": "B2303827",
      "role": "STUDENT",
      "isProfileComplete": true,
      "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=loc",
      "schoolName": "Trường Công nghệ Thông tin và Truyền thông",
      "majorName": "Kỹ thuật phần mềm"
    },
    "tokens": {
      "accessToken": "mock-jwt-token-1"
    }
  },
  "message": "Google auth success",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Đăng nhập Google thành công.
  - `401 UNAUTHORIZED`: Token Google không hợp lệ hoặc đã hết hạn (`AUTH_GOOGLE_TOKEN_INVALID`).

---

### 2.4 Lấy thông tin phiên người dùng hiện tại (`GET /auth/me`)
* **Mục đích**: Kiểm tra phiên làm việc và nạp hồ sơ người dùng đang đăng nhập khi ứng dụng khởi chạy hoặc F5 trang.
* **Quyền truy cập**: Yêu cầu xác thực (`ROLE_STUDENT`, `ROLE_FANPAGE_ADMIN`, `ROLE_ADMIN`).
* **Headers**: Cookie `ddd_jwt` hoặc `Authorization: Bearer <token>`
* **Response Body (`BaseResponse<UserProfileDto>`):**
```json
{
  "data": {
    "id": "1",
    "email": "student@university.edu.vn",
    "role": "STUDENT",
    "isActive": true,
    "firstName": "Lộc",
    "lastName": "Đoàn Tài",
    "name": "Đoàn Tài Lộc",
    "fullName": "Đoàn Tài Lộc",
    "studentId": "B2303827",
    "gender": "MALE",
    "kNumber": "49",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=loc",
    "associationName": "Đoàn Trường Đại học Cần Thơ",
    "majorName": "Kỹ thuật phần mềm",
    "majorCode": "7480103",
    "schoolName": "Trường Công nghệ Thông tin và Truyền thông",
    "isProfileComplete": true,
    "status": "Đang học",
    "cohort": "K49 (2023 - 2027)",
    "phoneNumber": "0912345678",
    "academicProgram": "Đại trà (Chương trình chuẩn)"
  },
  "message": "Success",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Lấy thông tin thành công.
  - `401 UNAUTHORIZED`: Chưa đăng nhập hoặc phiên làm việc hết hạn (`UNAUTHORIZED`).

---

### 2.5 Hoàn thiện hồ sơ sinh viên lần đầu (`POST /auth/student-profile`)
* **Mục đích**: Sinh viên điền thông tin học vụ (Khóa, Khoa, Ngành, Mã số sinh viên) ngay sau khi đăng ký hoặc đăng nhập Google lần đầu.
* **Quyền truy cập**: Authenticated (`ROLE_STUDENT`)
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "studentId": "B2303827",
  "kNumber": 49,
  "schoolId": 1,
  "majorId": 2,
  "associationId": 1,
  "dateOfBirth": "2005-08-16",
  "gender": "MALE",
  "phoneNumber": "0912345678",
  "academicProgram": "Đại trà (Chương trình chuẩn)",
  "bio": "Sinh viên KTPM khóa 49"
}
```
* **Response Body (`BaseResponse<UserProfileDto>`):**
```json
{
  "data": {
    "id": "1",
    "email": "student@ctu.edu.vn",
    "studentId": "B2303827",
    "name": "Đoàn Tài Lộc",
    "isProfileComplete": true
  },
  "message": "Cập nhật hồ sơ sinh viên thành công",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Hồ sơ hoàn tất hợp lệ.
  - `400 BAD REQUEST`: Dữ liệu MSSV hoặc mã ngành không tồn tại (`VALIDATION_ERROR`).

---

### 2.6 Hoàn thiện hồ sơ cán bộ / Fanpage Admin (`POST /auth/staff-profile`)
* **Mục đích**: Cán bộ hoàn thiện hồ sơ đơn vị công tác và chức vụ lần đầu.
* **Quyền truy cập**: Authenticated (`ROLE_FANPAGE_ADMIN`)
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "staffId": "CB-0012",
  "orgName": "Trường Công nghệ Thông tin và Truyền thông",
  "title": "Bí thư Đoàn Khoa",
  "phoneNumber": "0909123456",
  "dob": "1990-05-20"
}
```
* **Response Body (`BaseResponse<UserProfileDto>`):**
```json
{
  "data": {
    "id": "2",
    "email": "staff@ctu.edu.vn",
    "staffId": "CB-0012",
    "role": "FANPAGE_ADMIN",
    "isProfileComplete": true
  },
  "message": "Cập nhật hồ sơ cán bộ thành công",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Hồ sơ hoàn tất.
  - `400 BAD REQUEST`: Thiếu thông tin bắt buộc.

---

## 3. Nhóm Chứng nhận tham gia Sự kiện (Certificates)

### 3.1 Lấy thông tin Giấy chứng nhận (`GET /certificates/{registrationId}`)
* **Mục đích**: Hiển thị thông tin chứng nhận tham gia sự kiện điện tử (E-Certificate) cho sinh viên sau khi đã hoàn thành check-in và check-out.
* **Quyền truy cập**: `ROLE_STUDENT`, `ROLE_FANPAGE_ADMIN`, `ROLE_ADMIN`
* **Path Parameters**:
  - `registrationId` (String/Long, bắt buộc): ID của lượt đăng ký sự kiện (`registration_id`).
* **Response Body (`BaseResponse<CertificateDto>`):**
```json
{
  "data": {
    "id": "cert-reg-1",
    "registrationId": "reg-1",
    "eventId": "1",
    "attendeeName": "Đoàn Tài Lộc",
    "studentId": "B2303827",
    "eventTitle": "Hội thảo chuyên đề: Trí tuệ nhân tạo & Xu hướng mô hình ngôn ngữ lớn (LLM)",
    "issueDate": "2026-08-16",
    "verificationCode": "CTU-CERT-1-883921",
    "downloadUrl": "/api/v1/certificates/cert-reg-1/download"
  },
  "message": "Success",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Lấy thông tin chứng nhận thành công.
  - `404 NOT FOUND`: Không tìm thấy lượt đăng ký hoặc sinh viên chưa đủ điều kiện cấp chứng nhận (`CERTIFICATE_NOT_ELIGIBLE`).

---

### 3.2 Tải file Giấy chứng nhận PDF (`GET /certificates/{id}/download`)
* **Mục đích**: Tải xuống tệp PDF chính thức có chữ ký và mã QR xác thực của chứng nhận sự kiện.
* **Quyền truy cập**: Public hoặc Authenticated
* **Path Parameters**:
  - `id` (String): Mã chứng nhận (`id` hoặc `verificationCode`).
* **Response Headers**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="certificate.pdf"`
* **Response Body**: Binary PDF Stream (`application/pdf`).
* **HTTP Status Codes**:
  - `200 OK`: Xuất file PDF thành công.
  - `404 NOT FOUND`: Mã chứng nhận không hợp lệ.

---

## 4. Nhóm Check-in & Điểm danh đối soát Khuôn mặt (Photo Check-in)

### 4.1 Điểm danh qua ảnh chụp khuôn mặt (`POST /checkin/photo-verify`)
* **Mục đích**: Sinh viên tải ảnh chụp selfie tại sự kiện để hệ thống AI/Computer Vision hoặc cán bộ xác thực check-in/check-out.
* **Quyền truy cập**: `ROLE_STUDENT`
* **Headers**: `Content-Type: multipart/form-data`
* **Form Data Parameters**:
  - `registrationId` (String, bắt buộc): ID lượt đăng ký.
  - `photo` (File Binary, bắt buộc): Tệp ảnh định dạng JPG/PNG/WEBP.
* **Response Body (`BaseResponse<CheckInResultDto>`):**
```json
{
  "data": {
    "registrationId": "reg-2",
    "status": "CHECKED_IN",
    "verifiedAt": "2026-10-28T07:30:00Z",
    "confidenceScore": 0.98,
    "message": "Xác thực khuôn mặt thành công (độ chính xác 98%)."
  },
  "message": "Điểm danh thành công",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Điểm danh thành công.
  - `400 BAD REQUEST`: Ảnh không nhận diện được khuôn mặt, sai vị trí GPS hoặc ngoài khung giờ cho phép (`CHECKIN_VERIFICATION_FAILED`).

---

## 5. Nhóm Cán bộ & Quản trị Fanpage (Staff Fanpage Hub & Dashboard)

### 5.1 Danh sách Lời mời Quản trị Fanpage của Cán bộ (`GET /fanpages/fanpage-admin/invitations`)
* **Mục đích**: Lấy danh sách các lời mời tham gia ban quản trị Fanpage gửi tới tài khoản cán bộ đang đăng nhập.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Response Body (`BaseResponse<FanpageInvitationDto[]>`):**
```json
{
  "data": [
    {
      "id": "inv-1",
      "fanpageId": 4,
      "code": "KHTN",
      "name": "Fanpage Khoa Khoa học Tự nhiên",
      "inviter": "Ban Truyền thông CTU",
      "role": "Quản trị viên sự kiện",
      "status": "PENDING",
      "createdAt": "2026-10-20T08:00:00Z"
    },
    {
      "id": "inv-2",
      "fanpageId": 5,
      "code": "CTSV",
      "name": "Fanpage Trung tâm Hỗ trợ Sinh viên",
      "inviter": "Phòng Công tác Sinh viên",
      "role": "Biên tập viên nội dung",
      "status": "PENDING",
      "createdAt": "2026-10-21T09:30:00Z"
    }
  ],
  "message": "Success",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Lấy danh sách thành công.

---

### 5.2 Xử lý Lời mời Quản trị (`PATCH /fanpages/fanpage-admin/invitations/{id}`)
* **Mục đích**: Cán bộ chấp nhận hoặc từ chối lời mời quản trị Fanpage.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Path Parameters**:
  - `id` (String): ID lời mời (`inv-1`).
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "status": "ACCEPTED"
}
```
*(Giá trị `status`: `ACCEPTED` hoặc `REJECTED`)*
* **Response Body (`BaseResponse<{ success: boolean; id: string; status: string }>`):**
```json
{
  "data": {
    "success": true,
    "id": "inv-1",
    "status": "ACCEPTED"
  },
  "message": "Xử lý lời mời thành công",
  "exceptionCode": null
}
```

---

### 5.3 Thống kê Hoạt động Fanpage Dashboard (`GET /fanpages/{fanpageId}/activity-stats`)
* **Mục đích**: Trả về số liệu thống kê tổng hợp (số sự kiện, lượt tương tác, người theo dõi mới, tỷ lệ phản hồi) trên Dashboard quản trị của Fanpage.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`, `ROLE_ADMIN`
* **Path Parameters**:
  - `fanpageId` (Long/Integer, bắt buộc): ID Fanpage.
* **Response Body (`BaseResponse<FanpageActivityStatsDto>`):**
```json
{
  "data": {
    "periodLabel": "7 ngày gần nhất",
    "eventsCount": 8,
    "interactionsCount": 426,
    "newFollowersCount": 36,
    "responseRatePercent": 92,
    "pendingCommentsCount": 3
  },
  "message": "Success",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Lấy thống kê thành công.
  - `404 NOT FOUND`: Fanpage không tồn tại.

---

### 5.4 Sự kiện Sắp diễn ra cần nhắc nhở của Fanpage (`GET /fanpages/{fanpageId}/upcoming-reminder`)
* **Mục đích**: Lấy sự kiện gần nhất sắp diễn ra do Fanpage tổ chức để hiển thị widget nhắc nhở và chuẩn bị công tác tổ chức.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`, `ROLE_ADMIN`
* **Path Parameters**:
  - `fanpageId` (Long/Integer, bắt buộc): ID Fanpage.
* **Response Body (`BaseResponse<FanpageUpcomingReminderDto>`):**
```json
{
  "data": {
    "id": "5",
    "title": "Ngày hội việc làm CNTT 2026",
    "monthText": "TH10",
    "dayText": "12",
    "registrationsCount": 186,
    "dateText": "12/10/2026"
  },
  "message": "Success",
  "exceptionCode": null
}
```

---


### 5.5 Chốt cập nhật Điểm danh & Hoàn thành sự kiện (`POST /registrations/fanpage-member/fanpages/{fanpageId}/events/{eventId}/finalize`)
* **Mục đích**: Được gọi khi Quản trị viên/Cộng tác viên hoàn tất kiểm tra điểm danh vào và điểm danh ra trong màn hình Chi tiết Sự kiện (`FanpageEventDetailAdminView.tsx`), nhấn nút **"Lưu"**. Endpoint này lưu trữ hàng loạt trạng thái điểm danh của sinh viên (`COMPLETED`, `ABSENTED`), cập nhật mốc thời gian check-in/check-out, tự động chuyển trạng thái sự kiện sang `CLOSED` (Đã kết thúc), kích hoạt cộng điểm rèn luyện tự động vào sổ điểm và sinh Giấy chứng nhận cho sinh viên đủ điều kiện.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Path Parameters**:
  - `fanpageId` (Long/Integer, bắt buộc): ID của Fanpage tổ chức sự kiện.
  - `eventId` (Long/Integer, bắt buộc): ID sự kiện được chốt danh sách điểm danh.
* **Headers**: `Content-Type: application/json`
* **Request Body DTO (`FinalizeAttendanceRequestDto`):**
```json
{
  "attendees": [
    {
      "userId": 1,
      "status": "COMPLETED",
      "entryCheckInTime": "08:15",
      "checkOutTime": "11:30"
    },
    {
      "userId": 3,
      "status": "ABSENTED",
      "entryCheckInTime": null,
      "checkOutTime": null
    }
  ]
}
```
* **Response Body (`BaseResponse<{ eventId: number; status: string }>`):**
```json
{
  "data": {
    "eventId": 1,
    "status": "CLOSED"
  },
  "message": "Cập nhật danh sách điểm danh và hoàn thành sự kiện thành công",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `200 OK`: Cập nhật thành công, sự kiện đã đóng và chuyển sang trạng thái kết thúc.
  - `400 BAD REQUEST`: Dữ liệu người tham gia không hợp lệ hoặc sự kiện đã đóng trước đó.
  - `403 FORBIDDEN`: Người dùng không có quyền quản trị Fanpage này.
  - `404 NOT FOUND`: Không tìm thấy sự kiện hoặc Fanpage tương ứng.

---

### 5.6 Lấy danh sách Thành viên Ban tổ chức Fanpage mở rộng (`GET /fanpages/{fanpageId}/members`)
* **Mục đích**: Lấy danh sách toàn bộ cán bộ, sinh viên trong Ban quản trị và Ban tổ chức của một Fanpage (`FanpageMembersView.tsx`).
* **Lý do bổ sung (Khác biệt so với tài liệu gốc)**: Tài liệu gốc `api_documentation.md` (mục 2.5.10) chỉ có DTO tối giản `{ userId, email, firstName, lastName, avatarUrl, role }`. Giao diện Frontend Quản trị Fanpage thực tế yêu cầu mở rộng các trường thông tin chuẩn hóa để hiển thị đầy đủ hồ sơ thành viên, mã định danh và phân quyền thao tác:
  - `id` (String): Định danh hàng thành viên (ví dụ `"mem-2"`).
  - `userId` (String): ID tài khoản người dùng trong hệ thống.
  - `staffId` (String): Mã số cán bộ hoặc MSSV sinh viên (ví dụ `"CB-0104"`, `"B2100123"`).
  - `fullName` (String): Họ và tên đầy đủ hiển thị trực tiếp (ví dụ `"Nguyễn Minh Anh"`).
  - `avatarText` (String): Ký tự viết tắt đại diện nếu chưa có ảnh (ví dụ `"MA"`).
  - `avatarUrl` (String, nullable): Đường dẫn ảnh đại diện của thành viên.
  - `role` (String): Vai trò trong Fanpage (`"ADMIN"` hoặc `"COLLABORATOR"`).
  - `title` (String): Tên chức vụ chi tiết hiển thị trên thẻ (ví dụ `"Quản trị viên (Trưởng ban)"`, `"Cộng tác viên ban tổ chức"`).
  - `phone` (String): Số điện thoại liên lạc của thành viên.
  - `joinedAt` (String): Ngày gia nhập ban tổ chức (định dạng `YYYY-MM-DD`).
  - `isActive` (Boolean): Trạng thái quyền hạn trong Fanpage (`true` = Đang hoạt động, `false` = Tạm khóa quyền).
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`, `ROLE_ADMIN`
* **Path Parameters**:
  - `fanpageId` (Long/Integer, bắt buộc): ID của Fanpage.
* **Response Body (`BaseResponse<FanpageMemberDto[]>`):**
```json
{
  "data": [
    {
      "id": "mem-2",
      "userId": "2",
      "staffId": "CB-0104",
      "fullName": "Nguyễn Minh Anh",
      "email": "organizer@ctu.edu.vn",
      "avatarText": "MA",
      "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      "role": "ADMIN",
      "title": "Quản trị viên (Trưởng ban)",
      "phone": "0912 345 678",
      "joinedAt": "2026-08-15",
      "isActive": true
    },
    {
      "id": "mem-101",
      "userId": "101",
      "staffId": "B2100123",
      "fullName": "Lê Hoàng Anh",
      "email": "anhlhb2100123@student.ctu.edu.vn",
      "avatarText": "LA",
      "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
      "role": "COLLABORATOR",
      "title": "Cộng tác viên ban tổ chức",
      "phone": "0901 234 567",
      "joinedAt": "2026-09-05",
      "isActive": true
    }
  ],
  "message": "Success",
  "exceptionCode": null
}
```

---

### 5.7 Gửi lời mời tham gia Ban tổ chức Fanpage qua Email (`POST /fanpages/fanpage-admin/{fanpageId}/invitations`)
* **Mục đích**: Cho phép Quản trị viên Fanpage gửi thư mời tham gia Ban tổ chức tới địa chỉ email của sinh viên hoặc cán bộ CTU. Người nhận sẽ nhận được email chứa token xác nhận để tham gia Fanpage.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN` (Chỉ Quản trị viên Fanpage có quyền mời).
* **Path Parameters**:
  - `fanpageId` (Long/Integer, bắt buộc): ID của Fanpage.
* **Headers**: `Content-Type: application/json`
* **Request Body DTO (`SendInvitationRequestDto`):**
```json
{
  "email": "vananb2100111@student.ctu.edu.vn",
  "role": "COLLABORATOR"
}
```
* **Response Body (`BaseResponse<FanpageInvitationDto>`):**
```json
{
  "data": {
    "id": "inv-1730248800000",
    "email": "vananb2100111@student.ctu.edu.vn",
    "role": "COLLABORATOR",
    "invitedBy": "Nguyễn Minh Anh (Admin)",
    "invitedAt": "2026-10-30 08:30",
    "status": "PENDING"
  },
  "message": "Đã gửi lời mời tham gia tới email vananb2100111@student.ctu.edu.vn",
  "exceptionCode": null
}
```
* **HTTP Status Codes**:
  - `201 CREATED`: Đã tạo lời mời và gửi email thành công.
  - `400 BAD REQUEST`: Email đã là thành viên trong ban tổ chức hoặc đã có lời mời đang chờ xử lý (`FANPAGE_INVITATION_DUPLICATE`).

---

### 5.8 Quản lý Lời mời qua Email: Hủy & Gửi lại (`DELETE` & `POST /resend`)

#### 5.8.1 Hủy lời mời tham gia (`DELETE /fanpages/fanpage-admin/invitations/{id}`)
* **Mục đích**: Thu hồi lời mời đang ở trạng thái `PENDING`. Sau khi hủy, token trong email gửi cho người nhận sẽ bị vô hiệu hóa.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Path Parameters**: `id` (String/Long) - ID lời mời.
* **Response Body**:
```json
{
  "data": null,
  "message": "Đã hủy lời mời tham gia ban tổ chức thành công",
  "exceptionCode": null
}
```

#### 5.8.2 Gửi lại email lời mời (`POST /fanpages/fanpage-admin/invitations/{id}/resend`)
* **Mục đích**: Tạo lại token và gửi lại email nhắc nhở người nhận khi thư cũ bị thất lạc.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Path Parameters**: `id` (String/Long) - ID lời mời.
* **Response Body**:
```json
{
  "data": null,
  "message": "Đã gửi lại email lời mời thành công",
  "exceptionCode": null
}
```

---

### 5.9 Phân quyền Chuyển Admin & Xóa Thành viên khỏi Fanpage

#### 5.9.1 Chuyển quyền Quản trị viên / Gán vai trò (`POST /fanpages/fanpage-admin/{fanpageId}/add-member/{userId}`)
* **Mục đích**: 
  - Gán vai trò mới cho thành viên (ví dụ chuyển giao quyền `ADMIN` cho một Cộng tác viên, hạ vai trò của Quản trị viên cũ về `COLLABORATOR`).
  - Kích hoạt lại quyền nếu thành viên trước đó bị tạm khóa.
* **Request Body DTO**:
```json
{
  "role": "ADMIN"
}
```

#### 5.9.2 Xóa thành viên khỏi Fanpage (`POST /fanpages/fanpage-admin/{fanpageId}/remove-member/{userId}`)
* **Mục đích**: Rút quyền và xóa Cộng tác viên ra khỏi ban quản trị Fanpage.
* **Lưu ý nghiệp vụ**: Không thể xóa Quản trị viên (`ADMIN`). Quản trị viên bắt buộc phải chuyển quyền cho thành viên khác trước khi rời khỏi Fanpage.

---

### 5.10 Lấy danh sách Sự kiện theo Fanpage (`GET /fanpages/{fanpageId}/events`)
* **Mục đích**: Lấy danh sách sự kiện do một Fanpage tổ chức kèm bộ lọc trạng thái và phân trang.
* **Ghi chú Backend**: Đây là endpoint chuẩn RESTful song song với `GET /events/fanpage/{fanpageId}`. Cả Frontend `fanpageAdminService` lẫn trang Profile công khai của Fanpage đều gọi endpoint này để đồng bộ cấu trúc tài nguyên `/fanpages/{id}/events`.
* **Query Parameters**:
  - `status` (String, optional): Lọc theo trạng thái (`PUBLISHED`, `CLOSED`, `CANCELLED`, `ALL`).
  - `page` (Integer, optional, default: 0).
  - `size` (Integer, optional, default: 10).
* **Response Body**: `BaseResponse<PageResponse<EventDto>>` hoặc `BaseResponse<EventDto[]>`.

---

## 6. Nhóm Duyệt Đăng ký Sự kiện (Moderation Queue)

### 6.1 Hàng đợi duyệt người đăng ký sự kiện (`GET /moderation/queue`)
* **Mục đích**: Lấy danh sách các đơn đăng ký tham gia sự kiện có giới hạn số lượng / yêu cầu xét duyệt trước khi xác nhận chính thức.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`, `ROLE_ADMIN`
* **Response Body (`BaseResponse<PendingApplicantDto[]>`):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Đoàn Tài Lộc",
      "email": "student@ctu.edu.vn",
      "eventTitle": "Ngày hội việc làm và kết nối doanh nghiệp CNTT 2026",
      "step": "STAGE_1_REVIEW"
    }
  ],
  "message": "Success",
  "exceptionCode": null
}
```

---

### 6.2 Phê duyệt đơn đăng ký (`POST /moderation/{registrationId}/approve`)
* **Mục đích**: Duyệt đơn đăng ký của sinh viên chuyển sang bước tiếp theo hoặc xác nhận thành công (`CONFIRMED`).
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Path Parameters**:
  - `registrationId` (String/Long): ID lượt đăng ký.
* **Response Body (`BaseResponse<null>`):**
```json
{
  "data": null,
  "message": "Phê duyệt đơn đăng ký thành công",
  "exceptionCode": null
}
```

---

### 6.3 Từ chối đơn đăng ký (`POST /moderation/{registrationId}/reject`)
* **Mục đích**: Từ chối đơn đăng ký của sinh viên kèm theo lý do cụ thể.
* **Quyền truy cập**: `ROLE_FANPAGE_ADMIN`
* **Path Parameters**:
  - `registrationId` (String/Long): ID lượt đăng ký.
* **Headers**: `Content-Type: application/json`
* **Request Body DTO**:
```json
{
  "reason": "Số lượng sinh viên ngành KTPM đã đủ chỉ tiêu"
}
```
* **Response Body (`BaseResponse<null>`):**
```json
{
  "data": null,
  "message": "Đã từ chối đơn đăng ký",
  "exceptionCode": null
}
```

---

## 7. Nhóm Điểm Rèn Luyện Toàn Học Kỳ (Semester Training Points)

### 7.1 Lấy toàn bộ giao dịch điểm trong một Học kỳ (`GET /point-transactions/me/semesters/{semesterId}`)
* **Mục đích**: Lấy toàn bộ danh sách điểm rèn luyện (gồm điểm cộng từ sự kiện và điểm tự đánh giá `MANUAL`) của sinh viên trong một học kỳ mà **không cần phân tách theo từng mục nhỏ `pointCategoryId`**.
* **Quyền truy cập**: `ROLE_STUDENT`
* **Path Parameters**:
  - `semesterId` (Long/Integer, bắt buộc): ID học kỳ cần tra cứu.
* **Response Body (`BaseResponse<PointTransactionDto[]>`):**
```json
{
  "data": [
    {
      "id": 101,
      "userId": 1,
      "semesterId": 1,
      "pointCategoryId": 1,
      "eventId": 1,
      "points": 5,
      "type": "EVENT",
      "status": "CONFIRMED",
      "description": "Tham gia Hội thảo LLM 2026",
      "createdAt": "2026-08-16T10:00:00Z"
    },
    {
      "id": 102,
      "userId": 1,
      "semesterId": 1,
      "pointCategoryId": 2,
      "eventId": null,
      "points": 8,
      "type": "MANUAL",
      "status": "CONFIRMED",
      "description": "Sinh viên tự đánh giá ý thức học tập",
      "createdAt": "2026-09-01T08:00:00Z"
    }
  ],
  "message": "Success",
  "exceptionCode": null
}
```

---

## 8. Bảng Tổng kết & Khuyến nghị Backend Mapping

| STT | Endpoint | HTTP Method | Entity / Bảng CSDL liên quan | Khuyến nghị Controller Spring Boot |
| :---: | :--- | :---: | :--- | :--- |
| 1 | `/auth/verify-otp` | `POST` | `users`, `user_tokens` (hoặc Redis OTP key) | `AuthController.verifyOtp(...)` |
| 2 | `/auth/resend-otp` | `POST` | Redis OTP rate limiter | `AuthController.resendOtp(...)` |
| 3 | `/auth/google` | `POST` | `users`, Google OAuth2 Client | `AuthController.googleLogin(...)` |
| 4 | `/auth/me` | `GET` | `users`, `student_profiles` | `AuthController.getCurrentUser(...)` (hoặc alias tới `UserController.getProfile`) |
| 5 | `/auth/student-profile` | `POST` | `student_profiles` | `AuthController.completeStudentProfile(...)` |
| 6 | `/auth/staff-profile` | `POST` | `fanpage_admin_profiles` | `AuthController.completeStaffProfile(...)` |
| 7 | `/certificates/{registrationId}` | `GET` | `registrations`, `events`, `users` | `CertificateController.getCertificate(...)` |
| 8 | `/certificates/{id}/download` | `GET` | iText / JasperReports PDF generator | `CertificateController.downloadPdf(...)` |
| 9 | `/checkin/photo-verify` | `POST` | `registrations`, Face API / AWS Rekognition | `CheckInController.verifyPhoto(...)` |
| 10 | `/fanpages/fanpage-admin/invitations` | `GET` | `fanpage_members` (status `PENDING`) | `FanpageAdminController.getInvitations(...)` |
| 11 | `/fanpages/fanpage-admin/invitations/{id}` | `PATCH` | `fanpage_members` | `FanpageAdminController.updateInvitationStatus(...)` |
| 12 | `/fanpages/{fanpageId}/activity-stats` | `GET` | `events`, `registrations`, `fanpage_followers` | `FanpageAdminController.getActivityStats(...)` |
| 13 | `/fanpages/{fanpageId}/upcoming-reminder` | `GET` | `events` (nearest upcoming) | `FanpageAdminController.getUpcomingReminder(...)` |
| 14 | `/registrations/fanpage-member/fanpages/{fanpageId}/events/{eventId}/finalize` | `POST` | `registrations`, `events`, `point_transactions` | `RegistrationController.finalizeAttendance(...)` |
| 15 | `/fanpages/{fanpageId}/members` *(Mở rộng DTO)* | `GET` | `fanpage_members`, `users`, `student_profiles` | `FanpageController.getFanpageMembers(...)` |
| 16 | `/fanpages/fanpage-admin/{fanpageId}/invitations` | `POST` | `fanpage_members` (`PENDING`), JavaMailSender | `FanpageAdminController.sendInvitation(...)` |
| 17 | `/fanpages/fanpage-admin/invitations/{id}` | `DELETE` | `fanpage_members` | `FanpageAdminController.cancelInvitation(...)` |
| 18 | `/fanpages/fanpage-admin/invitations/{id}/resend` | `POST` | `fanpage_members`, JavaMailSender | `FanpageAdminController.resendInvitation(...)` |
| 19 | `/fanpages/{fanpageId}/events` *(Alias)* | `GET` | `events` | `FanpageController.getFanpageEvents(...)` (Alias với `/events/fanpage/{id}`) |
| 20 | `/moderation/queue` | `GET` | `registrations` (status `PENDING_APPROVAL`) | `RegistrationModerationController.getQueue(...)` |
| 21 | `/moderation/{registrationId}/approve` | `POST` | `registrations` | `RegistrationModerationController.approve(...)` |
| 22 | `/moderation/{registrationId}/reject` | `POST` | `registrations` | `RegistrationModerationController.reject(...)` |
| 23 | `/point-transactions/me/semesters/{semesterId}` | `GET` | `point_transactions` | `PointTransactionController.getTransactionsBySemester(...)` |
| 24 | `/events/{id}/register` *(Alias)* | `POST` | `registrations` | Alias trong `RegistrationController` chuyển hướng tới `registerEvent(...)` |
