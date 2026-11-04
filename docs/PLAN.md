# ROMS Frontend — Implementation Plan

**Scope:** 5-person React project, Group by Feature. This plan is a dependency-aware roadmap for transitioning ROMS to real restaurant operations. Screen ownership: `SCREEN_SPEC.md`; task ownership: `TASKS.md`.

## Phase 0 — Align Contracts (All, coordination by BINH-DEV)

1. Confirm access to latest backend branch/API paths/DTOs.
2. Put final docs in FE repo; attach `login.html` as primary UI reference.
3. Agree Vite/TypeScript baseline, node/package manager, review workflow and shared naming.

## Phase 1 — FE Foundation (BINH-DEV lead)

- Scaffold React/Vite project and `app/`, `features/`, `shared/`.
- Configure Navy & Sky Blue theme, Tailwind v4/shadcn/ui, responsive layouts, Router/guards, QueryClient, Axios client, Zustand auth context, shared dialogs/toasts and STOMP client.

## Phase 2 — Core Feature Delivery

| Stream | Owner | Screens / ticket focus | Key prerequisites |
|---|---|---|---|
| A | BINH-DEV | Tablet cart/tracking; service orders; Kitchen/KDS | auth shell, menu data, backend Order/Kitchen APIs |
| B | QUANG | Password recovery/profile/users/tables/sessions/welcome/AI | shared auth, OTP APIs, BE session & Gemini contract |
| C | Member 3 | Menu/category CRUD, Cloudinary images, tablet menu | shared shell, backend upload API |
| D | Member 4 | Ingredients, stock, checks, recipes, purchases | inventory/recipe/purchase BE APIs |
| E | Member 5 | Owner dashboard, expenses, reports & exports | backend metrics & expense APIs |

## Phase 3 — Manual Integration and UX Review

- Manual review of real backend integration: login/role, navigation, forms, loading/error/409 cases, state transitions, responsive breakpoints.
- Cross-feature flow checks: Session opening $\rightarrow$ Ordering $\rightarrow$ Kitchen $\rightarrow$ Serving $\rightarrow$ Reports.

## Phase 4 — Production Transition (Current Phase)

1. **Waitstaff Direct Ordering & Cancellation (Stream A — BINH-DEV)**:
   - Provide direct ordering UI for service staff on phone/tablet (`/staff/orders`).
   - Implement staff PENDING order/item cancellation with automatic stock restoration feedback.
2. **KDS FIFO Queue & Batch Actions (Stream A — BINH-DEV)**:
   - Order cards sorted in FIFO order (`created_at ASC`).
   - Individual item buttons: "Nấu" (item $\rightarrow$ `COOKING`), "Ra món" (item $\rightarrow$ `READY`).
   - Card bottom action buttons: "Nấu tất cả" (`cook-all`), "Ra tất cả" (`ready-all`).
   - STOMP listener on `/topic/service/ready-dishes` to notify waitstaff when dishes are ready.
   - Staff dish delivery confirmation button: "Hoàn thành" (`COMPLETED`).
3. **Restaurant Settings & VAT Configuration (Stream E — Member 5)**:
   - Screen `/owner/settings` (`FE-SCR-047`): Toggle `menu_price_includes_vat`.
   - Tax rate management: List and add tax rates (`rate >= 0`).
   - Update cart, order progress, and billing cards to show Price Before Tax, VAT Amount, and Total.
4. **Excel Import / Export Tools (Stream C & D — Member 3 & 4)**:
   - Menu Items (`/owner/menu-items`): "Tải file mẫu", "Xuất Excel", "Nhập Excel" modal.
   - Ingredients (`/inventory/ingredients`): "Tải file mẫu", "Xuất Excel", "Nhập Excel" modal.
   - User feedback for created/updated counts and auto-generated tax rates.
