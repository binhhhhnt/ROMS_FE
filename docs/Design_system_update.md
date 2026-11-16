# ROMS Frontend — Design System (POS Minimalist Draft)

> **Mục đích tài liệu:** Bản đề xuất cập nhật theo hướng **Minimalist POS / KDS** (tham khảo chuẩn vận hành thực tế của KiotViet FnB, Sapo FnB, Square & Toast POS/KDS) để thử nghiệm trên từng màn hình trước khi chốt thay thế cho [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).  
> **Nền tảng giữ nguyên:** Theme **Navy & Sky Blue**, ngôn ngữ UI **Tiếng Việt**, **shadcn/ui + Tailwind CSS v4 + Lucide React**, không thêm thư viện UI ngoài.

---

## 1. Triết lý thiết kế POS Minimalist

1. **Thông tin là trung tâm, màu sắc chỉ là tín hiệu:**
   - Giao diện ưu tiên nền trắng (`#FFFFFF`) và nền trang xám xanh rất nhạt (`#F5F8FC`), viền mảnh `1px`, hạn chế tối đa `shadow` (chỉ dùng `shadow-xs`/`shadow-md` cho modal/popover).
   - Không tô nền màu cho header/footer của card hay đóng hộp màu vàng cho mọi ghi chú.
2. **Nhịp đọc dưới 1.5 giây (Scan Hierarchy):**
   - **Số lượng (`3x`) là điểm neo lớn nhất & đậm nhất**, đứng ngay trước tên món (`font-mono font-bold`) để bếp/nhân viên nhìn thấy *bao nhiêu suất* trước khi đọc *món gì*.
   - **Tên món** in đậm (`font-semibold` / `font-bold`), cỡ chữ rõ ràng, màu `text` (`#243447`).
   - **Ghi chú / Tùy chọn (`item.note`)** đặt ngay dưới tên món, thụt lề nhẹ, nhấn bằng chữ đậm hoặc tag nhỏ tương phản cao.
   - **Metadata** (Số bàn, mã đơn, giờ gọi, đơn giá) neo cố định ở góc header hoặc cột phụ, cỡ nhỏ (`text-xs`), màu xám nhạt (`text-muted`). Với chuỗi ngày/giờ dài, dùng font chữ mặc định kèm `tabular-nums` (không dùng `font-mono` cho ngày/giờ vì dễ làm chữ nhỏ và khó đọc).
