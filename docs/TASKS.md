# ROMS Frontend — Shared Task Board

**Source:** `ROMS_FE_Screen_Map.xlsx` (46 UI entries / 59 unique ROMS tickets (new FE-SCR-046 linked to existing BE-008; no new ROMS ticket)). **Architecture:** React + TypeScript, Group by Feature. **Status:** `Todo` → `In Progress` → `In Review` → `Done`; `Blocked` if critical backend contract is missing.

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
| FE-005 | Theo dõi order tablet (`FE-SCR-005`; Page) | ROMS-030, ROMS-031 | BINH-DEV | Done | Lắng nghe STOMP realtime cập nhật đơn, lọc theo trạng thái, chỉ TABLE_ACCOUNT thuộc bàn tương ứng được hủy Order/OrderItem PENDING; modal xác nhận, đối chiếu payload hủy với BE; build verified |
| FE-006 | Danh sách order phục vụ (`FE-SCR-006`; Page) | ROMS-033 | BINH-DEV | Done | Tích hợp GET /api/orders, STOMP realtime, KPI stats, lọc bàn, trạng thái, thời gian, tìm kiếm, build verified |
| FE-007 | Chi tiết order phục vụ (`FE-SCR-007`; Page) | ROMS-034, ROMS-035 | BINH-DEV | Done | Tích hợp GET /api/orders/{id}, STOMP realtime, hiển thị tiến độ món, ghi chú, lý do hủy từ BE, cảnh báo món READY cần bưng, build verified |
| FE-008 | KDS hàng đợi (`FE-SCR-008`; Page + Action) | ROMS-037, ROMS-039, ROMS-042 | BINH-DEV | Done | Tích hợp GET /api/kitchen/orders?status=PENDING, POST /api/kitchen/orders/{id}/accept, STOMP realtime, cảnh báo chờ lâu; KHÔNG có nút hủy cho bếp (ROMS-042 trong tracker cũ mâu thuẫn quyền BE), build verified |
| FE-009 | KDS chi tiết order (`FE-SCR-009`; Page) | ROMS-038 | BINH-DEV | Done | Tích hợp GET /api/kitchen/orders/{id}, STOMP realtime, hiển thị món & ghi chú, cập nhật item COOKING→READY, build verified |
| FE-010 | KDS đang chế biến (`FE-SCR-010`; Page + Action) | ROMS-040 | BINH-DEV | Done | Tích hợp GET /api/kitchen/orders?status=COOKING, PATCH /items/{id}/status, STOMP realtime, chuyển item sang READY, build verified |
| FE-011 | KDS món sẵn sàng (`FE-SCR-011`; Page + Action) | ROMS-041 | BINH-DEV | Done | Item READY, service staff cập nhật COMPLETED khi phục vụ; verify route/UI manually |
| FE-046 | Rapid Menu Availability (`FE-SCR-046`; Page + Confirmation Modal) | BE-008 (no separate ROMS ticket) | BINH-DEV | Done | Tích hợp GET /api/menu-items, GET /api/categories, PATCH /api/menu-items/{id}/status, modal xác nhận bắt buộc, chặn Kitchen bật DISCONTINUED, build verified |
| FE-012 | Quên mật khẩu (`FE-SCR-012`; Page) | ROMS-002 | QUANG | Done | Gửi OTP email Gmail SMTP (qua BE); form validation Zod, state thông báo gửi mail, build verified |
| FE-013 | Đặt lại mật khẩu (`FE-SCR-013`; Page) | ROMS-003 | QUANG | Done | OTP 6 số, 5 phút, tối đa 5 lần sai; form xác nhận mật khẩu mới, liên kết từ quên mật khẩu, build verified |
| FE-014 | Đổi mật khẩu (`FE-SCR-014`; Page) | ROMS-004 | QUANG | Done | BE thu hồi các phiên liên quan khi đổi mật khẩu; form validation Zod, tự động thu hồi session, build verified |
| FE-015 | Hồ sơ cá nhân (`FE-SCR-015`; Page) | ROMS-005 | QUANG | Done | Tích hợp GET/PUT /api/users/me/profile, đồng bộ Zustand user, giao diện tab linh hoạt, build verified |
| FE-016 | Không có quyền (`FE-SCR-016`; Page) | ROMS-006 | QUANG | Done | Nâng cấp điều hướng thông minh theo vai trò, nút quay lại và đăng xuất an toàn, build verified |
| FE-017 | Quản lý tài khoản (`FE-SCR-017`; Page + Modal/Action) | ROMS-008, ROMS-009 | QUANG | Done | Bảng danh sách phân trang, tìm kiếm, lọc vai trò/trạng thái; modal tạo tài khoản ràng buộc bàn TABLE_ACCOUNT, build verified |
| FE-018 | Chi tiết/sửa tài khoản (`FE-SCR-018`; Page) | ROMS-010 | QUANG | Done | Modal/Action cập nhật họ tên, email, vai trò, liên kết bàn và chuyển đổi trạng thái hoạt động (khóa/mở), build verified |
| FE-019 | Sơ đồ/danh sách bàn (`FE-SCR-019`; Page + Modal/Action) | ROMS-011, ROMS-012 | QUANG | Done | Sơ đồ lưới trực quan, KPI tổng hợp, lọc khu vực/trạng thái, modal thêm/sửa bàn cho Owner, build verified |
| FE-020 | Chi tiết bàn (`FE-SCR-020`; Page + Modal/Action) | ROMS-013, ROMS-014 | QUANG | Done | Xem thông tin bàn, sức chứa, mở phiên phục vụ trực tiếp tại bàn, build verified |
| FE-021 | Chi tiết phiên phục vụ (`FE-SCR-021`; Page + Modal/Action) | ROMS-015, ROMS-016, ROMS-017 | QUANG | Done | Mở phiên, đóng phiên và modal chuyển bàn đích với kiểm tra bàn trống, build verified |
| FE-022 | Lịch sử phiên phục vụ (`FE-SCR-022`; Page) | ROMS-018 | QUANG | Done | Bảng lịch sử phiên phục vụ, lọc trạng thái, phân trang, tra cứu chi tiết lịch sử đổi bàn, build verified |
| FE-023 | Trang chào tablet (`FE-SCR-023`; Page + Modal/Action) | ROMS-024, ROMS-014 | QUANG | Done | Màn hình chào mừng thực khách tại bàn, mở phiên phục vụ tự động, chuyển tiếp vào thực đơn, build verified |
| FE-024 | Trợ lý AI món ăn (`FE-SCR-024`; Page/Drawer) | ROMS-032 | QUANG | Done | Tích hợp Google Gemini AI, nhận diện giọng nói tiếng Việt, kiểm tra tồn kho thời gian thực, build verified |
| FE-025 | Bàn đang phục vụ (`FE-SCR-025`; Page) | ROMS-036 | QUANG | Done | Tích hợp chế độ lọc các bàn đang phục vụ active session, thẻ đếm KPI thời gian thực, build verified |
| FE-026 | Danh mục món (`FE-SCR-026`; Page + Modal/Action) | ROMS-019, ROMS-020 | Member 3 | Todo | Form thêm/sửa category trong modal; verify route/UI manually |
| FE-027 | Danh sách món (`FE-SCR-027`; Page) | ROMS-021 | Member 3 | Todo | Lọc category/status; verify route/UI manually |
| FE-028 | Tạo món (`FE-SCR-028`; Page) | ROMS-022 | Member 3 | Todo | Cloudinary upload qua BE; DB lưu ảnh URL; verify route/UI manually |
| FE-029 | Chi tiết/sửa món (`FE-SCR-029`; Page + Action) | ROMS-023 | Member 3 | Todo | Quản lý ảnh/status/is_featured; không available_quantity; verify route/UI manually |
| FE-030 | Thực đơn tablet (`FE-SCR-030`; Page) | ROMS-025 | Member 3 | Todo | Best Seller ảo từ is_featured, kiểm tra sellability BE; verify route/UI manually |
| FE-031 | Chi tiết món tablet (`FE-SCR-031`; Page/Drawer) | ROMS-026 | Member 3 | Todo | Chọn số lượng và thêm vào giỏ hàng BINH-DEV; không thêm Order trực tiếp; verify route/UI manually |
| FE-032 | Nguyên liệu và tồn kho (`FE-SCR-032`; Page + Modal/Action) | ROMS-043, ROMS-044 | Member 4 | Todo | CRUD master data, tồn kho, minimum_stock, deactivate có kiểm tra recipe; verify route/UI manually |
| FE-033 | Kiểm kê/điều chỉnh kho (`FE-SCR-033`; Page + Modal/Action) | ROMS-048 | Member 4 | Todo | Chênh lệch do BE tính; movement append-only; verify route/UI manually |
| FE-034 | Lịch sử biến động kho (`FE-SCR-034`; Page) | ROMS-049 | Member 4 | Todo | Filter movementType, ingredient, phân trang; verify route/UI manually |
| FE-035 | Quản lý Recipe/BOM (`FE-SCR-035`; Page + Drawer/Modal) | ROMS-051, ROMS-052, ROMS-053 | Member 4 | Todo | Danh sách + xem/sửa định lượng; không tự thêm cost queries; verify route/UI manually |
| FE-036 | Danh sách phiếu mua (`FE-SCR-036`; Page) | ROMS-057 | Member 4 | Todo | Phiếu hàng đã nhận, không quản lý PO/supplier; verify route/UI manually |
| FE-037 | Tạo phiếu mua (`FE-SCR-037`; Page) | ROMS-058 | Member 4 | Todo | Tạo phiếu nhập hàng thực tế; verify route/UI manually |
| FE-038 | Chi tiết/chỉnh sửa phiếu mua (`FE-SCR-038`; Page + Modal/Action) | ROMS-059 | Member 4 | Todo | Sửa dòng phiếu mua, BE tạo movement bù trừ; verify route/UI manually |
| FE-039 | Dashboard Owner (`FE-SCR-039`; Page) | ROMS-007 | Member 5 | Todo | KPI chỉ dựa vào dữ liệu BE thực có; verify route/UI manually |
| FE-040 | Quản lý chi phí (`FE-SCR-040`; Page + Modal/Action) | ROMS-061, ROMS-062 | Member 5 | Todo | Thêm/sửa/hủy; yêu cầu lý do hủy; verify route/UI manually |
| FE-041 | Báo cáo doanh thu (`FE-SCR-041`; Page) | ROMS-063 | Member 5 | Todo | Chờ xác nhận định nghĩa doanh thu vì chưa có payment; verify route/UI manually |
| FE-042 | Báo cáo món bán chạy (`FE-SCR-042`; Page) | ROMS-064 | Member 5 | Todo | Chỉ số dựa trên API BE; verify route/UI manually |
| FE-043 | Báo cáo chi phí/lợi nhuận (`FE-SCR-043`; Page) | ROMS-065 | Member 5 | Todo | Lợi nhuận ước tính; cần xác nhận nguồn số liệu; verify route/UI manually |
| FE-044 | Báo cáo vận hành (`FE-SCR-044`; Page) | ROMS-066 | Member 5 | Todo | Verify actual backend endpoint, DTO and permissions; manual UI review; verify route/UI manually |
| FE-045 | Xuất báo cáo (`FE-SCR-045`; Action) | ROMS-067 | Member 5 | Todo | Không tạo page riêng; tải file theo bộ lọc; verify route/UI manually |

