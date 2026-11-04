# ROMS Frontend — Screen Specification

**Source:** `ROMS_FE_Screen_Map.xlsx` supplied by the project team. **Status:** Working screen/route plan for real restaurant operations; UI is designed by Antigravity under Design System, except Login layout from `login.html`.

## 1. Screen Register (47 UI Entries)

| Screen ID | Name | Related ROMS Tickets | Owner | Proposed Route | UI Type | Feature |
|---|---|---|---|---|---|---|
| FE-SCR-001 | Đăng nhập | ROMS-001 | BINH-DEV | `/login` | Page | auth |
| FE-SCR-002 | Giỏ hàng tablet | ROMS-027 | BINH-DEV | `/tablet/cart` | Page | ordering |
| FE-SCR-003 | Xác nhận đặt món | ROMS-028 | BINH-DEV | `/tablet/checkout` | Page | ordering |
| FE-SCR-004 | Đặt món thành công | ROMS-029 | BINH-DEV | `/tablet/order-success` | Page | ordering |
| FE-SCR-005 | Theo dõi order tablet | ROMS-030, ROMS-031 | BINH-DEV | `/tablet/orders` | Page | ordering |
| FE-SCR-006 | Danh sách & Đặt món phục vụ | ROMS-033, BE-036 | BINH-DEV | `/staff/orders` | Page + Modal/Action | ordering |
| FE-SCR-007 | Chi tiết order phục vụ | ROMS-034, ROMS-035, BE-036 | BINH-DEV | `/staff/orders/:orderId` | Page + Modal/Action | ordering |
| FE-SCR-008 | KDS hàng đợi | ROMS-037, ROMS-039, BE-037 | BINH-DEV | `/kitchen/queue` | Page + Action | kitchen |
| FE-SCR-009 | KDS chi tiết order | ROMS-038 | BINH-DEV | `/kitchen/orders/:orderId` | Page | kitchen |
| FE-SCR-010 | KDS đang chế biến | ROMS-040, BE-037 | BINH-DEV | `/kitchen/cooking` | Page + Action | kitchen |
| FE-SCR-011 | KDS món sẵn sàng | ROMS-041, BE-037 | BINH-DEV | `/kitchen/ready` | Page + Action | kitchen |
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
| FE-SCR-027 | Danh sách món & Excel | ROMS-021, BE-038 | Member 3 | `/owner/menu-items` | Page + Modal/Action | menu |
| FE-SCR-028 | Tạo món | ROMS-022 | Member 3 | `/owner/menu-items/new` | Page | menu |
| FE-SCR-029 | Chi tiết/sửa món | ROMS-023 | Member 3 | `/owner/menu-items/:itemId` | Page + Action | menu |
| FE-SCR-030 | Thực đơn tablet | ROMS-025 | Member 3 | `/tablet/menu` | Page | menu |
| FE-SCR-031 | Chi tiết món tablet | ROMS-026 | Member 3 | `/tablet/menu/:itemId` | Page/Drawer | menu |
| FE-SCR-032 | Nguyên liệu & Excel | ROMS-043, ROMS-044, BE-039 | Member 4 | `/inventory/ingredients` | Page + Modal/Action | inventory |
| FE-SCR-033 | Kiểm kê/điều chỉnh kho | ROMS-048 | Member 4 | `/inventory/checks` | Page + Modal/Action | inventory |
| FE-SCR-034 | Lịch sử biến động kho | ROMS-049 | Member 4 | `/inventory/movements` | Page | inventory |
| FE-SCR-035 | Quản lý Recipe/BOM | ROMS-051, ROMS-052, ROMS-053 | Member 4 | `/kitchen/recipes` | Page + Drawer/Modal | recipes |
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
| FE-SCR-046 | Rapid Menu Availability | BE-008 | BINH-DEV | `/kitchen/menu-availability` | Page + Modal | kitchen |
| FE-SCR-047 | Cài đặt nhà hàng & Thuế | BE-034, BE-035 | Member 5 | `/owner/settings` | Page + Modal/Action | dashboard |

## 2. Per-screen Notes and Backend Alignment

- **FE-SCR-006 & 007 — Order phục vụ & Đặt món trực tiếp**: Nhân viên phục vụ (`SERVICE_STAFF`) trực tiếp chọn món cho bàn tại `/staff/orders` hoặc trong phiên phục vụ, kiểm tra giỏ và gửi bếp (`PENDING`). Cho phép nhân viên hủy món/đơn khi còn `PENDING` (BE hoàn kho tự động).
- **FE-SCR-008 & 010 & 011 — KDS Bếp**:
  - Hàng đợi sắp xếp theo thứ tự gọi món (FIFO `created_at ASC`).
  - Màn đợi có nút từng món: "Nấu" (item $\rightarrow$ `COOKING`), hoặc nút to ở dưới: "Nấu tất cả" (`cook-all`).
  - Khi đang nấu, nút đổi thành "Ra món" (item $\rightarrow$ `READY`), hoặc nút to: "Ra tất cả" (`ready-all`).
  - Khi món `READY`, gửi thông báo STOMP tới nhân viên phục vụ (`/topic/service/ready-dishes`).
  - Phục vụ bưng món ra bàn và bấm "Hoàn thành" (`COMPLETED`).
- **FE-SCR-027 — Danh sách món & Excel**:
  - Nút "Tải file mẫu" (`/api/menu-items/excel/template`).
  - Nút "Xuất Excel" (`/api/menu-items/excel/export`).
  - Nút "Nhập Excel" (`/api/menu-items/excel/import`): Modal upload `.xlsx`; nếu trùng tên món thì cập nhật; nếu có tax rate mới thì tự động sinh tax category.
- **FE-SCR-032 — Nguyên liệu & Excel**:
  - Nút "Tải file mẫu" (`/api/ingredients/excel/template`).
  - Nút "Xuất Excel" (`/api/ingredients/excel/export`).
  - Nút "Nhập Excel" (`/api/ingredients/excel/import`): Modal upload `.xlsx`; nếu trùng tên thì cập nhật; nếu có tồn kho ban đầu thì ghi nhận stock movement.
- **FE-SCR-047 — Cài đặt nhà hàng & Thuế**:
  - Switch cấu hình `menu_price_includes_vat` (Đã gồm VAT / Chưa gồm VAT).
  - Quản lý danh mục thuế suất (`tax_categories`): Thêm mới thuế suất (`rate >= 0`), xem danh sách tỷ lệ thuế.
