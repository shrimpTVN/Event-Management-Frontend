# Plan refactor Google OAuth và lỗi đăng nhập

## Mục tiêu

1. Khi FE dùng BE thật (`npm run dev`/build thường), thiếu cấu hình Google phải báo lỗi rõ ràng trên màn hình đăng nhập/đăng ký. Không tạo credential giả, không gọi `/auth/login` thay cho `/auth/login/google`.
2. Khi dùng mock mode (`npm run dev:mock`), chỉ luồng mock đã chủ đích mới được dùng dữ liệu mock.
3. Đăng nhập email/password thất bại phải hiển thị cùng một thông báo cho email không tồn tại và mật khẩu sai: **“Email hoặc mật khẩu không đúng.”** Không suy đoán tài khoản từ dữ liệu FE.

## Hiện trạng đã xác nhận

- `src/app/providers.tsx` dùng `mock-client-id` nếu không có `VITE_GOOGLE_CLIENT_ID`, không phân biệt mock mode và BE thật.
- `src/features/auth/components/GoogleAuthButton.tsx` coi thiếu Google provider là nhánh mock, tạo `mock-google-token-*` ngay khi bấm.
- `src/features/auth/components/LoginForm.tsx` biến mock token thành `authService.login({ email: 'student1@example.com', password: 'password123' })`; ảnh Console xác nhận request `POST /api/auth/login` 400. Dòng `console.error` tiếp theo là log của cùng lỗi đó.
- `src/features/auth/components/RegisterForm.tsx` trong nhánh mock Google chuyển sang onboarding mà chưa có phiên đăng nhập.
- `LoginForm.tsx` gọi `checkEmailRegistered` sau lỗi `AUTH.005`/401. Hàm này chỉ tra seed, localStorage và email thành viên tối đa 20 fanpage; kết quả âm tính không chứng minh email vắng trong BE.
- BE `GlobalExceptionHandler` đã trả `AUTH.005` với thông điệp chung cho `BadCredentialsException`. FE đang tự biến nó thành thông báo riêng cho email/mật khẩu. `AUTH.010` của BE vẫn phân biệt tài khoản bị khóa ở cấp HTTP; xem phần giới hạn cuối tài liệu.
- `.env.example` có Google Client ID mẫu, nhưng file mẫu không được Vite nạp tự động. ID mẫu FE khác ID mặc định trong `ddd-infrastructure/src/main/resources/application.yml`; BE `GoogleTokenVerifierImpl` kiểm tra audience đúng bằng ID của BE.

## Task 1 — Cấu hình Google theo môi trường

**Files:** `src/shared/utils/env.ts` hoặc helper cấu hình auth trong `src/features/auth/`; `src/app/providers.tsx`; `.env.example`; tài liệu chạy local nếu có.

- [ ] Định nghĩa một nguồn trạng thái rõ ràng: `mock` chỉ khi `import.meta.env.MODE === 'mock'`; `ready` khi BE thật và `VITE_GOOGLE_CLIENT_ID` là chuỗi không rỗng; `unavailable` khi BE thật nhưng biến thiếu/rỗng. Không suy ra mock từ việc provider vắng mặt hoặc biến chưa đặt.
- [ ] Ở `ready`, mount `GoogleOAuthProvider` bằng client ID thật. Ở `unavailable`, vẫn render ứng dụng và form email/password; Google UI hiển thị lỗi cấu hình, không dùng `mock-client-id`. Ở `mock`, giữ luồng mock riêng.
- [ ] Sửa `.env.example`: ghi `VITE_GOOGLE_CLIENT_ID` là bắt buộc khi dùng BE thật, hướng dẫn tạo `.env.local` và khởi động lại Vite sau khi đổi biến. Ghi rõ FE và BE (`GOOGLE_CLIENT_ID`) phải cùng OAuth Client ID; không để hai giá trị ví dụ mâu thuẫn.
- [ ] **Kiểm tra:** chạy BE thật khi biến thiếu/rỗng: form thường vẫn dùng được, nút Google báo cấu hình thiếu, Network không có `/auth/login` hay `/auth/login/google` khi bấm. Khi biến đúng: provider được khởi tạo, không có mock token.

## Task 2 — Chặn fallback trong login và register Google

**Files:** `src/features/auth/components/GoogleAuthButton.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`; `src/features/auth/services/authService.ts` nếu cần kiểm tra payload ở biên service.

