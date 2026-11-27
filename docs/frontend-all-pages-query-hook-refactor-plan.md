# Kế hoạch refactor query, fetch và React hook trên toàn bộ FE

Ngày lập: 27/11/2026  
Nguồn: [báo cáo audit toàn FE](./frontend-all-pages-query-hook-audit.md) (F01–F21) và [báo cáo fanpage](./fanpage-management-fe-query-hook-review.md).

## Mục tiêu và cách triển khai

- Mỗi query key đại diện cho đúng **một** nguồn dữ liệu và một dạng dữ liệu. Dữ liệu server có một nguồn quản lý trong React Query; local state chỉ giữ trạng thái chỉnh sửa/điều khiển UI.
- UI phân biệt **đang tải**, **lỗi**, **rỗng hợp lệ** và **dữ liệu chưa đầy đủ**. Không thay lỗi bằng `[]`, `0` hoặc dữ liệu mẫu.
- Mutation cập nhật hoặc invalidate đúng những query bị ảnh hưởng. Route/tab không gọi API không dùng tới.
- Với danh sách lớn, phân trang và số tổng phải phản ánh toàn bộ dữ liệu; tránh một request cho mỗi hàng.
- Tách thành các task có thể review riêng. Sau từng task chỉ chạy kiểm thử liên quan; cuối đợt chạy kiểm thử và build toàn FE, đo Network/Profiler khi có môi trường local.

**Trạng thái đầu vào:** worktree đang có thay đổi chưa commit ở một số file fanpage. Trước khi sửa từng task cần xem diff hiện tại và đối chiếu lại F01/F15–F20; không coi phát hiện trong audit là còn nguyên trạng nếu code đã thay đổi. Chỉ đánh dấu task hoàn tất sau khi kiểm tra hành vi thực tế.

## Đợt 0 — Chốt baseline và hợp đồng dữ liệu

### Task 0.1 — Đối chiếu worktree và xác nhận API cần dùng

**Phạm vi:** F01–F21; đặc biệt các file fanpage đang sửa. Lập bảng `issue → còn tồn tại/đang sửa/đã có test`, đọc response BE cho lịch sử đăng ký, số đăng ký theo event và danh sách quản trị. Xác định API nào trả `totalElements`, `totalPages`, số count theo nhiều event, hoặc lọc theo event ID. Ghi rõ task nào cần BE đổi contract.

**Đầu ra:** checklist issue có trạng thái và ví dụ response/giới hạn phân trang. Không sửa code nghiệp vụ trong task này.

**Kiểm tra cuối task:** so sánh checklist với cả 21 ID; xác nhận không bỏ sót file đang có thay đổi chưa commit; các giả định về API có đường dẫn controller/DTO hoặc response local làm bằng chứng.

## Đợt 1 — Chặn crash và thông tin sai rõ ràng

### Task 1 — Bỏ state sao chép và dữ liệu mẫu ở tab Thành viên

**Issue:** F01, F15. Dùng kết quả query làm nguồn hiển thị thành viên/lời mời, giữ hằng mảng rỗng ổn định nếu cần. Bỏ effect đồng bộ `query.data → setState`, không dùng `MOCK_FANPAGE_MEMBERS` khi API trả rỗng. Mutation cập nhật cache có key fanpage tương ứng.

**Kiểm tra cuối task:** test khi query lời mời `enabled: false` và khi đang tải không xuất hiện vòng lặp render; API trả `[]` hiển thị danh sách rỗng; API lỗi hiển thị lỗi/retry; thêm/xóa thành viên và lời mời vẫn cập nhật đúng fanpage. Chạy test component liên quan và typecheck.

### Task 2 — Chỉ hiển thị chứng nhận đã xác thực khi BE trả dữ liệu hợp lệ

**Issue:** F09. Bỏ tên, MSSV, mã chứng thực mẫu khỏi nhánh production; xử lý riêng `isPending`, `isError`, `404`/chưa có chứng nhận và dữ liệu thành công. Chặn tải PDF khi không có certificate ID.

**Kiểm tra cuối task:** mock response thành công, lỗi mạng, 404 và response thiếu trường bắt buộc; không trường hợp lỗi nào hiển thị huy hiệu “Đã xác thực” hoặc dữ liệu mẫu. Chạy test `CertificateCard` và typecheck.

