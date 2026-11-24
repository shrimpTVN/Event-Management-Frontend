# Yêu cầu BE: trạng thái mật khẩu, hồ sơ cán bộ và thông báo vắng mặt

Ngày cập nhật: 22/11/2026. Tài liệu tập hợp các yêu cầu để Backend triển khai. Chưa sửa mã nguồn BE hoặc database theo tài liệu này; phần A/B/D đề xuất API, phần C mô tả lỗi thông báo và phần E mô tả điểm nghẽn cấp quyền/đăng ký fanpage.

- **Phần A:** Trả `hasPassword` để FE hiển thị đúng nút tạo mật khẩu lần đầu hoặc đổi mật khẩu.
- **Phần B:** Tạo hồ sơ cán bộ cho tài khoản đã đăng nhập, gồm tài khoản Google đã tồn tại.
- **Phần C:** Sửa migration ràng buộc loại thông báo để gửi nhắc nhở vắng mặt được.
- **Phần D:** Cho superadmin đọc hồ sơ cán bộ của người dùng khác trong trang Người dùng.
- **Phần E:** Hoàn thiện phân loại/quyền tài khoản Google và luồng đăng ký fanpage cho tài khoản đã tồn tại.

## A. Xác định tài khoản đã có mật khẩu

### 1. Vấn đề hiện tại

FE đã kết nối `POST /auth/create-password` và `POST /auth/change-password`, nhưng dữ liệu tài khoản chưa có `hasPassword`. Vì vậy FE chưa thể tự chọn đúng nút **Tạo mật khẩu lần đầu** hay **Đổi mật khẩu**.

`providerId` hoặc việc đăng nhập bằng Google không xác định được trạng thái này: tài khoản Google có thể đã tạo thêm mật khẩu để đăng nhập bằng email.

Hiện BE chỉ thông báo tài khoản đã có mật khẩu khi gọi API tạo mật khẩu. FE không nên phải gửi một yêu cầu tạo mật khẩu để dò trạng thái.

### 2. Hợp đồng API đề xuất

Bổ sung **`GET /users/me/security`**, trả theo envelope `BaseResponse` hiện có. Các đường dẫn trong tài liệu tương đối với API base URL của dự án.

Ví dụ phần `data`:

```json
{
  "hasPassword": false
}
```

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `hasPassword` | boolean, bắt buộc, không null | Tài khoản hiện tại đã thiết lập mật khẩu đăng nhập nội bộ hay chưa |

- Lấy tài khoản từ phiên đăng nhập/token; không nhận email hoặc user ID đích từ request.
- Cho phép mọi tài khoản đã đăng nhập sử dụng, gồm sinh viên, cán bộ, quản trị fanpage và superadmin; không yêu cầu có hồ sơ sinh viên/cán bộ.
- Chưa đăng nhập trả 401; tài khoản không tồn tại xử lý theo quy ước lỗi hiện có.
- Trả trạng thái mới nhất từ dữ liệu tài khoản. Không trả mật khẩu thô hoặc password hash.
- Không bắt buộc thêm trường mới vào các API danh sách/tìm kiếm người dùng.

Chọn endpoint riêng để FE có một nguồn đọc chung, không phụ thuộc loại hồ sơ. Nếu BE đã có endpoint thông tin tài khoản hiện tại dùng được cho mọi vai trò, có thể bổ sung `hasPassword` tại đó thay cho endpoint mới và thông báo đường dẫn/response chính xác để FE tích hợp. Trong `AuthController` đã kiểm tra hiện chưa có GET `/auth/me`; không mặc định coi đường dẫn này đã hoạt động.

### 3. Quy tắc xác định

Đồng bộ với điều kiện đang có trong `UserCommandServiceImpl.createPassword`:

```java
boolean hasPassword = user.getPassword() != null
        && !user.getPassword().isBlank();
```

| Tình huống | `hasPassword` |
| --- | --- |
| Đăng ký bằng email/mật khẩu thành công | `true` |
| Tài khoản Google chưa thiết lập mật khẩu, dữ liệu mật khẩu null/rỗng | `false` |
| Tài khoản Google đã tạo mật khẩu | `true` |
| Đổi mật khẩu thành công | `true` |

Đây là thuộc tính suy ra từ dữ liệu mật khẩu hiện có; không cần thêm cột `has_password` để tránh lệch trạng thái. Nếu dữ liệu OAuth cũ có mật khẩu ngẫu nhiên/giá trị giả thay cho null, BE cần rà soát riêng và thống nhất cách nhận diện; không tự xóa mật khẩu đã được người dùng thiết lập.

### 4. Giữ nguyên bảo vệ tại API ghi

