# Yêu cầu BE: giới hạn điểm ĐRL và cập nhật mục gốc

## 1. Hiện tượng

- Mục V có `maximum = 20` nhưng API trả tổng điểm là `24`, FE hiển thị `24/20`.
- Mục V.b có điểm tối đa `12` nhưng điểm ghi nhận từ hoạt động là `19`.
- Một số dòng con trên FE đã giới hạn điểm, trong khi tổng mục và tổng học kỳ lấy từ API vẫn vượt trần. Vì vậy tổng có thể không khớp với các dòng đang hiển thị.
- Không sửa được mục lớn ĐRL vì request cập nhật bắt buộc có `parentCategoryId`, trong khi mục gốc không có mục cha.

Tài liệu này yêu cầu sửa BE; chưa thực hiện thay đổi mã BE hoặc dữ liệu điểm.

## 2. Nguyên nhân trong mã hiện tại

File: `ddd-application/src/main/java/com/ddd/application/service/semesterpoint/impl/StudentSemesterPointCommandServiceImpl.java`.

Trong `bulkRecordPointsAndPropagate`:

- Node lá đang gán `totalPoint = systemPointRecord + manualPointRecord`.
- Node cha có `isMaxChild = true` lấy `totalPoint` của mục con cao nhất.
- Node cha có `isMaxChild = false` cộng `totalPoint` của các mục con trực tiếp.
- Các nhánh trên chưa giới hạn kết quả theo `PointCategory.maximum`.
- `Math.max(0, ...)` hiện có chỉ ngăn số điểm ghi nhận âm, không giới hạn điểm tối đa.

File đọc dữ liệu: `ddd-application/src/main/java/com/ddd/application/service/semesterpoint/impl/StudentSemesterPointQueryServiceImpl.java`. API đang lấy tổng đã lưu trong `StudentSemesterPoint`; sửa công thức ghi mới sẽ không tự sửa những tổng sai đã tồn tại.

## 3. Quy tắc điểm cần áp dụng

Phân biệt hai khái niệm:

| Cấu hình | Ý nghĩa |
| --- | --- |
| `isMaxChild` | Chọn cách tổng hợp các mục con: lấy mục cao nhất hoặc cộng các mục con |
| `maximum` | Trần điểm được tính của chính mục đó, áp dụng sau khi tổng hợp |

Tính từ node lá lên node cha, áp dụng giới hạn ở **mọi cấp**, không chỉ mục gốc.

```text
cap(value, maximum) = min(maximum, max(0, value))

Node lá:
  raw = systemPointRecord + manualPointRecord
  totalPoint = cap(raw, maximum)

Node cha, isMaxChild = false:
  aggregate = SUM(totalPoint đã giới hạn của các con trực tiếp)
  totalPoint = cap(aggregate, maximum)

Node cha, isMaxChild = true:
  aggregate = MAX(totalPoint đã giới hạn của các con trực tiếp)
  totalPoint = cap(aggregate, maximum)
```

Không có điểm hoặc không có mục con: kết quả bằng `0`. `maximum` phải có giá trị hợp lệ theo quy định danh mục; không tự coi cấu hình thiếu hoặc sai là không giới hạn.

Ví dụ: node lá V.b.1 có trần `12`, ghi nhận `19` thì điểm được tính chỉ là `12`. Node cha V.b cũng phải tuân theo trần của V.b. Tổng mục V được tính từ điểm hợp lệ của các nhánh rồi tiếp tục giới hạn ở `20`.

**Không chỉ sửa `24` thành `20` ở giao diện hoặc tại node gốc.** Khi giới hạn cả các nhánh con, tổng đúng có thể thấp hơn `20`; cần tính lại đầy đủ cây.

### Giữ nguyên lịch sử và điểm ghi nhận gốc

- Không xóa hoạt động, không sửa các giao dịch cộng điểm chỉ vì tổng vượt trần.
- Giữ điểm ghi nhận thô ở node lá để xem lịch sử, giải thích chênh lệch và xử lý sửa/xóa giao dịch sau này.
- `totalPoint` là điểm được tính sau giới hạn, nên có thể nhỏ hơn `systemPointRecord + manualPointRecord`.
- Với node cha, thống nhất và ghi rõ ý nghĩa các trường điểm ghi nhận/tự chấm trả về. Không yêu cầu chúng phải cộng lại bằng `totalPoint` sau giới hạn.
- Với nhánh lấy max, nếu trả thông tin nguồn của một mục con được chọn, lấy cùng một mục con; không lấy max điểm hệ thống và max điểm tự chấm từ hai mục con khác nhau. Khi bằng điểm, chọn ổn định theo thứ tự hiển thị rồi ID.

## 4. Các luồng phải được tính lại nhất quán