- [ ] `GoogleAuthButton` chỉ tạo credential mock trong `mock` mode. Với `unavailable`, hiển thị trạng thái disabled và thông điệp người dùng dễ hiểu như “Đăng nhập bằng Google chưa được cấu hình. Vui lòng dùng email và mật khẩu hoặc liên hệ quản trị viên.”; log kỹ thuật ở console dev nếu cần.
- [ ] Với `ready`, callback phải nhận credential thật, gọi duy nhất `exchangeGoogleToken` → `POST /auth/login/google`. Credential rỗng, thiếu hoặc có tiền tố `mock-google-token` trong BE thật là lỗi cấu hình/xác thực, không đổi sang `/auth/login` và không dùng email/password mặc định.
- [ ] Áp dụng cùng quy tắc cho **đăng nhập** và **đăng ký**. Nhánh đăng ký mock chỉ được điều hướng sau khi mock session hợp lệ được tạo theo hợp đồng mock; không đưa người dùng tới onboarding ở trạng thái chưa xác thực.
- [ ] Bỏ thông báo lỗi hướng dẫn nội bộ về `Authorized JavaScript origins` khỏi UI người dùng; hiện thông báo thân thiện, còn chi tiết nguyên nhân giữ trong log dev. Kiểm tra phạm vi click của nút Google thật trong trình duyệt; lớp phủ trong suốt hiện tại không được tạo vùng bấm giả gây hiểu nhầm.
- [ ] **Kiểm tra:** để trống email/password, bấm Google ở cả `/login` và `/register`: không có validation của form thường; cấu hình đúng thì chọn Google và có `/auth/login/google`; cấu hình thiếu thì chỉ thấy lỗi cấu hình. Mock mode tiếp tục theo đúng mock flow, không gọi BE thật.

## Task 3 — Sửa thông báo đăng nhập email/password

**Files:** `src/features/auth/components/LoginForm.tsx`; `src/features/auth/services/accountVerificationService.ts` chỉ nếu không còn caller khác cần dọn; `src/features/auth/components/__tests__/LoginForm.test.tsx` khi triển khai test theo rule FE.

- [ ] Bỏ `checkEmailRegistered` và logic dò `rawMsg` kiểu “user/email/account not found” khỏi luồng login. Không gọi API danh sách fanpage để quyết định email tồn tại.
- [ ] Với lỗi xác thực (`AUTH.005` và mã login tương ứng từ BE), hiển thị một lỗi chung ở mức form. Không gắn lỗi “email không tồn tại” hay “mật khẩu sai” vào riêng trường. Validation phía client vẫn chỉ báo email sai định dạng, password trống/quá ngắn trước khi gửi request.
- [ ] Chỉ hiển thị lỗi khác khi BE trả lỗi thực sự không phải sai thông tin đăng nhập, ví dụ lỗi mạng/5xx hoặc validation request. Không hiển thị nguyên văn message BE có thể tiết lộ trạng thái tài khoản trên màn hình login. Xem riêng chính sách `AUTH.010` trong phần giới hạn.
- [ ] Cập nhật các assertion cũ đang kỳ vọng “Email không tồn tại”/“Mật khẩu không chính xác” để phản ánh thông báo chung, nếu việc sửa test được duyệt cùng plan này.
- [ ] **Kiểm tra:** email không tồn tại và email đúng + sai password cho cùng UI/message; không gọi `/fanpages`/`members` sau login thất bại; lỗi mạng/500 không bị biến thành sai thông tin đăng nhập. Login thành công vẫn đi đúng route và lưu phiên như trước.

## Task 4 — Kiểm tra tích hợp hai bên và chốt phát hành

**Files:** Không bắt buộc sửa thêm; chỉ sửa cấu hình môi trường thật sau khi có OAuth Client ID được cấp cho môi trường đó.

- [ ] Đối chiếu `VITE_GOOGLE_CLIENT_ID` FE và `GOOGLE_CLIENT_ID` BE trong từng môi trường; kiểm tra Google Cloud Authorized JavaScript origins của URL FE. Không ghi client secret vào biến `VITE_*`.
- [ ] Chạy `npm run typecheck`, `npm run build` và test auth hiện có sau khi cập nhật kỳ vọng. Test thủ công login/register Google với form trống, cấu hình thiếu, cấu hình sai, token hết hạn, từ chối popup và BE trả lỗi.
- [ ] Dùng Network xác nhận chế độ BE thật **không bao giờ** gửi mock token hoặc credential mặc định; khi Google thành công chỉ gọi `/auth/login/google`. Kiểm tra thông báo người dùng không lộ chi tiết cấu hình/BE.
- [ ] **Kiểm tra cuối task:** lưu bảng kết quả từng kịch bản, status API và UI thấy được; không phát hành nếu FE/BE Google Client ID chưa khớp.

## Giới hạn cần quyết định riêng

Plan này sửa thông báo sai và khả năng suy đoán email **trên UI FE**. BE hiện trả `AUTH.010` cho tài khoản bị vô hiệu hóa; nếu yêu cầu chống liệt kê tài khoản ở cả tầng HTTP/Network, cần thêm task BE chuẩn hóa response đăng nhập thất bại cho tài khoản không tồn tại, sai mật khẩu và bị khóa theo chính sách bảo mật đã chốt. Không thể giải quyết sự khác biệt của response BE chỉ bằng việc đổi thông báo FE.

## Ghi chú triển khai

Theo `.agents/rules/agent-rules.md` của FE, đây là Phase 1: chỉ lập kế hoạch. Chờ người dùng duyệt trước khi sửa code chức năng. Các file auth và `src/shared/services/api.ts` đang có thay đổi chưa commit từ công việc khác; khi triển khai phải giữ nguyên các thay đổi đó và chỉ chỉnh đúng phần plan nêu.
