# Yêu cầu cập nhật API hồ sơ cán bộ

Ngày tạo: 20/11/2026. Gửi nhóm Backend để hỗ trợ trang **Thông tin cá nhân** trong khu vực quản lý fanpage. Tài liệu này đề xuất hợp đồng API; chưa triển khai thay đổi BE.

Tài liệu này giữ lại yêu cầu ban đầu để tham chiếu. BE hiện đã có GET/PATCH hồ sơ cán bộ và API avatar. Hai yêu cầu bổ sung ngày 22/11/2026 được tập hợp tại [tài liệu gửi BE](backend-account-security-and-staff-profile-request.md).

## 1. Vấn đề hiện tại

- `GET /api/users/me/profile` chỉ tìm trong hồ sơ sinh viên. Tài khoản cán bộ không có hồ sơ sinh viên sẽ nhận lỗi 404.
- Hồ sơ cán bộ đã có trong bảng `fanpage_admin_profiles`, nhưng chưa có API đọc và cập nhật hồ sơ cá nhân tương ứng.
- API đổi avatar hiện cũng tìm hồ sơ sinh viên sau bước cập nhật user, nên chưa dùng ổn định cho cán bộ thuần.
- FE đã bỏ dữ liệu gán mẫu. Cần API trả dữ liệu thật để hiển thị mã cán bộ, chức vụ, đơn vị, ngày sinh và điện thoại.

## 2. API đọc hồ sơ

Đề xuất bổ sung **`GET /api/users/me/staff-profile`**, giữ nguyên hợp đồng API hồ sơ sinh viên hiện tại.

Trả envelope `BaseResponse` đang dùng, với `data` gồm:

| Trường | Kiểu | Nguồn dữ liệu |
| --- | --- | --- |
| `userId` | number | ID tài khoản đang đăng nhập |
| `firstName`, `lastName` | string hoặc null | `users.first_name`, `users.last_name` |
| `email` | string | `users.email` |
| `gender` | `MALE`, `FEMALE`, `OTHER` hoặc null | `users.gender` |
| `avatarUrl` | string hoặc null | `users.avatar_url` |
| `roles` | string[] | Các quyền hệ thống thực tế của tài khoản |
| `staffProfile` | object hoặc null | Hồ sơ trong `fanpage_admin_profiles` liên kết bằng `user_id` |

Các thuộc tính trong `staffProfile`:

| Trường | Kiểu | Cột DB |
| --- | --- | --- |
| `staffId` | string | `staff_id` |
| `orgName` | string hoặc null | `org_name` |
| `title` | string hoặc null | `title` |
| `dateOfBirth` | string `YYYY-MM-DD` hoặc null | `dob` |
| `phoneNumber` | string hoặc null | `phone_number` |

Nếu tài khoản tồn tại nhưng chưa có hồ sơ cán bộ, trả **200 với `staffProfile: null`** và thông tin tài khoản thật. Không tạo hồ sơ sinh viên thay thế, không tự điền thông tin mẫu. Một tài khoản có thể đồng thời có hồ sơ sinh viên và cán bộ; không suy loại hồ sơ chỉ từ quyền `FANPAGE_ADMIN`.

## 3. API cập nhật hồ sơ

Đề xuất **`PATCH /api/users/me/staff-profile`**. Chỉ cập nhật thuộc tính được gửi; thuộc tính vắng mặt phải giữ nguyên. Ví dụ request:

```json
{
  "firstName": "An",
  "lastName": "Nguyễn",
  "gender": "MALE",
  "staffProfile": {
    "title": "Giảng viên",
    "dateOfBirth": "1995-10-15",
    "phoneNumber": "0901234567"
  }
}
```

Ví dụ trên minh họa cấu trúc request, không dùng làm dữ liệu mặc định cho người dùng.

- Cho tự sửa họ tên, giới tính, chức vụ, ngày sinh và điện thoại. **Email, quyền hệ thống, mã cán bộ và đơn vị công tác chỉ đọc** trong luồng này; không cho tự nâng quyền hoặc đổi danh tính cán bộ.
- Họ tên không được rỗng; giới tính phải đúng enum; ngày sinh hợp lệ và không ở tương lai. Điện thoại tối đa 20 ký tự, chức vụ tối đa 100 ký tự, họ và tên mỗi trường tối đa 100 ký tự.
- `null` dùng để xóa các trường tùy chọn như chức vụ, ngày sinh, điện thoại. Không chấp nhận `null` cho họ tên hoặc quyền.
- Nếu gửi thay đổi `staffProfile` khi chưa có hồ sơ cán bộ, trả lỗi 404 với `exceptionCode` riêng, ví dụ `STAFF_PROFILE_NOT_FOUND`; không tự tạo hồ sơ từ dữ liệu suy đoán. Cập nhật riêng các trường tài khoản vẫn có thể thực hiện khi `staffProfile: null`.
- Xác định người dùng bằng phiên/token đăng nhập, không lấy user ID hay email đích từ request. Cập nhật `users` và hồ sơ cán bộ trong cùng giao dịch; lỗi thì không lưu một phần.
- Trả **200 với hồ sơ đã lưu**, cùng cấu trúc GET ở trên, để FE cập nhật giao diện. Lỗi trả HTTP status, `message` và `exceptionCode` rõ ràng.

## 4. Avatar và độ dài tên đơn vị

- Sửa **`PATCH /api/users/me/profile/change-avatar`** để cập nhật `users.avatar_url` mà không bắt buộc tồn tại hồ sơ sinh viên. FE upload ảnh bằng luồng media hiện có rồi gửi `{ "avatarUrl": "<URL ảnh đã upload>" }`. Trả thông tin user/avatar đã lưu; không trả lỗi tìm hồ sơ sinh viên sau khi cập nhật.
- `org_name` của hồ sơ cán bộ hiện giới hạn 20 ký tự. Nếu trường này lưu tên đầy đủ của đơn vị, đề nghị tăng lên 255 ký tự và đồng bộ schema, entity, DTO/validation; không cắt tên hoặc buộc FE tự viết tắt.

## 5. Tiêu chí nghiệm thu

- [ ] Cán bộ không có hồ sơ sinh viên vẫn đọc được tài khoản và hồ sơ cán bộ thật.
- [ ] Tài khoản có cả hai loại hồ sơ đọc đúng từng loại; cập nhật cán bộ không đổi thông tin học vụ.
- [ ] Thiếu hồ sơ cán bộ trả `staffProfile: null`, không phát sinh dữ liệu mẫu.
- [ ] Chỉ gửi điện thoại thì các trường khác giữ nguyên; gửi `null` cho trường tùy chọn thì xóa được giá trị đó.
- [ ] Thay đổi được lưu thật: gọi lại GET hoặc đăng nhập lại vẫn nhận giá trị mới.
- [ ] Không sửa được email, roles, mã cán bộ hoặc đơn vị qua API tự cập nhật; không truy cập tài khoản người khác.
- [ ] Dữ liệu không hợp lệ không làm thay đổi DB; cập nhật lỗi không lưu một phần.
- [ ] Cán bộ thuần đổi avatar thành công mà không cần tạo hồ sơ sinh viên; API sinh viên hiện tại vẫn hoạt động.

Sau khi BE hoàn tất, cung cấp OpenAPI hoặc mẫu response GET/PATCH và một tài khoản cán bộ thử nghiệm. FE sẽ bổ sung bộ đọc hồ sơ cán bộ, hiển thị các trường thật và mở chỉnh sửa ngay tại chỗ theo hợp đồng đã thống nhất.
