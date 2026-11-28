# Báo cáo rà soát query, fetch và React hook trên toàn bộ FE

Ngày rà soát: 27/11/2026  
Nhánh: `codex/frontend-all-pages-audit`  
Phạm vi: 22 page đang được router sử dụng, các tab/modal/hook/service trực tiếp phục vụ page, và 2 page hiện không có route. Báo cáo [fanpage](./fanpage-management-fe-query-hook-review.md) là một phần của kết quả này.

## Cách kiểm tra và giới hạn

- Đối chiếu `src/app/router.tsx`, page, component dữ liệu, query key, service và UI sử dụng dữ liệu. Các URL alias cùng trỏ tới một page được tính một luồng.
- Kiểm tra điều kiện `enabled`, dữ liệu mặc định, effect, cập nhật sau mutation, phân trang, lỗi bị nuốt và các request lặp.
- Chạy 2 tập kiểm thử sẵn có (`eventFeedPagination` và `FanpageAdminPage`): **4 test đạt**. Chúng không kiểm chứng các lỗi được nêu dưới đây.
- Chưa có đo Network/React Profiler: không có FE local đang chạy tại `localhost:5173`. Số request trong báo cáo là suy ra từ vòng lặp và endpoint trong code, không phải số đo trình duyệt.
- Mức P1/P2 thể hiện mức ưu tiên xử lý. Các nhận định có điều kiện kích hoạt được ghi rõ; không xem mọi polling hay mọi `useEffect` là lỗi.

## Kiểm kê route và nguồn dữ liệu

| Page / route (gộp alias) | Nguồn dữ liệu và hook chính | Kết quả |
| --- | --- | --- |
| `LoginPage` (`/login`, `/dang-nhap`) | Login mutation, xóa query cache trước khi lưu phiên mới | Đã rà; không ghi lỗi query/effect riêng. |
| `RegisterPage` (`/register`, `/dang-ky`) | Form đăng ký | Đã rà; không ghi lỗi riêng. |
| `VerifyOtpPage` (`/verify-otp`) | Effect đếm ngược có cleanup | Đã rà; không ghi lỗi riêng. |
| `StudentOnboardingPage`, `StaffOnboardingPage` | Form, effect đồng bộ email/mã người dùng | Đã rà; không ghi lỗi riêng. |
| `FanpageRegistrationPage` (`/register/fanpage`, `/dang-ky-fanpage`) | Effect kiểm tra điều kiện đăng ký, submit API | Đã rà; không ghi lỗi riêng. |
| `StaffFanpageHubPage` (`/staff/fanpages`) | Profile, lời mời và fanpage của cán bộ | F16. |
| `FanpageAdminPage` (`/fanpage/admin`, `/fanpage/workspace`, `/fanpage/manage`, `/admin/fanpage`) | Fanpage, sự kiện, feed, member, stats, dashboard, tab/modal | F01, F15–F20 và báo cáo fanpage. |
| `SuperAdminPage` (`/admin`, `/super-admin`) | Bảy tập dữ liệu quản trị; dashboard và modal con | F08. |
| `HomePage` (`/`) | Feed, gợi ý, fanpage theo dõi, sự kiện đã lưu, đăng ký | F03–F05, F21. |
| `ProfilePage` (`/profile`) | Hồ sơ sinh viên, mutation lưu | Đã rà; không ghi lỗi riêng. |
| `SearchPage` (`/events`, `/events/search`, `/search`) | Sự kiện, fanpage, bộ lọc, đăng ký | F04, F05. |
| `EventDetailPage` (`/events/:id`) | Chi tiết sự kiện, follow/save, đăng ký | F02, F05. |
| `RegistrationPage` (`/events/:id/register`) | `RegistrationForm`: hồ sơ, sự kiện, mutation đăng ký | F02, F06, F07. |
| `EventHistoryPage` (`/history`) | Năm học, học kỳ, lịch sử đăng ký, modal điểm danh | F10, F12. |
| `SavedEventsPage` (`/saved`, `/events/saved`) | Sự kiện đã lưu | Đã rà; bị ảnh hưởng gián tiếp bởi F05. |
| `CertificatePage` (`/certificate`) | `CertificateCard`: chứng nhận theo `regId` | F09. |
| `NotificationsPage` (`/notifications`) | Infinite query thông báo, lời mời, unread count | Đã rà; không ghi lỗi riêng. |
| `TrainingPointsPage` (`/training-points`, `/drl`) | Năm học, học kỳ, cây điểm, summary, giao dịch khi mở modal | Đã rà; bị ảnh hưởng bởi cache năm học chung ở F08. |
| `Sv5tPage` (`/sv5t`, `/sinh-vien-5-tot`) | Năm học, cây tiến độ, mutation ghi nhận | Đã rà; bị ảnh hưởng bởi cache năm học chung ở F08. |
| `FanpageDetailPage` (`/fanpage`, `/fanpage/:id`, `/fanpages/:id`) | Fanpage, sự kiện, đăng ký, bộ lọc | F05, F14. |
| `NotFoundPage` (`*`) | Không có fetch/hook dữ liệu | Đã rà; không áp dụng. |