- `POST /auth/create-password` chỉ tạo khi chưa có mật khẩu; không ghi đè mật khẩu đã tồn tại. Không yêu cầu mật khẩu cũ trong luồng này.
- `POST /auth/change-password` yêu cầu kiểm tra mật khẩu hiện tại.
- API đọc trạng thái chỉ giúp hiển thị giao diện. API ghi vẫn phải kiểm tra lại, kể cả khi trạng thái đã thay đổi ở một tab khác.
- Đề nghị trả mã lỗi ổn định trong cấu trúc lỗi hiện có, ví dụ `PASSWORD_ALREADY_SET` khi tạo mật khẩu cho tài khoản đã có mật khẩu, và `PASSWORD_NOT_SET` khi yêu cầu đổi nhưng chưa có mật khẩu. FE sẽ không cần phân tích chuỗi thông báo tiếng Anh.
- Giữ hành vi phiên hiện tại: tạo mật khẩu trả refresh cookie mới; đổi mật khẩu thu hồi refresh session và FE yêu cầu đăng nhập lại. Không cần sửa cơ chế phiên trong yêu cầu này.

### 5. Cách FE sử dụng sau khi BE hoàn thành

1. Khi mở mục bảo mật, gọi API trạng thái của tài khoản hiện tại.
2. `hasPassword: false`: chỉ hiện **Tạo mật khẩu lần đầu**, gồm mật khẩu mới và xác nhận.
3. `hasPassword: true`: chỉ hiện **Đổi mật khẩu**, gồm mật khẩu hiện tại, mật khẩu mới và xác nhận.
4. Trong lúc tải hoặc khi API lỗi, không suy ra `false`; hiển thị trạng thái tải/lỗi và nút thử lại.
5. Tạo mật khẩu thành công: đọc lại trạng thái, chuyển sang giao diện đổi mật khẩu; không cần đăng nhập lại nếu phiên mới hợp lệ.
6. Đổi mật khẩu thành công: thực hiện luồng đăng nhập lại hiện có.
7. Khi nhận lỗi trạng thái đã thay đổi, đọc lại API để cập nhật giao diện. Cache phải gắn với tài khoản hiện tại và được xóa khi đăng xuất/đổi tài khoản.

FE sẽ tích hợp bước hiển thị có điều kiện sau khi BE cung cấp API; tài liệu này không khẳng định FE đã dùng `hasPassword`.

### 6. Tiêu chí nghiệm thu

- Tài khoản email có mật khẩu: API trả `true`.
- Tài khoản Google chưa có mật khẩu: trả `false`; sau khi tạo thành công, lần đọc kế tiếp trả `true`.
- Đăng nhập bằng Google vào tài khoản đã thiết lập mật khẩu vẫn trả `true`.
- Hoạt động cho mọi vai trò, kể cả tài khoản không có hồ sơ sinh viên/cán bộ.
- Không có phiên hợp lệ: trả 401; không lộ trạng thái mật khẩu của tài khoản khác.
- Response chỉ có boolean trạng thái, không chứa mật khẩu/hash.
- Gọi tạo mật khẩu lần nữa không ghi đè mật khẩu và trả lỗi ổn định; đổi mật khẩu sai mật khẩu hiện tại bị từ chối.
- Hai tab cùng tạo mật khẩu: BE đảm bảo chỉ một lần thiết lập thành công, lần còn lại không ghi đè.

Khi bàn giao, BE cung cấp đường dẫn chính thức, ví dụ response trong envelope thực tế, mã lỗi và các trường hợp kiểm thử đã chạy để FE cập nhật kiểu dữ liệu và giao diện.

## B. Tạo hồ sơ cán bộ cho tài khoản hiện tại


### B.1. Lỗi đang gặp và phân biệt các luồng

| Luồng | BE hiện tại |
| --- | --- |
| Bổ sung hồ sơ sinh viên cho tài khoản đã đăng nhập | `PUT /users/me/profile` có nhánh tạo hồ sơ nếu chưa tồn tại |
| Đọc/sửa hồ sơ cán bộ | Có `GET/PATCH /users/me/staff-profile`; PATCH dữ liệu hồ sơ khi chưa có hồ sơ sẽ báo không tìm thấy |
| Đăng ký tài khoản mới kèm hồ sơ cán bộ | `POST /auth/register/fanpage-admin` tạo cả user mới và hồ sơ |
| Tạo hồ sơ cán bộ cho tài khoản đã tồn tại, gồm tài khoản Google | Chưa có endpoint tương ứng |

Các đường dẫn phần B tương đối với API base URL của dự án.

FE hiện có nhánh gọi `POST /auth/staff-profile` trong `completeStaffProfile` khi không có đăng ký email/mật khẩu đang chờ. BE chưa có endpoint này, nên luồng hoàn thiện hồ sơ sau đăng nhập không hoạt động. Không dùng `/auth/register/fanpage-admin` thay thế vì tài khoản đã tồn tại; không yêu cầu tạo mật khẩu mới chỉ để tạo hồ sơ cán bộ.

### B.2. API tạo hồ sơ đề xuất

