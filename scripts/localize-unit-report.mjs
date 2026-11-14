import fs from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'

const root = path.resolve(import.meta.dirname, '../..')
const sourceDir = path.join(root, 'unit-test-delivery-full')
const out = path.join(root, 'unit-test-delivery-bilingual')
await fs.mkdir(out, { recursive: true })
const data = JSON.parse(await fs.readFile(path.join(sourceDir, 'test-cases.json'), 'utf8'))
const lines = (await fs.readFile(new URL('./locales/test-titles.vi.tsv', import.meta.url), 'utf8')).trim().split(/\r?\n/)
const titles = new Map(lines.map(line => {
  const split = line.indexOf('|')
  return ['UTC' + line.slice(0, split).padStart(4, '0'), line.slice(split + 1)]
}))
if (lines.length !== data.cases.length || titles.size !== data.cases.length || data.cases.some(c => !titles.get(c.id))) throw Error('Incomplete Vietnamese titles')
const englishOverrides = {
  UTC0091: 'Two concurrent checkout threads create exactly one bill without a race condition or deadlock',
  UTC0092: 'getBillPreview succeeds when menu prices include VAT',
  UTC0093: 'getBillPreview succeeds when menu prices exclude VAT, with separate 8% and 10% tax rows',
  UTC0094: 'getBillPreview rejects a table with PENDING or COOKING items',
  UTC0095: 'Checkout succeeds with full cash payment and no promotion code',
  UTC0096: 'Checkout succeeds with two payment methods and a PERCENT promotion',
  UTC0097: 'Checkout rejects payments whose sum does not match totalAmount',
}
const names = {
  Cover:'Trang bìa', 'Test Cases':'Danh sách ca kiểm thử', 'Test Statistics':'Thống kê kiểm thử',
  AI:'Trợ lý AI', Auth:'Xác thực', Bill:'Hóa đơn', Category:'Danh mục', Cloudinary:'Cloudinary',
  'Common and Config':'Dùng chung và cấu hình', 'Dashboard and CSV':'Tổng quan và CSV', Expense:'Chi phí',
  'FE AI':'FE - Trợ lý AI', 'FE Auth':'FE - Xác thực', 'FE Billing':'FE - Hóa đơn', 'FE Dashboard':'FE - Tổng quan',
  'FE Expense':'FE - Chi phí', 'FE Ingredient Import':'FE - Nhập nguyên liệu', 'FE Inventory':'FE - Kho',
  'FE Kitchen':'FE - Bếp', 'FE Menu':'FE - Thực đơn', 'FE Ordering':'FE - Gọi món',
  'FE Promotion':'FE - Khuyến mãi', 'FE Purchase':'FE - Nhập hàng', 'FE Purchase Import':'FE - Excel nhập hàng',
  'FE Realtime':'FE - Thời gian thực', 'FE Recipes':'FE - Công thức', 'FE Reports':'FE - Báo cáo',
  'FE Settings':'FE - Cài đặt', 'FE Table':'FE - Bàn', 'FE Users':'FE - Người dùng',
  Ingredient:'Nguyên liệu', 'Inventory Check':'Kiểm kê', Kitchen:'Bếp', Menu:'Thực đơn', Order:'Đơn gọi món',
  Printer:'In ấn', Promotion:'Khuyến mãi', Purchase:'Nhập hàng', Realtime:'Thời gian thực', Recipe:'Công thức',
  'Restaurant Setting':'Cài đặt nhà hàng', Security:'Bảo mật', 'Service Session':'Phiên phục vụ',
  'Stock Movement':'Biến động kho', Table:'Bàn', Tax:'Thuế', User:'Người dùng',
  'Code Inventory':'Danh mục mã kiểm thử', 'Read Me':'Hướng dẫn', 'Project Scope':'Phạm vi dự án',
  'Backend Service Scope':'Phạm vi dịch vụ backend',
}
const viTerms = { Passed:'Đạt', Failed:'Không đạt', Pending:'Chưa chạy', Normal:'Bình thường', Abnormal:'Bất thường', Boundary:'Biên', 'N/A':'Không áp dụng' }
const viLevels = { 'Unit (isolated)':'Đơn vị (độc lập)', 'Unit (Node.js)':'Đơn vị (Node.js)', 'Component (mock HTTP/security)':'Thành phần (HTTP/bảo mật giả lập)', 'Integration / môi trường':'Tích hợp / môi trường' }
const enLevels = { 'Integration / môi trường':'Integration / environment' }
const reasonPairs = new Map([
  ['Integration test khởi động Spring Boot và cần hạ tầng ứng dụng/database; không chạy trong profile unit-tests.', 'This integration test starts Spring Boot and requires application/database infrastructure; it is excluded from the unit-tests profile.'],
  ['Live smoke test cần bật riêng và thông tin Cloudinary.', 'This live smoke test requires explicit opt-in and Cloudinary credentials.'],
  ['Phụ thuộc máy in Windows; test hiện có có thể gửi lệnh in thật.', 'This test depends on Windows printers and may submit actual print jobs.'],
  ['Đã chạy trong profile unit-tests','Executed with the unit-tests profile'],
  ['Đã chạy bằng Node.js test runner','Executed with the Node.js test runner'],
])
const otherPairs = new Map([
  ['Node.js 24; gọi API/store/utility/schema thật. Helper register.mjs chỉ nạp TS, thay Vite DEV=false và thay HTTP client bằng httpMock.mjs; DOM/sessionStorage nếu cần được giả lập, không gọi mạng hay in thật. Xem beforeEach/afterEach và helper trong source.', 'Node.js 24 calls the real API/store/utility/schema code. register.mjs only loads TypeScript, sets the Vite DEV flag to false in memory, and replaces the HTTP client with httpMock.mjs. DOM/sessionStorage are simulated where required; no network requests or physical printing occur. See beforeEach/afterEach and the source helpers.'],
  ['Node.js + Zod có sẵn. Gọi schema thật của frontend; không gọi backend/database.', 'Node.js and the existing Zod dependency call the real frontend schemas; no backend or database is contacted.'],
  ['Node.js + ExcelJS; tạo workbook trong bộ nhớ. Xem helper excel() trong file nguồn. HTTP nếu có được mock.', 'Node.js and ExcelJS create workbooks in memory. See the excel() helper in the source file. HTTP, if used, is mocked.'],
  ['JUnit: tất cả assertion trong test đã đạt.', 'JUnit: all assertions in this test passed.'],
  ['Node.js test runner: đối chiếu frontend-unit-results.xml.', 'Node.js test runner: see frontend-unit-results.xml.'],
  ['Tham số nằm trực tiếp trong assertion/lời gọi bên cột Expected Results.', 'Parameters appear directly in the assertion or invocation in the Expected Results column.'],
  ['Xem assertion trong method nguồn và kết quả JUnit.', 'See the assertions in the source method and the JUnit result.'],
])
function narrative(text, language) {
  if (language === 'vi') return text
    .replace(/^Dependencies được mock\/cấu hình trong (.+)\./, 'Các đối tượng phụ thuộc được giả lập hoặc cấu hình trong $1.')
    .replace('Fixture chung: xem sheet Code Inventory và @BeforeEach trong file nguồn.', 'Dữ liệu dùng chung: xem Danh mục mã kiểm thử và @BeforeEach trong file nguồn.')
    .replace('Integration test khởi động Spring Boot và cần hạ tầng ứng dụng/database; không chạy trong profile unit-tests.', 'Kiểm thử tích hợp khởi động Spring Boot và cần hạ tầng ứng dụng/cơ sở dữ liệu; không chạy trong cấu hình unit-tests.')
    .replace('Live smoke test cần bật riêng và thông tin Cloudinary.', 'Kiểm thử nhanh với dịch vụ thật cần bật riêng và có thông tin xác thực Cloudinary.')
    .replace('Phụ thuộc máy in Windows; test hiện có có thể gửi lệnh in thật.', 'Phụ thuộc máy in Windows; ca hiện có có thể gửi lệnh in thật.')
    .replace('Đã chạy trong profile unit-tests', 'Đã chạy trong cấu hình unit-tests')
    .replace('Đã chạy bằng Node.js test runner', 'Đã chạy bằng trình kiểm thử Node.js')
    .replace('JUnit: tất cả assertion trong test đã đạt.', 'JUnit: mọi phép xác nhận trong ca đều đạt.')
    .replace('Node.js test runner: đối chiếu frontend-unit-results.xml.', 'Trình kiểm thử Node.js: xem frontend-unit-results.xml.')
    .replace('Node.js + Zod có sẵn. Gọi schema thật của frontend; không gọi backend/database.', 'Node.js và Zod có sẵn. Gọi lược đồ dữ liệu thật của FE; không gọi backend hoặc cơ sở dữ liệu.')
    .replace('Node.js + ExcelJS; tạo workbook trong bộ nhớ. Xem helper excel() trong file nguồn. HTTP nếu có được mock.', 'Node.js và ExcelJS tạo bảng tính trong bộ nhớ. Xem hàm hỗ trợ excel() trong mã nguồn. Lời gọi HTTP nếu có được giả lập.')
    .replace('Node.js 24; gọi API/store/utility/schema thật. Helper register.mjs chỉ nạp TS, thay Vite DEV=false và thay HTTP client bằng httpMock.mjs; DOM/sessionStorage nếu cần được giả lập, không gọi mạng hay in thật. Xem beforeEach/afterEach và helper trong source.', 'Node.js 24 gọi mã API, trạng thái, tiện ích và lược đồ dữ liệu thật. Hàm hỗ trợ register.mjs chỉ nạp TS, đặt Vite DEV=false và thay HTTP client bằng httpMock.mjs; DOM/sessionStorage được giả lập khi cần, không gọi mạng hoặc in thật. Xem beforeEach/afterEach và các hàm hỗ trợ trong mã nguồn.')
  if (reasonPairs.has(text)) return reasonPairs.get(text)
  if (otherPairs.has(text)) return otherPairs.get(text)
  return text.replace(/^Dependencies được mock\/cấu hình trong (.+)\./, 'Dependencies are mocked/configured in $1.')
    .replace('Fixture chung: xem sheet Code Inventory và @BeforeEach trong file nguồn.', 'Shared fixtures: see Code Inventory and @BeforeEach in the source file.')
    .replace('Chưa chạy: ', 'Not executed: ')
    .replace(/Integration test khởi động Spring Boot và cần hạ tầng ứng dụng\/database; không chạy trong profile unit-tests\./g, reasonPairs.get('Integration test khởi động Spring Boot và cần hạ tầng ứng dụng/database; không chạy trong profile unit-tests.'))
    .replace(/Live smoke test cần bật riêng và thông tin Cloudinary\./g, reasonPairs.get('Live smoke test cần bật riêng và thông tin Cloudinary.'))
    .replace(/Phụ thuộc máy in Windows; test hiện có có thể gửi lệnh in thật\./g, reasonPairs.get('Phụ thuộc máy in Windows; test hiện có có thể gửi lệnh in thật.'))
}
const scopesEn = [
  ['Authentication, sessions, OTP and passwords','Login, refresh, logout, valid/invalid/expired OTP, and tablet/staff session policies.'],
  ['User accounts and profiles','Staff/tablet CRUD, table assignment, email normalization, self-deactivation protection, password changes and session revocation.'],
  ['Tables and service sessions','Table CRUD, status, opening/closing/transferring sessions, transfer history and staff calls.'],
  ['Ordering and shopping cart','Add/merge/remove dishes, notes and cart totals, create/cancel orders, partial cancellation and direct-sale returns.'],
  ['Kitchen KDS and ready dishes','Accept orders, cook-all/ready-all commands, item transitions, READY queue and STOMP deduplication.'],
  ['Bill previews, invoices and checkout','Preview, VAT/discounts, split payments, duplicate-checkout protection and mocked printing.'],
  ['Menu, categories, images and Excel','CRUD, read/write authorization, sellability, images/multipart, prices, VAT, categories, Excel and duplicate confirmation.'],
  ['Ingredients, stock checks and movements','Ingredient CRUD/import, stocktaking, discrepancies, stock history and boundary data.'],
  ['Recipe quantities and ingredient costs','Read/replace recipes, add/update/delete ingredients, decimal quantities and inactive ingredients.'],
  ['Purchases and corrections','Date filters, purchase creation/details, quantity/price corrections, compensating stock adjustments and Excel input.'],
  ['Promotions','CRUD, active state, duplicate codes, percentage/fixed discounts, date windows and usage limits.'],
  ['Expenses and cancellation','Create/update/cancel expenses, cancellation reasons, status/date filters and amount boundaries.'],
  ['Dashboard and best-selling dishes','Overview, date windows, ranked dishes, trends, missing data and authorization errors.'],
  ['Financial reports and CSV','Revenue, expenses, negative profit, filters, CSV/blob export, UTF-8 BOM and rounding.'],
  ['Restaurant, VAT and printer settings','snake_case/camelCase normalization, preservation of false values, VAT, tax rates, paper sizes and no physical printing.'],
  ['AI assistant and shared realtime','Allergies/budget/party size, table/session chat isolation, after-commit cache invalidation, provider failures and STOMP authorization.'],
]
const scopesVi = [
  ['Xác thực, phiên, OTP và mật khẩu','Đăng nhập, làm mới token, đăng xuất, OTP đúng/sai/hết hạn và chính sách phiên tablet/nhân viên.'],
  ['Quản lý tài khoản và hồ sơ','Tạo/đọc/sửa/xóa nhân viên và tablet, gán bàn, chuẩn hóa email, bảo vệ tự khóa, đổi mật khẩu và thu hồi phiên.'],
  ['Bàn và phiên phục vụ','Tạo/đọc/sửa/xóa bàn, trạng thái, mở/đóng/chuyển phiên, lịch sử chuyển bàn và gọi nhân viên.'],
  ['Gọi món và giỏ hàng','Thêm/gộp/xóa món, ghi chú và tổng giỏ, tạo/hủy đơn, hủy một phần và trả hàng bán thẳng.'],
  ['Bếp KDS và ra món','Nhận đơn, lệnh cook-all/ready-all, chuyển trạng thái món, hàng đợi READY và chống trùng STOMP.'],
  ['Tạm tính, hóa đơn và thanh toán','Tạm tính, VAT/giảm giá, chia phương thức thanh toán, chống thanh toán trùng và in giả lập.'],
  ['Thực đơn, danh mục, ảnh và Excel','Tạo/đọc/sửa/xóa, quyền đọc/ghi, khả năng bán, ảnh/multipart, giá, VAT, danh mục, Excel và xác nhận trùng.'],
  ['Nguyên liệu, kiểm kê và biến động','Tạo/đọc/sửa/xóa và nhập nguyên liệu, kiểm kê, chênh lệch, lịch sử kho và dữ liệu biên.'],
  ['Định lượng và chi phí công thức','Đọc/thay công thức, thêm/sửa/xóa nguyên liệu, định lượng thập phân và nguyên liệu ngừng dùng.'],
  ['Phiếu nhập và điều chỉnh','Lọc ngày, tạo/xem phiếu nhập, sửa số lượng/đơn giá, bù trừ tồn và dữ liệu Excel đầu vào.'],
  ['Khuyến mãi','Tạo/đọc/sửa/xóa, trạng thái hoạt động, mã trùng, giảm theo phần trăm/số tiền, thời hạn và lượt dùng.'],
  ['Chi phí và hủy khoản chi','Tạo/sửa/hủy, lý do hủy, bộ lọc trạng thái/ngày và biên số tiền.'],
  ['Tổng quan và món bán chạy','Tổng quan, khoảng ngày, thứ hạng món, xu hướng, dữ liệu thiếu và lỗi quyền truy cập.'],
  ['Báo cáo tài chính và CSV','Doanh thu, chi phí, lợi nhuận âm, bộ lọc, xuất CSV/Blob, BOM UTF-8 và làm tròn.'],
  ['Cài đặt nhà hàng, VAT và máy in','Chuẩn hóa snake_case/camelCase, giữ false, VAT, thuế suất, khổ giấy và không in thật.'],
  ['Trợ lý AI và thời gian thực dùng chung','Dị ứng/ngân sách/số người, cách ly chat theo bàn/phiên, xóa cache sau commit, lỗi nhà cung cấp và quyền STOMP.'],
]
const readMe = {
  vi: [
    ['Kết quả','Tổng 720 ca; 638 đạt; 0 không đạt; 82 chưa chạy. Đã chạy 487 ca backend và 151 ca FE. Bổ sung 86 ca backend và 138 ca FE so với mã nguồn ban đầu.'],
    ['Phạm vi','Toàn bộ 16 nhóm chức năng: xác thực, người dùng, bàn, gọi món, bếp, hóa đơn, thực đơn, kho, công thức, nhập hàng, khuyến mãi, chi phí, tổng quan, báo cáo, cài đặt và AI. Có kiểm thử logic, trạng thái, lược đồ dữ liệu, hợp đồng API ở FE và dịch vụ backend. Xem Phạm vi dự án và Phạm vi dịch vụ backend. Không khẳng định bao phủ 100% nhánh hay giao diện React.'],
    ['Môi trường','Windows; Java 21; Maven; Spring Boot theo pom.xml; Node.js; ExcelJS có sẵn trong FE. Không thêm thư viện phụ thuộc cho ứng dụng.'],
    ['Backend','cd roms-backend; mvn -Punit-tests test (hoặc .\\run-unit-tests.ps1). XML: target/roms-unit-reports.'],
    ['Frontend','cd ROMS_FE; npm test (hoặc npm run test:unit). Mã kiểm thử: ROMS_FE/tests/*.test.mjs; hàm hỗ trợ: tests/helpers/*.mjs. Không gọi HTTP hay máy in thật. Kiểm thử API kiểm tra yêu cầu, phản hồi và truyền lỗi; không thay thế kiểm thử nghiệp vụ backend.'],
    ['Bằng chứng','execution-results.json lưu trạng thái, tên và thời gian thực chạy; test-cases.json lưu ánh xạ mã nguồn. Không lấy kết quả từ thư mục surefire-reports cũ.'],
    ['Chưa chạy','Các ca dùng @SpringBootTest, PostgreSQL thật, Cloudinary thật hoặc máy in cần môi trường riêng. Chưa thực thi và không đánh dấu đạt.'],
    ['Phân loại','Bình thường / Bất thường / Biên được gợi ý từ tên ca và phép xác nhận, chưa có người rà soát nghiệp vụ xác nhận. Một hàm kiểm thử có thể có nhiều phép xác nhận; danh mục đếm hàm/ca, không đếm phép xác nhận.'],
    ['Đầu vào / Kỳ vọng','Trích nguyên dữ liệu chuẩn bị, thao tác và phép xác nhận từ code để tái lập. Dữ liệu dùng chung ở Danh mục mã kiểm thử và file nguồn; cần đọc cả hàm hỗ trợ nếu ca có sử dụng.'],
    ['Vòng 2 / 3','Không áp dụng: chưa thực hiện đợt kiểm thử lại riêng. Không sao chép vòng kiểm thử, lỗi, tác giả hoặc kết quả của dự án trong mẫu.'],
    ['Độ bao phủ','Tỷ lệ đã chạy và đạt được tính từ danh mục. Chưa đo độ bao phủ dòng/nhánh; không suy ra chất lượng hoặc độ bao phủ mã nguồn đạt 100%.'],
    ['Người rà soát / kiểm thử','Người rà soát: chưa xác nhận. Người kiểm thử: công cụ tự động JUnit/Node.js; không gán tên thành viên dự án.'],
    ['Quy tắc ngôn ngữ','Hai bản chỉ khác ngôn ngữ trình bày. Giữ nguyên mã ca, tên lớp/hàm, đường dẫn, endpoint, hằng số, mã nguồn và chuỗi dữ liệu đầu vào/đầu ra để bảo toàn ý nghĩa thực thi. Vì vậy đoạn code và dữ liệu gốc có thể chứa tiếng Việt hoặc tiếng Anh trong cả hai bản.'],
  ],
  en: [
    ['Results','720 cases in total: 638 passed, 0 failed and 82 not executed. Executed 487 backend and 151 FE cases. Added 86 backend and 138 FE cases relative to the original source.'],
    ['Scope','All 16 functional groups: authentication, users, tables, ordering, kitchen, billing, menu, inventory, recipes, purchasing, promotions, expenses, dashboard, reports, settings and AI. Covers frontend logic, state, schemas and API contracts, plus backend services. See Project Scope and Backend Service Scope. This does not claim 100% branch or React UI coverage.'],
    ['Environment','Windows; Java 21; Maven; Spring Boot as declared in pom.xml; Node.js; the existing FE ExcelJS dependency. No application dependencies were added.'],
    ['Backend','cd roms-backend; mvn -Punit-tests test (or .\\run-unit-tests.ps1). XML: target/roms-unit-reports.'],
    ['Frontend','cd ROMS_FE; npm test (or npm run test:unit). Tests: ROMS_FE/tests/*.test.mjs; helpers: tests/helpers/*.mjs. No real HTTP or printer calls. API tests check requests, responses and error propagation; they do not replace backend business-rule tests.'],
    ['Evidence','execution-results.json records executed statuses, names and durations; test-cases.json maps cases to source. Results do not come from the old surefire-reports directory.'],
    ['Not executed','Tests using @SpringBootTest, live PostgreSQL, live Cloudinary or printers require a separate environment. They have not been executed and are not marked as passed.'],
    ['Classification','Normal / Abnormal / Boundary labels are suggested from case names and assertions and have not been confirmed by a business reviewer. A test method may contain several assertions; the inventory counts methods/cases, not assertions.'],
    ['Input / Expected','Fixture data, actions and assertions are copied verbatim from code for reproducibility. Shared fixtures are in Code Inventory and the source file; read the helpers as well where used.'],
    ['Rounds 2 / 3','Not applicable: no separate retest round has been executed. Test rounds, defects, authors and results from the sample project are not copied.'],
    ['Coverage','Execution and pass rates are calculated from the inventory. Line/branch coverage has not been measured; these rates do not imply 100% quality or code coverage.'],
    ['Reviewer / Tester','Reviewer: not confirmed. Tester: automated JUnit/Node.js tools; no project team member is named.'],
    ['Language policy','The two versions differ only in presentation language. Case IDs, class/method names, paths, endpoints, constants, source code and input/output string literals remain unchanged to preserve executable meaning. Code excerpts and original data may therefore contain Vietnamese or English in either version.'],
  ],
}