`DashboardPage` và `CheckInPage` không được `router.tsx` gắn route hiện tại. Đã rà tĩnh component trực tiếp: `DashboardPage` dùng hàng chờ mẫu; `CheckInPage` dùng `PhotoCheckIn`. Không tính chúng vào lỗi của route đang hoạt động.

## Phát hiện mới trên toàn FE

### F02 · P1 · Cache chi tiết sự kiện chứa hai dạng dữ liệu

[`EventDetailPage.tsx`](../src/pages/EventDetailPage.tsx) dòng 37–45 dùng key `['events', id]` và `eventService.getEventById`, kết quả đã qua `normalizeEvent`. [`RegistrationForm.tsx`](../src/features/registration/components/RegistrationForm.tsx) dòng 39–46 dùng **cùng key** nhưng gọi `/events/{id}` và trả DTO thô. Query nào chạy trước có thể quyết định dạng object mà cả hai page nhận trong thời gian cache còn hiệu lực. `EventDetailPage` truyền object đó vào `EventFeedCard`, nơi dùng các trường chuẩn hóa như `title`, `startTime`, `location`.

**Hướng sửa:** dùng cùng service chuẩn hóa cho cả hai page, hoặc tách key theo dạng dữ liệu. Test điều hướng cả hai chiều: chi tiết → đăng ký và đăng ký → chi tiết.

### F03 · P1 · Feed và sidebar dùng cùng key với bộ lọc khác nhau

[`HomePage.tsx`](../src/pages/HomePage.tsx) dòng 72–75 dùng `['events', 'feed']` cho `getEvents({ statuses: ['PUBLISHED'] })`. [`StudentLeftSidebar.tsx`](../src/features/events/components/StudentLeftSidebar.tsx) dòng 68–72 dùng cùng key cho `getEvents()` mặc định lấy `PUBLISHED`, `COMPLETED`, `CLOSED`. React Query chia sẻ cache dù hai consumer yêu cầu hai tập dữ liệu khác nhau. Kết quả phụ thuộc request nào khởi tạo cache; dấu “fanpage có bài mới” ở sidebar có thể tính từ tập trạng thái khác dự kiến.

**Hướng sửa:** thống nhất một tập dữ liệu nguồn hoặc đưa bộ lọc trạng thái vào query key.

### F04 · P1 · Lỗi tải sự kiện bị hiển thị thành danh sách rỗng

[`eventService.ts`](../src/features/events/services/eventService.ts) dòng 681–719 lấy nhiều trạng thái bằng `Promise.allSettled`, chỉ gom kết quả `fulfilled` rồi trả mảng. Nếu **tất cả** request thất bại, service vẫn trả `[]`; query của Trang chủ/Tìm kiếm không chuyển sang `isError`. Nếu một trạng thái lỗi, danh sách chỉ còn một phần mà không báo thiếu dữ liệu.

**Hướng sửa:** báo lỗi khi không tải được dữ liệu bắt buộc; nếu chấp nhận một phần kết quả, trả metadata `partial/error` để UI hiển thị rõ.

### F05 · P1 · Trạng thái đăng ký có thể thiếu dữ liệu nhưng UI coi là chưa đăng ký

