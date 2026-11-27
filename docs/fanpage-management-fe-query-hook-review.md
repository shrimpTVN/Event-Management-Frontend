# Rà soát query, fetch và React hook trong trang quản lý fanpage

Ngày rà soát: 27/11/2026  
Phạm vi: `/fanpage/admin`, `/fanpage/workspace`, trung tâm fanpage của cán bộ, các tab và hook/service FE mà những trang này sử dụng.

Đây là kết quả đọc mã nguồn; chưa đo số request hoặc thời gian render bằng Network và React Profiler. Mức độ ưu tiên dựa trên khả năng gây lỗi hiển thị và tải thừa đã thấy trong code.

## Vấn đề cần xử lý

| Ưu tiên | Khu vực | Phát hiện | Tác động | Hướng xử lý |
| --- | --- | --- | --- | --- |
| P0 | Thành viên | `serverInvitations = []` tạo mảng mới mỗi lần render khi query chưa có dữ liệu hoặc bị `enabled: false`. Effect phụ thuộc vào mảng này rồi gọi `setInvitations`. | Vòng lặp render, `Maximum update depth exceeded`; đặc biệt dễ xảy ra với người không có quyền xem lời mời. | Dùng trực tiếp `query.data ?? []` khi render; nếu cần state chỉnh sửa cục bộ, chỉ đồng bộ khi dữ liệu query thực sự đổi. |
| P1 | Trang quản trị chung | Các query bài viết, sự kiện, lượt theo dõi, thống kê và reminder đều được bật khi có fanpage ID, không phụ thuộc tab đang mở. | Tab Thành viên vẫn gọi API của các tab khác; thêm thời gian tải và lỗi request không liên quan. Request reminder 404 trong ảnh được phát sinh từ query này, còn service trả `null` khi lỗi. | Bật query theo tab cần dữ liệu; chỉ giữ query dùng chung thực sự cần cho layout. |
| P1 | Trang quản trị chung | `getFeedPosts` và `getAdminEvents` gọi cùng `GET /events/fanpage/{id}?size=100`, nhưng dùng hai query key khác nhau. | Tải trùng danh sách sự kiện; React Query không gộp hai request. | Dùng một query nguồn rồi chuyển đổi dữ liệu cho feed và danh sách quản lý. |
| P1 | Danh sách sự kiện | `useQueries` tạo một query lấy số đăng ký cho **mỗi** sự kiện. Mỗi query tải tối đa 200 bản ghi trang đầu và tự đếm sau khi lọc `CANCELLED`. | Có thể phát sinh khoảng 100 request khi danh sách có 100 sự kiện. Số đăng ký sai nếu vượt 200 bản ghi; lỗi API bị biến thành `0`, khiến UI hiển thị số liệu sai mà không báo lỗi. | Lấy số đếm từ API tổng hợp/phân trang có `totalElements` phù hợp; không dùng trang đầu làm tổng số, và giữ trạng thái lỗi riêng. |
| P1 | Thành viên | State `members` mặc định dùng `MOCK_FANPAGE_MEMBERS`; effect chỉ cập nhật khi kết quả server hoặc prop có phần tử. | Fanpage thực sự có 0 thành viên vẫn có thể hiển thị thành viên mẫu. Việc sao chép query data sang state cũng tạo thêm render. | Dùng kết quả query làm nguồn hiển thị; phân biệt `loading`, `error`, và kết quả rỗng. |
| P2 | Chi tiết fanpage và tab Thành viên | Query chi tiết fanpage gọi `getFanpageMembers` để suy ra quyền; tab Thành viên lại gọi API này qua query riêng. Query chi tiết còn bắt lỗi thành viên và mặc định quyền cộng tác viên. | Request trùng, chi tiết tải chậm hơn; quyền hiển thị sai khi request thành viên lỗi. | Dùng quyền từ dữ liệu fanpage đã xác thực hoặc chia sẻ một query thành viên. Hiển thị lỗi quyền thay vì âm thầm đổi vai trò. |
| P2 | Danh sách fanpage khả dụng | Query có `staleTime: 0`, `refetchOnMount: 'always'`. Service thử endpoint dự phòng khi endpoint đầu lỗi, sau cùng trả `[]` cho mọi lỗi; query còn ghi kết quả vào store. | Điều hướng qua lại gây fetch lặp. Lỗi mạng/401 có thể tạo hai request lỗi, xóa danh sách trong store và hiện thông báo “Chưa có Fanpage được chỉ định” thay cho lỗi tải. | Chỉ dùng endpoint dự phòng khi cần tương thích rõ ràng; để lỗi đi tới query, hiển thị `isLoading`/`isError`, và chỉ đồng bộ store khi fetch thành công. |
| P2 | Điều hướng sự kiện | Effect đồng bộ `eventId` từ URL chỉ chạy cập nhật khi URL có ID. Khi tham số bị xóa, `selectedEventId` cũ còn giữ; ID không tìm thấy lại rơi về sự kiện đầu tiên. | Mở sai sự kiện hoặc giữ lựa chọn cũ sau khi đổi tab/URL. | Lấy URL làm nguồn duy nhất hoặc đồng bộ cả trường hợp ID rỗng; xử lý ID không tồn tại bằng trạng thái lỗi/rỗng. |
| P3 | Điểm danh và hồ sơ | Danh sách người tham gia được poll mỗi 15 giây khi tab điểm danh mount. Tab hồ sơ dùng `refetchOnMount: 'always'` và `staleTime: 0`. | Tải mạng định kỳ hoặc lặp lại khi mở lại tab. Mức độ ảnh hưởng thực tế phụ thuộc số người tham gia và tần suất dùng trang. | Xác nhận yêu cầu cập nhật tức thời rồi đặt chu kỳ/cache phù hợp; chỉ refetch sau mutation hoặc khi dữ liệu có khả năng thay đổi. |

