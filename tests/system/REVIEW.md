# Rà soát system test ROMS — 14/11/2026

File gốc: `D:\Report-5.3_System_Test_FRs_ROMS_Testt1.xlsx`. Không chỉnh sửa file gốc. Nội dung workbook được xem là dữ liệu cần kiểm tra; ghi chú trong đó không được xem là yêu cầu đánh dấu Passed cho lần làm việc này.

Kết luận: tài liệu có khung kịch bản phù hợp cho 5 vai trò, nhưng **chưa đủ điều kiện dùng làm báo cáo kết quả system test đã đạt**.

## Kết quả đối chiếu

| Hạng mục | Nhận xét và sửa đổi |
|---|---|
| Số lượng | Đủ 127 mã không trùng: Owner 37, Service 21, Customer 27, Kitchen 20, Inventory 22. |
| Kết quả thực thi | 127 ca × 3 vòng đều Passed; Cover!E11 và ghi chú ở các sheet nói chưa thực thi mới, Passed được điền theo yêu cầu trước. Không có đủ bằng chứng để chấp nhận 381 kết quả Passed. Bản rà soát đưa các vòng về Pending, xóa ngày/tester của các kết quả chưa xác minh. |
| Vòng 2/3 | Đánh dấu Passed nhưng ngày/tester trống. Chỉ ghi kết quả khi có lần chạy tương ứng, môi trường, build, dữ liệu và bằng chứng. |
| SS20, Service Staff dòng 38 | Sai quy tắc: cấm nhân viên hủy PENDING. PRD và backend cho phép SERVICE_STAFF/OWNER hủy đơn PENDING và món PENDING. Đã sửa nội dung và thêm thử lặp yêu cầu/đơn COOKING. |
| KS18, Kitchen Staff dòng 35 | Quyền cấm bếp hủy là đúng; điều kiện “only TABLE_ACCOUNT may cancel” sai. Đã sửa điều kiện, giữ mục tiêu cấm bếp hủy. |
| KS01, Kitchen Staff dòng 12 | Trang sau login thực tế là `/kitchen/cooking`. `/kitchen/queue` là alias chuyển hướng, không phải URL cuối. Đã sửa Expected Results. KS02 vẫn có thể kiểm tra alias queue và phải kỳ vọng redirect. |
| Thống kê | Các công thức đếm theo F/I/L và tham chiếu tổng số hiện phù hợp 127 ca. Không thấy lỗi cộng tổng. Thống kê tổng hợp đang lấy Round 1, cần nói rõ vòng nào nếu tiếp tục dùng nhiều vòng. Đã cập nhật cached results về 0 Passed/127 Pending, buộc Excel tính lại khi mở. |
| “Test coverage” | Công thức `(Passed + Failed)/(Total - N/A)` đo tỷ lệ ca đã thực thi, không phải coverage của Functional Requirements. Đã đổi nhãn thành execution rate. Để tính FR coverage cần bảng FR ID → case ID. |

Căn cứ trong source:

- `roms-backend/docs/PRD.md:17,79,92`: quyền hủy và điều kiện trạng thái.
- `roms-backend/src/main/java/com/roms/service/impl/OrderServiceImpl.java:300,350`: kiểm tra role, đơn/món PENDING và hoàn kho.
- `ROMS_FE/src/features/auth/components/LoginForm.tsx:55`: chuyển kitchen tới `/kitchen/cooking`.
- `ROMS_FE/src/app/routes/index.tsx`: các route và alias theo vai trò.
- `roms-backend/src/main/java/com/roms/service/impl/DashboardServiceImpl.java:64`: báo cáo tính từ order items, chi phí active và phiếu nhập; không được mặc định coi doanh thu dashboard bằng tiền đã thanh toán.

## Những phần cần bổ sung trước nghiệm thu

1. Gắn FR ID, phiên bản yêu cầu và mức ưu tiên cho từng ca. Chưa có ma trận truy vết để kết luận 127 ca bao phủ hết FR.
2. Điền URL môi trường, build/commit FE và BE, phiên bản DB/schema, trình duyệt, dữ liệu fixture và cách đưa hệ thống về trạng thái ban đầu. “Dedicated test data exists” hiện chưa đủ để người khác tái lập độc lập.
3. Thêm Actual Result và Evidence (ảnh/log/test report), Defect ID khi lỗi. Không chỉ điền trạng thái hoặc dùng một câu Expected chung.
4. Tách ca nhiều hành vi và nhiều dữ liệu lỗi. Ví dụ OW08 gộp reset OTP/đăng nhập/không dùng lại OTP/thu hồi phiên; OW21 gộp cập nhật menu và giá đơn cũ; IS04 gộp tên trống và tồn tối thiểu âm. Mỗi điều kiện cần kết quả riêng.
5. Dùng fixture có bản ghi biết trước để kiểm tra danh sách/chi tiết, và ca riêng cho dữ liệu trống. “Có dữ liệu hoặc empty state” cùng một expected có thể bỏ sót lỗi API trả danh sách trống sai.
6. Cụ thể hóa báo cáo: bộ đơn/chi phí/phiếu nhập nguồn, khoảng ngày và biên đầu/cuối ngày, trạng thái được tính, công thức lợi nhuận, timezone, nội dung CSV/Vietnamese encoding. OW36/37 mới nói khớp định nghĩa nhưng chưa có con số để đối chiếu.
7. Bổ sung các nhóm đang có trong source nhưng 127 ca này chưa thể hiện đủ: hóa đơn/thanh toán/VAT, khuyến mãi và giới hạn dùng, cài đặt nhà hàng, nhập/xuất Excel và xử lý dữ liệu lỗi, printer failure. Xác nhận chúng có nằm trong phạm vi FR của đợt nghiệm thu hay không.
8. Bổ sung race conditions: hai đơn tranh tồn cuối, nhận/hủy đồng thời, double-submit, refresh đồng thời, mất mạng khi đã lưu, STOMP reconnect. Kiểm tra lặp tuần tự hiện có chưa chứng minh được xử lý đồng thời.
9. OTP cần ca hết hạn, sai quá số lần, gửi lại, không tái sử dụng; AI cần ca dịch vụ lỗi, món không bán được và ràng buộc dị ứng. Xác định test inbox/SMTP và dịch vụ AI cho từng nhóm.

## Mã kiểm thử được bàn giao

61 bài Playwright; catalogue giữ đủ 127 mã và không đánh đồng bài tự động với một ca Excel đã hoàn thành. 30 ca có script UI theo nội dung chính; 70 ca được kiểm tra một phần qua UI/API; 27 ca chưa tự động hóa. Danh sách cụ thể nằm trong `cases.json` (trường `automation` và `limitation`). Các mã API có thể được dùng làm fixture hoặc được kiểm tra trong nhiều step; không tự động ghi cả ca Excel Passed.

5 ca public OW01–OW05 đã đạt trên Chrome và Edge với frontend thật và backend tắt. Lần thử Edge đầu có một ca lỗi; sau khi loại HTML báo cáo khỏi Vite watcher để tránh reload do file output, chạy lại cả 5 ca trên Edge đều đạt. Lần tải Chromium từ CDN không thành công do mạng/DNS nên dùng trình duyệt cài sẵn. 151 unit test có sẵn đạt. Những kết quả này không thay thế một lần chạy system test trên môi trường đầy đủ.

Bản `ROMS_System_Test.reviewed.xlsx` là bản kế hoạch được chỉnh về trạng thái chưa thực thi system test đầy đủ; bằng chứng local UI được lưu riêng, không dùng để điền Passed cho cả ba vòng. Tất cả các ca còn lại cần chạy sau khi có môi trường.