[`HomePage.tsx`](../src/pages/HomePage.tsx) dòng 144–172, [`SearchPage.tsx`](../src/pages/SearchPage.tsx) dòng 152–178, [`EventDetailPage.tsx`](../src/pages/EventDetailPage.tsx) dòng 92–118 và [`FanpageDetailPage.tsx`](../src/pages/FanpageDetailPage.tsx) dòng 50–75 cùng lấy lịch sử đăng ký với `size: 100` và lịch sắp tới, rồi `Promise.allSettled` bỏ qua endpoint lỗi. Dữ liệu quá 100 bản ghi hoặc một endpoint lỗi có thể làm sự kiện đã đăng ký hiện như chưa đăng ký. Vì query trả mảng, UI không biết dữ liệu thiếu.

**Hướng sửa:** dùng endpoint/response có tổng số hoặc phân trang đủ; phân biệt trạng thái đầy đủ và một phần. Dùng một query/hook dùng chung cho trạng thái đăng ký.

### F06 · P1 · Đăng ký thành công không làm mới các query liên quan

[`RegistrationForm.tsx`](../src/features/registration/components/RegistrationForm.tsx) dòng 47–69 gửi đăng ký và chỉ đổi state `submitted`; [`RegistrationPage.tsx`](../src/pages/RegistrationPage.tsx) dòng 36 không truyền `onSubmitSuccess`. Sau khi về chi tiết/trang chủ, cache `['registrations', 'me', ...]` và số đăng ký sự kiện có thể còn giá trị trước đó trong thời gian cache hợp lệ.

**Hướng sửa:** cập nhật/invalidate các key đăng ký và sự kiện sau submit thành công; xác minh trạng thái nút đăng ký khi quay lại page.

### F07 · P2 · Form đăng ký hiển thị thông tin sự kiện mẫu khi fetch lỗi

[`RegistrationForm.tsx`](../src/features/registration/components/RegistrationForm.tsx) dòng 30–45 không lấy `isError`; phần tóm tắt dùng tên “Sự kiện CTU”, ngày “Tháng 10/2026” và điểm mẫu khi dữ liệu thiếu (dòng 118 trở đi). Người dùng có thể thấy thông tin không thuộc sự kiện đang đăng ký.

**Hướng sửa:** hiển thị lỗi tải và chặn xác nhận nếu không có event hợp lệ.

### F08 · P1 · Trang Super Admin tải toàn bộ dữ liệu và tạo N+1 request

[`SuperAdminPage.tsx`](../src/pages/SuperAdminPage.tsx) dòng 103–166 tải đồng thời 7 tập dữ liệu cho mọi lần mở trang, bất kể tab đang xem; `getUsers`, `getFanpages`, `getEvents` được gọi với `size: Number.MAX_SAFE_INTEGER` nhưng service vẫn đọc toàn bộ trang từ BE. [`superAdminService.ts`](../src/features/super-admin/services/superAdminService.ts) dòng 518–550 gọi follower count và members **cho mỗi fanpage**, có thể gọi thêm profile admin; dòng 958–980 gọi detail **cho mỗi trường/khoa**. Khi nhiều bản ghi, request và độ trễ tăng theo số fanpage/trường.

**Hướng sửa:** tách query theo tab, phân trang server, lấy count/membership bằng endpoint tổng hợp hoặc tải detail khi mở hàng. Đo Network sau sửa.

### F09 · P1 · Chứng nhận giả xuất hiện khi API lỗi

[`CertificateCard.tsx`](../src/features/certificates/components/CertificateCard.tsx) dòng 23–27 chỉ lấy `isLoading`; sau khi query lỗi, `cert` là `undefined` nhưng component vẫn render huy hiệu **“Đã xác thực”** và tên sự kiện, tên sinh viên, MSSV, mã chứng thực mẫu ở dòng 90–139.

**Hướng sửa:** phân biệt lỗi/không tìm thấy/chưa phát hành; chỉ render chứng nhận đã xác thực khi có dữ liệu BE hợp lệ.

### F10 · P1 · Lịch sử chỉ lấy 100 bản ghi đầu và che lỗi

[`historyService.ts`](../src/features/registration-history/services/historyService.ts) dòng 327–390 chỉ gọi `page: 0, size: 100`, rồi trả `[]` trong `catch`. [`EventHistoryPage.tsx`](../src/pages/EventHistoryPage.tsx) dòng 176–183 có `isError`, nhưng khi service nuốt lỗi thì `isError` không bật. Màn hình có thể thiếu lịch sử hoặc hiện trạng thái rỗng khi API thất bại. Service còn tải thêm fanpage riêng cho mỗi ID thiếu avatar (dòng 350–370).