Bổ sung **`POST /users/me/staff-profile`** cho tài khoản đã đăng nhập, tách khỏi PATCH chỉnh sửa. Giữ API PATCH chỉ cập nhật hồ sơ đã tồn tại; không tự tạo hồ sơ từ payload cập nhật thiếu dữ liệu.

Ví dụ request:

```json
{
  "firstName": "An",
  "lastName": "Nguyễn Văn",
  "staffProfile": {
    "staffId": "CB01234",
    "orgName": "Trường Công nghệ Thông tin và Truyền thông",
    "title": "Giảng viên",
    "phoneNumber": "0901234567"
  }
}
```

- `firstName`, `lastName`, `staffProfile.staffId`, `staffProfile.orgName`, `staffProfile.title`: bắt buộc, trim và không rỗng. Họ/tên tối đa 100 ký tự mỗi trường, mã cán bộ tối đa 20, đơn vị tối đa 255, chức vụ tối đa 100.
- `staffProfile.phoneNumber`: tùy chọn, tối đa 20 ký tự; `staffProfile.dateOfBirth`: tùy chọn, `YYYY-MM-DD`, không ở tương lai. `gender` nếu được gửi phải đúng `MALE`, `FEMALE`, `OTHER`.
- Không bắt buộc ngày sinh hoặc giới tính nếu form chưa thu thập. Đồng bộ tính nullable của schema/entity/DTO khi cần; không tự gán ngày sinh, giới tính, điện thoại hoặc mã cán bộ mẫu để vượt validation.
- Dữ liệu ví dụ chỉ minh họa hợp đồng, không dùng làm giá trị mặc định. FE gửi mã cán bộ và tên đơn vị người dùng đã xác nhận; không cắt ngắn tên đơn vị.
- `staffId` và `orgName` được nhận lúc tạo lần đầu; sau đó vẫn chỉ đọc trong API PATCH tự chỉnh sửa hiện có.

Thành công trả **201**, envelope `BaseResponse` hiện có, phần `data` cùng cấu trúc `StaffProfileResponseDto` của GET/PATCH: thông tin user thật và `staffProfile` đã lưu. Sau khi tạo, GET phải đọc được ngay hồ sơ mới. Không cần thay đổi response của API đăng ký tài khoản mới.

### B.3. Quy tắc xử lý BE

- Xác định user từ phiên/token hiện tại. Không nhận `userId`, email đích, password hoặc roles từ request tạo hồ sơ.
- Chỉ bổ sung hồ sơ vào user hiện tại; giữ email, liên kết Google, mật khẩu, avatar và các hồ sơ khác. Không tạo thêm user, không gộp tài khoản theo email do client gửi.
- Hỗ trợ tài khoản đang đăng nhập đủ điều kiện theo chính sách hệ thống, gồm tài khoản Google chưa có mật khẩu. Không bắt buộc có hồ sơ sinh viên và không chặn chỉ vì tài khoản chưa có quyền `FANPAGE_ADMIN` trong bước onboarding.
- Tạo hồ sơ không đồng nghĩa được quyền quản trị mọi fanpage. Kiểm tra thành viên/quyền từng fanpage vẫn giữ nguyên. Nếu nghiệp vụ cần gán quyền cán bộ sau khi tạo hồ sơ, BE xác định quyền đó theo chính sách hiện có, không lấy từ client; giữ các quyền cũ và không cấp `ADMIN`/superadmin từ việc gửi form.
- Một user chỉ có một hồ sơ cán bộ; mã cán bộ không được trùng với user khác. Ràng buộc ở DB và xử lý tranh chấp đồng thời, không chỉ kiểm tra trước khi insert.
- Tạo hồ sơ và cập nhật họ tên/các trường user được cho phép trong cùng transaction; lỗi thì rollback toàn bộ.
- Nếu hồ sơ đã tồn tại, trả **409** với mã lỗi ổn định, ví dụ `STAFF_PROFILE_ALREADY_EXISTS`; không ghi đè dữ liệu. FE có thể gọi GET và chuyển sang màn hình hồ sơ.
- Mã cán bộ trùng tài khoản khác: **409**, ví dụ `STAFF_ID_ALREADY_EXISTS`. Dữ liệu không hợp lệ: **400**, kèm trường lỗi. Chưa đăng nhập: **401**. Không đủ điều kiện theo chính sách BE: **403** với lý do rõ ràng.
- Các mã lỗi trên là đề xuất; đặt trong trường `exceptionCode`/cấu trúc lỗi chuẩn của dự án và thông báo lại FE hợp đồng chính thức.

### B.4. Thay đổi FE sau khi BE bàn giao