**Backend alignment:** BE PRD mới nhất chỉ cho `TABLE_ACCOUNT` của chính bàn đó hủy Order/OrderItem còn `PENDING`; mọi thao tác hủy trong UI Staff/Kitchen phải ẩn hoặc loại bỏ. `ROMS-042` vẫn giữ làm mã tham chiếu từ tracker cũ nhưng không triển khai chức năng hủy tại KDS; cần đồng bộ tracker/SRS nếu nhóm cập nhật tài liệu nguồn. FE-046 là màn hình FE phát sinh từ BE-008 đã phê duyệt, không tự đặt mã ROMS mới.

## 3. Cross-feature Coordination

- **BINH-DEV ↔ QUANG:** auth API/session state and `features/auth` edits; Login versus recovery/profile ownership; service session data for tablet and orders.
- **BINH-DEV ↔ Member 3:** tablet menu/detail and cart add-item contract; current sellability vs 409 on order creation; reuse menu list DTO/read API for new Kitchen Menu Availability, confirm KITCHEN_STAFF read permission.
- **BINH-DEV ↔ Member 4:** stock-aware Order conflicts and stock movement display; backend is authority.
- **Member 5 ↔ backend/report owners:** exact supported KPI semantics and export endpoints; do not present unconfirmed paid revenue.
- Treat feature dependencies as collaboration/blockers, not permission to change another owner's work.

## 4. Update Protocol

- Owner updates only assigned rows after actual changes are manually reviewed. `Done` requires real functional UI and confirmed backend integration where required; mocks alone do not count.
- Do not require automated E2E testing or automatically generate test files per component at this stage. Record manual verification succinctly in PR or task notes.
- Preserve original screen IDs, ROMS tickets and Owners. Change routes/UI composition only by agreement, keeping mapping synchronized with `SCREEN_SPEC.md`.
- If API contract is unavailable, use `Blocked` or explicitly mark prototype-only work; no invented endpoints.
