# Điểm danh fanpage: luồng lưu và các phần API cần bổ sung

> Cập nhật 14/11/2026: nghiệp vụ tự check-in/check-out và xác nhận của BE đã thay đổi. Luồng hiện tại cùng dữ liệu demo được ghi tại [photo-attendance-integration.md](photo-attendance-integration.md). Các mục bên dưới ghi lại tình trạng trước lần pull; mục BE cần tách gửi ảnh và xác nhận đã được BE triển khai bằng `SPENDING_CONFIRM` và `confirm-attendance`.

Cập nhật: 13/11/2026. Chỉ sửa frontend; không triển khai thay đổi backend.

## FE đã thực hiện

- Thủ công: tick check-in/check-out từng người hoặc chọn tất cả; chỉ giữ bản nháp đến khi nhấn **Lưu điểm danh**.
- Bán thủ công: có nút xem ảnh gốc/ảnh xem trước; tick duyệt từng người hoặc tất cả người có ảnh. Không chọn người chưa gửi ảnh; bản ghi đã hoàn thành trên server không được gửi lại.
- Có **Hủy thay đổi**, số sinh viên chưa lưu và bảo vệ khỏi nhấn Lưu lặp trong khi đang gửi.
- Không gọi API cập nhật khi tick, xem ảnh, tìm kiếm hoặc hủy bản nháp. Không gọi đổi trạng thái/đóng sự kiện khi lưu điểm danh.
- Khi lưu, chỉ gửi người thay đổi. Dùng API hiện có `PATCH /registrations/fanpage-member/events/{eventId}/check-in` rồi `/check-out` với body `{ studentUserIds: [...] }`. Người đã check-in chỉ cần gửi check-out; check-in đơn thuần không tự gửi check-out.
- Hai endpoint chưa phải một giao dịch chung: nếu check-in thành công nhưng check-out lỗi, giữ lựa chọn chưa hoàn tất và thử lại check-out, không gửi lại check-in đã được xác nhận.
- Đọc đủ các trang attendees trước khi dùng “tất cả”; không giới hạn ở 200 người đầu tiên. Lỗi tải danh sách không được giả thành danh sách rỗng thành công.
- Thông tin ảnh mới từ server không ghi đè các tick đang chờ lưu. Không sử dụng ID đăng ký thay cho ID tài khoản để gửi cập nhật.

## Tạo sự kiện thật với chế độ nộp ảnh: phần còn thiếu

FE đã chuẩn bị luồng cấu hình trong `FanpageCreateEventView`, payload tạo/cập nhật và các bộ đọc dữ liệu. Phần BE (`EventCreateRequestDto`, `EventCreateDto`, model sự kiện) hiện chưa có hai trường này. Vì vậy chế độ `STUDENT_PROOF` vẫn chưa được lưu/trả lại ổn định trong database thật sau khi tải trang, cho đến khi BE bổ sung hỗ trợ.

- [x] FE gửi `attendanceMethod` (`MANUAL` / `STUDENT_PROOF`) và `attendanceSessionType` (`START` / `END` / `BOTH`) trong payload tạo/cập nhật.
- [x] FE dùng chung `src/shared/utils/attendanceConfig.ts`: nhận cả mã `CHECK_IN/CHECK_OUT` cũ và `START/END`, mặc định dữ liệu cũ là `MANUAL/BOTH`.
- [x] Trang student đọc cấu hình từ `eventInfo` trong lịch sử, hoặc trường cấp đăng ký nếu API cũ trả tại đó; trang chi tiết sự kiện và fanpage cũng giữ cấu hình do API trả.
- [x] Modal nộp ảnh chỉ mở với `STUDENT_PROOF`; chọn đúng phiên, xóa ảnh khi đổi sự kiện và giữ ảnh để thử lại nếu upload lỗi. Chỉ gửi URL ảnh tải lên thật; không dùng ảnh mẫu thay thế khi upload thất bại.
- [ ] BE bổ sung lưu cấu hình trong database, request/response, DTO và mapper; mặc định dữ liệu cũ là `MANUAL` để giữ hành vi hiện tại.
- [ ] API danh sách và chi tiết sự kiện trả lại hai trường để student và fanpage dùng cùng chế độ sau khi tải lại trang.
- [ ] Kiểm tra tạo thật, mở lại trên cả student/fanpage và tải lại trang vẫn giữ chế độ nộp ảnh.

Không tạo sự kiện rồi báo đã hỗ trợ nộp ảnh khi cấu hình này chưa được lưu. Mock server có hai trường này nhưng không thay thế dữ liệu thật.

Có thể dùng luồng FE với mock server hiện có để kiểm tra cấu hình tạo/sửa. Không thêm localStorage để giả lập rằng BE đã lưu chế độ điểm danh, không thay đổi hoặc tạo sự kiện thật trong bước chuẩn bị FE này.

## BE cần xử lý sau: upload ảnh và duyệt ảnh là hai bước riêng

Mã nguồn hiện tại: `RegistrationCommandServiceImpl.checkIn` lưu ảnh rồi đổi trạng thái thành `CHECKED_IN`; `checkOut` lưu ảnh cuối giờ, chuyển `COMPLETED` và cộng điểm/tiêu chí ngay. Vì vậy ảnh cuối giờ do sinh viên tự gửi có thể đã hoàn thành trên server trước khi fanpage duyệt.

- [ ] Với chế độ nộp ảnh, tách endpoint/trạng thái **đã nộp ảnh, chờ duyệt** khỏi trạng thái điểm danh chính thức.
- [ ] Upload ảnh chưa tự hoàn thành/cộng quyền lợi; chỉ chuyển sang hoàn thành khi fanpage lưu duyệt thành công.
- [ ] Trả rõ trạng thái duyệt, ảnh từng phiên, người duyệt, thời gian duyệt và lý do từ chối nếu có.
- [ ] Nếu cần bỏ duyệt/sửa trạng thái đã lưu, cung cấp API tương ứng và quy định thu hồi quyền lợi đã cộng. Hiện FE chỉ cho bỏ tick chưa lưu; chưa có API đảo ngược check-in/check-out đã lưu.
- [ ] Nếu cần một lần lưu nguyên tử cho cả check-in/check-out, bổ sung API nhận trạng thái mong muốn của danh sách và xử lý trong một giao dịch. Hỗ trợ gửi lại an toàn khi mạng lỗi hoặc dữ liệu đã được người khác cập nhật.

Không dùng lại hàm `finalizeAttendance` cũ để lưu: hàm này gom cả người mới check-in vào danh sách check-out và nuốt lỗi, không phù hợp luồng lưu bản nháp.

## Kiểm tra

- [ ] Dữ liệu thật: tick một người/nhiều người không phát sinh PATCH trước Lưu; Hủy thay đổi không gửi PATCH.
- [ ] Lưu check-in riêng, rồi lưu check-out ở lần sau; không gửi lại người đã hoàn thành.
- [ ] Chọn tất cả ảnh: bao gồm ảnh đầu giờ, cuối giờ và trường ảnh cũ; không bao gồm người chưa có ảnh.
- [ ] Lỗi ở từng bước, nhấn Lưu lặp, tải lại dữ liệu trong khi đang chọn và danh sách lớn hơn 200 người.
- [ ] Xác nhận thời điểm cộng quyền lợi thực tế khi lưu check-out theo BE hiện có.
