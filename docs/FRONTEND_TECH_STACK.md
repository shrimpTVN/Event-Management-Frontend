# TÀI LIỆU KIẾN TRÚC & CÔNG NGHỆ FRONTEND (FRONTEND TECHNOLOGY STACK)
**Dự án:** Hệ thống Quản lý Sự kiện & Hoạt động Sinh viên CTU (CTU Event Management System)  
**Môn học:** Niên luận ngành Kỹ thuật Phần mềm (KTPM K49) - Trường CNTT&TT, Đại học Cần Thơ  
**Ngày cập nhật:** 13/11/2026  
**Nhánh công nghệ:** Single Page Application (SPA) / Modern Web Architecture  

---

## 1. TỔNG QUAN ĐỊNH HƯỚNG CÔNG NGHỆ

Giao diện người dùng (Frontend) của hệ thống được xây dựng theo mô hình **Single Page Application (SPA)** hiện đại, áp dụng kiến trúc **Feature-Driven Architecture (Vertical Slice Architecture)** nhằm phục vụ nhiều nhóm đối tượng người dùng:
1. **Sinh viên:** Khám phá sự kiện, đăng ký tham gia, nhận vé QR code, theo dõi tiến độ Điểm rèn luyện và Danh hiệu Sinh viên 5 tốt (SV5T).
2. **Ban quản trị Fanpage (Đoàn - Hội / Câu lạc bộ):** Đăng tải sự kiện, quản lý người tham dự, điểm danh check-in bằng mã QR, quản lý thành viên và theo dõi thống kê tương tác.
3. **Quản trị viên cấp cao (Super Admin):** Duyệt yêu cầu tạo fanpage, kiểm duyệt bài đăng sự kiện, quản lý danh mục Điểm rèn luyện, khung tiêu chí SV5T, cây cơ cấu Khoa/Trường và năm học.

Để đáp ứng khối lượng nghiệp vụ phức tạp trên một giao diện mượt mà và trực quan, dự án lựa chọn các công nghệ cốt lõi thuộc hệ sinh thái **React 19**, **TypeScript** và **Vite**, kết hợp với giải pháp quản lý trạng thái máy chủ chuyên nghiệp (**TanStack Query**) và thiết kế UI dạng headless accessible (**Tailwind CSS + Radix UI**).

---

## 2. BẢNG TỔNG HỢP CÔNG NGHỆ CHÍNH (TECH STACK MATRIX)

