# Điểm danh bằng ảnh theo BE ngày 14/11/2026

## Cập nhật kết thúc sự kiện ngày 15/11/2026

- BE nền `fdf77b9` đã build và khởi động lại. Có sửa local để lưu trạng thái sự kiện `COMPLETED`, giữ đăng ký `CANCELLED`/`RECORDED`, bỏ qua lần kết thúc đã thành công và chặn điểm danh tiếp sau khi kết thúc. Các sửa này chưa commit/push.
- Nút **Kết thúc sự kiện** gọi `PATCH /registrations/fanpage-member/events/{eventId}/event-completed`, thay cho API chỉ đổi trạng thái `CLOSED`. Modal báo số người được ghi nhận và sẽ bị tính vắng theo dữ liệu đã lưu; lựa chọn chưa lưu không được áp dụng.
- `COMPLETED`/`CONFIRMED` của đăng ký là đã hoàn tất điểm danh, chưa phát quyền lợi. Khi kết thúc: các đăng ký này thành `RECORDED` và BE phát quyền lợi; người chưa hoàn tất, kể cả `SPENDING_CONFIRM`, thành `ABSENT`. Đăng ký đã hủy giữ nguyên.
- FE hỗ trợ `RECORDED` trong danh sách BTC và lịch sử sinh viên; sự kiện `COMPLETED` nằm ở nhóm đã kết thúc và khóa thao tác. Sau API thành công tải lại đăng ký và dữ liệu quyền lợi.
- Đã cập nhật constraint DB cho `registrations.RECORDED` và `events.COMPLETED` bằng `Event-Management-Backend/scripts/registration-status-migration.sql`.
- Sự kiện **17** `[TEST 15/11] Thủ công - kết thúc và đánh vắng`, **18** `[TEST 15/11] Gửi ảnh - xác nhận rồi kết thúc` còn `PUBLISHED`; user demo 1 và user 136 đều `REGISTERED` để thử từ đầu. Cùng fanpage 1, quyền lợi 1 điểm mục 511. File/camera dùng luồng sinh viên hiện có.
- Sự kiện QA **16** dùng riêng để kiểm tra API thật: HTTP 200, kết thúc lưu `COMPLETED`, 2 `RECORDED`, 4 `ABSENT`, 1 `CANCELLED`; gọi lại HTTP 200 giữ nguyên và tổng chỉ 2 giao dịch thưởng, mỗi sinh viên demo 1 điểm. Không kết thúc sự kiện 17/18 hoặc các sự kiện cũ.

## Điểm danh thủ công

- Với danh sách đang dùng luồng ảnh, nút **Điểm danh thay** cạnh **Xuất CSV** mở modal riêng khi sự kiện còn mở. Check-in chỉ nhận `REGISTERED`; check-out nhận `CHECKED_IN` và `SELF_CHECKED_IN`, không nhận người chờ duyệt, hoàn thành, vắng hoặc đã hủy.
- Modal mặc định tick tất cả người đủ điều kiện theo từng lượt, hỗ trợ tìm kiếm và chọn tất cả trong kết quả đang lọc. Lưu một lượt chỉ gọi một API thủ công, không nối check-in/check-out; không gọi API xác nhận ảnh hoặc kết thúc sự kiện. Lỗi giữ lựa chọn, có khóa gửi lặp và tải lại dữ liệu trước khi thử lại.
- Bảng danh sách dùng cùng kiểu chữ và màu xám cho MSSV; thời gian vào/ra ở cùng một dòng, ngăn bằng dấu `·`, dùng `—` nếu chưa có một mốc thời gian.

- Tách lượt Check-in và Check-out. Khi mở trang, ưu tiên Check-in nếu còn người `REGISTERED`; nếu chỉ còn người `CHECKED_IN`, mở lượt Check-out.
- Tự tick tất cả người đủ điều kiện trong lượt đang mở, chưa gửi API. BTC bỏ tick người vắng rồi nhấn **Lưu**. Các lựa chọn bỏ tick được giữ khi dữ liệu tải lại nền.
- Lượt Check-in chỉ gửi `REGISTERED`; lượt Check-out chỉ gửi `CHECKED_IN`. Không tự ghép hai API vào cùng một lần Lưu. Sau khi lưu check-in, BTC chủ động chuyển sang lượt Check-out.
- Check-in/Check-out là hai tab. Checkbox ở đầu dòng thay cho cột thao tác; checkbox tiêu đề chỉ chọn/bỏ chọn người đủ điều kiện trong danh sách đang lọc, giữ nguyên lựa chọn ngoài bộ lọc. Người đã hoàn thành, vắng hoặc hủy không chọn được.
- Thanh **Đã chọn n · Hủy thay đổi · Lưu** chỉ hiện khi còn người được chọn để lưu. Các nút thao tác nằm bên phải; không còn nút Check-in/Check-out tất cả riêng.
- Các số thống kê và nhãn trạng thái lấy từ dữ liệu đã lưu trên BE, không tính tick mặc định là đã hoàn thành.
- **Kết thúc sự kiện** mở hộp xác nhận, báo nếu có lựa chọn chưa lưu, gọi API `event-completed` rồi khóa giao diện điểm danh. Nếu thất bại giữ trạng thái mở và lựa chọn cũ. BE đánh vắng các đăng ký chưa hoàn tất, không tự lưu các tick trước khi kết thúc.