### Task 3 — Thống nhất dạng dữ liệu chi tiết sự kiện và sửa form đăng ký

**Issue:** F02, F07. Dùng cùng một query factory/service chuẩn hóa event cho `EventDetailPage` và `RegistrationForm`; key chứa ID và dạng dữ liệu nhất quán. Form phải có nhánh lỗi tải và chỉ cho submit khi event hợp lệ; bỏ thông tin sự kiện giả.

**Kiểm tra cuối task:** test điều hướng chi tiết → đăng ký → chi tiết và đăng ký → chi tiết với cùng query cache; title/thời gian/địa điểm đúng ở cả hai page. Mock API lỗi hoặc trả event không hợp lệ: form báo lỗi, không gửi đăng ký. Chạy test hai page/form và typecheck.

## Đợt 2 — Tính đúng của danh sách và trạng thái đăng ký

### Task 4 — Giữ lỗi tải feed thay vì biến thành kết quả rỗng

**Issue:** F04. Sửa `eventService.getEvents` để tất cả request trạng thái thất bại thì query reject. Quyết định rõ chính sách lỗi một phần: hoặc yêu cầu đủ tất cả trạng thái, hoặc trả trạng thái `partial` cho UI; không trả mảng thiếu mà coi là thành công đầy đủ. Áp dụng vào Home/Search/preview sử dụng service.

**Kiểm tra cuối task:** test 0/3, 1/3 và 3/3 endpoint thành công; UI phân biệt lỗi/rỗng hợp lệ/dữ liệu một phần theo chính sách đã chọn. Không làm mất danh sách khi một trạng thái không được yêu cầu. Chạy test service và các page bị ảnh hưởng.

### Task 5 — Tạo nguồn trạng thái đăng ký dùng chung, đọc đủ dữ liệu

**Issue:** F05. Đưa logic lịch sử + sắp tới đang lặp ở Home/Search/EventDetail/FanpageDetail vào một service/hook có key theo người dùng. Đọc đủ trang cần thiết hoặc dùng endpoint tra trạng thái theo danh sách event nếu BE hỗ trợ; không kết luận “chưa đăng ký” khi một nguồn lỗi. Chuẩn hóa và loại trùng theo event ID, ưu tiên trạng thái mới nhất theo dữ liệu BE.

**Kiểm tra cuối task:** dữ liệu hơn 100 bản ghi vẫn đánh dấu đúng event ở trang sau; một API lỗi thì UI không khẳng định “chưa đăng ký” sai; cùng một event xuất hiện ở hai nguồn không bị hai trạng thái mâu thuẫn. Test bốn page/hook với cache chung và typecheck.

### Task 6 — Đồng bộ cache sau khi đăng ký từ form riêng

**Issue:** F06. Sau POST thành công ở `RegistrationForm`, cập nhật/invalidate query đăng ký dùng chung ở Task 5 và query event/count liên quan. Giữ đúng trạng thái thành công của form; không invalidate khi POST lỗi.

**Phụ thuộc:** Task 5.

**Kiểm tra cuối task:** đăng ký xong quay lại Home, Search, EventDetail và FanpageDetail đều hiện “đã đăng ký” mà không phải chờ hết `staleTime`; số chỗ/số đăng ký cập nhật sau refetch. POST lỗi không làm UI thành “đã đăng ký”. Chạy test mutation và luồng điều hướng.

### Task 7 — Phân trang lịch sử đăng ký và hiển thị lỗi thật

**Issue:** F10. Sửa `historyService.getMyHistory` để không chỉ lấy trang 0/100. Chọn phân trang UI hoặc đọc các trang theo contract BE; không nuốt lỗi chính thành `[]`. Tối ưu avatar fanpage bằng cache/batch nếu API có hỗ trợ; tránh lookup lặp theo mỗi ID khi chuyển bộ lọc.

**Kiểm tra cuối task:** lịch sử 101+ bản ghi không mất hàng; lỗi API hiện lỗi/retry, response rỗng hợp lệ hiện empty state. Đếm số request avatar theo số ID duy nhất và xác nhận không tải lại không cần thiết. Chạy test service/Page.

