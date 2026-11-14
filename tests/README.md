# Unit test frontend ROMS — toàn bộ dự án

Chạy trong thư mục `ROMS_FE` bằng Node.js 24 và dependency hiện có:

```powershell
npm test
# Hoặc: npm run test:unit
```

| File | Phạm vi | Số ca |
|---|---|---:|
| authSchemas.test.mjs | Đăng nhập, email, OTP, đổi/reset mật khẩu, hồ sơ | 13 |
| tableSchema.test.mjs | Mã bàn, sức chứa và khu vực | 6 |
| promotionSchema.test.mjs | Phần trăm/số tiền giảm, giới hạn lượt dùng, thời hạn | 6 |
| purchaseSchema.test.mjs | Phiếu nhập và dữ liệu dòng nguyên liệu | 4 |
| expenseSchema.test.mjs | Chi phí và lý do hủy | 4 |
| ingredientImport.test.mjs | Đọc/kiểm tra Excel nguyên liệu; test sẵn có | 7 |
| purchaseImport.test.mjs | Đọc/đối chiếu Excel nhập hàng; test sẵn có | 6 |

Bảng trên liệt kê nhóm schema/import ban đầu. Bộ đầy đủ có **151 ca / 27 file test**, bổ sung các nhóm sau:

| File test bổ sung | Phạm vi | Ca |
|---|---|---:|
| authApi | Login, refresh, recovery, profile, truyền lỗi xác thực | 5 |
| users | Tài khoản nhân viên/tablet, API, schema, chống sai role | 6 |
| tableApi | Bàn, phiên phục vụ, chuyển bàn, gọi nhân viên | 6 |
| orderingApi, cartStore | Gọi/hủy/trả món; giỏ hàng, ghi chú, tổng tiền | 12 |
| kitchenApi | Nhận đơn, nấu, ra món, trạng thái menu | 5 |
| billingApi, receiptPrinter | Hóa đơn, chia phương thức thanh toán, HTML hóa đơn/in bằng mock | 8 |
| menu, menuImport | Danh mục, menu, ảnh, giá, VAT, Excel, xác nhận trùng | 19 |
| inventoryApi | Nguyên liệu, kiểm kê, biến động, schema và Excel API | 5 |
| recipeApi | Công thức, định lượng, nguyên liệu và chi phí | 5 |
| purchaseApi | Phiếu nhập và điều chỉnh dòng nhập | 3 |
| promotionApi | CRUD, lọc, bật/tắt khuyến mãi và mã trùng | 3 |
| expenseApi | Lọc, tạo, chỉnh sửa và hủy chi phí | 3 |
| dashboardApi, reportApi | Tổng quan, top món, xu hướng và CSV/blob | 8 |
| settingsApi | Cài đặt, VAT, thuế suất, máy in; snake/camel và false | 5 |
| aiChat, realtimeStores | AI, dị ứng/ngân sách, cách ly chat; trạng thái STOMP | 12 |

Tên file ở bảng bổ sung đều có đuôi `.test.mjs`. Test gọi source thật của dự án, kiểm tra dữ liệu hợp lệ, không hợp lệ, giá trị biên và việc truyền lỗi. API test kiểm tra hợp đồng request/response phía FE; không thay thế kiểm thử nghiệp vụ backend.

`helpers/register.mjs` dùng TypeScript có sẵn để nạp alias/extension trong Node, thay `import.meta.env.DEV` thành false trong bộ nhớ và thay duy nhất HTTP client bằng `helpers/httpMock.mjs`. HTTP mock ghi nhận lời gọi, trả response hoặc ném lỗi giả lập; không gọi mạng. Store chat dùng sessionStorage trong bộ nhớ. Test in hóa đơn dùng DOM/timer/print mock và phục hồi global sau mỗi ca; không in thật.

Kết quả ngày 14/11/2026: **151 Passed, 0 Failed, 0 Skipped**. Phạm vi gồm 16 nhóm chức năng (AI nằm trong tables); chưa đo line/branch coverage, chưa kiểm thử render toàn bộ React, trình duyệt thực hoặc end-to-end.