1. Đổi nhánh hoàn thiện hồ sơ cho tài khoản đã đăng nhập từ `/auth/staff-profile` sang endpoint POST đã thống nhất.
2. Map dữ liệu form sang request: họ tên → `firstName`/`lastName`, `department` → `staffProfile.orgName`, `position` → `staffProfile.title`, cùng mã cán bộ và điện thoại.
3. Nhận response thật, đọc lại hồ sơ/quyền tài khoản khi cần và xóa cache liên quan trước khi điều hướng. Không tự gán quyền chỉ để coi là tạo thành công.
4. Chỉ đánh dấu hoàn thiện hồ sơ khi BE lưu thành công; lỗi giữ nguyên form và cho thử lại.
5. Giữ riêng nhánh đăng ký tài khoản mới bằng email/mật khẩu qua `/auth/register/fanpage-admin`.

### B.5. Tiêu chí nghiệm thu bổ sung

- [ ] Tài khoản Google chưa có mật khẩu tạo được hồ sơ cán bộ, không cần đăng ký lại.
- [ ] Tài khoản đã có hồ sơ sinh viên có thể thêm hồ sơ cán bộ nếu được phép; không mất hồ sơ sinh viên.
- [ ] Cán bộ không có hồ sơ sinh viên tạo/đọc/sửa hồ sơ được theo đúng luồng.
- [ ] Sau POST thành công, GET trả hồ sơ đã lưu; tải lại trang/đăng nhập lại vẫn còn dữ liệu.
- [ ] Gửi lại POST hoặc hai request đồng thời không tạo trùng hồ sơ, không ghi đè hồ sơ cũ.
- [ ] Mã cán bộ trùng trả lỗi có thể gắn vào trường mã cán bộ trên FE.
- [ ] Dữ liệu sai hoặc lỗi lưu không làm thay đổi một phần thông tin user.
- [ ] Không thể tạo hồ sơ cho user khác hoặc tự cấp quyền bằng request sửa tay.
- [ ] Luồng đăng ký mới và API PATCH hồ sơ đã tồn tại vẫn hoạt động như trước.

BE bàn giao đường dẫn chính thức, schema request/response, mã lỗi, chính sách quyền sau khi tạo và yêu cầu làm mới phiên nếu quyền thay đổi. Phần này chỉ là mô tả yêu cầu; chưa sửa BE hoặc chuyển FE sang endpoint đề xuất.

## C. Sửa lỗi không gửi được thông báo nhắc nhở vắng mặt

### C.1. Hiện trạng và bằng chứng

FE đã gọi endpoint hiện có:

```http
POST /api/fanpages/{fanpageId}/statistics/absent-students/alert
```

Payload theo `AlertAbsentStudentsRequestDto`:

```json
{
  "semesterId": 9,
  "studentUserIds": [81],
  "message": "Vui lòng chú ý tham gia đúng lịch đã đăng ký."
}
```

ID trong ví dụ chỉ minh họa cấu trúc; khi thử nghiệm phải dùng học kỳ và user ID hợp lệ của môi trường test. `studentUserIds` là ID tài khoản, không phải chuỗi mã số sinh viên.

Log tại `Event-Management-Backend/logs/ddd.log`, ngày 22/11/2026 lúc 21:47:10 và 21:47:14, ghi nhận lỗi tại endpoint trên:

```text
SQLState: 23514
new row for relation "notifications" violates check constraint "notifications_type_check"
```

BE đã đi đến bước INSERT vào `notifications` với `type = 'EVENT_ABSENCE_ALERT'`, rồi database từ chối. Vì vậy FE hiển thị "Chưa gửi được thông báo. Vui lòng thử lại." Đây là lỗi không đồng bộ giữa loại thông báo trong mã nguồn BE và ràng buộc của DB đang chạy; không phải thiếu nút gửi hoặc sai tên trường request ở FE.

`NotificationTypeEnum` hiện đã có `EVENT_ABSENCE_ALERT`; `FanpageStatisticCommandServiceImpl.alertAbsentStudents` cũng đang dùng đúng giá trị này. Build và restart BE không đảm bảo tự cập nhật ràng buộc CHECK đã tồn tại trong DB.

### C.2. Yêu cầu sửa phía BE/database

1. Kiểm tra định nghĩa thực tế của `notifications_type_check` trong đúng database/schema ứng dụng đang kết nối. Đối chiếu với toàn bộ `NotificationTypeEnum` hiện hành.
2. Bổ sung migration cập nhật CHECK constraint để chấp nhận `EVENT_ABSENCE_ALERT`, đồng thời giữ đầy đủ các loại thông báo hợp lệ khác. Không thay constraint bằng danh sách chỉ chứa loại mới và không bỏ hẳn việc kiểm tra dữ liệu.
3. Chạy thay đổi trong transaction theo cơ chế migration của dự án, có bước kiểm tra dữ liệu hiện có trước khi áp dụng. Không xóa bảng, dữ liệu thông báo hoặc tạo lại database để xử lý lỗi này.
4. Đồng bộ schema khởi tạo cho môi trường mới; migration phải hỗ trợ cả database đã có dữ liệu. Không chỉ sửa enum Java hoặc file schema khởi tạo mà bỏ qua DB đang chạy.
5. Giữ nguyên loại `EVENT_ABSENCE_ALERT` và endpoint/payload đang dùng; không đổi sang một loại thông báo khác để vượt qua constraint.
6. Khi lưu thất bại, rollback toàn bộ batch. Chỉ phát SSE/thông báo thành công sau khi giao dịch lưu thành công, tránh FE nhận thông báo chưa tồn tại trong DB. Đề nghị kiểm tra hành vi này trong luồng thông báo hiện có khi sửa.