**Hướng sửa:** xử lý phân trang đầy đủ hoặc phân trang UI; để lỗi đi tới query và tránh lookup avatar N+1.

### F11 · P1 · Sidebar hiển thị mọi fanpage khi API “đang theo dõi” lỗi

[`StudentLeftSidebar.tsx`](../src/features/events/components/StudentLeftSidebar.tsx) dòng 119–153: với người đã đăng nhập, nếu `/fanpages/following` lỗi, query chuyển sang `/fanpages` và trả danh sách chung cho sidebar theo dõi. Người dùng có thể thấy fanpage chưa theo dõi như fanpage của mình.

**Hướng sửa:** giữ trạng thái lỗi hoặc dữ liệu cũ, không thay danh sách theo dõi bằng danh sách chung.

### F12 · P2 · Nhiều page dùng chung cache năm học với cách xử lý lỗi khác nhau

[`EventHistoryPage.tsx`](../src/pages/EventHistoryPage.tsx) dòng 52–74 dùng key `['academic-years']` và `['semesters']`, nhưng biến lỗi API thành `[]`. [`TrainingPointsPage.tsx`](../src/pages/TrainingPointsPage.tsx) dòng 24–33, [`Sv5tPage.tsx`](../src/pages/Sv5tPage.tsx) dòng 26–29 và các component khác dùng cùng key; provider mặc định `staleTime` 5 phút. Nếu lịch sử tải lỗi trước, cache rỗng có thể được tái sử dụng ở các page khác mà không hiện lỗi. Dashboard Super Admin dùng key riêng, nên không bị trộn với nhóm này.

**Hướng sửa:** thống nhất service/query function cho các key chung và để lỗi đi qua React Query.

### F13 · P2 · Tìm kiếm gợi ý phát sinh nhiều request cho một lần nhập

[`NavbarSearchAutocomplete.tsx`](../src/features/events/components/NavbarSearchAutocomplete.tsx) dòng 53–95 debounce 250 ms rồi gọi tìm sự kiện và fanpage. `eventService.getEvents({ keyword, size: 3 })` có thể gọi ba trạng thái sự kiện riêng, cộng thêm một request fanpage. Khi người dùng dừng gõ nhiều lần, số request tăng nhanh; hủy effect chỉ ngăn ghi state, không hủy request HTTP đã bắt đầu.

**Hướng sửa:** endpoint gợi ý gộp hoặc giới hạn trạng thái cần tìm; truyền `AbortSignal` để hủy request cũ.

### F14 · P2 · Query fanpage công khai không phân biệt lỗi và không tồn tại

[`FanpageDetailPage.tsx`](../src/pages/FanpageDetailPage.tsx) dòng 35–45 chỉ lấy `isLoading`; khi lỗi tải fanpage hoặc sự kiện, UI dùng các nhánh “Không tìm thấy thông tin Fanpage”/“Chưa có sự kiện nào” (dòng 410–482). Lỗi mạng/401/500 vì vậy bị hiểu thành dữ liệu không tồn tại hoặc danh sách rỗng.

**Hướng sửa:** xử lý `isError` riêng cho fanpage và event list, có nút retry.

### F21 · P2 · Cache fanpage theo dõi có hai dạng object

[`HomePage.tsx`](../src/pages/HomePage.tsx) dòng 106–119 và [`EventDetailPage.tsx`](../src/pages/EventDetailPage.tsx) dòng 47–59 dùng key `['fanpages', 'sidebar', isAuthenticated]` và giữ DTO thô từ `/fanpages/following`. [`StudentLeftSidebar.tsx`](../src/features/events/components/StudentLeftSidebar.tsx) dòng 119–153 dùng cùng key nhưng ánh xạ sang `{ id, name, avatarUrl }`. Sidebar có thể nhận DTO thô thiếu `name` chuẩn hóa, tùy query nào khởi tạo cache trước; các page còn lại chỉ lấy `id` nên ít bị ảnh hưởng hơn.

**Hướng sửa:** dùng cùng service chuẩn hóa hoặc tách key theo dạng dữ liệu; kiểm tra tên và avatar sidebar khi điều hướng giữa các page.

