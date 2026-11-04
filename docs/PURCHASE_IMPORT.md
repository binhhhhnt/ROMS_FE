# Import Excel vào phiếu nhập hàng

Trong **Tạo Phiếu Nhập Hàng Mới**, nút **Nhập Excel** nền trắng nằm phía trên bên phải, ngang tiêu đề, cùng kiểu với nút ở **Nguyên liệu & Tồn kho**. Bấm nút để mở cửa sổ có **Tải file mẫu** và **Chọn file Excel**. **Thêm dòng** và cách chọn nguyên liệu thủ công vẫn hoạt động như trước.

1. Bấm **Nhập Excel**, chọn **Tải file mẫu**, thay các dòng ví dụ bằng dữ liệu cần nhập.
2. Chọn file `.xlsx` tối đa 5 MB, tối đa 500 dòng trên phiếu. Dòng đầu là tiêu đề; đọc trang tính đầu tiên.
3. Các dòng từ file được thêm vào **Danh sách nguyên vật liệu nhập**. Giữ các dòng đã nhập tay; bỏ dòng trống ban đầu.
4. Kiểm tra trạng thái mỗi dòng. Chọn lại nguyên liệu trong danh mục, sửa số lượng/đơn giá hoặc xóa những dòng không cần.
5. Bấm **Xác nhận Nhập kho** khi mọi dòng hợp lệ. Chọn file, tải file mẫu hoặc chỉnh sửa phiếu nháp không tạo nguyên liệu, không tạo phiếu và không thay đổi tồn kho.

| Cột Excel | Quy tắc |
| --- | --- |
| Tên nguyên liệu | Bắt buộc; đối chiếu tên không phân biệt hoa/thường, bỏ khoảng trắng đầu/cuối; không tự tạo nguyên liệu mới |
| Đơn vị tính | Tùy chọn; nếu có thì phải khớp đơn vị kho; không tự đổi số lượng giữa kg/g, lít/ml |
| Số lượng nhập | Bắt buộc; lớn hơn 0; tối đa 3 chữ số thập phân |
| Đơn giá (VNĐ) | Bắt buộc; không âm; tối đa 2 chữ số thập phân |

Có thể dùng tiêu đề `name`, `unit`, `quantity`, `unitPrice` và thay đổi thứ tự cột. Số thập phân dùng dấu chấm hoặc dấu phẩy; không dùng dấu phân cách hàng nghìn. Không dùng công thức hoặc ngày tháng trong các ô dữ liệu.

Màn hình tải đủ các trang danh mục để đối chiếu, bao gồm nguyên liệu đã ngưng sử dụng. Dòng không tìm thấy tên, tên trùng nhiều kết quả, ngưng sử dụng, sai đơn vị hoặc sai số liệu được giữ lại và báo lỗi. Chọn lại nguyên liệu kho là thao tác xác nhận liên kết dòng đó với danh mục; cần kiểm tra số lượng theo đơn vị kho trước khi lưu.

Phiếu được gửi qua API tạo phiếu nhập hiện có. Backend kiểm tra nguyên liệu còn tồn tại và đang hoạt động khi nhập kho; cả phiếu, tồn kho và biến động kho được xử lý trong transaction hiện có. Lỗi lưu giữ nguyên phiếu nháp để nhân viên kiểm tra lại.

Kiểm tra parser và đối chiếu (Node.js 24+): `npm run test:purchase-import`.

Kiểm tra nghiệp vụ backend: `mvn test -Dtest=PurchaseServiceTest`.