BE tự xây dựng migration dựa trên định nghĩa constraint thực tế. Tài liệu không cung cấp câu lệnh ALTER với danh sách enum suy đoán để tránh vô tình loại bỏ các loại thông báo đang sử dụng.

### C.3. Tiêu chí nghiệm thu

- [ ] Sau migration, gọi endpoint với user/học kỳ hợp lệ trả thành công và thông báo được lưu với `type = EVENT_ABSENCE_ALERT`.
- [ ] Người nhận thấy đúng nội dung và biểu tượng fanpage trong danh sách thông báo; tải lại vẫn còn dữ liệu.
- [ ] Luồng cập nhật thời gian thực hoạt động theo cơ chế hiện có; thông báo chưa đọc được cập nhật đúng.
- [ ] URL do BE trả (hiện là `/fanpages/{id}`) được FE chuẩn hóa và mở đúng trang `/fanpage/{id}`.
- [ ] Các loại thông báo khác vẫn tạo được; giá trị loại không hợp lệ vẫn bị DB từ chối.
- [ ] Không mất dữ liệu thông báo cũ; migration chạy được trên DB đã có dữ liệu và môi trường mới.
- [ ] Khi có lỗi trong batch, không lưu/gửi một phần hoặc báo thành công giả.
- [ ] Không cần thay hợp đồng API phía FE chỉ để xử lý lỗi constraint này.

Khi bàn giao, BE cung cấp migration đã áp dụng, database/schema đã kiểm tra và kết quả thử gửi trên dữ liệu test. Tài liệu này chưa thực thi migration, chưa sửa BE và chưa gửi thử thông báo thật.

## D. API hồ sơ cán bộ cho trang Người dùng của superadmin

### D.1. Hiện trạng và nguyên nhân thiếu thông tin

BE **đã có** `GET /users/me/staff-profile`, trả hồ sơ cán bộ của người đang đăng nhập. Tuy nhiên API này không nhận user ID đích, nên không dùng để superadmin xem hồ sơ của một người khác.

Trang Người dùng của FE hiện kết hợp:

- `GET /users/admin`: trả `UserResponseDto`, gồm thông tin tài khoản cơ bản và quyền; chưa có `staffProfile`.
- `GET /users/admin/profiles`: trả danh sách hồ sơ sinh viên.
- `GET /users/admin/{id}/profile`: cũng chỉ đọc hồ sơ sinh viên, không phải hồ sơ cán bộ.

Vì vậy tài khoản có đầy đủ dữ liệu trong `fanpage_admin_profiles` vẫn có thể thiếu mã cán bộ, đơn vị, chức vụ và điện thoại trên trang superadmin. FE đã có phần hiển thị `staffProfile`, nhưng các API đang gọi chưa cung cấp dữ liệu đó.

Đã kiểm tra đọc trực tiếp DB local ngày 22/11/2026: tài khoản `organizer@ctu.edu.vn`, user ID `2`, có hồ sơ cán bộ và quyền `FANPAGE_ADMIN`. Không cần tạo lại hồ sơ hoặc tự điền dữ liệu mẫu ở FE để xử lý lỗi hiển thị này.

Các đường dẫn phần D tương đối với API base URL của dự án (ví dụ `/api`). Các API dưới đây là đề xuất, chưa triển khai.

### D.2. Danh sách người dùng: trả kèm hồ sơ cán bộ

Ưu tiên bổ sung `staffProfile` trong từng phần tử của **`GET /users/admin`**, giữ nguyên envelope/phân trang, tên và ý nghĩa các trường tài khoản đang có.

Ví dụ phần tử trong `data.content` (dữ liệu minh họa):

```json
{
  "userId": 2,
  "email": "organizer@ctu.edu.vn",
  "roles": ["FANPAGE_ADMIN"],
  "role": "FANPAGE_ADMIN",
  "firstName": "Minh Anh",
  "lastName": "Nguyễn",
  "gender": "FEMALE",
  "isActive": true,
  "avatarUrl": null,
  "staffProfile": {
    "staffId": "CB-0104",
    "orgName": "Đoàn Trường CNTT&TT",
    "title": "Bí thư Đoàn khoa",
    "dateOfBirth": "1995-10-15",
    "phoneNumber": "02923872254"
  }
}
```