- Cộng điểm từ hoạt động/check-out, cả luồng một sinh viên và hàng loạt.
- Thêm, sửa, xóa điểm tự chấm hoặc giao dịch điểm.
- Thu hồi/sửa điểm đã ghi nhận.
- Thay đổi `maximum` hoặc quy tắc `isMaxChild` của danh mục có dữ liệu.
- API cây ĐRL, tổng học kỳ và các dữ liệu tổng hợp dùng cho sidebar/xếp loại.

Các luồng phải dùng chung quy tắc tính. Khi điểm giảm, tính lại từ dữ liệu nguồn và các mục con hiện tại; không trừ trực tiếp vào tổng đã bị giới hạn.

Ví dụ: điểm thô `19`, trần `12`, điểm tính `12`; thu hồi `3` thì điểm thô còn `16`, điểm tính vẫn là `12`, không phải `9`.

## 5. Xử lý dữ liệu đã có

1. Chuẩn bị tác vụ tính lại theo sinh viên và học kỳ, từ node lá lên đến mục gốc, giữ nguyên giao dịch và các điểm ghi nhận gốc.
2. Kiểm tra trước/sau: tổng từng node không vượt `maximum`, tổng mục khớp với quy tắc lấy max/cộng con, tổng học kỳ và xếp loại dùng cùng nguồn điểm đã tính lại.
3. Tác vụ chạy lại nhiều lần phải cho cùng kết quả, không tạo thêm giao dịch hoặc cộng điểm lần nữa.
4. Phân biệt điểm đang đánh giá và điểm đã chốt (`finalizedAt`): nêu rõ phạm vi tính lại; không tự ghi đè kết quả đã chốt khi chưa xác định quy trình điều chỉnh.

## 6. Cho phép cập nhật mục gốc ĐRL

File: `ddd-api/src/main/java/com/ddd/api/dto/pointcategory/req/UpdatePointCategoryRequestDto.java`.

Hiện `parentCategoryId` có `@NotNull @Positive`, làm request sửa mục gốc với `parentCategoryId = null` bị từ chối.

Yêu cầu:

- Cho phép chỉnh nội dung, điểm tối đa và trạng thái của mục gốc mà không cần gán mục cha giả.
- Phân biệt cập nhật nội dung/trạng thái với chuyển vị trí trong cây. Nếu không đổi mục cha, giữ nguyên quan hệ cha và cấp hiện tại.
- Không để request chỉ cập nhật trạng thái của mục con biến nó thành mục gốc.
- Nếu hỗ trợ chuyển mục cha: kiểm tra cha tồn tại, không tự làm cha, không tạo chu trình và cập nhật cấp các node bị ảnh hưởng.
- Nếu thay đổi điểm tối đa hoặc trạng thái ảnh hưởng cách tính điểm, xử lý tổng đã lưu theo mục 4–5.

FE hiện khóa sửa/đổi trạng thái mục gốc để tránh gửi request mà BE từ chối. Sau khi API hỗ trợ, thông báo FE để mở lại thao tác.

## 7. Ca kiểm thử và tiêu chí nghiệm thu

| Trường hợp | Kết quả mong đợi |
| --- | --- |
| Lá có ghi nhận `19`, tự chấm `0`, trần `12` | Điểm tính `12`, vẫn giữ lịch sử đủ `19` |
| Lá có ghi nhận `10`, tự chấm `5`, trần `12` | Điểm tính `12` |
| Cha lấy tổng, các con sau giới hạn là `12`, `10`, `2`, trần cha `20` | Tổng cha `20` |
| Cha lấy max, các con là `3`, `5`, `8`, trần cha `20` | Tổng cha `8`, không phải `16` |
| Cha lấy max, con cao nhất `24`, trần cha `20` | Tổng cha `20` |
| Con có điểm thô vượt trần | Giới hạn con trước rồi mới tính cha |
| Nhiều con bằng điểm ở nhánh lấy max | Tổng và nguồn điểm được chọn nhất quán |
| Thu hồi `3` từ điểm thô `19`, trần `12` | Thô còn `16`, điểm tính vẫn `12` |
| Thay đổi điểm tự chấm, sau đó tải lại trang | Điểm trước và sau tải lại khớp nhau |
| Chạy tác vụ tính lại hai lần | Kết quả không đổi, không nhân đôi giao dịch |
| Sửa tên/điểm tối đa/trạng thái mục gốc | API chấp nhận và giữ node là mục gốc |
| Sửa trạng thái mục con | Giữ đúng cha và cấp của mục con |

Hoàn thành khi API trả điểm được tính không vượt trần ở mọi cấp, dữ liệu cũ thuộc phạm vi điều chỉnh đã được tính lại, và FE không còn tình trạng dòng con đã giới hạn nhưng tổng mục vẫn vượt mức tối đa.