## Phát hiện fanpage đã xác nhận ở báo cáo trước

| ID | Ưu tiên | Nội dung | Nguồn |
| --- | --- | --- | --- |
| F01 | P0 | `serverInvitations = []` kết hợp effect `setInvitations` gây render vô hạn khi query chưa có dữ liệu/disabled. | [`FanpageMembersView.tsx`](../src/features/fanpage-admin/components/FanpageMembersView.tsx), dòng 245 và 356. |
| F15 | P1 | Tab Thành viên giữ dữ liệu thành viên mẫu nếu API trả danh sách rỗng. | Cùng file, dòng 253–260 và 348–354. |
| F16 | P2 | Quản lý fanpage và hub nuốt lỗi danh sách thành `[]`; trang có thể hiện “không có fanpage” khi 401/lỗi mạng. `AccountNavigationPopup` cũng ghi `[]` vào store sau fetch lỗi. | [`fanpageAdminService.ts`](../src/features/fanpage-admin/services/fanpageAdminService.ts), dòng 163–202; [`StaffFanpageHub.tsx`](../src/features/auth/components/StaffFanpageHub.tsx), dòng 113–155; [`AccountNavigationPopup.tsx`](../src/shared/components/layout/AccountNavigationPopup.tsx), dòng 114–170. |
| F17 | P1 | Page quản trị fetch dữ liệu của tab khác; feed và admin events gọi trùng endpoint, mỗi lần chỉ lấy 100 sự kiện. | [`FanpageAdminPage.tsx`](../src/pages/FanpageAdminPage.tsx), dòng 148–181; [`fanpageAdminService.ts`](../src/features/fanpage-admin/services/fanpageAdminService.ts), dòng 242–245 và 320–325. |
| F18 | P1 | Tab Sự kiện tạo một request lấy count cho mỗi event; chỉ đếm 200 bản ghi đầu và đổi lỗi thành `0`. | [`FanpageEventListView.tsx`](../src/features/fanpage-admin/components/FanpageEventListView.tsx), dòng 84–102; [`fanpageAdminService.ts`](../src/features/fanpage-admin/services/fanpageAdminService.ts), dòng 432–448. |
| F19 | P2 | Query chi tiết gọi lại member API để suy quyền; tab Thành viên có query riêng. Khi lỗi, quyền mặc định thành cộng tác viên. | [`FanpageAdminPage.tsx`](../src/pages/FanpageAdminPage.tsx), dòng 83–122; [`FanpageMembersView.tsx`](../src/features/fanpage-admin/components/FanpageMembersView.tsx), dòng 223–227. |
| F20 | P2 | `eventId` từ URL chỉ đồng bộ khi có giá trị; khi xóa hoặc ID không tồn tại, UI có thể giữ event cũ hoặc chọn event đầu. | [`FanpageAdminPage.tsx`](../src/pages/FanpageAdminPage.tsx), dòng 226–239. |

## Thứ tự xử lý đề xuất

1. F01, F09, F02, F15: loại crash và thông tin giả/sai rõ ràng.
2. F04, F05, F06, F10, F11: sửa trạng thái tải/lỗi, phân trang và đồng bộ sau đăng ký.
3. F08, F17, F18: giảm tải lớn ở Super Admin và fanpage; đo lại số request.
4. F03, F07, F12–F14, F16, F19–F21: thống nhất cache key, lỗi, URL state và tối ưu request còn lại.

## Kiểm thử hồi quy cần có sau khi sửa

- Cùng một event: vào chi tiết trước rồi đăng ký, và vào đăng ký trước rồi quay lại chi tiết.
- API trả rỗng, 401/500, hoặc hơn 100 đăng ký/lịch sử/sự kiện; xác nhận UI không hiển thị dữ liệu mẫu hay số `0` giả.
- Đổi tab fanpage/Super Admin, đổi fanpage hoặc event ID, back/forward; kiểm tra query chỉ gọi khi dữ liệu được dùng.
- Đăng ký xong quay lại feed/chi tiết; trạng thái “đã đăng ký” và số lượng cập nhật.
- Mở trang chứng nhận với API lỗi; không hiển thị huy hiệu xác thực.
- Sau khi có FE và BE local: đo request và render trên Network/Profiler, đặc biệt F01, F08, F17, F18.