- `staffProfile`: object nếu có hồ sơ cán bộ, **null nếu chưa có**. Không dùng role `FANPAGE_ADMIN` để suy ra một hồ sơ giả.
- Dùng cùng tên trường/kiểu dữ liệu với `StaffProfileDetailsResponseDto` hiện có; `dateOfBirth` là `YYYY-MM-DD` hoặc null, các trường tùy chọn giữ null khi chưa có dữ liệu.
- Liên kết hồ sơ bằng `user_id` thật, không ghép dựa trên tên hoặc suy đoán từ email.
- Một user có thể có cả hồ sơ sinh viên và cán bộ; bổ sung hồ sơ cán bộ không làm mất hồ sơ sinh viên hoặc đổi quyền tài khoản.
- Trả đúng cả tài khoản hoạt động và bị khóa theo `isActive` đã yêu cầu. Không bỏ user chỉ vì chưa có hồ sơ, không thay đổi tổng số/phân trang do phép join.
- Tránh N+1: lấy hồ sơ theo tập user ID của trang hiện tại hoặc bằng truy vấn phù hợp. Không buộc FE gọi một request riêng cho từng dòng chỉ để hiển thị mã cán bộ/đơn vị.
- Nếu dùng `UserResponseDto` chung cho các endpoint tìm kiếm/công khai, nên tạo DTO riêng cho danh sách admin hoặc giới hạn mapping theo endpoint; không vô tình lộ hồ sơ cán bộ ở API khác khi thêm trường.

Nếu BE chọn endpoint danh sách hồ sơ cán bộ riêng thay vì mở rộng `/users/admin`, cần cung cấp API phân trang hoặc batch theo user ID, trả `userId` rõ ràng và thống nhất hợp đồng với FE trước khi tích hợp. Không chỉ thêm API chi tiết rồi để danh sách vẫn thiếu thông tin.

### D.3. Đọc chi tiết một cán bộ theo user ID

Bổ sung **`GET /users/admin/{userId}/staff-profile`**:

- `{userId}` là ID trong bảng `users`, không phải ID bản ghi `fanpage_admin_profiles`.
- Response dùng `BaseResponse`, phần `data` cùng cấu trúc `StaffProfileResponseDto` của `/users/me/staff-profile`: `userId`, họ/tên, email, giới tính, avatar, roles và `staffProfile` lồng bên trong.
- User tồn tại nhưng chưa có hồ sơ cán bộ: **200 với `staffProfile: null`**, giữ thông tin tài khoản thật để FE phân biệt thiếu hồ sơ với lỗi tải dữ liệu.
- User không tồn tại: **404** theo cấu trúc lỗi hiện có.
- Không thay ý nghĩa endpoint `/users/admin/{id}/profile` hiện dành cho sinh viên; không fallback từ user ID sang profile ID có thể trả nhầm người.

API chi tiết phục vụ xem lại dữ liệu mới nhất khi mở hồ sơ; danh sách vẫn cần đáp ứng mục D.2 để hiển thị các dòng đầy đủ.

### D.4. Phân quyền và tính nhất quán

- Chỉ cho người có quyền hệ thống `ADMIN` (superadmin trên FE) gọi các API đọc hồ sơ admin. Chưa đăng nhập trả 401; sinh viên hoặc `FANPAGE_ADMIN` không có `ADMIN` trả 403 khi gọi API này.
- Giữ `/users/me/staff-profile` cho luồng tự xem hồ sơ; không thêm khả năng chọn tùy ý user ID vào endpoint `/me` để vượt kiểm tra quyền.
- Không trả password/hash, JWT, refresh token hoặc thông tin xác thực khác.
- Đây là yêu cầu **đọc dữ liệu**, không cấp thêm quyền sửa hồ sơ, đổi email, đổi mã cán bộ hoặc đơn vị qua API admin.
- Cùng một user phải nhận thông tin hồ sơ nhất quán giữa API `/me`, danh sách admin và chi tiết admin sau khi cập nhật thành công.

### D.5. Tích hợp FE và nghiệm thu

FE sẽ dùng `staffProfile` từ danh sách admin để hiển thị mã cán bộ, đơn vị, chức vụ và điện thoại; đọc lại API chi tiết khi mở hồ sơ nếu cần. Giữ riêng dữ liệu sinh viên và cán bộ, định danh user bằng `userId`; dữ liệu trống hiển thị thiếu thông tin, không điền mẫu.

- [ ] Tài khoản local user ID `2` có hồ sơ cán bộ thật được hiển thị đúng trong trang Người dùng của superadmin.
- [ ] API danh sách có đủ trường cần cho dòng người dùng mà không cần gọi hồ sơ chi tiết cho mọi dòng.
- [ ] API chi tiết trả đúng người theo user ID, không nhầm profile ID.
- [ ] User có cả hai loại hồ sơ không bị mất hoặc ghi đè thông tin sinh viên/cán bộ.
- [ ] Chưa có hồ sơ trả null, user không tồn tại trả 404; FE phân biệt được hai trường hợp này với lỗi server.
- [ ] Phân trang, tổng số user, lọc hoạt động/bị khóa vẫn đúng.
- [ ] Người không có `ADMIN` không đọc được hồ sơ người khác qua API admin; các API tìm kiếm/công khai không vô tình trả dữ liệu hồ sơ mới.
- [ ] Sửa thông tin qua luồng cá nhân hiện có rồi tải lại trang superadmin nhận dữ liệu mới.