## Luồng đã nối

1. Sinh viên mở Lịch sử đăng ký (`/history`), chọn Điểm danh.
2. Chọn tệp PNG/JPG/WEBP tối đa 5 MB hoặc mở camera, chụp và xem trước ảnh.
3. FE upload ảnh thật qua `mediaService` (category `EVIDENCE`), gửi URL bằng `PATCH /registrations/me/events/{id}/check-in`.
4. BE chuyển `REGISTERED` → `SELF_CHECKED_IN`. Lần tiếp theo form tự chuyển sang gửi ảnh cuối buổi qua `/check-out`.
5. BE chuyển sang `SPENDING_CONFIRM`. FE hiện chờ xác nhận, chặn gửi lại và chưa tính hoàn thành.
6. Ban tổ chức xem ảnh và xác nhận trực tiếp trong modal; hoặc tick nhiều người rồi nhấn **Xác nhận (n)**. Thanh hàng loạt chỉ hiện khi đã chọn, có nút **Bỏ chọn** và không dùng nút Lưu cho luồng ảnh. FE gọi `PATCH /registrations/fanpage-member/events/{id}/confirm-attendance` với `{studentUserIds: [...]}`; không gọi check-in/check-out lại cho người đang chờ xác nhận. Đã bỏ nút Xác nhận riêng trên mỗi dòng.
7. `CONFIRMED` và `COMPLETED` được tính hoàn tất điểm danh. ĐRL/quyền lợi do BE cộng ở bước **Kết thúc sự kiện**, khi chuyển thành `RECORDED`; FE tải lại dữ liệu server.

Đường dẫn API ở trên chưa bao gồm tiền tố `/api`.

## API danh sách và minh chứng mới

- Đã pull BE đến commit `93798bf`, build lại và khởi động BE mới ở cổng 8080.
- FE lấy danh sách BTC từ `GET /registrations/fanpage-member/fanpages/{fanpageId}/events/{eventId}/registrations`. API trả Spring Page; FE đọc hết các trang theo `last`, lấy hồ sơ từ `studentProfile`, ảnh từ `checkInEvidenceUrl`/`checkOutEvidenceUrl` và thời gian từ `checkInAt`/`checkOutAt`.
- Kiểm tra API thật với BTC demo, event **15**: 7 bản ghi, đủ 7 hồ sơ, 2 ảnh đầu giờ và 1 ảnh cuối giờ, kèm thời gian tương ứng. FE ẩn đăng ký hủy nên hiển thị 6 người. Bộ test danh sách/chi tiết đạt **30/30**, build FE và lint các file thực thi đã sửa đạt.

- Nút **Xuất CSV** gọi `GET /registrations/fanpage-member/fanpages/{fanpageId}/events/{eventId}/attendees/export`, nhận Blob và tải nguyên file BE, không dựng lại từ danh sách đang lọc. API đã trả HTTP 200 với `text/csv; charset=UTF-8` khi kiểm tra local event 13. Có khóa gửi lặp, trạng thái đang xuất và báo lỗi.
- Nút **Xem ảnh** đặt trong cột **Điểm danh & minh chứng**, chỉ hiện khi có URL ảnh thực trong response. Nếu BE chưa trả URL thì ẩn nút; hộp xem vẫn hỗ trợ riêng ảnh đầu/cuối buổi khi có dữ liệu.
- Trong modal minh chứng, **Xác nhận** gọi API xác nhận ngay cho sinh viên đang xem, không cần nhấn Lưu bên ngoài. Thành công hiện **Đã xác nhận**; thất bại giữ modal và hiển thị lỗi để thử lại. Các lựa chọn của sinh viên khác vẫn được giữ.
- Các tab và nhóm nút hủy/lưu/xác nhận đã căn phải. Checkbox chọn tất cả đặt ở tiêu đề đầu bảng. Khi tất cả bản ghi hoàn thành thì không hiện nhóm tab điểm danh; không còn cột thao tác hay chữ Đã lưu/Vắng lặp lại trạng thái.

