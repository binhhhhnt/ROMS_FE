# ROMS Frontend — Shared Task Board

**Source:** `ROMS_FE_Screen_Map.xlsx` (47 UI entries). **Architecture:** React + TypeScript, Group by Feature. **Status:** `Todo` → `In Progress` → `In Review` → `Done`; `Blocked` if critical backend contract is missing.

## 1. Shared Frontend Foundation

| ID | Deliverable | Owner | Status | Dependencies / Verification |
|---|---|---|---|---|
| FE-BASE-001 | React/Vite TypeScript setup, app/features/shared, styling, Navy & Sky Blue theme | BINH-DEV | Done | Verified clean build & Tailwind v4 Navy & Sky Blue tokens |
| FE-BASE-002 | React Router, role-aware layouts and protected routes | BINH-DEV | Done | Verified AuthLayout, StaffLayout, KitchenLayout, TabletLayout, guards |
| FE-BASE-003 | Axios/API envelopes, JWT memory auth, credentialed refresh, TanStack Query and Zustand foundations | BINH-DEV | Done | Implemented Axios interceptor single-flight 401 refresh, Zustand memory store |
| FE-BASE-004 | shadcn shared primitives, Sonner, form and navigation conventions | BINH-DEV | Done | Implemented Button, Input, Card, Badge, Toaster with theme classes |
| FE-BASE-005 | STOMP/SockJS shared client, event → query invalidation | BINH-DEV | Done | Implemented SockJS/STOMP client adapter with topic subscription |

## 2. Screens by Assigned Owner