BE bàn giao hợp đồng API chính thức, response mẫu và kết quả kiểm thử trước khi FE nối vào. Tài liệu này chỉ bổ sung mô tả yêu cầu; chưa sửa BE hoặc tích hợp các endpoint đề xuất.

## E. Quyền tài khoản Google và điểm nghẽn đăng ký fanpage

### E.1. Hành vi hiện tại đã kiểm tra trong mã nguồn

Trong `AuthServiceImpl`:

| Luồng | Hành vi cấp quyền hiện tại |
| --- | --- |
| Đăng ký sinh viên bằng email/mật khẩu qua `/auth/register` | Tạo user với `STUDENT` |
| Đăng nhập Google lần đầu, email chưa có user | Luôn tạo user với `STUDENT`, kể cả email cán bộ |
| Đăng nhập Google với email đã có user | Giữ nguyên quyền đã có; không tự chuyển về `STUDENT` |
| Đăng ký tài khoản cán bộ mới qua `/auth/register/fanpage-admin` | Tạo user mới với `FANPAGE_ADMIN` và hồ sơ cán bộ |

Trong khi đó, FE cho cả nhóm sinh viên và staff mở form đăng ký fanpage, còn BE áp dụng:

- `SecurityConstant.FANPAGE_ADMIN_ENDPOINTS` chứa `/api/fanpages/fanpage-admin/**`.
- `SecurityConfig` yêu cầu `hasRole(FANPAGE_ADMIN)` cho nhóm endpoint này, bao gồm POST đăng ký.
- `FanpageCommandServiceImpl.createFanpage` tiếp tục bắt buộc hồ sơ cán bộ có `staffId` và `orgName`.
- FE coi cả `ADMIN` và `FANPAGE_ADMIN` là staff, nhưng user chỉ có `ADMIN` cũng không vượt qua rule `hasRole(FANPAGE_ADMIN)` hiện tại.

Vì vậy cán bộ đăng nhập Google lần đầu bị đưa vào vai trò `STUDENT`, rồi không thể gửi đăng ký fanpage; nếu tài khoản đã tồn tại nhưng thiếu hồ sơ cán bộ thì còn vướng phần B. Sinh viên có hồ sơ sinh viên đầy đủ cũng chưa có luồng xin quyền/đăng ký fanpage riêng.

Thông báo được ghi nhận ở FE khi gửi đăng ký là:

```text
You do not have permission to perform this action
```

Thông báo này tương ứng lỗi 403 từ lớp kiểm tra quyền của BE, chưa xác nhận hồ sơ cán bộ thiếu hoặc dữ liệu fanpage sai. Riêng user ID `2` (`organizer@ctu.edu.vn`) đã được kiểm tra có `FANPAGE_ADMIN` và hồ sơ cán bộ trong DB; không được suy rằng tài khoản này thiếu quyền trong DB chỉ từ lỗi 403. Nếu tài khoản đó bị chặn, cần kiểm tra quyền trong phiên/JWT đang gửi, cách tạo authorities và API thực sự bị từ chối.

### E.2. Yêu cầu hoàn thiện luồng

1. Giữ đăng ký sinh viên thông thường với `STUDENT`; việc không tự cấp `FANPAGE_ADMIN` cho mọi sinh viên không phải lỗi cần sửa bằng cách cấp đại trà.
2. Hoàn thiện luồng **Google/tài khoản đã tồn tại → xác định loại hồ sơ → hoàn thiện hồ sơ cán bộ → kiểm tra điều kiện/quyền theo chính sách BE → được gửi đăng ký fanpage**. Tái sử dụng API tạo hồ sơ cho user hiện tại ở phần B, không bắt đăng ký lại tài khoản hoặc tạo mật khẩu để vượt bước này.
3. Việc xác định cán bộ/phê duyệt quyền phải theo chính sách hệ thống và danh tính đã xác minh. Không cấp quyền chỉ vì client gửi `role`, chọn nút "cán bộ", hoặc chỉ dựa vào tên/email chưa kiểm chứng. BE cần thống nhất tiêu chí đủ điều kiện, có cần superadmin duyệt quyền hay không, và phản hồi trạng thái để FE thể hiện rõ.
4. Nếu nghiệp vụ cho phép sinh viên đứng tên đăng ký fanpage, bổ sung luồng gửi yêu cầu dựa trên hồ sơ sinh viên và minh chứng hợp lệ. Không ép sinh viên nhập mã cán bộ/hồ sơ cán bộ giả. BE cần xác nhận rõ chính sách này; phần mô tả không mặc định đã cho phép mọi sinh viên quản trị fanpage.
5. Quyền **gửi hồ sơ đăng ký** phải được xét riêng với quyền **quản trị fanpage cụ thể**. Nếu mở cho sinh viên gửi yêu cầu, chỉ điều chỉnh endpoint đăng ký và các kiểm tra liên quan; không mở toàn bộ `/fanpage-admin/**` cho `STUDENT` hoặc mọi user đã đăng nhập.
6. Giữ fanpage đăng ký mới ở trạng thái `PENDING`, tiếp tục quy trình superadmin duyệt. Không bỏ bước duyệt hoặc tự cấp quyền hệ thống `ADMIN` để giải quyết lỗi.
7. Thống nhất hành vi cho user chỉ có `ADMIN`: nếu superadmin được phép đăng ký thay/tạo fanpage, khai báo rõ trong rule endpoint; nếu không, trả lý do rõ và FE không hiển thị thao tác như đã đủ điều kiện.
8. Đăng nhập Google vào user đã tồn tại phải giữ quyền và hồ sơ hiện có; không tạo user trùng, không hạ quyền, không ghi đè hồ sơ sinh viên/cán bộ.