| STT | Công nghệ / Thư viện | Phiên bản | Nhóm vai trò | Mục đích & Ứng dụng chính trong dự án |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **React** | `^19.2.8` | Core Library | Thư viện nền tảng xây dựng UI hướng component, tận dụng React 19 concurrent features, custom hooks và Virtual DOM hiệu năng cao. |
| **2** | **TypeScript** | `~6.0.2` | Programming Language | Ngôn ngữ phát triển chính; cung cấp Static Typing, type-safety toàn diện cho API DTOs, Enums, Form schema và UI props. |
| **3** | **Vite** | `^8.3.0` | Build Tool & Bundler | Công cụ đóng gói và máy chủ phát triển (HMR) tốc độ cao, cấu hình Path Aliasing (`@/`), Reverse Proxy tích hợp điều hướng API cookie. |
| **4** | **React Router DOM** | `^7.18.4` | Routing & Navigation | Quản lý định tuyến SPA đa tầng (nested routes), điều hướng trang, xử lý URL params, query string và bảo vệ route bằng `AuthGuard` (RBAC). |
| **5** | **TanStack Query (React Query)** | `^5.104.1` | Server State Management | Quản lý dữ liệu máy chủ không đồng bộ (asynchronous state): Caching tự động (staleTime 5m), Background Refetching, Invalidation, Deduplication. |
| **6** | **Axios** | `1.20.0` | HTTP Client | Xử lý giao tiếp REST API: cấu hình Interceptors tự động bóc tách envelope `ApiResponse<T>`, tự động inject token/credentials và xử lý lỗi 401. |
| **7** | **Zustand** | `^5.0.15` | Client State Management | Quản lý trạng thái giao diện và phiên làm việc gọn nhẹ: `authStore` (phiên đăng nhập, quyền hạn), `userFanpagesStore`, `uiStore`. |
| **8** | **Tailwind CSS** | `^3.4.19` / PostCSS | Styling & Utility CSS | Framework CSS utility-first; hỗ trợ Dark/Light theme, bố cục linh hoạt (Flexbox, Grid), responsive đa thiết bị từ Mobile đến Desktop. |
| **9** | **Radix UI Primitives** | `^1.3.1` / `^2.4.1` | Headless UI Components | Bộ linh kiện giao diện headless đạt tiêu chuẩn WAI-ARIA Accessibility: Dialog/Modal, Select Box, Dropdown Menu, Slide-over Sheet Drawer. |
| **10** | **React Hook Form** | `^7.90.0` | Form Management | Quản lý form dữ liệu hiệu năng cao dựa trên Uncontrolled Components, giảm thiểu tối đa số lần re-render khi người dùng nhập liệu. |
| **11** | **Zod** | `^4.6.7` | Data Validation | Khai báo và xác thực Schema dữ liệu chặt chẽ từ runtime, tự động suy diễn kiểu dữ liệu TypeScript (`z.infer<typeof schema>`). |
| **12** | **Lucide React** | `^1.55.0` | Iconography | Hệ thống biểu tượng vector SVG hiện đại, thẩm mỹ cao, hỗ trợ tree-shaking thu nhỏ kích thước bundle. |
| **13** | **@react-oauth/google** | `^0.13.5` | Social Authentication | Tích hợp xác thực đăng nhập một chạm Google One Tap / Google OAuth 2.0 dành cho email cán bộ và sinh viên CTU. |
| **14** | **date-fns** | `^4.4.0` | Date & Time Utility | Thư viện xử lý, tính toán và định dạng thời gian sự kiện tiếng Việt (format, parse, differenceInDays, relative time). |
| **15** | **tsParticles** | `^4.5.0` | Canvas Animation | Hiệu ứng đồ họa mạng hạt phân tử động cho trang Landing, Đăng nhập, Đăng ký và nền Hero banner. |
| **16** | **Vitest & React Testing Library** | `^5.0.3` / `^16.3.3` | Testing Suite | Khung kiểm thử tự động đơn vị và tích hợp (Unit & Integration tests) cho các components, stores và services. |
| **17** | **ESLint & Oxlint & Prettier** | Latest | Code Quality Tooling | Công cụ linter & formatter đảm bảo mã nguồn sạch sẽ, đồng bộ chuẩn viết code giữa các thành viên. |

---

## 3. CHI TIẾT TỪNG NHÓM CÔNG NGHỆ & VAI TRÒ KIẾN TRÚC

