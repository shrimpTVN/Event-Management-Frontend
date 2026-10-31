# Deferred Student Onboarding & Event Registration Flow (Tài liệu Tách Luồng Đăng Ký và Hoàn Thiện Hồ Sơ)

> **Mục đích tài liệu:**  
> Giải thích chi tiết cho đội ngũ **Backend (Spring Boot DDD)** về kiến trúc và luồng nghiệp vụ mới từ **Frontend**: Tối ưu hóa trải nghiệm đăng ký (Frictionless Onboarding), cho phép sinh viên vào trang chủ ngay sau khi xác thực OTP, và chỉ yêu cầu điền thông tin chi tiết sinh viên khi bấm đăng ký sự kiện.

---

## 1. Bối cảnh & Vấn đề giải quyết

### 1.1. Luồng cũ (Tạo ma sát lớn - High Friction)
- Người dùng đăng ký phải nhập cùng lúc: `email`, `password`, `studentId`, `firstName`, `lastName`, `gender`, `kNumber`, `majorId`, `associationId`, `providerId`.
- Nếu thiếu bất kỳ trường nào, Backend từ chối với lỗi `400 Bad Request`.
- Người dùng chưa kịp nhìn thấy sự kiện nào trên web đã phải điền quá nhiều thông tin ➔ Dẫn đến tỷ lệ bỏ dở đăng ký cao (High Drop-off rate).

### 1.2. Luồng mới (Just-In-Time / Lazy Onboarding)
- **Giai đoạn 1 (Đăng ký nhanh):** Người dùng chỉ cần cung cấp `email` + `password` và xác thực mã `OTP` gửi về email. Sau khi xác thực xong, hệ thống đăng nhập và chuyển thẳng vào **Trang chủ (`/`)** để lướt xem các sự kiện và bài viết.
- **Giai đoạn 2 (Hoàn thiện hồ sơ theo ngữ cảnh):** Chỉ khi người dùng bấm nút **"Đăng ký ngay"** ở một sự kiện, hệ thống mới kiểm tra và yêu cầu người dùng bổ sung thông tin sinh viên (MSSV, ngành, khóa,...) để phục vụ tính điểm rèn luyện.

---

## 2. Sơ đồ luồng tổng quan (Architecture Flowchart)

```mermaid
flowchart TD
    subgraph GiaiDoan1["GIAI ĐOẠN 1: ĐĂNG KÝ NHANH"]
        A["1. Form Đăng ký (Email + Password)"] --> B["2. Gửi mã OTP về Email"]
        B --> C["3. Nhập 6 số OTP (POST /api/auth/verify-otp)"]
        C --> D["4. Xác thực thành công ➔ Cấp Session JWT"]
    end

    subgraph GiaiDoan2["GIAI ĐOẠN 2: TRẢI NGHIỆM TRANG CHỦ"]
        D --> E["5. Vào thẳng Trang Chủ (/)"]
        E --> F["6. Xem danh sách sự kiện, chi tiết bài viết, fanpage"]
    end

    subgraph GiaiDoan3["GIAI ĐOẠN 3: ĐĂNG KÝ SỰ KIỆN"]
        F --> G{"7. Bấm 'Đăng ký ngay' sự kiện"}
        G -- "Đã có đủ hồ sơ sinh viên" --> H["8. Gọi POST /events/{id}/register ➔ Thành công"]
        G -- "Chưa có thông tin sinh viên" --> I["9. Hiển thị Popup: Yêu cầu thông tin sinh viên"]
        I --> J["10. Điền MSSV, Lớp, Ngành (POST /api/users/me/student-profile)"]
        J --> K["11. Lưu hồ sơ ➔ Tự động quay lại đăng ký sự kiện"]
    end

    style GiaiDoan1 fill:#e0f2fe,stroke:#0284c7
    style GiaiDoan2 fill:#f0fdf4,stroke:#16a34a
    style GiaiDoan3 fill:#fef3c7,stroke:#d97706
```

---

## 3. Sơ đồ tuần tự chi tiết (Sequence Diagrams)

### 3.1. Giai đoạn 1: Đăng ký & Xác thực OTP nhanh

```mermaid
sequenceDiagram
    autonumber
    actor User as Sinh viên
    participant FE as Frontend (React)
    participant Auth as AuthController (/api/auth)
    participant Service as AuthService
    participant DB as PostgreSQL

    User->>FE: Nhập Email trường + Mật khẩu
    FE->>Auth: POST /api/auth/register {email, password}
    Auth->>Service: createQuickUser(email, password)
    Service->>DB: INSERT INTO users (role=STUDENT, is_active=true)
    Note over Service,DB: Chưa cần tạo student_profiles ở bước này
    Auth-->>FE: 200 OK + Tự động gửi OTP qua mail
    FE->>FE: Chuyển sang màn hình /verify-otp

    User->>FE: Nhập 6 số OTP
    FE->>Auth: POST /api/auth/verify-otp {email, otpCode}
    Auth->>Service: verifyOtp(email, otpCode)
    Service->>DB: Kiểm tra OTP hợp lệ
    Auth-->>FE: 200 OK + Set-Cookie: ddd_jwt, ddd_refresh
    FE->>FE: Lưu trạng thái: isAuthenticated=true, isProfileComplete=false
    FE->>User: Điều hướng thẳng về Trang Chủ (/)
```

---

### 3.2. Giai đoạn 2 & 3: Đăng ký sự kiện & Hoàn thiện hồ sơ

