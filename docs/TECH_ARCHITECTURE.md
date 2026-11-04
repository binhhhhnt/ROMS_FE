# ROMS Frontend — Technical Architecture

**Approved stack:** React + TypeScript + Vite; React Router; shadcn/ui (Radix primitives) + Tailwind CSS v4 + Lucide React; TanStack Query, Zustand, React `useState`; Axios; React Hook Form + Zod; Sonner; Recharts; STOMP.js + SockJS. Keep versions compatible with the existing `package.json`.

## 1. Group by Feature

```text
src/
├── app/
│   ├── layouts/                 # Shared application shells (AuthLayout, StaffLayout, KitchenLayout, TabletLayout)
│   ├── routes/                  # Route definitions, guards, redirects
│   ├── providers/               # QueryClient, app-wide providers
│   ├── store/                   # Global application state (auth, notifications)
│   └── App.tsx
├── features/
│   ├── auth/                    # Login, password recovery, profile
│   ├── users/                   # Account management
│   ├── tables/                  # Tables and active sessions
│   ├── sessions/                # Session detail & history
│   ├── menu/                    # Categories, menu items, Excel template/export/import
│   ├── ordering/                # Direct staff ordering, cart, order tracking, cancellation
│   ├── kitchen/                 # KDS FIFO queue, batch cooking/readiness, menu availability
│   ├── inventory/               # Ingredients, Excel template/export/import, checks, movements
│   ├── recipes/                 # Recipe / BOM editor
│   ├── purchasing/              # Purchases & corrections
│   ├── expenses/                # Operational expenses
│   ├── dashboard/               # Owner dashboard, restaurant settings & tax categories
│   ├── reports/                 # Financial & operational reports, CSV export
│   └── ai-assistant/            # Gemini AI menu assistant
├── shared/
│   ├── components/ui/          # Installed shadcn components
│   ├── components/             # Reusable UI primitives (dialogs, tables, notifications)
│   ├── hooks/
│   ├── lib/                    # Axios client, QueryClient, STOMP adapter
│   ├── utils/                  # Currency, VAT calculation, date formatters
│   ├── types/
│   └── constants/
└── main.tsx
```

## 2. Routing and Layouts

- Central routing in `app/routes`:
  - Public / Auth: `/login`, `/forgot-password`, `/reset-password`.
  - Staff / Owner: `/staff/tables`, `/staff/orders`, `/staff/orders/:orderId`, `/owner/menu-items`, `/owner/settings`, `/inventory/*`, `/owner/reports/*`.
  - Kitchen: `/kitchen/queue`, `/kitchen/cooking`, `/kitchen/ready`, `/kitchen/menu-availability`.
  - Tablet: `/tablet/welcome`, `/tablet/menu`, `/tablet/orders`, `/tablet/assistant`.
- Role guards restrict access by `OWNER`, `SERVICE_STAFF`, `KITCHEN_STAFF`, `INVENTORY_STAFF`, `TABLE_ACCOUNT`.

## 3. Realtime & Notification Architecture

- **WebSocket / STOMP** endpoint: `/ws` (SockJS + STOMP.js).
- Destinations:
  - `/topic/kitchen/orders`: New orders placed (`PENDING`), cancellations. Prompts KDS queue refetch.
  - `/topic/session/{sessionId}/orders`: Order and item status changes.
  - `/topic/tables`: Table transfers, session open/close.
  - `/topic/service/ready-dishes`: Realtime alerts for service staff when kitchen finishes a dish (`READY`). Displays toast/notification badge with table number and dish info.

## 4. Excel Import / Export Flow

- **Template Download & Export**:
  - Axios request with `responseType: 'blob'`.
  - Triggers browser file download (`menu_template.xlsx`, `menu_export.xlsx`, `ingredients_template.xlsx`, `ingredients_export.xlsx`).
- **Transactional Import**:
  - File input / Drag-and-drop modal accepting `.xlsx`.
  - Sent via `multipart/form-data` to backend import endpoints.
  - Shows parsing summary: number of items created, updated, and missing tax rates auto-generated.
  - On success, invalidates TanStack Query caches (`['menu-items']`, `['ingredients']`, `['tax-categories']`).

## 5. VAT & Pricing Engine (Client Display)

- Centralized helper in `shared/utils/vat.ts`:
  - Consumes `restaurant_settings.menu_price_includes_vat` and `tax_categories.rate`.
  - Standardizes calculations across cart, order cards, and bills.
  - Prevents rounding discrepancies by using standard decimal math.

## 6. Concurrency & UX Safety

- **KDS Batch Actions**:
  - Disable buttons during mutation to prevent double-clicks.
  - TanStack Query mutation invalidates active queue after commit.
- **Order Cancellation**:
  - Confirm modal before cancellation.
  - If kitchen has already accepted (`COOKING`), handle `409 Conflict` gracefully with a clear Vietnamese alert ("Đơn hàng đã được bếp tiếp nhận chế biến, không thể hủy").