3. **Thao tác cảm ứng dứt khoát (Fitts's Law & Touch Ergonomics):**
   - Nút hành động chính ở đáy card/thanh thao tác: tối thiểu `h-11` (`44px`), rộng dễ chạm.
   - Nút thao tác từng dòng: `h-9` đến `h-10` (`36px–40px`).
   - Thao tác lặp lại (nhận nấu, ra món, xác nhận đã bưng) thực hiện **1 chạm**, không bật popup xác nhận (chỉ bật confirm cho thao tác hủy/xóa).
   - Khi đang gọi API: **giữ nguyên nhãn nút** và chỉ `disabled` (`opacity-50`), không đổi chữ sang `"Đang lưu..."` gây nhảy layout/khựng mắt.
   - Không phụ thuộc `hover` cho thao tác quan trọng (tương thích tablet/màn hình cảm ứng).

---

## 2. Core Palette (Giữ nguyên Token gốc, Siết cách dùng)

| Token | Hex | Vai trò trong POS Minimalist |
|---|---|---|
| `primary` | `#1D3557` | Nút hành động chính (Primary CTA), mục đang chọn trên thanh điều hướng |
| `background` | `#F5F8FC` | Nền trang tổng thể |
| `white` / `card` | `#FFFFFF` | Nền card, bảng, modal — luôn dùng làm bề mặt mặc định |
| `surface` | `#DCEAF5` | Dùng cho trạng thái đang được chọn (selected row/tab/table) và làm nền nhẹ (`bg-surface/60`) cho hàng cha/header nhóm (`Order`, `thead`) để tách biệt với cả nền trang `#F5F8FC` lẫn hàng con `#FFFFFF` |
| `text` | `#243447` | Văn bản chính, tiêu đề, số lượng |
| `accent` | `#3D92CB` | Focus ring, link, nhấn nhẹ phần tử đang tương tác |

> **Quy tắc:** Dùng token CSS trong `src/index.css` (`bg-card`, `border-border` với `--color-border: #CBD5E1` để viền card/bảng sắc nét trên nền `#F5F8FC`, `text-text`, `text-muted`, `bg-primary`). Tránh hard-code màu như `bg-amber-50`, `bg-emerald-600`, `border-amber-200` trong component feature.

---

## 3. Quy tắc hiển thị Trạng thái, Thời gian & Nút thao tác

### 3.1. Trạng thái (Status Badge — Phân biệt rõ màu theo từng trạng thái)
Dùng pill/badge gọn (`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border`) với **màu nền nhẹ + viền + màu chữ khác nhau rõ rệt** cho từng trạng thái:

| Trạng thái | Hiển thị đề xuất |
|---|---|
| `PENDING` (Chờ nấu / Chờ tiếp nhận) | Nền `bg-status-pending/15`, viền `border-status-pending/35`, chấm `bg-status-pending` + chữ `text-amber-700 dark:text-amber-400` |
| `COOKING` (Đang nấu) | Nền `bg-status-cooking/15`, viền `border-status-cooking/35`, chấm `bg-status-cooking` + chữ `text-status-cooking` |
| `READY` (Sẵn sàng) | Nền `bg-status-ready/15`, viền `border-status-ready/35`, chấm `bg-status-ready` + chữ `text-status-ready` |
| `COMPLETED` (Hoàn thành) | Nền `bg-status-completed/15`, viền `border-status-completed/30`, chữ `text-status-completed` |
| `CANCELLED` (Đã hủy) | Nền `bg-status-cancelled/15`, viền `border-status-cancelled/30`, chữ `text-status-cancelled` |

### 3.2. Tín hiệu thời gian chờ cho KDS (Urgency Timer)
- Không dùng màu rực để phân biệt trạng thái tĩnh của card. Tất cả card mặc định nền trắng, viền `border-border`.
- Dùng **màu sắc theo thời gian chờ** trên bộ đếm giờ (và/hoặc viền mỏng trên cùng card) để báo động đơn sắp trễ:
  - Bình thường: chữ `text-muted` trung tính.
  - Sắp quá giờ: chữ `text-status-pending` (vàng/cam).
  - Quá giờ: chữ `text-status-cancelled` (đỏ) hoặc viền trên đỏ mảnh.

### 3.3. Nút thao tác (Action Buttons — Có nền màu theo ngữ nghĩa & rõ vùng bấm)
Mọi nút thao tác trên POS/KDS đều có **nền màu và đường biên rõ ràng** để nhận diện ngay loại hành động mà không cần đọc kỹ chữ (giữ phẳng, không gradient/shadow dày):

- **Hành động chính chung & Phục vụ bàn (`Đặt món`, `Thanh toán`, `Mở phiên`, `Đã bưng ra bàn`, `Bưng tất cả`):** `bg-primary text-white border border-primary hover:bg-primary-hover` (Navy `#1D3557` đồng bộ).
- **Nút nhận nấu trên KDS (`Nấu`, `Nấu tất cả`):** `bg-blue-700 text-white border border-blue-700 hover:bg-blue-800` (xanh dương đậm dịu mắt, tránh xanh tươi gây chói).
- **Nút hoàn thành món trên KDS (`Ra món`, `Ra tất cả`):** `bg-emerald-700 text-white border border-emerald-700 hover:bg-emerald-800` (xanh lá đậm dịu mắt, tương phản tốt với chữ trắng).
- **Hành động phụ & Điều hướng (Secondary / Outline):** `bg-card text-text border border-border hover:bg-muted-bg` (ví dụ: `Kiểm đồ`, `Chuyển bàn`, `Cập nhật lại`, và các nút `Quay lại ...` ở đầu trang dùng `h-9 px-3 text-xs font-medium`, tránh dùng link chữ nhỏ trơ trọi khó bấm).
- **Hành động hủy / đóng (Destructive Outline):** `bg-card text-status-cancelled border border-status-cancelled/35 hover:bg-status-cancelled/10` (nền trắng sạch + viền đỏ mảnh rõ vùng bấm).

---

## 4. Quy tắc Bố cục & Chống chồng chéo (Anti-Overlap Layout Rules)

1. **Không lồng Card trong Card (Single Container Rule) & Phân biệt Hàng cha – Hàng con:**
   - Mỗi khối lớn chỉ dùng **1 lớp khung** (`bg-card border border-border rounded-lg`).
   - Với card thông thường, Header & Footer giữ nền trắng, phân tách bằng đường kẻ mảnh `border-b border-border` / `border-t border-border`.
   - **Với danh sách dạng nhóm / xổ xuống (Parent–Child / Dropdown list như `Order` $\rightarrow$ `OrderItem`, hoặc `thead` $\rightarrow$ `tbody`):** Hàng cha / header nhóm dùng nền xanh nhạt `bg-surface/60` (từ `#DCEAF5`) để **tách biệt rõ ràng** với cả nền trang (`#F5F8FC`) lẫn các hàng con bên dưới (nền trắng `bg-card`), giúp mắt nhận diện ngay cấp bậc cha–con mà không bị chìm vào nền.
   - Danh sách món ăn bên trong phân tách bằng `divide-y divide-border` hoặc khoảng trống, **không** bọc thêm `border rounded-xl bg-...` cho từng item con.
2. **Chống đè chữ & vỡ hàng (`min-w-0` + `shrink-0`):**
   - Trong mỗi hàng flex (tên món – số lượng – trạng thái – nút), khối tên món/ghi chú bắt buộc có `min-w-0 flex-1` để tự co hoặc xuống dòng gọn.
   - Khối số lượng, giá và nút thao tác giữ `shrink-0` để không bao giờ bị bóp méo hoặc đè lên chữ trên tablet/màn hình hẹp.
   - **Tối đa 3 nhóm thông tin** trên cùng 1 hàng ngang (ví dụ: `[Số lượng + Tên món]` bên trái, `[Trạng thái]` ở giữa, `[Nút thao tác]` bên phải). Nếu nhiều hơn (thêm đơn giá, thành tiền, nút Hủy), tách thành 2 tầng rõ ràng thay vì dồn hết lên 1 dòng.
3. **Số cột Grid vừa đủ rộng (Responsive Grid):**
   - Grid thẻ đơn hàng (KDS/POS) tối đa **3 cột trên desktop** (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`), tránh chia 4–5 cột làm card bị hẹp, chữ rớt dòng lộn xộn.
4. **Cấu trúc 3 tầng của 1 trang & Chống che khuất:**
   - Tách rõ 3 tầng: **Header trang** (tiêu đề + 1–2 nút chính) → **Thanh lọc / Tabs** (gọn 1 hàng) → **Nội dung chính**, cách nhau `space-y-5` / `gap-4` trở lên.
   - Nếu có thanh hành động `sticky` hoặc `fixed` ở đáy màn hình (như thanh tổng tiền, nút đặt món), vùng cuộn phía trên phải chừa `pb-20` để không che mất dòng cuối cùng.
   - Không mở chồng nhiều overlay (Modal/Drawer) cùng lúc.
5. **Icon:** Dùng Lucide icons tiết chế (`w-3.5 h-3.5` hoặc `w-4 h-4`). Chỉ gắn icon khi giúp nhận diện nhanh hơn; không gắn icon trang trí vào mọi nút.

---

## 5. Các quy chuẩn nghiệp vụ giữ nguyên từ `DESIGN_SYSTEM.md`

- **Tiền tệ & VAT:** Định dạng `#,##0 đ` (vd: `100.000 đ`) và cách hiển thị theo `menu_price_includes_vat` giữ nguyên như Mục 4 của `DESIGN_SYSTEM.md`.
- **Excel Import / Export:** Giữ nguyên Mục 5 (`Tải file mẫu`, `Xuất Excel`, `Nhập Excel`).
- **Mockup Policy:** Giữ nguyên Mục 6 (`login.html` cho Login).

---

## 6. Quy trình thử nghiệm & Rollback

1. Chọn **1 màn hình/component** làm mẫu thử theo tài liệu này.
2. Kiểm tra trực quan trên trình duyệt (độ rõ chữ, tốc độ quét mắt, không chồng chéo trên desktop & tablet, độ dễ bấm).
3. Nếu chưa phù hợp: rollback code màn hình thử nghiệm và điều chỉnh trực tiếp các quy tắc trong file này trước khi áp dụng rộng rãi.
