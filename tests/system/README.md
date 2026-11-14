# System test ROMS

Mã test nằm trong `ROMS_FE/tests/system`, tách khỏi unit test tại `tests/*.test.mjs`.
Bộ kiểm thử dùng trình duyệt và HTTP thật; không dùng HTTP mock của unit test.
`npm test` tiếp tục chạy unit test như trước.

## Đã kiểm tra đến đâu

- 61 bài Playwright trong 3 file; 5 bài trong số đó là các luồng nghiệp vụ gồm nhiều `test.step`.
- `cases.json` đối chiếu đủ 127 mã Excel: 30 ca có script UI, 70 ca có kiểm tra một phần, 27 ca còn thủ công. Đây là mức hiện thực hóa script, **không phải số ca Passed**.
- Ngày 14/11/2026: chạy `OW01–OW05` với frontend Vite: **5 Passed trên Chrome, 5 Passed trên Edge**. Backend không chạy; kết quả này chỉ xác nhận 5 ca UI công khai. JSON bằng chứng: `evidence/public-ui-results.json` (Chrome), `evidence/public-ui-edge-results.json` (Edge).
- Unit test cũ: **151 Passed, 0 Failed**.
- Chưa chạy các bài đăng nhập thật, phân quyền, lưu dữ liệu và workflow vì chưa có backend + PostgreSQL + Redis + tài khoản test. Chưa thể kết luận hệ thống đạt.
- Lần thử Edge ban đầu có 4 Passed/1 Failed tại OW04. Log Vite cho thấy HTML báo cáo làm phát sinh reload trong lúc kiểm tra; đã loại `playwright-report` và `test-results` khỏi Vite watcher và chạy lại cả nhóm trên Edge đạt 5/5. Phạm vi xác nhận vẫn chỉ gồm 5 ca UI trên.

## Chạy UI công khai ngay trên máy hiện tại

Mở PowerShell trong `D:\roms\ROMS_FE`:

```powershell
npm ci
# Terminal thứ nhất:
npm run dev -- --host 127.0.0.1
```

Terminal thứ hai:

```powershell
$env:ROMS_BROWSER_CHANNEL = 'chrome'
npm run test:system:public
```

Có thể dùng `msedge` nếu có Edge. Nếu dùng Chromium do Playwright quản lý, bỏ biến channel và chạy `npx playwright install chromium` trước. Lần tải Chromium tại máy hiện tại thất bại vì kết nối/DNS tới CDN; Chrome cài sẵn đã chạy được.

## Chạy với môi trường đầy đủ

Cần một backend ROMS tương ứng source trong `roms-backend`, PostgreSQL đã chạy Flyway migrations, Redis truy cập được, frontend trỏ đúng backend và tài khoản OWNER hoạt động. Chỉ dùng cơ sở dữ liệu kiểm thử có thể đặt lại. Các workflow tạo bàn, tài khoản, món, công thức, phiếu nhập, đơn và lịch sử kho thật với tiền tố `ST...`.

1. Cấu hình backend theo `roms-backend/src/main/resources/application.properties`: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, Redis, JWT và các cấu hình tích hợp mà ứng dụng yêu cầu. Dùng cấu hình dành riêng cho kiểm thử.
2. Chạy backend theo quy trình dự án; xác nhận API đăng nhập hoạt động tại URL test. Cần JDK 21 cho backend hiện tại.
3. Đặt `VITE_API_BASE_URL` trước khi khởi động Vite nếu backend khác mặc định `http://localhost:8080`. `ROMS_API_URL` chỉ cấu hình client của test, không cấu hình frontend.
4. Đặt biến môi trường rồi chạy. Ví dụ dưới đây là chỗ điền tài khoản, không phải tài khoản được tạo sẵn:

