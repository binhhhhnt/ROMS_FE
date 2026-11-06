# Nhập nguyên liệu từ Excel

Tại **Nguyên liệu & Tồn kho**, dùng **Thêm nguyên liệu** để nhập từng mục hoặc **Nhập Excel** để nhập nhiều mục. Quyền sử dụng: `OWNER`, `INVENTORY_STAFF`.

1. Bấm **Tải file mẫu**. Thay các dòng ví dụ bằng nguyên liệu cần thêm.
2. Chọn file `.xlsx` tối đa 5 MB, 500 dòng dữ liệu. Hệ thống đọc trang tính đầu tiên và dùng dòng đầu làm tiêu đề.
3. Xem danh sách, bỏ tích hoặc xóa những dòng không cần nhập. Dòng thiếu thông tin, trùng tên trong danh sách đang chọn hoặc sai định dạng số phải được bỏ chọn hoặc sửa trong file rồi tải lại.
4. Bấm **Xác nhận thêm … nguyên liệu**. Đóng/hủy màn hình trước khi xác nhận không thêm dữ liệu.

| Cột | Bắt buộc | Quy tắc |
| --- | --- | --- |
| Tên nguyên liệu | Có | Tối đa 255 ký tự; không trùng tên đã có, kể cả nguyên liệu ngưng sử dụng |
| Đơn vị tính | Có | Tối đa 20 ký tự, ví dụ kg, g, lít |
| Mức tồn tối thiểu | Không | 0–999999999,999; tối đa 3 chữ số thập phân; không dùng dấu phân cách hàng nghìn |

Chấp nhận cả tiêu đề `name`, `unit`, `minimumStock`, thứ tự cột tùy ý. Bỏ qua dòng trống. Không nhập ô công thức hoặc ngày tháng. Số thập phân có thể dùng dấu chấm hoặc dấu phẩy. Tồn kho ban đầu luôn bằng 0; dùng phiếu nhập hàng hoặc kiểm kê để ghi nhận số lượng thực tế.

## API

`POST /api/ingredients/import`

```json
{
  "ingredients": [
    { "name": "Gạo", "unit": "kg", "minimumStock": 5 },
    { "name": "Dầu ăn", "unit": "lít", "minimumStock": null }
  ]
}
```

Trả về `201` với danh sách nguyên liệu đã tạo. Backend kiểm tra lại dữ liệu, tên trùng và quyền. Các nguyên liệu được lưu chung một transaction: lỗi kiểm tra hoặc lỗi lưu khiến cả lần nhập không được lưu. Khi có lỗi, FE giữ danh sách và lựa chọn để nhân viên điều chỉnh. Khi mất kết nối trong lúc xác nhận, kiểm tra danh sách nguyên liệu trước khi thử lại vì có thể máy chủ đã lưu nhưng phản hồi chưa về tới trình duyệt.

File Excel được đọc ở trình duyệt; chỉ dữ liệu các dòng đang chọn được gửi lên API sau khi xác nhận. Cần khởi động lại backend sau khi cập nhật code để có endpoint mới.

## Kiểm tra

- FE (Node.js 24+): `npm run test:ingredient-import`
- Backend: `mvn test -Dtest=IngredientServiceTest,IngredientImportControllerTest`
