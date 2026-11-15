# Các phần superadmin cần nối API sau

Cập nhật: 13/11/2026. Đối chiếu với mã nguồn BE hiện có, chưa xác minh dữ liệu của từng tài khoản trong database đang chạy.

Tài liệu này ghi việc cần làm sau; chưa triển khai các thay đổi BE bên dưới. Đường dẫn API không bao gồm tiền tố `/api`. Endpoint ghi **đề xuất** chưa tồn tại trong BE hiện tại.

## 0. Ưu tiên sửa: API người dùng thiếu `userId`

**Đã xác nhận từ mã nguồn và mapper được sinh:** `UserDtoMapper.toUserSummaryDto` chưa ánh xạ `UserJpaEntity.id` sang `UserSummaryDto.userId`. File `ddd-application/target/generated-sources/annotations/com/ddd/application/mapper/UserDtoMapperImpl.java` đang gán `Long userId = null`.

Hậu quả: FE trước đây hiển thị “ID tài khoản undefined”, đối chiếu sai danh sách thành viên fanpage và có nguy cơ gửi thao tác tài khoản với ID không hợp lệ.

- [ ] BE thêm mapping vào `ddd-application/src/main/java/com/ddd/application/mapper/UserDtoMapper.java`, ngay trên phương thức `toUserSummaryDto`:

```java
@Mapping(target = "userId", source = "id")
```

- [ ] Build lại BE để sinh mapper; không sửa trực tiếp file trong `target/generated-sources`.
- [ ] Kiểm tra `GET /users/admin` và `/users/search-users` trả đúng `userId` của từng email.
- [ ] Kiểm tra lại nâng/gỡ quyền và khóa tài khoản với ID thật, không nhầm ID hồ sơ.

FE đã bổ sung xử lý trong lúc chờ BE: khi thiếu ID, đối chiếu email với dữ liệu members để lấy lại ID thực, chỉ chấp nhận email khớp duy nhất một ID. Drawer có thể tìm fanpage bằng email nếu vẫn chưa có ID. Không tự tạo ID từ email; chưa xác định được ID thì vô hiệu hóa thay đổi quyền/trạng thái.

API `GET /fanpages/my-fanpages` hiện chỉ lấy các trang của **người đang đăng nhập**. Superadmin xem người khác đang dùng cách đối chiếu API members từng fanpage; vẫn cần endpoint tra fanpage theo `userId` như ghi ở mục 1.

## 1. Ưu tiên: thông tin admin fanpage và hồ sơ cán bộ

### Hiện trạng

- FE lấy người đại diện từ `GET /fanpages/{fanpageId}/members`, chọn thành viên có `role = ADMIN`.
- `FanpageMemberResponseDto` chỉ có `userId`, `email`, `firstName`, `lastName`, `avatarUrl`, `role`; chưa có mã cán bộ hoặc số điện thoại.
- Database đã có `fanpage_admin_profiles.staff_id` và `phone_number`, liên kết bằng `user_id`.
- `GET /users/admin/{id}/profile` hiện đọc **hồ sơ sinh viên**, không phải hồ sơ cán bộ. Không thể dùng endpoint này để bảo đảm lấy đủ thông tin admin fanpage.
- `GET /users/admin` cũng chưa trả `staffId` hoặc số điện thoại. Vì vậy bảng người dùng còn thiếu mã cán bộ.
- `helpContact` và `helpPhone` là thông tin liên hệ của **fanpage**, không phải tên hoặc số điện thoại cá nhân của admin.

### BE cần làm

- [ ] Bổ sung `staffId` và `phoneNumber` của đúng tài khoản vào response thành viên fanpage; hoặc cung cấp API hồ sơ cán bộ dành cho superadmin.
- [ ] Bổ sung mã cán bộ vào response người dùng hoặc API hồ sơ dùng cho bảng người dùng.
- [ ] Nếu dùng một API hồ sơ chung, phân biệt `studentId` và `staffId`, trả `null` khi không có dữ liệu.
- [ ] Tra hồ sơ bằng `user_id`; không nhầm ID hồ sơ với ID người dùng. FE hiện kiểm tra email khớp trước khi dùng dữ liệu hồ sơ.
- [ ] Bảo đảm superadmin xem được admin của fanpage bị khóa/vô hiệu hóa. API members hiện kiểm tra fanpage `isActive = true`, nên fanpage không hoạt động có thể không đọc được danh sách admin.
- [ ] Chỉ trả các trường hồ sơ cá nhân cho vai trò được phép; không mở rộng dữ liệu nhạy cảm của API members công khai một cách mặc định.