```powershell
$env:ROMS_WEB_URL = 'http://127.0.0.1:5173'
$env:ROMS_API_URL = 'http://127.0.0.1:8080'
$env:ROMS_BROWSER_CHANNEL = 'chrome'
$env:ROMS_OWNER_USERNAME = '<owner-test>'
$env:ROMS_OWNER_PASSWORD = '<password>'

# Chỉ workflow API: tự tạo 4 vai trò còn lại và dữ liệu riêng từng bài.
npm run test:system:api

# Chạy cả UI: cần thêm 4 tài khoản có sẵn trong môi trường test.
$env:ROMS_SERVICE_STAFF_USERNAME = '<service-test>'
$env:ROMS_SERVICE_STAFF_PASSWORD = '<password>'
$env:ROMS_KITCHEN_STAFF_USERNAME = '<kitchen-test>'
$env:ROMS_KITCHEN_STAFF_PASSWORD = '<password>'
$env:ROMS_INVENTORY_STAFF_USERNAME = '<inventory-test>'
$env:ROMS_INVENTORY_STAFF_PASSWORD = '<password>'
$env:ROMS_TABLE_ACCOUNT_USERNAME = '<tablet-test>'
$env:ROMS_TABLE_ACCOUNT_PASSWORD = '<password>'
npm run test:system
```

TABLE_ACCOUNT phải được gán một bàn hoạt động. Với các bài trang menu/theo dõi đơn, chuẩn bị phiên ACTIVE cho bàn trước. Không có khách hoặc tiến trình bếp tự động xử lý dữ liệu fixture trong khi test chạy. Dùng cùng hostname `127.0.0.1` cho frontend và backend khi chạy local, JWT refresh cookie local không đặt Secure. Nếu truy cập trực tiếp khác origin, cấu hình CORS phù hợp.

Test thiếu tài khoản hoặc không kết nối được sẽ báo lỗi; không tự ghi Passed hoặc tự bỏ qua để tạo báo cáo xanh. Các bài độc lập về dữ liệu nhưng chạy 1 worker để tránh thay thế phiên TABLE_ACCOUNT ngoài ý muốn. Không bật retry tự động cho nghiệp vụ có ghi dữ liệu.

Sau mỗi workflow, test cố đăng xuất và đóng HTTP context; dữ liệu nghiệp vụ được giữ lại để tra cứu bằng attachment `fixture-ids`. Đặt lại database test từ snapshot khi cần; suite không xóa lịch sử kho/đơn hàng. Việc đặt lại database thuộc bước quản lý môi trường test.

## Kết quả và phạm vi

```powershell
npm run test:system:list
npm run test:system:report
```

Báo cáo lần chạy gần nhất: `playwright-report/system/index.html`, `test-results/system/results.json`, `results.xml`; ảnh khi lỗi trong `test-results/system`. Các file này được gitignore. Trace mặc định tắt; đặt `ROMS_TRACE=1` nếu cần trong môi trường test vì trace có thể chứa request đăng nhập.

| File | Nội dung |
|---|---|
| `auth.system.spec.mjs` | 5 bài public; đăng nhập, sai mật khẩu, reload, logout theo 5 vai trò; trang/API bị cấm |
| `pages.system.spec.mjs` | 26 trang lấy từ catalogue và giỏ hàng trống; kiểm tra URL, heading, API tải dữ liệu |
| `workflow.system.spec.mjs` | 5 workflow: nhập/sửa/kiểm kê/rollback; hủy và hoàn kho; bếp–phục vụ/giá lịch sử; cách ly bàn/hết hàng/trạng thái món; dữ liệu nền và thu hồi phiên |
| `cases.json` | 127 ca: sheet, dòng, mô tả, điều kiện, expected, loại tự động hóa và giới hạn |
| `REVIEW.md` | Kết luận rà soát Excel và các nội dung cần bổ sung |
| `ROMS_System_Test.reviewed.xlsx` | Bản rà soát riêng; các vòng system test chưa thực thi đặt Pending |

Các nhãn `[partial]` và `PARTIAL` không xác nhận toàn bộ Expected Results trong Excel. Ví dụ TA10 qua API kiểm tra dữ liệu đơn hàng nhưng chưa bấm toàn bộ giỏ hàng/checkout; kiểm tra trang báo cáo chưa xác nhận số liệu đúng. Các ca ghép trong workflow cần đọc kết quả từng step, không đổi tất cả mã thành Passed nếu cả bài chưa đạt hoặc mới kiểm tra một phần.

Để tái tạo bản Excel rà soát và catalogue (thao tác này đặt trạng thái lại Pending, không nhập kết quả chạy):

```powershell
node tests/system/review-workbook.mjs 'D:\Report-5.3_System_Test_FRs_ROMS_Testt1.xlsx'
```

Tài liệu nền dùng khi viết script: [Playwright assertions](https://playwright.dev/docs/test-assertions), [Playwright API testing](https://playwright.dev/docs/api-testing).