```mermaid
sequenceDiagram
    autonumber
    actor User as Sinh viên
    participant FE as Frontend (RegisterButton)
    participant Event as Event/RegistrationController
    participant UserCtrl as UserController / AuthController
    participant DB as PostgreSQL

    User->>FE: Bấm "Đăng ký ngay" sự kiện #10
    
    alt Frontend kiểm tra cục bộ (Fast-check)
        FE->>FE: Kiểm tra user.isProfileComplete == false
        FE->>User: Mở Popup "Yêu cầu thông tin sinh viên"
    else Trường hợp gửi trực tiếp lên Backend
        FE->>Event: POST /api/events/10/register
        Event->>DB: Kiểm tra student_profiles của user
        DB-->>Event: Không tìm thấy hồ sơ sinh viên
        Event-->>FE: 403 Forbidden { exceptionCode: "STUDENT_PROFILE_REQUIRED" }
        FE->>User: Mở Popup "Yêu cầu thông tin sinh viên"
    end

    User->>FE: Bấm "Cập nhật ngay"
    FE->>FE: Chuyển tới /onboarding/student?redirect=/events/10
    User->>FE: Nhập MSSV, Giới tính, Khoa, Ngành học, Lớp, Khóa
    FE->>UserCtrl: POST /api/users/me/student-profile {studentId, firstName, lastName, gender, majorId, ...}
    UserCtrl->>DB: INSERT INTO student_profiles (user_id, student_id, major_id, ...)
    UserCtrl-->>FE: 200 OK (Cập nhật thành công)
    
    FE->>FE: Cập nhật state: isProfileComplete=true
    FE->>User: Điều hướng ngược lại trang sự kiện #10
    FE->>Event: POST /api/events/10/register (Đăng ký lại)
    Event->>DB: INSERT INTO registrations ...
    Event-->>FE: 200 OK { message: "Đăng ký thành công" }
    FE->>User: Đổi nút sang "Đã đăng ký" (Màu xanh)
```

---

## 4. Đề xuất điều chỉnh Backend (Backend Action Items)

Để hỗ trợ hoàn hảo luồng này, phía Backend (Spring Boot DDD) cần điều chỉnh hoặc bổ sung các điểm sau:

### 4.1. Cho phép Đăng ký nhanh chỉ với Email + Password
- **Endpoint:** `POST /api/auth/register` (hoặc tạo thêm `POST /api/auth/register-quick`)
- **Request Body tối thiểu:**
  ```json
  {
    "email": "student123@student.ctu.edu.vn",
    "password": "Password123!"
  }
  ```
- **Xử lý:**
  - Tạo bản ghi trong bảng `users` với role `ROLE_STUDENT`.
  - Chưa bắt buộc phải có `student_profiles` ngay, hoặc cho phép các trường profile nhận `null` tạm thời.

---

### 4.2. Bổ sung Endpoint Lưu/Hoàn thiện hồ sơ sinh viên
- **Endpoint:** `POST /api/users/me/student-profile` hoặc `POST /api/auth/student-profile`
- **Security:** Yêu cầu đăng nhập (`Authenticated` qua JWT cookie).
- **Request Body:**
  ```json
  {
    "firstName": "Văn A",
    "lastName": "Nguyễn",
    "studentId": "B2101234",
    "gender": "MALE",
    "kNumber": 49,
    "majorId": 1,
    "associationId": 1
  }
  ```
- **Xử lý:**
  - Lấy `userId` từ token đang đăng nhập (`SecurityContextHolder`).
  - Lưu bản ghi vào bảng `student_profiles` liên kết với `userId`.
  - Trả về `BaseResponse.ok()`.

---

### 4.3. Kiểm tra điều kiện khi Đăng ký sự kiện
- **Endpoint:** `POST /api/events/{id}/register` hoặc `POST /api/registrations`
- **Xử lý:**
  - Trước khi ghi nhận vào bảng `registrations`, kiểm tra xem tài khoản sinh viên đã có `student_profiles` hợp lệ hay chưa.
  - **Nếu chưa có:** Trả về lỗi có mã định danh rõ ràng:
    ```json
    {
      "data": null,
      "message": "Vui lòng hoàn thiện thông tin sinh viên trước khi đăng ký sự kiện.",
      "exceptionCode": "STUDENT_PROFILE_REQUIRED"
    }
    ```
    *HTTP Status:* `400 Bad Request` hoặc `403 Forbidden`.

---

## 5. Danh mục mã lỗi (Exception Codes quy ước)

| HTTP Status | Exception Code | Ý nghĩa | Frontend xử lý |
|:---|:---|:---|:---|
| **403 / 400** | `STUDENT_PROFILE_REQUIRED` | Người dùng chưa có thông tin sinh viên khi đăng ký sự kiện | Mở modal chuyển hướng sang form hoàn thiện hồ sơ sinh viên |
| **401** | `UNAUTHORIZED` | Chưa đăng nhập | Chuyển hướng sang `/login?redirect=...` |
| **409** | `DUPLICATE_REGISTRATION` | Sinh viên đã đăng ký sự kiện này rồi | Hiển thị nút "Đã đăng ký" |
| **400** | `EVENT_FULL` | Sự kiện đã hết số lượng đăng ký | Vô hiệu hóa nút đăng ký |

---

## 6. Lợi ích của luồng mới
1. **Tăng tỷ lệ chuyển đổi (Conversion Rate):** Sinh viên tạo tài khoản chỉ mất dưới 30 giây để bắt đầu khám phá hệ thống.
2. **Đúng ngữ cảnh (Contextual Need):** Chỉ yêu cầu nhập MSSV, chi hội, ngành học khi thực sự cần thiết (lúc đăng ký sự kiện để cấp chứng nhận và điểm rèn luyện).
3. **Trải nghiệm mượt mà:** Sau khi nhập thông tin ở sự kiện A, hệ thống tự động đưa sinh viên trở lại sự kiện A và tiếp tục đăng ký mà không cần tìm lại sự kiện.
