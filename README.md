# 🎓 CTU Event Management System (Frontend)

> Giao diện web người dùng của Hệ thống Quản lý Sự kiện & Đánh giá Điểm rèn luyện / SV5T Đại học Cần Thơ, được xây dựng bằng **React 19**, **TypeScript**, **Tailwind CSS** và **Vite**.

---

## 🛠️ Yêu cầu môi trường (Prerequisites)

- **Node.js**: Phiên bản 18+ hoặc 20+ (khuyến nghị Node 20 LTS)
- **Trình quản lý gói**: `npm` (đi kèm Node.js) hoặc `pnpm`
- **Backend API**: Đang chạy tại `http://localhost:8080` (xem hướng dẫn ở repo `Event-Management-Backend`)

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Cài đặt thư viện dependencies
```bash
npm install
```

### 2. Cấu hình biến môi trường (Tùy chọn)
Tạo file `.env` từ `.env.example` nếu cần tùy chỉnh cổng hoặc địa chỉ Backend:
```bash
cp .env.example .env
```
*(Nếu không tạo file `.env`, Vite đã mặc định tự động proxy toàn bộ request `/api` sang `http://localhost:8080`).*

### 3. Khởi chạy máy chủ phát triển (Dev Server)
```bash
npm run dev
```
Giao diện sẽ sẵn sàng tại: **`http://localhost:5173`**

### 4. Kiểm tra mã nguồn & Kiểm thử (Verification & Tests)
```bash
# Kiểm tra TypeScript typecheck
npx tsc --noEmit

# Chạy toàn bộ 460+ unit test bằng Vitest
npm run test
```

---

## 🔑 Tài khoản đăng nhập thử nghiệm (Test Accounts)

Hệ thống hỗ trợ đăng nhập bằng **Tài khoản Google (OAuth2)** hoặc đăng nhập với các tài khoản được nạp từ `mock_data.sql` ở Backend:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Ghi chú |
|---|---|---|---|
| **Sinh viên** | `student1@example.com` | `password123` | MSSV SV001, đã có profile mẫu |
| **Sinh viên** | `student2@example.com` | `password123` | MSSV SV002 |
| **Quản trị Fanpage / Cán bộ** | `admin1@example.com` | `password123` | Quản lý Fanpage Sự Kiện IT, LCH CNTT |
| **Google Login** | Tài khoản `@student.ctu.edu.vn` | - | Đăng nhập một chạm qua Google OAuth |

---

## 📁 Cấu trúc thư mục (Project Structure)

```
src/
├── app/               # Root Providers, Routing & Shell Integration
├── assets/            # Logo CTU, hình ảnh tĩnh, icons
├── components/        # Thư viện UI tái sử dụng (Button, Input, Modal, Tooltip,...)
├── features/          # Các phân hệ nghiệp vụ chính (Feature-driven)
│   ├── auth/          # Đăng nhập, Google OAuth, Đăng ký, Quản lý tài khoản
│   ├── events/        # Khám phá sự kiện, Chi tiết, Đăng ký, Bộ lọc
│   ├── fanpage/       # Xem fanpage công khai phía sinh viên
│   ├── fanpage-admin/ # Workspace Quản trị Fanpage (Tạo sự kiện, Quản lý thành viên, Thống kê)
│   ├── check-in/      # Điểm danh sự kiện & Xác minh ảnh minh chứng
│   ├── sv5t/          # Tiêu chí Sinh viên 5 tốt & Báo cáo tiến độ
│   ├── training-points/ # Điểm rèn luyện theo học kỳ
│   └── super-admin/   # Quản trị hệ thống toàn trường
├── shared/            # Axios API Client, utilities, layouts
└── store/             # Zustand state management stores
```
