# ROMS Frontend — Implementation Plan

**Scope:** 5-person React project, Group by Feature. This plan is a dependency-aware roadmap, not authorization to implement all features simultaneously. Screen ownership: `SCREEN_SPEC.md`; task ownership: `TASKS.md`.

## Phase 0 — Align Contracts (All, coordination by BINH-DEV)

1. Confirm access to latest backend branch/API paths/DTOs; note missing endpoint contracts before UI implementation.
2. Put final docs in FE repo; attach only `login.html` as primary UI reference; other HTML optional.
3. Agree Vite/TypeScript baseline, node/package manager, review workflow and shared naming. Never copy backend secrets into frontend `.env`.

## Phase 1 — FE Foundation (BINH-DEV lead; collaboration for shared auth routes)

- Scaffold React/Vite project and `app/`, `features/`, `shared/`.
- Configure Navy & Sky Blue theme, Tailwind v4/shadcn/ui, responsive layouts, Router/guards, QueryClient, Axios client/refresh handling, Zustand auth context, shared dialogs/toasts and STOMP client.
- Implement Login from `login.html`, verify credentialed refresh and current-user flow manually against real backend. QUANG owns other auth/recovery pages and coordinates shared auth contract.
- Publish shared component/API usage conventions so members can build features in parallel.

## Phase 2 — Parallel Feature Delivery

| Stream | Owner | Screens / ticket focus | Key prerequisites |
|---|---|---|---|
| A | BINH-DEV | Tablet cart/checkout/tracking; service orders; Kitchen/KDS | auth shell, menu data from Member 3, session from QUANG, backend Order/Kitchen |
| B | QUANG | Password recovery/profile/users/tables/sessions/welcome/AI | shared auth, OTP APIs, BE session & Gemini contract |
| C | Member 3 | Menu/category CRUD, images, tablet menu/detail | shared shell, Cloudinary backend upload, cart add-item contract with BINH-DEV |
| D | Member 4 | Ingredients, stock, checks, recipes, purchases | inventory/recipe/purchase BE API and contract review |
| E | Member 5 | Owner dashboard, expenses and reports/exports | backed metrics & expense APIs; revenue/profit definition approval |

Work in independent feature branches. Shared auth/cart/navigation changes require owner coordination; do not duplicate feature business state inside shared.

## Phase 3 — Manual Integration and UX Review

- Each owner manually walks assigned screens using real backend where supported: login/role, navigation, forms, loading/error/409 cases, table scoping, state transitions, responsive breakpoints.
- Cross-feature checks: Tablet Menu → Cart → Checkout → Kitchen → status updates; session opening → ordering; password recovery; images; stock-aware sellability; after-commit STOMP refresh.
- Highlight blocked interactions honestly, confirm reports' number semantics and verify browser refresh/cookie behavior on intended deployment.
- **No automated E2E implementation or mandated automated per-component tests in this phase.** Separate request later if wanted.

## Phase 4 — Review and Handoff

- Review UI consistency, role restrictions, absence of out-of-scope screens, clean route coverage and navigation.
- Update `TASKS.md` only after owner verifies and (when required) reviews a working implementation. Record endpoint blockers instead of marking Done on mock-only UI.

## Immediate Next Step

Have BINH-DEV prepare the shared FE skeleton, Design System, HTTP/auth integration and Login visual reference while other contributors confirm API contracts and plan their own feature screens.
