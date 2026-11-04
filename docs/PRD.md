# ROMS Frontend — Product Requirements

**Scope:** React frontend for one restaurant; five contributors. **Sources:** agreed ROMS backend rules and the assigned ROMS ticket tracker. `SCREEN_SPEC.md` is the frontend screen/route reference; actual backend API implementation remains authoritative for available operations.

## 1. Purpose and Actors

ROMS supports table-based ordering by staff, kitchen operations (KDS), menu, staff/table/service-session administration, inventory/recipes/purchases, expenses, reporting, restaurant settings & VAT, Excel batch import/export, and Gemini menu guidance. The UI is in **Vietnamese**; source code identifiers, paths and component names use English. The frontend consumes the separate Spring Boot backend.

| Role | Primary UX |
|---|---|
| `OWNER` | Administration, reports, menus, staff, restaurant settings & VAT, Excel tools, and authorized operations |
| `SERVICE_STAFF` | Tables, service sessions, direct ordering at table, serving dishes, cancelling PENDING orders |
| `KITCHEN_STAFF` | Kitchen FIFO queue, cooking & readiness (single "Nấu"/"Ra món" & batch "Nấu tất cả"/"Ra tất cả"), rapid menu availability |
| `INVENTORY_STAFF` | Ingredients, checks, stock movements, recipes/purchases, Excel import/export |
| `TABLE_ACCOUNT` | Assigned table's welcome page, menu browsing, order tracking, and AI assistant (foundation for future QR ordering) |

Frontend route visibility is convenience only. Backend authorization and assigned-table scoping are definitive; do not assume every listed screen is accessible to every role.

## 2. Approved Frontend Workflows

- **Authentication**: Login is owned by **BINH-DEV**. Forgot/reset password, change password and profile belong to **QUANG**. JWT access token (15 min) stays in application memory; opaque refresh token stays in an HttpOnly cookie; refresh rotation is managed by backend. Tablet account has one active login, staff accounts may have multiple.
- **Forgot password**: email OTP via backend **Gmail SMTP**; six digits, valid **5 minutes**, at most **5 failed attempts**. Frontend never sends SMTP credentials or stores the OTP long-term.
- **Direct Table Ordering**: Service staff uses tablet/smartphone to open a session at the guest's table, add dishes to cart, and submit the order directly to the kitchen (`PENDING`). `TABLE_ACCOUNT` is retained for guests to view menu, progress, and AI assistant.
- **Order & Item Cancellation**: Both `SERVICE_STAFF` and `OWNER` can cancel an Order or OrderItem while in `PENDING` status. Cancellation triggers atomic stock restoration on backend.
- **Kitchen Operations (KDS)**:
  - Orders are listed in FIFO order by creation time.
  - Per item: "Nấu" (item moves to `COOKING`), "Ra món" (item moves to `READY`).
  - Batch buttons: "Nấu tất cả" (all pending items move to `COOKING`), "Ra tất cả" (all cooking items move to `READY`).
  - Dishes reaching `READY` trigger realtime STOMP notifications to service staff accounts.
- **Serving Flow**: Service staff delivers ready dishes to table and clicks "Hoàn thành" (`COMPLETED`).
- **Restaurant Settings & VAT**:
  - Owner manages setting: `menu_price_includes_vat` (true = Giá menu đã gồm VAT, false = Giá menu chưa gồm VAT).
  - Displays Price before tax, VAT amount, and Total to pay clearly in cart, order tracking, and bills.
- **Excel Import / Export**:
  - Menu Items: Download standard template, export current menu, import `.xlsx` with duplicate name update and auto-creation of missing tax categories.
  - Ingredients: Download template, export current stock, import `.xlsx` with duplicate name update and initial balance tracking.
- **Menu & Sellability**: sold-out availability derives from status and sufficient active recipe ingredients in live PostgreSQL. There is **no** `available_quantity` or serving-quota UI. `TEMPORARILY_UNAVAILABLE` is a separate manual status toggleable by kitchen.
- **Realtime**: REST remains source of business commands/queries; authenticated STOMP events prompt TanStack Query invalidation/refetch.
- **AI**: Gemini gives recommendations, not order creation, price authority or live inventory authority.

## 3. Scope and Exclusions

Ticket-to-screen mapping, owners, and suggested UI form are in `SCREEN_SPEC.md`; actual assigned tasks appear in `TASKS.md`. **No payment, reservations, supplier management, multi-branch, tags, manual serving quotas, or invented APIs**.

Existing HTML mockups are **non-authoritative exploratory references**, except `login.html`, which is the primary **layout reference for Login only**.

## 4. UI Acceptance (Current Phase)

- Feature works with real supported backend endpoints, enforces expected navigation and visible role constraints, and has meaningful loading/empty/error states.
- Member manually reviews appearance, interactions, Vietnamese copy and relevant device layouts; performs manual API integration testing and cross-feature handoff checks.
- Screens are implemented incrementally and reviewed by their assigned owner. Do not silently modify unrelated owner files.

## 5. Open Implementation Contracts

Exact endpoint/DTO/payload contracts for feature-specific flows, role-operation matrix details, and deployment-specific cookie/CORS setup must be verified against the live backend, not invented.