### 3.1. Nền tảng cốt lõi: React 19 + TypeScript + Vite 8
- **React 19:**
  - Được xây dựng hoàn toàn bằng Functional Components kết hợp hệ sinh thái React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`).
  - Hỗ trợ Strict Mode để phát hiện sớm các tác dụng phụ (side-effects) và memory leaks trong quá trình render.
- **TypeScript (~6.0.2):**
  - Mọi thực thể trong hệ thống đều được định kiểu chi tiết: từ DTO backend trả về (`EventInfoDto`, `UserResponseDto`, `CriteriaProgressDto`), Enums miền (`EventStatus`, `FanpageRole`, `CriteriaType`), cho đến Props của từng component.
  - Tránh triệt để lỗi `Cannot read properties of undefined` và hỗ trợ tính năng tự động gợi ý mã (IntelliSense) vượt trội.
- **Vite 8:**
  - Máy chủ phát triển tích hợp Hot Module Replacement (HMR) gần như tức thì (< 100ms).
  - Tích hợp cấu hình path alias `@/` trỏ trực tiếp vào thư mục `src/`, loại bỏ các đường dẫn tương đối phức tạp như `../../../../components`.
  - Tích hợp cấu hình proxy cục bộ (`vite.config.ts`), xử lý rewrite cookie session và xóa cờ `Secure` khi lập trình trên môi trường HTTP cục bộ giữa port `5173` và `8080`.

---

### 3.2. Quản lý trạng thái máy chủ (Server State): TanStack Query v5
Trong các ứng dụng quản lý sự kiện, dữ liệu như *danh sách sự kiện, trạng thái đăng ký, bộ lọc tiêu chí, số lượng vé còn lại* thường xuyên thay đổi. Thay vì lưu trữ thủ công vào global state, hệ thống sử dụng **TanStack Query v5**:
- **Automatic Caching & Stale Time:** Thiết lập mặc định `staleTime: 5 phút`, ngăn chặn việc gửi request trùng lặp (deduplication) khi chuyển đổi giữa các tab hoặc component.
- **Optimistic Updates & Cache Invalidation:** Khi ban tổ chức cập nhật trạng thái sự kiện hoặc người dùng nhấn Đăng ký, query cache tương ứng (`['events']`, `['event-detail', id]`) được tự động kích hoạt làm mới (`invalidateQueries`).
- **Loading / Error State Management:** Cung cấp sẵn các cờ `isLoading`, `isFetching`, `isError` để hiển thị UI Skeleton hoặc thông báo lỗi thân thiện.

---

### 3.3. Giao tiếp mạng & Xác thực: Axios + Interceptors
Tầng giao tiếp REST API được đóng gói tập trung tại `src/shared/services/api.ts`:
- **Request Interceptor:** Tự động kiểm tra chế độ chạy (Mock hay Real Backend) và gắn Header `Authorization: Bearer <token>` khi có token hợp lệ.
- **Cookie Session Support:** Bật cấu hình `withCredentials: true` để truyền và nhận Cookie an toàn (JSESSIONID/JWT HttpOnly Cookie) giữa Frontend và Spring Boot Backend.
- **Response Interceptor (Envelope Unwrapping):** Tự động bóc tách vỏ ApiResponse bọc ngoài (`{ success: true, data: T, message: string }`) để trả thẳng đối tượng dữ liệu `T` cho service tiêu thụ, giảm thiểu boilerplate code.
- **Centralized 401 Handling:** Khi phiên đăng nhập hết hạn (HTTP 401), interceptor kích hoạt cơ chế xóa phiên và chuyển hướng người dùng về `/login?redirect=...`.

---

### 3.4. Quản lý trạng thái ứng dụng phía Client: Zustand v5
Dự án sử dụng **Zustand** thay vì Redux Toolkit nhờ ưu điểm siêu nhẹ (< 1KB), cấu hình đơn giản không cần Provider bao bọc:
- **`authStore.ts`:** Quản lý thông tin phiên làm việc của người dùng hiện tại (`currentUser`), danh sách quyền, trạng thái xác thực và lưu trữ an toàn trong `localStorage`.
- **`userFanpagesStore.ts`:** Quản lý danh sách các Fanpage/Câu lạc bộ mà tài khoản đang sở hữu hoặc giữ vai trò quản trị viên/thành viên ban tổ chức.
- **`uiStore.ts`:** Quản lý các trạng thái giao diện dùng chung như mở/đóng modal, trạng thái thu gọn thanh bên (sidebar collapse), thông báo toast.

---

### 3.5. Biểu mẫu & Xác thực dữ liệu: React Hook Form + Zod
Đối với các biểu mẫu phức tạp như *Tạo sự kiện mới, Đăng ký thông tin sinh viên, Đăng ký mở Fanpage, Nộp minh chứng tiêu chí*:
- **React Hook Form:** Lưu trữ giá trị input bằng `ref` không gây giật lag hoặc render lại toàn bộ trang khi người dùng gõ từng ký tự.
- **Zod:** Định nghĩa Schema xác thực kiểu hướng khai báo (declarative): kiểm tra định dạng email sinh viên `@ctu.edu.vn`, định dạng MSSV (ví dụ: `B2303827`), độ dài mật khẩu, ngày bắt đầu phải trước ngày kết thúc sự kiện.
- **@hookform/resolvers:** Tự động kết nối Zod Schema với hook `useForm({ resolver: zodResolver(schema) })`, hiển thị lỗi xác thực ngay lập tức bên dưới từng input field.

---

### 3.6. Giao diện & Trải nghiệm người dùng: Tailwind CSS + Radix UI + Lucide
- **Tailwind CSS (Utility-First):**
  - Sử dụng hệ thống utility classes giúp viết CSS ngay trong JSX/TSX.
  - Hỗ trợ đầy đủ biến màu CSS Tokens (CSS Variables) để chuyển đổi giao diện Dark Mode / Light Mode mượt mà.
  - Sử dụng hàm tiện ích `cn()` kết hợp `clsx` và `tailwind-merge` để xử lý các class có điều kiện và tránh xung đột độ ưu tiên class.
- **Radix UI Primitives:**
  - Sử dụng các components không chứa CSS tĩnh (headless) như Dialog/Modal, Select Box, Dropdown, Accordion.
  - Đảm bảo tuân thủ tiêu chuẩn tương tác bàn phím (Tab, Enter, Escape, Arrow keys) và chuẩn trợ năng cho người khiếm thị (WAI-ARIA).
- **Lucide React:**
  - Bộ biểu tượng thống nhất phong cách thiết kế với hơn 1000+ icons vector sắc nét trên mọi độ phân giải màn hình.

---

### 3.7. Hiệu ứng đồ họa: tsParticles
- Được ứng dụng tại các trang cửa ngõ (Landing Page, Login, Register, Header Banner) để tạo các chùm hạt chuyển động tương tác theo con trỏ chuột, tạo cảm giác hiện đại, trẻ trung và công nghệ cao cho sinh viên trường CNTT&TT.

---

### 3.8. Phân quyền & Điều hướng: React Router DOM v7 + AuthGuard (RBAC)
- Hệ thống định tuyến hỗ trợ kiểm soát truy cập dựa trên vai trò (**Role-based Access Control - RBAC**):
  - **Public Routes:** Trang chủ `/`, Chi tiết sự kiện `/events/:id`, Trang Fanpage `/fanpage/:id`.
  - **Student Protected Routes:** Lịch sử tham gia `/event-history`, Điểm rèn luyện `/training-points`, Sinh viên 5 tốt `/sv5t`, Hồ sơ cá nhân `/profile`.
  - **Staff / Fanpage Admin Routes:** Không gian quản trị Fanpage `/fanpage/workspace`, Tạo sự kiện `/fanpage/events/create`.
  - **Super Admin Routes:** Bảng điều khiển quản trị hệ thống `/admin`, `/super-admin`.
- Thành phần `AuthGuard` tự động kiểm tra `role` của người dùng; nếu không đủ quyền hạn sẽ chuyển hướng an toàn về trang thích hợp hoặc hiển thị thông báo từ chối truy cập.

---

### 3.9. Kiểm thử tự động & Đảm bảo chất lượng: Vitest + Testing Library
- **Vitest:** Thực thi kiểm thử cực nhanh nhờ tận dụng trực tiếp pipeline biên dịch của Vite, không cần cấu hình Babel hay Jest phức tạp.
- **React Testing Library & JSDOM:** Kiểm thử giao diện theo góc nhìn trải nghiệm người dùng thực tế (tìm kiếm theo label, text, button role thay vì tìm theo class name).
- Bộ test suite bao phủ các chức năng nhạy cảm như logic phân quyền, tính toán điểm rèn luyện, lọc sự kiện đa tiêu chí và dropdown thông báo.

---

## 4. KIẾN TRÚC TỔ CHỨC MÃ NGUỒN (FEATURE-DRIVEN ARCHITECTURE)

Dự án áp dụng mô hình phân tách thư mục theo **Feature (Tính năng nghiệp vụ)** thay vì phân tách theo loại tệp kỹ thuật:

```text
Event-Management-Frontend/
├── public/                     # Tài nguyên tĩnh công khai (logo, favicon, images)
├── mock/                       # Dữ liệu và server mock chạy thử nghiệm cục bộ (Node.js/JSON Server)
├── src/
│   ├── app/                    # Cấu hình cấp ứng dụng
│   │   ├── providers.tsx       # QueryClientProvider, GoogleOAuthProvider
│   │   └── router.tsx          # Toàn bộ danh mục routes và cấu hình bảo vệ AuthGuard
│   ├── assets/                 # Hình ảnh, icons, minh họa nội bộ
│   ├── components/             # UI Components tái sử dụng toàn cục
│   │   ├── ui/                 # Atomic UI (button, input, select, sheet, dialog, skeleton,...)
│   │   ├── layout/             # Navbar, Footer, PageShell, Sidebar
│   │   └── common/             # ParticleBackground, VerifiedBadge,...
│   ├── features/               # CÁC MODULE NGHIỆP VỤ CHÍNH (VERTICAL SLICES)
│   │   ├── auth/               # Đăng nhập, Google OAuth, Onboarding, authStore
│   │   ├── events/             # Danh sách sự kiện, bộ lọc đa tiêu chí, chi tiết sự kiện
│   │   ├── fanpage/            # Trang chi tiết fanpage công khai, theo dõi fanpage
│   │   ├── fanpage-admin/      # Bảng tin quản trị fanpage, duyệt thành viên, quét vé QR
│   │   ├── super-admin/        # Kiểm duyệt sự kiện, duyệt fanpage, quản lý tiêu chí SV5T & ĐRL
│   │   ├── sv5t/               # Theo dõi 5 tiêu chuẩn SV5T, nộp minh chứng tự đánh giá
│   │   ├── training-points/    # Bảng tổng hợp và lịch sử tích lũy Điểm rèn luyện
│   │   ├── registration/       # Form đăng ký tham gia sự kiện và xuất vé QR
│   │   ├── registration-history/# Lịch sử tham dự sự kiện và chứng nhận điện tử
│   │   ├── notifications/      # Chuông thông báo và danh sách thông báo theo vai trò
│   │   └── profile/            # Cập nhật thông tin cá nhân sinh viên
│   ├── lib/                    # Cấu hình tiện ích dùng chung (utils.ts)
│   ├── pages/                  # Các Page components đóng vai trò container kết nối feature
│   ├── shared/                 # Tầng dùng chung (ApiClient, kiểu dữ liệu chung, hooks chung)
│   └── types/                  # Các kiểu dữ liệu toàn cục (Global TypeScript Definitions)
```

Mỗi module trong `src/features/<feature-name>` được đóng gói khép kín gồm:
- `components/`: Các thành phần giao diện chỉ dùng riêng cho tính năng đó.
- `services/`: Các hàm gọi API Axios tương ứng với endpoint backend của tính năng.
- `types/`: Các kiểu dữ liệu DTO, Request, Response, Form Values đặc thù.
- `store/` (nếu có): Quản lý state cục bộ cho tính năng bằng Zustand.
- `hooks/`: Các custom hook xử lý nghiệp vụ phức tạp.

---

## 5. ƯU ĐIỂM CỦA BỘ TECH STACK TRONG BÁO CÁO NIÊN LUẬN NGÀNH

1. **Tính Hiện Đại & Bắt Kịp Xu Hướng:**
   - Sử dụng các phiên bản mới nhất của ngành công nghiệp phần mềm: React 19, Vite 8, TypeScript 6, TanStack Query v5 và Tailwind CSS.
2. **Hiệu Năng & Tối Ưu Hóa Tải Trang:**
   - Cơ chế đóng gói chia nhỏ chunk (Code Splitting) và Dynamic Import giúp thời gian tải trang ban đầu (First Contentful Paint) dưới 1 giây.
   - Nhờ TanStack Query caching, người dùng không phải chờ tải lại dữ liệu khi quay lại các trang vừa duyệt.
3. **Độ Tin Cậy Cao (Type Safety & Fault Tolerance):**
   - Sự kết hợp giữa TypeScript và Zod loại bỏ hầu hết các lỗi định dạng dữ liệu ngay tại máy khách trước khi gửi lên máy chủ.
4. **Khả Năng Mở Rộng & Bảo Trì Dễ Dàng (Scalability & Maintainability):**
   - Kiến trúc phân chia theo Feature cho phép nhiều thành viên trong nhóm phát triển đồng thời các phân hệ (SV5T, Fanpage, Admin, Sự kiện) mà không bị xung đột mã nguồn (merge conflict).
5. **Trải Nghiệm Người Dùng (UX) Chuẩn Mực:**
   - Hệ thống hỗ trợ đầy đủ trạng thái Skeleton Loading khi tải dữ liệu, giao diện thích ứng mượt mà trên điện thoại di động và máy tính bảng, tương tác trực quan với Dark Mode và Particle animation.

---
*Tài liệu được lập bởi Frontend Development Team - Phục vụ công tác báo cáo và lưu trữ đồ án Niên luận ngành KTPM K49.*