## Vị trí mã nguồn

- Vòng lặp lời mời: [`FanpageMembersView.tsx`](../src/features/fanpage-admin/components/FanpageMembersView.tsx), dòng 245–252 và 356–360.
- State thành viên và dữ liệu mẫu: cùng file, dòng 253–260 và 348–354.
- Query tải theo trang và đồng bộ URL: [`FanpageAdminPage.tsx`](../src/pages/FanpageAdminPage.tsx), dòng 35–72, 83–122, 148–181, 226–239.
- Request sự kiện bị lặp: [`fanpageAdminService.ts`](../src/features/fanpage-admin/services/fanpageAdminService.ts), dòng 242–245 và 320–325.
- Số đăng ký theo từng sự kiện: [`FanpageEventListView.tsx`](../src/features/fanpage-admin/components/FanpageEventListView.tsx), dòng 84–102; [`fanpageAdminService.ts`](../src/features/fanpage-admin/services/fanpageAdminService.ts), dòng 432–448.
- Service danh sách fanpage và reminder: [`fanpageAdminService.ts`](../src/features/fanpage-admin/services/fanpageAdminService.ts), dòng 163–202 và 227–237.
- Poll điểm danh: [`useAttendanceDraft.ts`](../src/features/fanpage-admin/hooks/useAttendanceDraft.ts), dòng 35–40.
- Refetch hồ sơ: [`FanpageProfileEditView.tsx`](../src/features/fanpage-admin/components/FanpageProfileEditView.tsx), dòng 48–59.

## Thứ tự triển khai đề xuất

1. Loại vòng lặp effect và dữ liệu thành viên mẫu khỏi trạng thái thực tế.
2. Bật query theo tab, gộp hai request cùng danh sách sự kiện.
3. Sửa nguồn số đăng ký để không giới hạn ở 200 bản ghi và không biến lỗi thành `0`.
4. Thống nhất nguồn xác định quyền, trạng thái tải/lỗi của danh sách fanpage và `eventId` trong URL.
5. Đo Network/Profiler sau thay đổi rồi quyết định chu kỳ poll và chính sách cache cho các tab còn lại.
