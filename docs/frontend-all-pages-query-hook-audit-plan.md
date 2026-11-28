# Kế hoạch rà soát query, fetch và React hook trên toàn bộ FE

Ngày lập: 27/11/2026  
Mục tiêu: tìm các lỗi tương tự báo cáo [quản lý fanpage](./fanpage-management-fe-query-hook-review.md) trên mọi màn hình FE, đặc biệt là lỗi render lặp, request thừa, dữ liệu sai và trạng thái tải/lỗi bị che khuất.

## Phạm vi

- Lấy `src/app/router.tsx` làm danh sách route chuẩn; kiểm tra từng page được route render, tab con, modal/drawer có query riêng, layout và hook dùng chung. Gộp các URL alias cùng trỏ tới một page để không rà trùng nhưng vẫn kiểm tra tham số URL khác nhau.
- Bao gồm các luồng chưa có route trực tiếp nhưng được mở qua page: đăng ký sự kiện, điểm danh, chi tiết sự kiện, quản trị và dashboard.
- Đi theo đường dữ liệu `page → component/hook → service → endpoint/cache key → UI`; xem cả trường hợp chuyển page, đổi tài khoản/vai trò, đổi ID và mutation.
- Không sửa logic trong lượt rà soát. Mỗi phát hiện cần bằng chứng mã nguồn hoặc bước tái hiện. Việc refactor và kiểm thử hồi quy là giai đoạn sau khi chốt danh sách lỗi.

Kiểm kê ban đầu: `src/app/router.tsx` hiện có khoảng 40 khai báo `path`, gồm route thật và alias/redirect; `src/pages/` có 24 file `*Page.tsx`. Con số kiểm kê chính thức sẽ được chốt ở bước 1 vì một page có thể chứa nhiều tab hoặc luồng riêng.

## Các bước thực hiện

### 1. Lập bản đồ route và nguồn dữ liệu

1. Liệt kê route, page, vai trò truy cập, tab, component tải lười và layout dùng chung từ router.
2. Với mỗi page, ghi các query key, `enabled`, `staleTime`, `refetchOnMount`, `refetchInterval`, `retry`, API endpoint, mutation và invalidate.
3. Tìm query key/endpoint dùng chung giữa nhiều page; xác định chỗ gọi trùng nhưng không chia sẻ cache.
4. Ghi rõ dữ liệu nào là nguồn từ server, dữ liệu nào được copy sang local state/store hoặc tính lại trên FE.

**Đầu ra:** bảng kiểm kê `route/page → query/effect → endpoint → phần UI sử dụng` và danh sách route đã/ chưa rà.

### 2. Rà tĩnh theo checklist lỗi

| Nhóm | Cần kiểm tra |
| --- | --- |
| Hook/effect | Giá trị mặc định `[]`/`{}` được tạo mới trong render rồi nằm trong dependency; effect gọi `setState` hoặc điều hướng mỗi render; dependency thiếu/thừa; callback hoặc object không ổn định; query data được copy sang state và không xử lý kết quả rỗng. |
| Query/fetch | Query chạy khi tab/modal không dùng dữ liệu; `enabled` thiếu hoặc sai; N+1 request; cùng endpoint nhưng nhiều key; key thiếu user/ID/bộ lọc; fetch trong render/effect trùng với React Query; polling/refetch quá dày; request cũ ghi đè dữ liệu của ID mới. |
| Cache/mutation | Invalidate quá rộng hoặc thiếu; cập nhật optimistic không khớp server; lưu dữ liệu vào store trong `queryFn`; dữ liệu tài khoản/fanpage cũ còn sau khi đổi vai trò hoặc logout. |
| Hiển thị | Loading/error/empty bị gộp; service nuốt lỗi và trả `[]`/`0`/mock; phân trang đầu bị xem là tổng; URL state lệch local state; dữ liệu mẫu lọt vào production; phép tính FE khác kết quả BE. |
| Luồng chung | Auth guard, layout, navigation, notification/SSE, search và profile gây fetch trên mọi route; callback không ổn định làm kết nối hoặc subscription tạo lại. |

Với mỗi nghi vấn, kiểm tra đường gọi thực tế trước khi ghi lỗi. Ví dụ, `refetchInterval` chỉ là vấn đề khi tần suất và dung lượng dữ liệu không phù hợp với nhu cầu màn hình.

### 3. Kiểm tra động các nghi vấn ưu tiên cao

1. Dùng Network và React Profiler trên các route có nghi vấn P0/P1; đo số request khi vào trang, đổi tab, đổi ID, quay lại trang và sau mutation.
2. Tái hiện với các trạng thái API: đang tải, danh sách rỗng, 401/403/404/500, phản hồi chậm, dữ liệu nhiều hơn một trang và hai request trả về đảo thứ tự.
3. Kiểm tra riêng tài khoản sinh viên, cán bộ, quản trị viên và trường hợp đổi tài khoản; ghi route, bước tái hiện, kết quả mong đợi và kết quả thực tế.
4. Dùng mock/test hiện có nếu môi trường BE không sẵn; đánh dấu phát hiện chỉ xác nhận bằng mã nguồn hoặc mock, không khẳng định đã đo production.

### 4. Tổng hợp và ưu tiên

Mỗi phát hiện cần có: `ID`, route/tab, file và dòng, điều kiện kích hoạt, endpoint/query key liên quan, tác động tới hiển thị hoặc hiệu năng, bằng chứng, mức độ chắc chắn, hướng sửa và kiểm thử hồi quy cần có.

- **P0:** crash, render vô hạn hoặc mất khả năng dùng trang.
- **P1:** dữ liệu hiển thị sai, lộ dữ liệu của ngữ cảnh cũ, hoặc tải thừa lớn/N+1 trên luồng chính.
- **P2:** request trùng/lặp, cache sai hoặc trạng thái loading/error gây hiểu nhầm.
- **P3:** tối ưu nhỏ, chỉ ghi khi có bằng chứng đo đạc hoặc đường gọi rõ ràng.

Gộp các lỗi có cùng nguyên nhân vào một phát hiện và liệt kê mọi route bị ảnh hưởng. Không tính mỗi triệu chứng hoặc mỗi alias là một lỗi riêng.

## Thứ tự rà soát

1. **Luồng dùng chung:** router, provider React Query, auth, layout, navigation, thông báo, search và các hook dùng trên nhiều route.
2. **Luồng nhiều dữ liệu/mutation:** fanpage và quản trị, sự kiện/đăng ký/điểm danh, điểm rèn luyện, SV5T, super admin.
3. **Luồng cá nhân:** trang chủ, hồ sơ, lịch sử, sự kiện đã lưu, chứng nhận, onboarding/đăng nhập.
4. **Đối chiếu liên route:** chuyển tab, chuyển sự kiện/fanpage, back/forward, đổi tài khoản, invalidate sau mutation.

## Hoàn thành khi

- Mỗi route thực trong router và mỗi tab/query độc lập có trạng thái **đã rà**, **không áp dụng** hoặc **chưa kiểm được** kèm lý do.
- Mọi phát hiện P0/P1 có đường tái hiện hoặc giải thích điều kiện kích hoạt từ mã nguồn; các số liệu request chỉ được ghi khi đã đo.
- Có báo cáo tổng hợp và danh sách task sửa lỗi theo mức độ ưu tiên, tách rõ lỗi chắc chắn khỏi nghi vấn cần xác minh.
- Sau khi sửa, kiểm tra lại route bị ảnh hưởng và các luồng chung liên quan; chỉ thêm test hồi quy cho lỗi có điều kiện tái hiện rõ.
