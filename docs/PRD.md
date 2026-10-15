# ROMS Frontend — Product Requirements

**Scope:** React frontend for one restaurant; five contributors. **Sources:** agreed ROMS backend rules and the assigned ROMS ticket tracker. `SCREEN_SPEC.md` is the frontend screen/route reference; actual backend API implementation remains authoritative for available operations.

## 1. Purpose and Actors

ROMS supports table-based ordering, kitchen operations, menu, staff/table/service-session administration, inventory/recipes/purchases, expenses, reporting, and Gemini menu guidance. The UI is in **Vietnamese**; source code identifiers, paths and component names use English. The frontend consumes the separate Spring Boot backend.

| Role | Primary UX |
|---|---|
| `OWNER` | Administration, reports, menus, staff and authorized operations |
| `SERVICE_STAFF` | Tables, service sessions, orders, serving dishes |
| `KITCHEN_STAFF` | Kitchen queue, cooking and readiness |
| `INVENTORY_STAFF` | Ingredients, checks, stock movements, recipes/purchases as authorized |
| `TABLE_ACCOUNT` | Assigned table's welcome page, menu, cart, orders and AI assistant |

Frontend route visibility is convenience only. Backend authorization and assigned-table scoping are definitive; do not assume every listed screen is accessible to every role.

## 2. Approved Frontend Workflows

- Authentication: Login is owned by **BINH-DEV**. Forgot/reset password, change password and profile belong to **QUANG**. JWT access token (15 min) stays in application memory; opaque refresh token stays in an HttpOnly cookie; refresh rotation is managed by backend. Tablet account has one active login, staff accounts may have multiple.
- Forgot password: email OTP via backend **Gmail SMTP**; six digits, valid **5 minutes**, at most **5 failed attempts**. Frontend never sends SMTP credentials or stores the OTP long-term.
- Tablet: a `TABLE_ACCOUNT` is assigned to `users.table_id`, not an individual guest; it may initiate opening the assigned table's service session via confirmation. Closing a session is a staff/Owner action. Additional dishes require a *new* Order under the active session.
- Menu: sold-out availability derives from status and sufficient active recipe ingredients in live PostgreSQL. There is **no** `available_quantity` or serving-quota UI. `TEMPORARILY_UNAVAILABLE` is a separate manual status. Menu images are uploaded via backend to Cloudinary; frontend only handles file selection/upload UX and returned image URLs.
- Ordering: cart is client-side until order placement. After placing an Order, its items and quantities cannot be edited. Backend atomically deducts recipe stock on successful Order creation; if insufficient, it rejects the **whole** order with `409 Conflict`. Show meaningful conflict feedback and let user revise cart. No partial-order assumption.
- Statuses: Order `PENDING → COOKING → COMPLETED` or `PENDING → CANCELLED`; OrderItem `PENDING → COOKING → READY → COMPLETED` or `PENDING → CANCELLED`. Order does **not** have `READY` or `REJECTED`. Only a target currently `PENDING` can be cancelled. Do not infer Order completion from an individual completed item.
- Kitchen acceptance changes workflow only; **does not deduct stock twice**. Backend automatically restores previously deducted stock on valid PENDING cancellation. UI must not calculate/persist stock directly.
- Realtime: REST remains source of business commands/queries; authenticated STOMP events prompt TanStack Query invalidation/refetch. If WebSocket is disconnected, REST data remains usable.
- AI: Gemini gives recommendations, not order creation, price authority or live inventory authority. Live sellability is validated by backend; cached stable menu/ingredient context is backend infrastructure.
- Inventory: display ingredient `current_stock` (never negative), stock alerts, inventory checks and append-only stock movements. Movement `quantity_change` is signed while `current_stock` is nonnegative. Purchase corrections remain auditable and backend-transactional. No supplier/purchase-order workflow.
- Reporting: only display KPIs and exports supported by actual backend data. Since **payment is out of scope**, revenue/profit meanings must be confirmed before presenting as settled paid-revenue numbers.

## 3. Scope and Exclusions

Ticket-to-screen mapping, owners, and suggested UI form (page/modal/action) are in `SCREEN_SPEC.md`; actual assigned tasks appear in `TASKS.md`. **No payment, reservations, supplier management, multi-branch, tags, manual serving quotas, or invented APIs**.

Existing HTML mockups are **non-authoritative exploratory references**, except `login.html`, which is the primary **layout reference for Login only**. If login HTML conflicts with backend business rules or approved Navy & Sky Blue tokens, preserve valid layout intent while following the documentation and backend contract.

## 4. UI Acceptance (Current Phase)

- Feature works with real supported backend endpoints (or is explicitly marked blocked when missing), enforces expected navigation and visible role constraints, and has meaningful loading/empty/error states.
- Member manually reviews appearance, interactions, Vietnamese copy and relevant device layouts; performs manual API integration testing and cross-feature handoff checks.
- **Do not require automated E2E testing or a test-per-component policy at this stage.** Automated tests may be introduced later by a separate team decision.
- Screens are implemented incrementally and reviewed by their assigned owner. Do not silently modify unrelated owner files.

## 5. Open Implementation Contracts

Exact endpoint/DTO/payload contracts for feature-specific flows, role-operation matrix details, missing report definitions, voice-input browser support, and deployment-specific cookie/CORS setup must be verified against the live backend, not invented.