### Task 8 — Sửa danh sách fanpage đang theo dõi và cache key sidebar

**Issue:** F11, F21. Một service chuẩn hóa `{id, name, avatarUrl}` cho danh sách đang theo dõi; dùng cùng query key/shape ở Home, EventDetail và `StudentLeftSidebar`. Khi `/fanpages/following` lỗi, không dùng `/fanpages` như danh sách theo dõi. Đảm bảo invalidate sau follow/unfollow.

**Kiểm tra cuối task:** API lỗi không hiển thị fanpage chưa theo dõi; dữ liệu có `orgName` nhưng không có `name` vẫn hiển thị đúng; điều hướng Home ↔ EventDetail không đổi dạng cache; follow/unfollow cập nhật sidebar. Chạy test sidebar/page liên quan.

### Task 9 — Thống nhất cache key feed và danh mục năm học/học kỳ

**Issue:** F03, F12. Đưa tập `statuses` vào key feed hoặc thống nhất một nguồn feed có định nghĩa rõ cho Home và sidebar. Dùng query options/service chung cho `academic-years` và `semesters`; bỏ `catch → []` ở EventHistory để lỗi không đầu độc cache dùng chung.

**Kiểm tra cuối task:** Home và sidebar nhận đúng tập trạng thái bất kể mount order; tải lỗi năm học từ EventHistory không tạo cache `[]` thành công cho TrainingPoints/SV5T; dữ liệu rỗng hợp lệ vẫn hiển thị đúng. Test hai thứ tự mount và chạy test ba page.

### Task 10 — Phân biệt lỗi/rỗng ở fanpage công khai

**Issue:** F14. Thêm `isError` và retry riêng cho query chi tiết fanpage và danh sách sự kiện. Giữ “không tìm thấy” cho 404 xác định được; không dùng nhánh “chưa có sự kiện” khi API lỗi.

**Kiểm tra cuối task:** mock 200 rỗng, 404 và 500 cho từng query; thông điệp và nút retry đúng, phần hồ sơ có thể hiển thị độc lập khi chỉ danh sách sự kiện lỗi. Chạy test `FanpageDetailPage`.

## Đợt 3 — Giảm request trên fanpage và Super Admin

### Task 11 — Thống nhất quyền và trạng thái tải danh sách fanpage quản lý

**Issue:** F16, F19. Service danh sách fanpage không đổi 401/lỗi mạng thành `[]`; UI phân biệt loading/error/empty. Query role không gọi lại member API nếu danh sách đã có quyền tin cậy, hoặc chia sẻ query member có cache. Chỉ ghi fanpage store sau fetch thành công; tránh request lại mỗi lần mở popup nếu dữ liệu còn tươi.

**Kiểm tra cuối task:** 401/500 không hiện “không có fanpage” và không xóa store; danh sách thật rỗng vẫn hiện empty state; role ADMIN/MEMBER đúng khi member API lỗi; số lần gọi member endpoint không bị nhân đôi khi mở tab Thành viên. Chạy test hub/admin/popup và typecheck.

### Task 12 — Chỉ fetch dữ liệu của tab fanpage đang mở, dùng một nguồn sự kiện

**Issue:** F17. Di chuyển hoặc đặt `enabled` cho feed, event list, follower count, stats, reminder theo tab; feed và event list chuyển đổi từ một query `/events/fanpage/{id}`. Xử lý phân trang 100 sự kiện; giữ đúng số `eventsCount` theo tổng BE thay vì độ dài trang đầu nếu có metadata.

**Phụ thuộc:** Task 11 nếu nguồn fanpage ID/quyền được thay đổi.

**Kiểm tra cuối task:** mở tab Thành viên không gọi feed/stats/reminder; mở Home hoặc Sự kiện chỉ gọi endpoint sự kiện một lần cho cùng cache; fanpage >100 event vẫn truy cập đủ qua phân trang; đổi fanpage không lẫn dữ liệu. Dùng spy API trong test và đo Network khi có môi trường local.

### Task 13 — Lấy số đăng ký theo event bằng nguồn tổng hợp