const manifest = { source: 'unit-test-delivery-full', summary: data.summary, sheetCount: 51, cases: [] }
for (const language of ['vi', 'en']) {
  const w = new ExcelJS.Workbook()
  await w.xlsx.readFile(path.join(sourceDir, 'Report-5.1_Unit Test_ROMS_Full_Project.xlsx'))
  const t = (vi, en) => language === 'vi' ? vi : en
  const term = s => language === 'vi' ? (viTerms[s] ?? s) : s
  const moduleName = s => language === 'vi' ? (names[s] ?? s) : s
  const set = (s, ref, vi, en) => { s.getCell(ref).value = t(vi, en) }
  const cover = w.getWorksheet('Cover'), index = w.getWorksheet('Test Cases'), stats = w.getWorksheet('Test Statistics')
  const titleProject = t('Hệ thống quản lý vận hành nhà hàng (ROMS)', 'Restaurant Operations Management System (ROMS)')
  for (const [ref, vi, en] of [
    ['B2','TÀI LIỆU KIỂM THỬ ĐƠN VỊ','UNIT TEST DOCUMENT'], ['A4','Tên dự án','Project Name'],
    ['E4','Người tạo','Creator'], ['A5','Mã dự án','Project Code'], ['E5','Ngày phát hành','Issue Date'],
    ['A6','Mã tài liệu','Document Code'], ['E6','Phiên bản','Version'], ['A9','Lịch sử thay đổi','Record of Changes'],
    ['A10','Ngày hiệu lực','Effective Date'], ['B10','Phiên bản','Version'], ['C10','Hạng mục thay đổi','Changed Item'],
    ['D10','Thêm/Xóa/Sửa','Add/Delete/Modify'], ['E10','Mô tả thay đổi','Change Description'], ['F10','Tham chiếu','References'],
    ['C11','Toàn bộ 16 phân hệ FE và nghiệp vụ backend','All 16 functional groups and backend business services'],
    ['D11','Sửa','Modify'], ['F4','ROMS — công cụ kiểm thử tự động','ROMS — automated testing tools'],
    ['E11','720 ca: 638 đạt, 0 không đạt, 82 chưa chạy. Bổ sung 224 ca kiểm thử đơn vị. Chỉ ghi nhận một vòng chạy thực tế.','720 cases: 638 passed, 0 failed, 82 not executed. Added 224 unit tests. Only one actual execution round is recorded.'],
    ['F11','Mã nguồn ROMS; PRD; TECH_ARCHITECTURE; code test; JUnit XML; Node.js XML. Mẫu bố cục: unit-test-mau.xlsx và Report-5.1_Unit Test.xlsx. Nội dung dự án mẫu được thay bằng ROMS.','ROMS source; PRD; TECH_ARCHITECTURE; test code; JUnit XML; Node.js XML. Layout templates: unit-test-mau.xlsx and Report-5.1_Unit Test.xlsx. Sample-project content is replaced with ROMS content.'],
  ]) set(cover, ref, vi, en)
  cover.getCell('B4').value = titleProject
  for (const [ref, vi, en] of [
    ['D1','DANH SÁCH CA KIỂM THỬ','TEST CASE LIST'], ['B3','Tên dự án','Project Name'], ['B4','Mã dự án','Project Code'],
    ['B5','Mô tả thiết lập môi trường kiểm thử','Test Environment Setup'], ['B8','STT','No.'], ['C8','Tên phân hệ','Module Name'],
    ['D8','Tên trang tính','Sheet Name'], ['E8','Mô tả','Description'], ['F8','Điều kiện tiên quyết','Preconditions'],
    ['D5','Java 21; Maven; Spring Boot theo pom.xml; JUnit + Mockito + AssertJ. Backend: mvn -Punit-tests test. FE: node --test tests/*.test.mjs. Profile loại kiểm thử tích hợp và máy in. Dùng kết quả lần chạy hiện tại, không dùng XML cũ.','Java 21; Maven; Spring Boot as declared in pom.xml; JUnit + Mockito + AssertJ. Backend: mvn -Punit-tests test. FE: node --test tests/*.test.mjs. The profile excludes integration and printer tests. Results come from the current execution, not old XML.'],
  ]) set(index, ref, vi, en)
  index.getCell('D3').value = titleProject
  for (const [ref, vi, en] of [
    ['A2','THỐNG KÊ KIỂM THỬ ĐƠN VỊ','UNIT TEST STATISTICS'], ['A4','Tên dự án','Project Name'], ['D4','Người tạo','Creator'],
    ['F4','ROMS — kiểm thử tự động','ROMS — automated testing'], ['A5','Mã dự án','Project Code'], ['D5','Người rà soát/phê duyệt','Reviewer/Approver'],
    ['F5','Chưa xác nhận','Not confirmed'], ['A6','Mã tài liệu','Document Code'], ['D6','Ngày phát hành','Issue Date'], ['A7','Ghi chú','Notes'],
    ['B7','Vòng 1: đã chạy 487 ca backend và 151 ca FE; 638 đạt, 0 không đạt. Chưa chạy 82 ca tích hợp/máy in. Vòng 2/3: không áp dụng. Tỷ lệ bên dưới đo số ca thực thi trong danh mục, không phải độ bao phủ dòng/nhánh. Phân loại bình thường/bất thường/biên được gợi ý từ tên và phép xác nhận, cần rà soát nghiệp vụ.','Round 1: executed 487 backend and 151 FE cases; 638 passed, 0 failed. 82 integration/printer cases have not been executed. Rounds 2/3: not applicable. Rates below measure case execution within the inventory, not line/branch coverage. Normal/abnormal/boundary labels are suggested from names and assertions and require business review.'],
  ]) set(stats, ref, vi, en)
  stats.getCell('B4').value = titleProject
  stats.getRow(11).values = t(['STT','Mã chức năng','Đạt','Không đạt','Chưa chạy','Bình thường','Bất thường','Biên','Tổng số ca'], ['No.','Function Code','Passed','Failed','Untested','Normal','Abnormal','Boundary','Total Cases'])

  const modules = [...new Set(data.cases.map(c => c.module))]
  const note = t('Chưa thực hiện vòng kiểm thử lại riêng.', 'No separate retest round has been executed.')
  for (const [i, module] of modules.entries()) {
    const s = w.getWorksheet(module), list = data.cases.filter(c => c.module === module)
    set(s,'A2','Mã phân hệ','Module Code'); s.getCell('B2').value = moduleName(module)
    set(s,'A3','Số ca kiểm thử','Number of Cases')
    s.getRow(4).values = t(['Vòng kiểm thử','Đạt','Không đạt','Chưa chạy'], ['Testing Round','Passed','Failed','Pending'])
    for (let round = 1; round <= 3; round++) s.getCell('A' + (round + 4)).value = t('Vòng ', 'Round ') + round
    s.getRow(8).values = t(['Loại kiểm thử','Bình thường','Bất thường','Biên'], ['Testing Type','Normal','Abnormal','Boundary'])
    set(s,'A9','Số lượng','Count')
    set(s,'A10','Ghi nhận một vòng chạy thực tế. Vòng 2/3 không áp dụng. Đầu vào/kỳ vọng trích từ dữ liệu chuẩn bị và phép xác nhận trong code; xem mã nguồn và Danh mục mã kiểm thử để có đầy đủ @BeforeEach.','One actual execution round is recorded. Rounds 2/3 are not applicable. Inputs/expected results are extracted from fixtures and assertions in code; see the source and Code Inventory for complete @BeforeEach setup.')
    s.getRow(11).values = t(
      ['Mã ca kiểm thử','Điều kiện tiên quyết','Đầu vào / chuẩn bị và thao tác','Kết quả kỳ vọng / phép xác nhận','Loại','Vòng 1','Ngày kiểm thử','Người kiểm thử','Vòng 2','Ngày kiểm thử','Người kiểm thử','Vòng 3','Ngày kiểm thử','Người kiểm thử','Mã lỗi','Mô tả / ghi chú','Mức kiểm thử','Mã nguồn / hàm kiểm thử','Kết quả thực tế','Thời gian (giây)'],
      ['Test Case ID','Preconditions','Input / Setup and Action','Expected Results / Assertions','Type','Round 1','Test Date','Tester','Round 2','Test Date','Tester','Round 3','Test Date','Tester','Defect IDs','Description / Notes','Test Level','Source / Test Method','Actual Result','Time (seconds)'])
    for (const [j,c] of list.entries()) {
      const r = s.getRow(j + 13), title = language === 'vi' ? titles.get(c.id) : (englishOverrides[c.id] ?? c.title)
      r.getCell(2).value = narrative(c.precondition, language)
      if (otherPairs.has(c.input)) r.getCell(3).value = language === 'vi' ? c.input.replace('assertion/lời gọi bên cột Expected Results','phép xác nhận hoặc lời gọi trong cột Kết quả kỳ vọng') : otherPairs.get(c.input)
      if (otherPairs.has(c.expected)) r.getCell(4).value = language === 'vi' ? 'Xem phép xác nhận trong hàm nguồn và kết quả JUnit.' : otherPairs.get(c.expected)
      r.getCell(5).value = term(c.type); r.getCell(6).value = term(c.status)
      r.getCell(8).value = c.status === 'Pending' ? '' : t('Tự động (JUnit/Node)', 'Automated (JUnit/Node)')
      r.getCell(9).value = term('N/A'); r.getCell(12).value = term('N/A')
      r.getCell(16).value = title + '\n' + (c.reason ? narrative(c.reason,language) : note)
      r.getCell(17).value = language === 'vi' ? viLevels[c.level] : (enLevels[c.level] ?? c.level)
      r.getCell(19).value = narrative(c.actual,language)
      r.getCell(6).dataValidation = { type:'list', allowBlank:false, formulae:['"' + ['Passed','Failed','Pending'].map(term).join(',') + '"'] }
      if(language === 'vi') manifest.cases.push({ id:c.id, module:c.module, vi:title, en:englishOverrides[c.id] ?? c.title, status:c.status, type:c.type, source:c.source })
    }
    const ir = index.getRow(9+i)
    ir.getCell(3).value = moduleName(module)
    ir.getCell(4).value = { text:moduleName(module), hyperlink:`#'${moduleName(module)}'!A1` }
    const n = status => list.filter(c=>c.status===status).length
    ir.getCell(5).value = t(`${list.length} ca: ${n('Passed')} đạt, ${n('Failed')} không đạt, ${n('Pending')} chưa chạy. `, `${list.length} cases: ${n('Passed')} passed, ${n('Failed')} failed, ${n('Pending')} not executed. `) + [...new Set(list.map(c=>c.source.split('/').at(-1)))].join(', ')
    ir.getCell(6).value = t('Dữ liệu chuẩn bị và giả lập: xem Danh mục mã kiểm thử; ca cần hạ tầng được ghi chưa chạy.', 'See Code Inventory for fixtures and mocks; infrastructure-dependent cases are marked as not executed.')
    stats.getRow(12+i).getCell(2).value = moduleName(module)
  }
  const totalRow = 13 + modules.length
  set(stats,'B'+totalRow,'Tổng cộng','Total')
  for(const [j,vi,en] of [[0,'Tỷ lệ ca đã thực thi (không phải độ bao phủ code)','Case Execution Rate (not code coverage)'],[1,'Tỷ lệ đạt trên tổng số ca','Pass Rate Across All Cases'],[2,'Ca bình thường','Normal Cases'],[3,'Ca bất thường','Abnormal Cases'],[4,'Ca biên','Boundary Cases']]) set(stats,'B'+(totalRow+2+j),vi,en)

  const inventory = w.getWorksheet('Code Inventory')
  inventory.getRow(1).values = t(['Lớp / file kiểm thử','Mã nguồn','Số ca','Mức kiểm thử','Lý do chưa chạy / phạm vi','Đối tượng giả lập','Dữ liệu chung / @BeforeEach / import (trích code)'], ['Test Class / File','Source','Cases','Test Level','Pending Reason / Scope','Mocks','Shared Fixtures / @BeforeEach / Imports (code excerpt)'])
  inventory.eachRow((r,i)=>{
    if(i===1) return
    r.getCell(4).value = language==='vi' ? (viLevels[r.getCell(4).value] ?? r.getCell(4).value) : (enLevels[r.getCell(4).value] ?? r.getCell(4).value)
    r.getCell(5).value = narrative(r.getCell(5).value,language)
    if(r.getCell(6).value==='Không gọi backend/database.') r.getCell(6).value=t('Không gọi backend hoặc cơ sở dữ liệu.','No backend or database calls.')
    if(r.getCell(7).value==='Không có @BeforeEach') r.getCell(7).value=t('Không có @BeforeEach','No @BeforeEach setup')
  })
  const read = w.getWorksheet('Read Me')
  read.getRow(1).values = t(['Mục','Nội dung'], ['Item','Content'])
  for(const [i,values] of readMe[language].entries()) {
    const r=read.getRow(i+2);r.values=values;r.height=i===12?85:65
    for(let col=1;col<=2;col++) {r.getCell(col).style={...read.getRow(3).getCell(col).style};r.getCell(col).alignment={wrapText:true,vertical:'top'}}
  }
  const projectScope = w.getWorksheet('Project Scope')
  projectScope.getRow(1).values = t(['Phân hệ FE','Phạm vi','Mã kiểm thử FE thực thi','Mã kiểm thử backend','FE đạt','Backend đạt','Backend chưa chạy','Luồng kiểm thử / giới hạn'], ['FE Feature','Scope','Executed FE Test Code','Backend Test Code','FE Passed','Backend Passed','Backend Pending','Test Flows / Limits'])
  const scopeSuffixVi=' Các số này là ca test được ánh xạ; một ca dùng chung có thể xuất hiện ở nhiều phân hệ. Không cộng bảng này làm tổng hay hiểu là line/branch coverage.'
  const scopeSuffixEn=' These are mapped cases; a shared case may appear in more than one feature. Do not sum this table as the total or interpret it as line/branch coverage.'
  projectScope.eachRow((r,i)=>{if(i>1){const pair=(language==='vi'?scopesVi:scopesEn)[i-2];r.getCell(2).value=pair[0];r.getCell(8).value=pair[1]+t(' Đây là số ca được ánh xạ; một ca dùng chung có thể xuất hiện ở nhiều phân hệ. Không cộng bảng này thành tổng số ca hoặc hiểu là độ bao phủ dòng/nhánh.',scopeSuffixEn)}})
  const backendScope=w.getWorksheet('Backend Service Scope')
  backendScope.getRow(1).values=t(['Dịch vụ / hàm hỗ trợ thực tế','Mã nguồn ứng dụng','Mã kiểm thử trực tiếp','Số ca đạt trong lớp kiểm thử','Ghi chú phạm vi'],['Actual Service / Helper','Application Source','Direct Test Code','Passed Cases in Referencing Classes','Scope Notes'])
  backendScope.eachRow((r,i)=>{if(i>1)r.getCell(5).value=t('Có kiểm thử gọi phần triển khai hoặc hàm hỗ trợ thật với đối tượng phụ thuộc giả lập. Số ca tính trên toàn lớp kiểm thử tham chiếu; không phải độ bao phủ từng hàm hoặc nhánh.','Tests invoke the real implementation/helper with mocked dependencies. Case counts cover the entire referencing test class, not individual-method or branch coverage.')})

  // Rewrite sheet references and COUNTIF criteria without changing executable snippets.
  for(const s of w.worksheets) s.eachRow(r=>r.eachCell(cell=>{
    if(cell.type===ExcelJS.ValueType.Merge) return
    if(cell.value?.formula && language==='vi') {
      let f=cell.value.formula
      for(const [oldName,newName] of Object.entries(names)) f=f.replaceAll(`'${oldName}'!`,`'${newName}'!`)
      for(const [oldTerm,newTerm] of Object.entries(viTerms)) f=f.replaceAll('"'+oldTerm+'"','"'+newTerm+'"')
      cell.value={...cell.value,formula:f}
    }
  }))
  if(language==='vi') for(const s of w.worksheets) s.name=moduleName(s.name)
  w.creator='ROMS';w.lastModifiedBy='ROMS';w.calcProperties.fullCalcOnLoad=true
  const file=path.join(out, language==='vi'?'ROMS_Unit_Test_Full_Project_VI.xlsx':'ROMS_Unit_Test_Full_Project_EN.xlsx')
  await w.xlsx.writeFile(file)
  console.log('Saved '+file)
}
await fs.writeFile(path.join(out,'language-equivalence.json'),JSON.stringify(manifest,null,2),'utf8')