Ví dụ các trường cần trả cho **superadmin**; giá trị chỉ minh họa:

```json
{
  "userId": 20,
  "firstName": "Nguyễn Văn",
  "lastName": "An",
  "email": "admin@example.edu.vn",
  "role": "ADMIN",
  "staffId": "CB123",
  "phoneNumber": "0901234567"
}
```

### FE cần làm sau khi BE bổ sung

- [ ] Đối chiếu tên trường thực tế, cập nhật `mapAdminFanpage` và `mapAdminUser` trong `src/features/super-admin/services/superAdminService.ts`.
- [ ] Nếu BE tạo endpoint hồ sơ cán bộ riêng, thay lời gọi hồ sơ sinh viên đang dùng để bổ sung thông tin admin.
- [ ] Xác nhận mã và SĐT xuất hiện trong bảng người dùng, bảng fanpage và drawer fanpage.
- [ ] Giữ riêng SĐT cá nhân admin và SĐT liên hệ fanpage; không tự lấy email làm mã hoặc tên.

FE đã hỗ trợ đọc `staffId` và `phoneNumber` của admin khi API trả chúng. Các trường thiếu vẫn hiện “Chưa có dữ liệu”.

### Quy ước hiện tại: ba vai trò và hồ sơ gốc

- Bảng người dùng hiển thị mã định danh theo hồ sơ: MSSV cho sinh viên, mã CB cho cán bộ. Không dùng quyền `FANPAGE_ADMIN` để khẳng định người đó là cán bộ.
- Drawer sinh viên có MSSV, khóa, khoa/trường, ngành và đơn vị Đoàn/Hội nếu có dữ liệu.
- Drawer cán bộ có mã CB, đơn vị công tác, chức danh và SĐT nếu API trả hồ sơ cán bộ.
- Superadmin hoặc tài khoản chưa có hồ sơ không bị gán các trường học tập giả. Nếu có cả hai hồ sơ thì hiển thị hai nhóm riêng.
- Bảng và drawer chỉ hiển thị ba vai trò: **Super admin, Cán bộ, Sinh viên**. Super admin có ưu tiên hiển thị; loại sinh viên/cán bộ lấy từ hồ sơ gốc, không lấy quyền `FANPAGE_ADMIN` làm bằng chứng là cán bộ.
- FE chỉ có thao tác **Cấp quyền Super admin** hoặc **Gỡ quyền Super admin**, không cho chuyển trực tiếp sinh viên ↔ cán bộ.
- Dùng API **đã có** `PATCH /users/admin/{id}/change-roles`, body là mảng tên quyền. Khi nâng/gỡ chỉ thêm/bỏ `ADMIN`, giữ nguyên các quyền còn lại và hồ sơ cá nhân.
- Nếu tài khoản chỉ có `ADMIN`, FE chỉ khôi phục quyền sinh viên/cán bộ khi có hồ sơ gốc xác định. Thiếu thông tin gốc thì không tự chọn loại tài khoản để hạ quyền.
- Tab Cán bộ lọc theo hồ sơ cán bộ thực nhận được; Super admin có tab riêng. Khi BE chưa trả hồ sơ cán bộ, tab Cán bộ có thể chưa liệt kê đủ cán bộ thực tế. Loại tài khoản chưa xác định hiển thị dấu `—`, không tự gán là cán bộ.
- Fanpage người dùng tham gia hiển thị trong drawer, kèm vai trò **Quản trị viên/Thành viên** tại từng fanpage. FE đối chiếu đúng `userId` trong API members, không suy từ quyền hệ thống hoặc danh sách theo dõi.

- [ ] BE bổ sung API hồ sơ cán bộ hoặc trả hồ sơ theo loại trong `/users/admin`. Hợp đồng FE hiện hỗ trợ `studentProfile: { studentId, kNumber, schoolName, majorName, associationName }` và `staffProfile: { staffId, orgName, title, phoneNumber }`; đây là cấu trúc FE đã chuẩn bị, chưa phải cam kết API BE hiện có.
- [ ] Xác định loại hồ sơ bằng dữ liệu hồ sơ hoặc trường loại tài khoản do BE trả; không chỉ dựa vào đuôi email hoặc quyền fanpage.
- [ ] Kiểm tra trường hợp một tài khoản có nhiều quyền, hồ sơ sinh viên và quyền quản trị fanpage; đổi quyền rồi tải lại trang vẫn giữ đúng hồ sơ cá nhân.
- [ ] BE cung cấp loại tài khoản gốc, kể cả khi người dùng đã được nâng lên Super admin; bảo đảm nâng/gỡ quyền không làm mất liên kết hồ sơ sinh viên/cán bộ.
- [ ] BE nên cung cấp API dành cho superadmin để lấy fanpage theo `userId` (ví dụ **đề xuất** `GET /users/admin/{id}/fanpages`). Hiện FE phải đọc danh sách fanpage rồi kiểm tra members từng trang. API members hiện không hỗ trợ fanpage `isActive = false`; danh sách có thể chưa đầy đủ và FE sẽ báo rõ thay vì kết luận không tham gia fanpage.