**Issue:** F18. Ưu tiên BE trả `registeredCount` chính xác cho toàn danh sách event hoặc endpoint batch count theo nhiều event ID. Nếu BE chưa có, task gồm hợp đồng API/triển khai BE; FE không tiếp tục lấy trang đầu 200 bản ghi rồi coi là tổng. Tách trạng thái lỗi khỏi số `0`.

**Phụ thuộc:** Task 0.1 xác nhận contract; Task 12 xác định nguồn event list.

**Kiểm tra cuối task:** event có >200 đăng ký và nhiều `CANCELLED` hiển thị đúng số; API lỗi không hiển thị `0` giả. Network trên tab Sự kiện không tăng tuyến tính theo số event. Test 0, 1, 201+ đăng ký và trường hợp lỗi.

### Task 14 — Chuẩn hóa `eventId` theo URL trong workspace fanpage

**Issue:** F20. Lấy `eventId` từ URL làm nguồn lựa chọn hoặc đồng bộ đầy đủ cả khi tham số bị xóa. Không tự rơi về event đầu nếu ID không hợp lệ; khi đổi fanpage hoặc tab, dọn ID không còn phù hợp.

**Kiểm tra cuối task:** back/forward, xóa `eventId`, ID không tồn tại và đổi fanpage không mở sai event; URL và tab đang thấy khớp nhau. Chạy test router/Page.

### Task 15 — Tách tải dữ liệu Super Admin theo tab và giảm N+1

**Issue:** F08. Chuyển 7 dataset từ `loadBackendData` sang các query có key/tab/param rõ ràng, chỉ fetch dữ liệu đang dùng. Thêm phân trang server cho users/fanpages/events; lấy follower count, membership và school majors khi cần hoặc qua API tổng hợp/batch. Mutation invalidate đúng dataset/tab. Những điểm cần BE batch endpoint được ghi thành subtasks phụ thuộc contract.

**Kiểm tra cuối task:** mở Overview không kéo toàn bộ users/events/schools; đổi sang tab tương ứng mới fetch. Với N fanpage/trường, request không tăng theo 2N/N như hiện tại; page 2 và bộ lọc có kết quả đúng. Test tab, mutation và đo Network với dữ liệu nhiều bản ghi.

## Đợt 4 — Tối ưu tìm kiếm gợi ý

### Task 16 — Giảm và hủy request autocomplete

**Issue:** F13. Giới hạn trạng thái và số trang cần cho gợi ý; dùng `AbortSignal` hoặc cơ chế hủy tương đương để request keyword cũ không tiếp tục chiếm tài nguyên. Nếu muốn gộp sự kiện + fanpage thành một call, cần BE endpoint riêng; có thể làm sau nếu số request đo được vẫn cao.

**Kiểm tra cuối task:** nhập nhanh `a → ab → abc` chỉ hiển thị gợi ý của `abc`; request cũ được hủy hoặc không phát sinh sau debounce; số call cho một lần dừng gõ được ghi bằng spy/Network. Test lỗi một trong hai nguồn vẫn hiện nguồn còn lại và trạng thái lỗi phù hợp.

## Cổng kiểm tra cuối đợt

1. Đối chiếu lại F01–F21: mỗi ID có task, test và trạng thái hoàn thành; không coi task đã hoàn tất chỉ vì đã sửa một file.
2. Chạy `npm run typecheck`, `npm test`, `npm run build` sau khi các task liên quan đã nhập chung; xử lý lỗi hồi quy phát sinh từ thay đổi cache key/contract.
3. Khi FE/BE local có dữ liệu và tài khoản thử nghiệm, đo Network/React Profiler trên các luồng chính: Home → EventDetail → Registration, History, Certificate, Search, Fanpage Members/Events, Super Admin. Ghi số request trước/sau, lỗi console, render lặp và trạng thái dữ liệu khi API lỗi.
4. Kiểm tra 401/403/404/500, empty hợp lệ, hơn một trang dữ liệu, đổi tài khoản/fanpage/event, back/forward và mutation. Báo cáo rõ phần nào chỉ xác minh bằng mock nếu môi trường thật chưa sẵn.

**Ngoài phạm vi của plan này:** refactor race condition ở BE đã được hoãn theo yêu cầu trước đó; các task ở đây tập trung vào dữ liệu, cache, hook và request của FE cùng những contract BE cần cho count/phân trang chính xác.