- BE không lưu/trả `attendanceMethod` và `attendanceSessionType`. FE sinh viên dùng trạng thái đăng ký để mở đúng bước, theo nghiệp vụ hai bước của BE; không tự lưu cấu hình giả vào localStorage. Các sự kiện đang hoạt động/đã xuất bản đều có thể dùng API tự điểm danh khi đã bắt đầu. Chưa thể cấu hình một sự kiện chỉ cho phép ảnh bằng DB hiện có.
- Endpoint `/attendees` cũ vẫn không trả ảnh; FE đã chuyển sang `/registrations` mới để BTC xem minh chứng đầu/cuối buổi. Nút xem chỉ hiện nếu có ít nhất một URL; bước chưa có ảnh hiện “Chưa có ảnh”. FE không lấy ảnh banner làm minh chứng, không truy cập trực tiếp DB từ trình duyệt.
- Camera trực tiếp cần HTTPS hoặc localhost và quyền camera. Nếu không mở được camera, sinh viên vẫn chọn tệp; trình duyệt di động có thêm input `capture` dùng camera thiết bị. Chụp thật trên thiết bị cần kiểm tra quyền và phần cứng; các bài test mô phỏng camera.

## Dữ liệu thử đã thêm vào DB local

- Event ID: **12**; tên: **[DEMO] Điểm danh bằng ảnh - chọn tệp hoặc chụp hình**.
- Fanpage ID **1**, Đoàn Khoa CNTT & TT; trạng thái `PUBLISHED`, bắt đầu **08:00 ngày 14/11/2026**, học kỳ **1**.
- Quyền lợi: **1 điểm** tại danh mục **511**, chỉ do BE cộng sau khi xác nhận.
- Hai đăng ký `REGISTERED`: user **1** (`loc@student.ctu.edu.vn`) và user **136** (`locb2303827@student.ctu.edu.vn`).
- Người quản trị fanpage hiện có: user **2**, `organizer@ctu.edu.vn`.
- Chỉ thêm sự kiện, quyền lợi và đăng ký mới; không đổi mật khẩu/quyền tài khoản hay điểm danh sự kiện cũ. Không điền ảnh minh chứng giả.

Đã kiểm tra bằng API local: đăng nhập tài khoản demo, đọc sự kiện 12 và đăng ký từ history. Không gửi điểm danh/cộng điểm qua API thật để giữ hai đăng ký sẵn sàng cho người dùng thử.

## Sửa môi trường chạy và xác minh API thật tối 14/11

- Nguyên nhân sinh viên tự hoàn thành: tiến trình BE ở cổng 8080 đang nạp JAR module trong `.m2` được build ngày 11/11, thay vì mã nguồn mới ngày 14/11. Đã build/install lại cả reactor và khởi động JAR mới. Không thay đổi mã nguồn nghiệp vụ BE.
- DB còn `registrations_status_check` chỉ cho phép bốn trạng thái cũ. Đã chạy migration bổ sung bốn trạng thái mới, giữ nguyên các bản ghi hiện có. Script tái sử dụng: `Event-Management-Backend/scripts/registration-status-migration.sql` ở workspace.
- Thêm nút **Xác nhận** trực tiếp từng người trong danh sách admin; vẫn giữ chọn nhiều người rồi Lưu. Nút trực tiếp chỉ gọi `confirm-attendance`, không gọi check-in/check-out và chặn nhấn lặp khi đang gửi.
- Thêm sự kiện demo **13**, **[DEMO] Điểm danh bằng ảnh - chờ ban tổ chức xác nhận**, cùng fanpage/quyền lợi như sự kiện 12. User **136** vẫn `REGISTERED`, sẵn sàng để người dùng thử.
- Đã upload ảnh PNG có đánh dấu kiểm thử qua API media/Cloudinary thật và gửi API cho user demo **1**, event **13**: check-in → `SELF_CHECKED_IN`, check-out → `SPENDING_CONFIRM`; sau đó đăng nhập organizer và xác nhận → `CONFIRMED`. Đây là kiểm thử API thật, không chỉ mock FE.
- Lượt user 136 ở event 12 đã `COMPLETED` bởi BE cũ được giữ nguyên; không tự hoàn tác điểm/quyền lợi đã phát sinh. Dùng event 13 để thử lại luồng mới.
- Build BE hiện tại bỏ qua biên dịch/chạy test (`-Dmaven.test.skip=true`) vì bộ test API đang lỗi biên dịch khi build thông thường. FE build đạt và 20 test liên quan nút xác nhận/trạng thái lịch sử đạt.