## 2. Số đăng ký sự kiện

- `EventResponseDto` hiện chưa có `registeredCount`.
- API attendees hiện có: `GET /registrations/fanpage-member/fanpages/{fanpageId}/events/{eventId}/attendees`.
- API này kiểm tra người gọi là thành viên fanpage; không phù hợp để superadmin đếm toàn hệ thống. Đếm độ dài một trang attendees cũng không cho tổng chính xác.

- [ ] BE bổ sung `registeredCount` vào response `/events/admin`, đếm lượt đăng ký chưa hủy; hoặc tạo API thống kê dành riêng cho superadmin.
- [ ] Trả số `0` khi thực sự không có lượt đăng ký; không dùng `0` thay cho lỗi hoặc trường chưa hỗ trợ.
- [ ] FE kiểm tra cột đăng ký và drawer sau khi BE bổ sung. FE đã nhận `registeredCount` và đã bỏ thanh tiến độ/phần trăm.

## 3. Các thao tác chưa có API phù hợp

| Thao tác                         | Hiện trạng                                                                                         | Cần làm sau                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Từ chối đăng ký fanpage có lý do | Có API duyệt, khóa, mở khóa; chưa có API lưu việc từ chối và lý do                                 | BE bổ sung nghiệp vụ từ chối có lý do; FE nối `handleRejectFanpage`                                              |
| Superadmin ẩn/khôi phục sự kiện  | Có đổi trạng thái cho thành viên fanpage; chưa có API kiểm duyệt riêng cho superadmin              | BE bổ sung quyền và API kiểm duyệt; FE nối `handleToggleHideEvent`                                               |
| Đặt học kỳ hiện hành             | Request cập nhật học kỳ hiện không nhận trạng thái/`isCurrent`; chưa có endpoint chọn kỳ hiện hành | Thống nhất cách xác định kỳ hiện hành; nếu chọn thủ công thì BE bổ sung API và FE nối `handleSetCurrentSemester` |

Các handler này nằm trong `src/pages/SuperAdminPage.tsx`, hiện báo chưa hỗ trợ thay vì giả lập cập nhật thành công tại FE.

- [ ] Riêng danh sách học kỳ: FE hiện gọi `GET /semesters` (chỉ kỳ hoạt động). Đổi sang API **đã có** `GET /semesters/admin` nếu trang superadmin cần hiển thị toàn bộ học kỳ.

## 4. Hồ sơ minh chứng và dữ liệu thống kê còn thiếu

- [ ] `FanpageResponseDto` chưa trả `proofFileUrl`/`proofFileName`: cần BE trả dữ liệu hồ sơ thật để nút xem minh chứng hoạt động.
- [ ] Nếu cần hiển thị tổng sự kiện **đã tổ chức**, cần thống nhất bộ lọc trạng thái/thời gian với BE. Hiện FE đếm các sự kiện API trả về của fanpage, bao gồm các trạng thái khác nhau; không đồng nghĩa toàn bộ đã tổ chức xong.
- [ ] Tổng lượt check-in, tăng trưởng người dùng/sự kiện và thống kê theo tuần cần API thống kê thật. Không khôi phục biểu đồ hoặc tỷ lệ mẫu.
- [ ] Số sinh viên theo ngành chưa được API ngành trả về; giữ dấu thiếu dữ liệu cho tới khi có số thật.

## 5. Người theo dõi: đã nối, cần kiểm tra dữ liệu thực tế

- Đã gọi `GET /fanpages/{id}/followers/count`, đọc trường `followerCount`.
- Đã ưu tiên API đếm thay vì số cũ trong danh sách; tải lại khi mở drawer.
- Lỗi tải hiện “Chưa tải được dữ liệu”; số `0` hợp lệ vẫn hiển thị `0`.

