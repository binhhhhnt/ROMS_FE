# ROMS Frontend — Design System

**Approved theme:** **Navy & Sky Blue**, shared by admin/staff, kitchen and tablet views. **UI language:** Vietnamese. **Implementation:** shadcn/ui + Tailwind CSS v4 (Radix-based primitives) + Lucide React. Do not mix other UI libraries by default.

## 1. Core Palette

| Token | Hex | Suggested role |
|---|---|---|
| `primary` | `#1D3557` | Navy: top navigation, primary actions, active navigation |
| `background` | `#F5F8FC` | Main page background |
| `surface` | `#DCEAF5` | Soft blue selected/highlight panels; avoid making all cards blue |
| `text` | `#243447` | Main text |
| `accent` | `#3D92CB` | Focus/link/highlight accents |
| `white` | `#FFFFFF` | Cards, dialogs and forms |

Store palette in centralized CSS design tokens mapped to Tailwind semantic utilities. Never scatter hard-coded hex values through feature code. Ensure readable contrast, especially on pale blue.

## 2. Layout and Components

- Use one shared spacing scale (Tailwind), consistent radius/shadow and screen containers. Prefer white card surfaces on `background`; reserve `surface` for selected/highlight areas.
- **Navigation Patterns**:
  - Owner/Staff: Desktop sidebar and responsive mobile/tablet bottom/drawer navigation for waitstaff on floor.
  - Kitchen: High-contrast FIFO queue card grid (KDS) optimized for horizontal touch displays and fast visual scanning.
  - Tablet/Mobile: Touch-friendly cards and large buttons; no hover-only critical interactions.
- Use shared shadcn `Button`, `Input`, `Card`, `Dialog`, `Sheet`, `Table`, `Tabs`, `Select` as needed. Use Lucide icons only.
- Typography: **Be Vietnam Pro** recommended for Vietnamese UI; fallback `Inter, system-ui, sans-serif`.

## 3. Semantic Status Colors & Action Button States

Use accessible, consistent tokens and **always display the state label/icon**, not color alone.

| State / Action | Meaning / UI Approach |
|---|---|
| Order `PENDING` | Amber/yellow badge + "Chờ chế biến" |
| Item action: "Nấu" | Amber/orange button $\rightarrow$ chuyển item sang `COOKING` |
| Order action: "Nấu tất cả" | Large primary amber/orange button at bottom of order card |
| Order / Item `COOKING` | Blue badge + "Đang chế biến" |
| Item action: "Ra món" | Teal/sky-blue button $\rightarrow$ chuyển item sang `READY` |
| Order action: "Ra tất cả" | Large teal button at bottom of order card |
| Item `READY` | Green/teal badge + "Sẵn sàng (Chờ bưng món)" |
| Staff action: "Hoàn thành" | Green button on staff view $\rightarrow$ chuyển item sang `COMPLETED` |
| Order / Item `COMPLETED` | Green badge + "Hoàn thành" |
| Order / Item `CANCELLED` | Red/neutral badge + "Đã hủy" |
| Low / Out of stock | Amber / red badge + số lượng |

## 4. Financial & VAT Display Guidelines

Format currency consistently in Vietnamese Dong: `#,##0 đ` (e.g. `100.000 đ`).
Depending on `restaurant_settings.menu_price_includes_vat`:
- **Giá đã gồm VAT**:
  ```text
  Tổng tiền món:        100.000 đ
  (Trong đó: Tiền trước thuế: 92.593 đ | VAT (8%): 7.407 đ)
  Khách phải trả:       100.000 đ
  ```
- **Giá chưa gồm VAT**:
  ```text
  Tiền trước thuế:      100.000 đ
  Tiền thuế VAT (8%):     8.000 đ
  Khách phải trả:       108.000 đ
  ```

## 5. Excel Import / Export Component Guidelines

- Uniform header action buttons across Menu Items (`/owner/menu-items`) and Ingredients (`/inventory/ingredients`):
  - **Tải file mẫu**: Secondary button with `Download` icon.
  - **Xuất Excel**: Outline button with `FileSpreadsheet` icon.
  - **Nhập Excel**: Primary button with `Upload` icon, opening a Drag & Drop upload modal with sheet preview, duplicate update note, and validation result feedback.

## 6. Mockup Policy

- `login.html`: **primary visual reference** for Login composition.
- Other screens: Antigravity designs within Navy & Sky Blue guidelines, based on `SCREEN_SPEC.md` and verified backend APIs.
