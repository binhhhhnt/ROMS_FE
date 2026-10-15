# ROMS Frontend — Screen Specification

**Source:** `ROMS_FE_Screen_Map.xlsx` supplied by the project team. **Status:** Working screen/route plan; UI is designed by Antigravity under Design System, except Login layout from `login.html`. Do not construe proposed routes as existing React Router or backend API paths.

## 1. Screen Register (46 UI Entries)

| Screen ID | Name | Related ROMS Tickets | Owner | Proposed Route | UI Type | Feature |
|---|---|---|---|---|---|---|
| FE-SCR-001 | Đăng nhập | ROMS-001 | BINH-DEV | `/login` | Page | auth |
| FE-SCR-002 | Giỏ hàng tablet | ROMS-027 | BINH-DEV | `/tablet/cart` | Page | ordering |
| FE-SCR-003 | Xác nhận đặt món | ROMS-028 | BINH-DEV | `/tablet/checkout` | Page | ordering |
| FE-SCR-004 | Đặt món thành công | ROMS-029 | BINH-DEV | `/tablet/order-success` | Page | ordering |
| FE-SCR-005 | Theo dõi order tablet | ROMS-030, ROMS-031 | BINH-DEV | `/tablet/orders` | Page | ordering |
| FE-SCR-006 | Danh sách order phục vụ | ROMS-033 | BINH-DEV | `/staff/orders` | Page | ordering |
| FE-SCR-007 | Chi tiết order phục vụ | ROMS-034, ROMS-035 | BINH-DEV | `/staff/orders/:orderId` | Page + Modal/Action | ordering |
| FE-SCR-008 | KDS hàng đợi | ROMS-037, ROMS-039, ROMS-042 | BINH-DEV | `/kitchen/queue` | Page + Modal/Action | kitchen |
| FE-SCR-009 | KDS chi tiết order | ROMS-038 | BINH-DEV | `/kitchen/orders/:orderId` | Page | kitchen |
| FE-SCR-010 | KDS đang chế biến | ROMS-040 | BINH-DEV | `/kitchen/cooking` | Page + Action | kitchen |
| FE-SCR-011 | KDS món sẵn sàng | ROMS-041 | BINH-DEV | `/kitchen/ready` | Page + Action | kitchen |
| FE-SCR-012 | Quên mật khẩu | ROMS-002 | QUANG | `/forgot-password` | Page | auth |
| FE-SCR-013 | Đặt lại mật khẩu | ROMS-003 | QUANG | `/reset-password` | Page | auth |
| FE-SCR-014 | Đổi mật khẩu | ROMS-004 | QUANG | `/settings/change-password` | Page | auth |
| FE-SCR-015 | Hồ sơ cá nhân | ROMS-005 | QUANG | `/profile` | Page | auth |
| FE-SCR-016 | Không có quyền | ROMS-006 | QUANG | `/access-denied` | Page | auth |
| FE-SCR-017 | Quản lý tài khoản | ROMS-008, ROMS-009 | QUANG | `/owner/users` | Page + Modal/Action | users |
| FE-SCR-018 | Chi tiết/sửa tài khoản | ROMS-010 | QUANG | `/owner/users/:userId` | Page | users |
| FE-SCR-019 | Sơ đồ/danh sách bàn | ROMS-011, ROMS-012 | QUANG | `/staff/tables` | Page + Modal/Action | tables |
| FE-SCR-020 | Chi tiết bàn | ROMS-013, ROMS-014 | QUANG | `/staff/tables/:tableId` | Page + Modal/Action | tables, sessions |
| FE-SCR-021 | Chi tiết phiên phục vụ | ROMS-015, ROMS-016, ROMS-017 | QUANG | `/staff/sessions/:sessionId` | Page + Modal/Action | sessions |
| FE-SCR-022 | Lịch sử phiên phục vụ | ROMS-018 | QUANG | `/staff/sessions/history` | Page | sessions |
| FE-SCR-023 | Trang chào tablet | ROMS-024, ROMS-014 | QUANG | `/tablet/welcome` | Page + Modal/Action | sessions |
| FE-SCR-024 | Trợ lý AI món ăn | ROMS-032 | QUANG | `/tablet/assistant` | Page/Drawer | ai-assistant |
| FE-SCR-025 | Bàn đang phục vụ | ROMS-036 | QUANG | `/staff/active-tables` | Page | tables, sessions |
| FE-SCR-026 | Danh mục món | ROMS-019, ROMS-020 | Member 3 | `/owner/categories` | Page + Modal/Action | menu |
| FE-SCR-027 | Danh sách món | ROMS-021 | Member 3 | `/owner/menu-items` | Page | menu |
| FE-SCR-028 | Tạo món | ROMS-022 | Member 3 | `/owner/menu-items/new` | Page | menu |
| FE-SCR-029 | Chi tiết/sửa món | ROMS-023 | Member 3 | `/owner/menu-items/:itemId` | Page + Action | menu |
| FE-SCR-030 | Thực đơn tablet | ROMS-025 | Member 3 | `/tablet/menu` | Page | menu |
| FE-SCR-031 | Chi tiết món tablet | ROMS-026 | Member 3 | `/tablet/menu/:itemId` | Page/Drawer | menu |
| FE-SCR-032 | Nguyên liệu và tồn kho | ROMS-043, ROMS-044 | Member 4 | `/inventory/ingredients` | Page + Modal/Action | inventory |
| FE-SCR-033 | Kiểm kê/điều chỉnh kho | ROMS-048 | Member 4 | `/inventory/checks` | Page + Modal/Action | inventory |
| FE-SCR-034 | Lịch sử biến động kho | ROMS-049 | Member 4 | `/inventory/movements` | Page | inventory |
| FE-SCR-035 | Quản lý Recipe/BOM | ROMS-051, ROMS-052, ROMS-053 | Member 4 | `/inventory/recipes` | Page + Drawer/Modal | recipes |
| FE-SCR-036 | Danh sách phiếu mua | ROMS-057 | Member 4 | `/inventory/purchases` | Page | purchasing |
| FE-SCR-037 | Tạo phiếu mua | ROMS-058 | Member 4 | `/inventory/purchases/new` | Page | purchasing |
| FE-SCR-038 | Chi tiết/chỉnh sửa phiếu mua | ROMS-059 | Member 4 | `/inventory/purchases/:purchaseId` | Page + Modal/Action | purchasing |
| FE-SCR-039 | Dashboard Owner | ROMS-007 | Member 5 | `/owner/dashboard` | Page | dashboard |
| FE-SCR-040 | Quản lý chi phí | ROMS-061, ROMS-062 | Member 5 | `/owner/expenses` | Page + Modal/Action | expenses |
| FE-SCR-041 | Báo cáo doanh thu | ROMS-063 | Member 5 | `/owner/reports/revenue` | Page | reports |
| FE-SCR-042 | Báo cáo món bán chạy | ROMS-064 | Member 5 | `/owner/reports/popular-items` | Page | reports |
| FE-SCR-043 | Báo cáo chi phí/lợi nhuận | ROMS-065 | Member 5 | `/owner/reports/profit` | Page | reports |
| FE-SCR-044 | Báo cáo vận hành | ROMS-066 | Member 5 | `/owner/reports/operations` | Page | reports |
| FE-SCR-045 | Xuất báo cáo | ROMS-067 | Member 5 | (Trên các trang /owner/reports/*) | Action | reports |
| FE-SCR-046 | Rapid Menu Availability / Quản lý trạng thái món tại bếp | BE-008 (không có ROMS ticket riêng) | BINH-DEV | `/kitchen/menu-availability` | Page + Confirmation Modal | kitchen |

## 2. Per-screen Notes and Backend Alignment

- **FE-SCR-001 — Đăng nhập** (BINH-DEV; ROMS-001): Nhân viên và TABLE_ACCOUNT; refresh HttpOnly cookie
- **FE-SCR-002 — Giỏ hàng tablet** (BINH-DEV; ROMS-027): Giỏ hàng client-side; không cập nhật order đã tạo
- **FE-SCR-003 — Xác nhận đặt món** (BINH-DEV; ROMS-028): BE xác minh recipe/tồn kho, trừ khi tạo order; xử lý 409; không serving quota
- **FE-SCR-004 — Đặt món thành công** (BINH-DEV; ROMS-029): Chuyển về theo dõi order; không coi là thanh toán
- **FE-SCR-005 — Theo dõi order tablet** (BINH-DEV; ROMS-030, ROMS-031): Order theo phiên + lịch sử; STOMP; chỉ TABLE_ACCOUNT đúng bàn được hủy Order/OrderItem còn PENDING; modal xác nhận, kiểm tra API payload hủy; chi tiết có thể mở drawer
- **FE-SCR-006 — Danh sách order phục vụ** (BINH-DEV; ROMS-033): Lọc bàn, trạng thái, thời gian
- **FE-SCR-007 — Chi tiết order phục vụ** (BINH-DEV; ROMS-034, ROMS-035): Xem chi tiết đơn và tiến độ từng món; BE chỉ cấp quyền hủy cho TABLE_ACCOUNT nên Staff chỉ xem chi tiết và lý do hủy từ API
- **FE-SCR-008 — KDS hàng đợi** (BINH-DEV; ROMS-037, ROMS-039, ROMS-042): Chỉ nhận Order PENDING; KHÔNG có thao tác hủy ở Kitchen (chỉ TABLE_ACCOUNT được hủy); ROMS-042 trong tracker cũ cần đối chiếu, không có REJECTED
- **FE-SCR-009 — KDS chi tiết order** (BINH-DEV; ROMS-038): Trạng thái item và ghi chú
- **FE-SCR-010 — KDS đang chế biến** (BINH-DEV; ROMS-040): Chuyển trạng thái OrderItem PENDING→COOKING→READY
- **FE-SCR-011 — KDS món sẵn sàng** (BINH-DEV; ROMS-041): Item READY, service staff cập nhật COMPLETED khi phục vụ
- **FE-SCR-012 — Quên mật khẩu** (QUANG; ROMS-002): Gửi OTP email Gmail SMTP (qua BE)
- **FE-SCR-013 — Đặt lại mật khẩu** (QUANG; ROMS-003): OTP 6 số, 5 phút, tối đa 5 lần sai
- **FE-SCR-014 — Đổi mật khẩu** (QUANG; ROMS-004): BE thu hồi các phiên liên quan khi đổi mật khẩu
- **FE-SCR-015 — Hồ sơ cá nhân** (QUANG; ROMS-005): Use approved feature behavior; verify API/permissions before coding.
- **FE-SCR-016 — Không có quyền** (QUANG; ROMS-006): Protected Routes dùng chung
- **FE-SCR-017 — Quản lý tài khoản** (QUANG; ROMS-008, ROMS-009): Danh sách, tạo account với role và table_id khi TABLE_ACCOUNT
- **FE-SCR-018 — Chi tiết/sửa tài khoản** (QUANG; ROMS-010): Quản lý trạng thái, role và liên kết bàn
- **FE-SCR-019 — Sơ đồ/danh sách bàn** (QUANG; ROMS-011, ROMS-012): Quản lý bàn: Owner; thêm/sửa bằng modal
- **FE-SCR-020 — Chi tiết bàn** (QUANG; ROMS-013, ROMS-014): Staff/Owner có thể mở phiên hỗ trợ; tablet mở trên trang chào
- **FE-SCR-021 — Chi tiết phiên phục vụ** (QUANG; ROMS-015, ROMS-016, ROMS-017): Chuyển bàn, đóng phiên trong modal; tablet không được đóng phiên
- **FE-SCR-022 — Lịch sử phiên phục vụ** (QUANG; ROMS-018): Theo phiên, log chuyển bàn nằm trong chi tiết
- **FE-SCR-023 — Trang chào tablet** (QUANG; ROMS-024, ROMS-014): ROMS-014 shared workflow của QUANG; xác nhận mở phiên từ tablet
- **FE-SCR-024 — Trợ lý AI món ăn** (QUANG; ROMS-032): Text + voice-to-text; Gemini chỉ gợi ý; khả dụng từ BE
- **FE-SCR-025 — Bàn đang phục vụ** (QUANG; ROMS-036): Tổng hợp bàn và active session
- **FE-SCR-026 — Danh mục món** (Member 3; ROMS-019, ROMS-020): Form thêm/sửa category trong modal
- **FE-SCR-027 — Danh sách món** (Member 3; ROMS-021): Lọc category/status
- **FE-SCR-028 — Tạo món** (Member 3; ROMS-022): Cloudinary upload qua BE; DB lưu ảnh URL
- **FE-SCR-029 — Chi tiết/sửa món** (Member 3; ROMS-023): Quản lý ảnh/status/is_featured; không available_quantity
- **FE-SCR-030 — Thực đơn tablet** (Member 3; ROMS-025): Best Seller ảo từ is_featured, kiểm tra sellability BE
- **FE-SCR-031 — Chi tiết món tablet** (Member 3; ROMS-026): Chọn số lượng và thêm vào giỏ hàng BINH-DEV; không thêm Order trực tiếp
- **FE-SCR-032 — Nguyên liệu và tồn kho** (Member 4; ROMS-043, ROMS-044): CRUD master data, tồn kho, minimum_stock, deactivate có kiểm tra recipe
- **FE-SCR-033 — Kiểm kê/điều chỉnh kho** (Member 4; ROMS-048): Chênh lệch do BE tính; movement append-only
- **FE-SCR-034 — Lịch sử biến động kho** (Member 4; ROMS-049): Filter movementType, ingredient, phân trang
- **FE-SCR-035 — Quản lý Recipe/BOM** (Member 4; ROMS-051, ROMS-052, ROMS-053): Danh sách + xem/sửa định lượng; không tự thêm cost queries
- **FE-SCR-036 — Danh sách phiếu mua** (Member 4; ROMS-057): Phiếu hàng đã nhận, không quản lý PO/supplier
- **FE-SCR-037 — Tạo phiếu mua** (Member 4; ROMS-058): Tạo phiếu nhập hàng thực tế
- **FE-SCR-038 — Chi tiết/chỉnh sửa phiếu mua** (Member 4; ROMS-059): Sửa dòng phiếu mua, BE tạo movement bù trừ
- **FE-SCR-039 — Dashboard Owner** (Member 5; ROMS-007): KPI chỉ dựa vào dữ liệu BE thực có
- **FE-SCR-040 — Quản lý chi phí** (Member 5; ROMS-061, ROMS-062): Thêm/sửa/hủy; yêu cầu lý do hủy
- **FE-SCR-041 — Báo cáo doanh thu** (Member 5; ROMS-063): Chờ xác nhận định nghĩa doanh thu vì chưa có payment
- **FE-SCR-042 — Báo cáo món bán chạy** (Member 5; ROMS-064): Chỉ số dựa trên API BE
- **FE-SCR-043 — Báo cáo chi phí/lợi nhuận** (Member 5; ROMS-065): Lợi nhuận ước tính; cần xác nhận nguồn số liệu
- **FE-SCR-044 — Báo cáo vận hành** (Member 5; ROMS-066): Use approved feature behavior; verify API/permissions before coding.
- **FE-SCR-045 — Xuất báo cáo** (Member 5; ROMS-067): Không tạo page riêng; tải file theo bộ lọc
- **FE-SCR-046 — Rapid Menu Availability** (BINH-DEV; BE-008, không có ROMS ticket riêng): Page riêng `/kitchen/menu-availability` cho `KITCHEN_STAFF` và `OWNER`; grid/card các món có ảnh/tên/danh mục/status, tìm kiếm và lọc; toggle `AVAILABLE` ↔ `TEMPORARILY_UNAVAILABLE` mở modal xác nhận, **chỉ gọi** `PATCH /api/menu-items/{id}/status` sau khi xác nhận; hủy modal không gọi API; lỗi cập nhật giữ trạng thái cũ và thông báo. `DISCONTINUED` không được Kitchen bật lại, Owner xử lý theo quyền BE. Menu status thủ công khác sellability theo Recipe/tồn kho. Dùng menu list API từ BE-007 (In Review), xác minh GET và quyền `KITCHEN_STAFF`/response DTO trước khi tích hợp. Không tạo `available_quantity`.

**Quy tắc quyền hủy:** Chỉ `TABLE_ACCOUNT` thuộc bàn tương ứng mới được hủy Order/OrderItem còn `PENDING`. Không hiển thị nút hủy trong `/staff/*` hoặc `/kitchen/*`. Giữ ROMS-042 làm tham chiếu tracker cũ, không triển khai chức năng trái với BE; cần sửa tracker/SRS riêng khi nhóm chốt.

## 3. Screen Design Policy

- **Login:** `login.html` is a primary visual/layout reference, not a source of authority for security, backend endpoints, state or old colors. Implement in React using the approved theme.
- **All other screens:** Antigravity may create layouts/components within Navy & Sky Blue and shadcn/ui guidelines, guided by this register and current backend API. Old HTML mockups are optional visual inspiration only.
- Modal/Drawer/Action entries do not require new routes. A route under a Page may be adjusted with team approval, but keep its screen ID, ticket coverage and owner.
- Reuse shared shell/components; do not add new business features, serving quota, tags, supplier management, payments or reservations.
- The same ticket may appear in multiple screens for one shared interaction (e.g. opening sessions); do not count duplicated references as extra owner assignments.
- Validate actual field/DTO contracts, role guards, tablet/session scoping, and 409 state conflicts before marking integrated.

## 4. UX States and Review Checklist

- Screens need sensible loading, empty, error, success, unauthorized/forbidden, and stale-data handling as applicable.
- Manual review: visual match to Navy & Sky Blue, Vietnamese labels, desktop/tablet responsive usability, interactions and realistic backend response handling.
- **No automated E2E test requirement in the current phase.**

## 5. Open / Blocked Conditions

- Revenue/profit labels and exports must correspond to actual supported backend calculations; ROMS has no payment flow.
- AI voice input is a feature idea in Screen Map notes, but implementation requires browser support/approved behavior; never imply backend handles speech automatically.
- Upload contract and password-reset endpoint DTOs require verification in backend; the presence of a screen is not evidence of a working endpoint.
- BE-007 menu read APIs đang In Review; trước khi làm FE-SCR-046 phải xác minh GET danh sách món cho `KITCHEN_STAFF`, pagination/filter và payload của PATCH BE-008.
- Screen mới FE-SCR-046 bổ sung theo nghiệp vụ BE-008 đã duyệt, không tự ý gán ROMS ticket mới; đồng bộ Screen Map Excel khi cập nhật bản gốc.