| ID | Screen / UI deliverable | ROMS tickets | Owner | Status | Dependencies / Manual acceptance |
|---|---|---|---|---|---|
| FE-001 | Đăng nhập (`FE-SCR-001`; Page) | ROMS-001 | BINH-DEV | Done | Form validated in Vietnamese, password toggle, Navy theme verified via browser |
| FE-002 | Giỏ hàng tablet (`FE-SCR-002`; Page) | ROMS-027 | BINH-DEV | Done | Quản lý giỏ hàng client-side in-memory, tăng/giảm số lượng, ghi chú, tóm tắt tổng tiền, build verified |
| FE-003 | Xác nhận đặt món (`FE-SCR-003`; Page) | ROMS-028 | BINH-DEV | Done | Tích hợp POST /api/orders, xử lý 409 Conflict thiếu tồn kho chi tiết, giữ nguyên giỏ hàng, build verified |
| FE-004 | Đặt món thành công (`FE-SCR-004`; Page) | ROMS-029 | BINH-DEV | Done | Hiển thị mã đơn, số bàn, badge PENDING, disclaimer không phải hóa đơn, điều hướng theo dõi order, build verified |
| FE-005 | Theo dõi order tablet (`FE-SCR-005`; Page) | ROMS-030, ROMS-031 | BINH-DEV | Done | Lắng nghe STOMP realtime cập nhật đơn, lọc theo trạng thái, modal xác nhận hủy order/item, build verified |
| FE-006 | Danh sách order phục vụ (`FE-SCR-006`; Page) | ROMS-033 | BINH-DEV | Done | Tích hợp GET /api/orders, STOMP realtime, KPI stats, lọc bàn, trạng thái, thời gian, tìm kiếm, build verified |
| FE-007 | Chi tiết order phục vụ (`FE-SCR-007`; Page) | ROMS-034, ROMS-035 | BINH-DEV | Done | Tích hợp GET /api/orders/{id}, STOMP realtime, hiển thị tiến độ món, ghi chú, lý do hủy từ BE, cảnh báo món READY cần bưng, build verified |
| FE-008 | KDS hàng đợi (`FE-SCR-008`; Page + Action) | ROMS-037, ROMS-039 | BINH-DEV | Done | Tích hợp GET /api/kitchen/orders?status=PENDING, FIFO sorting, build verified |
| FE-009 | KDS chi tiết order (`FE-SCR-009`; Page) | ROMS-038 | BINH-DEV | Done | Tích hợp chi tiết trực tiếp trên thẻ KDS, build verified |
| FE-010 | KDS đang chế biến (`FE-SCR-010`; Page + Action) | ROMS-040 | BINH-DEV | Done | Tích hợp GET /api/kitchen/orders?status=COOKING, chuyển item sang READY, build verified |
| FE-011 | KDS Quầy chờ bưng món (`FE-SCR-011`; Page + Action) | ROMS-041 | BINH-DEV | Done | Quầy chờ bưng món READY, xác nhận Đã bưng ra bàn chuyển sang COMPLETED, build verified |
| FE-046 | Rapid Menu Availability (`FE-SCR-046`; Page + Modal) | BE-008 | BINH-DEV | Done | Tích hợp GET /api/menu-items, GET /api/categories, PATCH /api/menu-items/{id}/status, modal xác nhận bắt buộc, build verified |
| FE-012 | Quên mật khẩu (`FE-SCR-012`; Page) | ROMS-002 | QUANG | Done | Gửi OTP email Gmail SMTP (qua BE), form validation Zod, build verified |
| FE-013 | Đặt lại mật khẩu (`FE-SCR-013`; Page) | ROMS-003 | QUANG | Done | OTP 6 số, 5 phút, tối đa 5 lần sai, build verified |
| FE-014 | Đổi mật khẩu (`FE-SCR-014`; Page) | ROMS-004 | QUANG | Done | BE thu hồi các phiên liên quan khi đổi mật khẩu, build verified |
| FE-015 | Hồ sơ cá nhân (`FE-SCR-015`; Page) | ROMS-005 | QUANG | Done | Tích hợp GET/PUT /api/users/me/profile, build verified |
| FE-016 | Không có quyền (`FE-SCR-016`; Page) | ROMS-006 | QUANG | Done | Điều hướng thông minh theo vai trò, nút quay lại an toàn, build verified |
| FE-017 | Quản lý tài khoản (`FE-SCR-017`; Page + Modal/Action) | ROMS-008, ROMS-009 | QUANG | Done | Bảng danh sách phân trang, tìm kiếm, lọc vai trò/trạng thái, modal tạo tài khoản, build verified |
| FE-018 | Chi tiết/sửa tài khoản (`FE-SCR-018`; Page) | ROMS-010 | QUANG | Done | Cập nhật họ tên, email, vai trò, liên kết bàn, khóa/mở tài khoản, build verified |
| FE-019 | Sơ đồ/danh sách bàn (`FE-SCR-019`; Page + Modal/Action) | ROMS-011, ROMS-012 | QUANG | Done | Sơ đồ lưới trực quan, KPI tổng hợp, lọc khu vực/trạng thái, modal thêm/sửa bàn, build verified |
| FE-020 | Chi tiết bàn (`FE-SCR-020`; Page + Modal/Action) | ROMS-013, ROMS-014 | QUANG | Done | Xem thông tin bàn, sức chứa, mở phiên phục vụ trực tiếp tại bàn, build verified |
| FE-021 | Chi tiết phiên phục vụ (`FE-SCR-021`; Page + Modal/Action) | ROMS-015, ROMS-016, ROMS-017 | QUANG | Done | Mở phiên, đóng phiên và chuyển bàn đích, build verified |
| FE-022 | Lịch sử phiên phục vụ (`FE-SCR-022`; Page) | ROMS-018 | QUANG | Done | Bảng lịch sử phiên phục vụ, lọc trạng thái, tra cứu lịch sử đổi bàn, build verified |
| FE-023 | Trang chào tablet (`FE-SCR-023`; Page + Modal/Action) | ROMS-024, ROMS-014 | QUANG | Done | Chào mừng thực khách tại bàn, mở phiên phục vụ tự động, chuyển tiếp vào thực đơn, build verified |
| FE-024 | Trợ lý AI món ăn (`FE-SCR-024`; Page/Drawer) | ROMS-032 | QUANG | Done | Tích hợp Google Gemini AI, nhận diện giọng nói tiếng Việt, kiểm tra tồn kho, build verified |
| FE-025 | Bàn đang phục vụ (`FE-SCR-025`; Page) | ROMS-036 | QUANG | Done | Chế độ lọc các bàn đang phục vụ active session, KPI thời gian thực, build verified |
| FE-026 | Danh mục món (`FE-SCR-026`; Page + Modal/Action) | ROMS-019, ROMS-020 | Member 3 | Todo | Form thêm/sửa category trong modal; verify route/UI manually |
| FE-027 | Danh sách món & Excel (`FE-SCR-027`; Page) | ROMS-021, BE-038 | Member 3 | Todo | Lọc category/status; thêm nút Tải mẫu, Xuất Excel, Nhập Excel |
| FE-028 | Tạo món (`FE-SCR-028`; Page) | ROMS-022 | Member 3 | Todo | Cloudinary upload qua BE; DB lưu ảnh URL; chọn thuế suất |
| FE-029 | Chi tiết/sửa món (`FE-SCR-029`; Page + Action) | ROMS-023 | Member 3 | Todo | Quản lý ảnh/status/is_featured/tax_category_id |
| FE-030 | Thực đơn tablet (`FE-SCR-030`; Page) | ROMS-025 | Member 3 | Todo | Best Seller ảo từ is_featured, kiểm tra sellability BE |
| FE-031 | Chi tiết món tablet (`FE-SCR-031`; Page/Drawer) | ROMS-026 | Member 3 | Todo | Xem chi tiết món và thêm vào giỏ hàng |
| FE-032 | Nguyên liệu & Excel (`FE-SCR-032`; Page + Modal/Action) | ROMS-043, ROMS-044, BE-039 | Member 4 | Todo | CRUD master data, tồn kho; thêm nút Tải mẫu, Xuất Excel, Nhập Excel |
| FE-033 | Kiểm kê/điều chỉnh kho (`FE-SCR-033`; Page + Modal/Action) | ROMS-048 | Member 4 | Todo | Chênh lệch do BE tính; movement append-only |
| FE-034 | Lịch sử biến động kho (`FE-SCR-034`; Page) | ROMS-049 | Member 4 | Todo | Filter movementType, ingredient, phân trang |
| FE-035 | Quản lý Recipe/BOM (`FE-SCR-035`; Page + Drawer/Modal) | ROMS-051, ROMS-052, ROMS-053 | Member 4 | Todo | Route `/kitchen/recipes` (OWNER & KITCHEN_STAFF) |
| FE-036 | Danh sách phiếu mua (`FE-SCR-036`; Page) | ROMS-057 | Member 4 | Todo | Phiếu hàng đã nhận, không quản lý PO/supplier |
| FE-037 | Tạo phiếu mua (`FE-SCR-037`; Page) | ROMS-058 | Member 4 | Todo | Tạo phiếu nhập hàng thực tế |
| FE-038 | Chi tiết/chỉnh sửa phiếu mua (`FE-SCR-038`; Page + Modal/Action) | ROMS-059 | Member 4 | Todo | Sửa dòng phiếu mua, BE tạo movement bù trừ |
| FE-039 | Dashboard Owner (`FE-SCR-039`; Page) | ROMS-007 | Member 5 | Done | KPI metrics, biểu đồ SVG tương tác, top món bán chạy |
| FE-040 | Quản lý chi phí (`FE-SCR-040`; Page + Modal/Action) | ROMS-061, ROMS-062 | Member 5 | Done | CRUD chi phí /api/expenses; modal thêm/sửa/hủy |
| FE-041 | Báo cáo doanh thu (`FE-SCR-041`; Page) | ROMS-063 | Member 5 | Done | Biểu đồ doanh thu SVG, tính theo đơn COMPLETED |
| FE-042 | Báo cáo món bán chạy (`FE-SCR-042`; Page) | ROMS-064 | Member 5 | Done | Xếp hạng món bán chạy SVG, chi tiết số lượng & doanh thu |
| FE-043 | Báo cáo chi phí/lợi nhuận (`FE-SCR-043`; Page) | ROMS-065 | Member 5 | Done | Doanh thu, chi phí, nhập hàng, lợi nhuận ròng |
| FE-044 | Báo cáo vận hành (`FE-SCR-044`; Page) | ROMS-066 | Member 5 | Done | Tỷ lệ hoàn thành đơn, tỷ lệ hủy, cảnh báo tồn kho |
| FE-045 | Xuất báo cáo (`FE-SCR-045`; Action) | ROMS-067 | Member 5 | Done | Nút xuất CSV trên ReportFilterBar |
| FE-047 | Cài đặt nhà hàng & Thuế (`FE-SCR-047`; Page + Modal/Action) | BE-034, BE-035 | Member 5 | Done | Implemented /owner/settings page with VAT toggle, live calculation table, and TaxCategoryModal for adding rates; build verified |
| FE-048 | Đặt món trực tiếp & Hủy đơn cho Phục vụ | BE-036 | BINH-DEV | Done | Implemented StaffOrderModal for direct ordering, integrated into StaffOrdersPage & SessionDetailPage; enabled PENDING order & item cancellation with reason in StaffOrderDetailPage; build verified |
| FE-049 | KDS Nút "Nấu tất cả" / "Ra tất cả" & Báo phục vụ | BE-037 | BINH-DEV | Done | KDS FIFO queue, action batch cook-all / ready-all, STOMP event báo món READY, nút phục vụ "Hoàn thành"; build verified |
| FE-050 | UI Nhập/Xuất Excel Thực đơn | BE-038 | Member 3 | Done | Tải file mẫu, Xuất file Excel thực đơn, Modal Nhập file Excel thực đơn với thống kê và danh sách lỗi chi tiết; build verified |
| FE-051 | UI Nhập/Xuất Excel Nguyên liệu | BE-039 | Member 4 | Done | Tải file mẫu, Xuất file Excel nguyên liệu, Modal Nhập file Excel nguyên liệu với thống kê và danh sách lỗi chi tiết; build verified |

## 3. Cross-feature Coordination

- **BINH-DEV ↔ Member 5:** Cài đặt VAT và hiển thị số tiền trên hóa đơn / order card.
- **BINH-DEV ↔ QUANG:** Chuyển luồng order chính thức sang nhân viên phục vụ khi mở phiên bàn; `TABLE_ACCOUNT` giữ vai trò tra cứu và AI.
- **Member 3 & 4 ↔ BE:** Tích hợp Excel endpoints (`/api/menu-items/excel/*` và `/api/ingredients/excel/*`).

## 4. Update Protocol

- Cập nhật dòng nhiệm vụ sau khi đã review thực tế và build thành công.
- Lưu lại bằng chứng kiểm thử thủ công trong PR và task notes.