- [ ] Đối chiếu fanpage có người theo dõi thật với kết quả API. Nếu API vẫn trả `0`, kiểm tra dữ liệu following của đúng fanpage và trạng thái `FOLLOWING`; không gán số giả ở FE.
- [ ] Kiểm tra fanpage không hoạt động: endpoint đếm hiện yêu cầu `isActive = true`; nếu superadmin cần xem số này thì BE phải hỗ trợ trường hợp đó.

## 6. Kiểm tra sau khi nối API

- [ ] Admin fanpage là cán bộ: đúng họ tên, email, `staffId`, SĐT cá nhân.
- [ ] Hồ sơ sinh viên: MSSV vẫn lấy từ `studentId`, không bị thay bởi mã cán bộ.
- [ ] Fanpage khóa hoặc thiếu hồ sơ: không hiển thị thông tin của người khác hoặc dữ liệu tự tạo.
- [ ] Người theo dõi và lượt đăng ký: kiểm tra cả số `0`, số lớn hơn `0` và lỗi API.
- [ ] Thay đổi dữ liệu rồi tải lại trang: kết quả vẫn đúng theo BE.
- [ ] Chạy build, lint phần sửa và bộ test `src/features/super-admin`.

## 7. Drawer sự kiện và quyền lợi: dữ liệu cần bổ sung sau

Theo yêu cầu: chỉ sửa FE. Các thay đổi BE từng thêm cho `registeredCount`, `criteriaId`, mapper, entity và test đã được hoàn tác; các mục dưới đây chưa triển khai ở BE.

### Số đã đăng ký / chỉ tiêu

- [ ] Bổ sung `registeredCount` vào API `/events/admin` như mục 2. Giữ `capacity` làm chỉ tiêu; không lấy chỉ tiêu thay cho số đăng ký.
- [ ] Đếm tất cả lượt đăng ký chưa hủy của đúng sự kiện, bao gồm đã check-in/hoàn thành; loại `CANCELLED`. Không đếm độ dài một trang attendees.
- [ ] Khi bổ sung, cập nhật `EventInfoDto`, `EventResponseDto`, phần truy vấn/ánh xạ và kiểm thử. Cách triển khai đếm cần tránh phát sinh một truy vấn riêng cho mỗi dòng trong danh sách.
- FE hiện giữ “Chưa có dữ liệu” nếu API chưa trả số đăng ký; số `0` thật vẫn hiển thị bình thường.

### Tiêu chí sinh viên 5 tốt: FE đã đồng bộ, BE chỉ còn cải tiến định danh

- API sự kiện hiện chỉ trả `criteriaName`, chưa trả `criteriaId`. FE student và superadmin đã dùng chung bộ đối chiếu cây `/criterias`: ưu tiên ID nếu có; nếu thiếu ID thì tra tên con khớp chính xác và chỉ ghép tên nhóm khi kết quả không mơ hồ.
- [x] Student và superadmin dùng chung `src/shared/utils/sv5tLabels.ts`, không còn hai cách tra tiêu chí riêng.
- [x] Đã hiển thị `Tình nguyện tốt (Tên mục con cuối cùng)` ngay khi API chỉ có tên con nhưng đối chiếu được chính xác. Bỏ nội dung cấp trung gian như “Đạt thêm 01 trong 05 tiêu chí…” và dấu phân cách `·`.
- [x] Đã kiểm thử cách tra bằng ID, tra tên khi thiếu ID, tên trùng giữa các nhóm và lỗi tải cây tiêu chí; TypeScript đạt.
- [ ] Cải tiến BE sau này: trả thêm `criteriaId` của tiêu chí gắn với sự kiện trong `EventInfoDto` và `EventResponseDto`; ánh xạ từ `criteria.id` trong `EventDtoMapper`. Mục này giúp phân biệt tiêu chí trùng tên, không còn là việc bắt buộc để hiện tên mục lớn.
- [ ] Khi BE bổ sung ID, kiểm tra lại trên dữ liệu thật: đúng nhóm khi tên mục con trùng nhau, ID không tồn tại và ID/tên không khớp.
- FE đã hỗ trợ hiển thị tên nhóm khi thiếu ID nhưng tên con xác định được duy nhất một nhãn nhóm. Nếu tên trùng giữa các nhóm hoặc không tải được cây, giữ tên thực nhận; không suy đoán theo từ khóa. Bổ sung ID ở BE là cải tiến cần làm sau để phân biệt trường hợp trùng tên, không phải điều kiện bắt buộc cho mọi sự kiện.