### E.3. Trạng thái quyền và hợp đồng FE cần

- Nếu quyền thay đổi sau khi hoàn thiện/duyệt hồ sơ, cấp lại phiên/token phù hợp hoặc yêu cầu đăng nhập lại một cách rõ ràng. Không chỉ cập nhật DB rồi để JWT cũ tiếp tục bị 403 trong khi FE đã hiển thị được phép gửi.
- Cung cấp dữ liệu trạng thái có thể dùng để phân biệt: chưa đủ hồ sơ, đang chờ xét quyền, chưa được phép đăng ký và đã đủ điều kiện. BE bàn giao tên trường/mã lỗi chính thức; FE không tự đoán quyền từ email hoặc đổi role trong local state để vượt kiểm tra.
- Dùng cấu trúc lỗi chuẩn với `exceptionCode` và thông báo cụ thể. Phân biệt lỗi quyền endpoint (403) với lỗi thiếu hồ sơ (`USER.002` hiện có), tên fanpage trùng và lỗi tệp minh chứng.
- Không trả JWT/secret trong log chẩn đoán. Khi điều tra lỗi, đối chiếu user ID và tên authorities cần thiết, không yêu cầu người dùng gửi token thô.
- Sau khi BE thống nhất nghiệp vụ và API, FE sẽ đồng bộ điều kiện hiển thị nút/form, bước hoàn thiện hồ sơ và cách làm mới phiên. Chỉ có màn hình staff trên FE không được xem là bằng chứng đủ quyền BE.

### E.4. Tiêu chí nghiệm thu

- [ ] Tài khoản Google mới của cán bộ có luồng hoàn thiện hồ sơ/xét quyền khả dụng, không bị kẹt ở `STUDENT` mà không có cách tiếp tục.
- [ ] Tài khoản sinh viên đăng ký thông thường vẫn chỉ nhận quyền theo chính sách sinh viên; không được nâng quyền trái phép bằng request sửa tay.
- [ ] Nếu cho phép sinh viên đăng ký fanpage, hồ sơ hợp lệ gửi được yêu cầu `PENDING` mà không cần giả hồ sơ cán bộ; các API quản trị khác vẫn kiểm tra quyền riêng.
- [ ] Tài khoản cán bộ đăng ký bằng email/mật khẩu vẫn tạo hồ sơ và đăng ký fanpage bình thường.
- [ ] User Google đã tồn tại giữ nguyên quyền/hồ sơ, không phát sinh user trùng.
- [ ] Tài khoản có cả hồ sơ sinh viên và cán bộ giữ được cả hai và được xét quyền đúng theo chính sách.
- [ ] Sau khi thay đổi quyền, phiên mới dùng được ngay hoặc FE nhận hướng dẫn đăng nhập lại; không còn lệch DB/phiên/hiển thị FE.
- [ ] Tài khoản ID `2` có `FANPAGE_ADMIN`, hồ sơ đầy đủ và phiên hợp lệ gửi đăng ký được; nếu bị 403 phải xác định đúng request/rule/authorities gây chặn.
- [ ] User chỉ có `ADMIN` có hành vi nhất quán giữa FE và BE theo chính sách đã chốt.
- [ ] Fanpage gửi mới vẫn chờ superadmin duyệt; không mở rộng quyền quản trị hàng loạt để sửa lỗi đăng ký.

BE cần bàn giao chính sách cán bộ Google/sinh viên đăng ký fanpage, hợp đồng trạng thái/lỗi, cách làm mới phiên và kết quả kiểm thử. Đây là mô tả yêu cầu; chưa sửa quyền tài khoản, BE hoặc database.
