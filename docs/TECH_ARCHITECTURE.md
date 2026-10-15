# ROMS Frontend — Technical Architecture

**Approved stack:** React + TypeScript + Vite; React Router; shadcn/ui (Radix primitives) + Tailwind CSS v4 + Lucide React; TanStack Query, Zustand, React `useState`; Axios; React Hook Form + Zod; Sonner; Recharts; STOMP.js + SockJS. Keep versions compatible with the existing `package.json`; install only required dependencies when implementing approved tasks.

## 1. Group by Feature

```text
src/
├── app/
│   ├── layouts/                 # Shared application shells by role/use case
│   ├── routes/                  # Route definitions, guards, redirects
│   ├── providers/               # QueryClient, app-wide providers
│   ├── store/                   # Only truly global application concerns
│   └── App.tsx
├── features/
│   ├── auth/                    # BINH-DEV: login; QUANG: remaining account flows
│   ├── users/
│   ├── tables/
│   ├── sessions/
│   ├── menu/
│   ├── ordering/
│   ├── kitchen/
│   ├── inventory/
│   ├── recipes/
│   ├── purchasing/
│   ├── expenses/
│   ├── dashboard/
│   ├── reports/
│   └── ai-assistant/
├── shared/
│   ├── components/ui/          # Installed/adapted shadcn components
│   ├── components/             # App-level reusable UI
│   ├── hooks/
│   ├── lib/                    # Axios client, QueryClient, STOMP adapter
│   ├── utils/
│   ├── types/
│   └── constants/
└── main.tsx
```

Feature folders may contain `pages/`, `components/`, `hooks/`, `api/`, `store/`, `schemas/`, `types/`. Do not create empty folders or duplicate implementations by default. **Dependence:** `app → features → shared`; feature-specific concerns stay under feature, generic primitives in shared. `shared/` must not import `features/`. Cross-feature contracts are coordinated rather than importing private internals or duplicating business behavior. **No separate frontend infrastructure layer is required.**

## 2. Routing and Layouts

- React Router defines routes centrally in `app/routes`; pages themselves live in their owning feature. Routes in `SCREEN_SPEC.md` are **proposals**, to be approved against actual navigation and existing code before publication.
- Separate appropriate Owner/Staff, Kitchen and Tablet layouts; Login and password recovery use public/auth layout.
- Auth guards require authentication; role guards hide unauthorized navigation but **cannot replace backend authorization**. Unauthorized goes to access-denied; anonymous goes to Login where appropriate.
- Focus on desktop/laptop for admin/staff, landscape tablet/desktop for Kitchen, portrait/landscape tablet for customer ordering; Login supports desktop/tablet/mobile. Avoid broken overflow at smaller widths.

## 3. State Ownership

| State | Use | Examples |
|---|---|---|
| TanStack Query | Backend-owned asynchronous server state | menu, orders, sessions, stock, reports |
| Zustand | Shared client state that must survive component switches within the app | transient cart, access token/auth state |
| `useState` | Local short-lived presentation state | modal, selected tab, input visibility |

- Do not copy entire TanStack Query API responses into Zustand. Scope Query keys to feature/resource/filter/session. Mutations invalidate or update affected queries after a confirmed response.
- Tablet cart persists in memory by default; any persistence across reload must be **explicitly approved**, and never expose the access token through localStorage/sessionStorage.
- Never treat STOMP as the sole persisted source; websocket event triggers targeted query invalidation/refetch.

## 4. API and Authentication

- Single shared Axios client in `shared/lib/`, with centralized base URL, access bearer injection, HTTP error normalization, and credentialed refresh requests.
- Access JWT is kept **in memory**, not localStorage/sessionStorage; HttpOnly refresh cookie stays browser-managed. On reload, attempt `POST /api/auth/refresh` once to rehydrate auth. Coordinate single-flight refresh on simultaneous 401s, avoid infinite retries.
- Auth endpoints already agreed: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`. Access tokens expire after 900 seconds; refresh window is 90 days for TABLE_ACCOUNT and 7 days for staff/Owner, sliding on successful rotation.
- Send refresh cookie with `withCredentials` where appropriate. Exact CORS, `SameSite` and CSRF policy depend on deployed FE/BE origins; do not weaken browser protections to work around local errors.
- Feature API functions consume typed DTOs and the backend `ApiResponse<T>` envelope; UI components do not scatter raw Axios calls.
- Respect `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` business conflicts and `500` unexpected failure; use Vietnamese user-friendly messages.

## 5. Forms, Styling and Integration

- Use React Hook Form + Zod for substantial forms; small presentation inputs may use `useState` without forcing a form library.
- Use **shadcn/ui + Tailwind v4**; all tokens in `DESIGN_SYSTEM.md`. Do not mix Ant Design, MUI or new icon frameworks without agreement. Components with feature business meaning belong in the owning feature.
- Cloudinary: frontend sends a validated file to a **backend-approved upload operation**, renders returned URL, and keeps Cloudinary secrets/config on server. Avoid pretending a direct unsigned cloud upload route exists.
- Forgot-password OTP: backend sends via Gmail SMTP; frontend shows request form, 6-digit input, reset form, expiry/retry feedback. Do not embed SMTP/Redis secrets.
- Realtime: use existing `/ws` STOMP/SockJS endpoint and approved destinations (`/topic/kitchen/orders`, `/topic/session/{sessionId}/orders`, `/topic/tables`, `/user/queue/notifications`) according to backend subscription permissions. Restore subscriptions on reconnect; clean up on unmount/logout.
- Charts: Recharts only when backend supplies reliable data; never synthesize revenue or cost KPIs.

## 6. Feature Ownership and Manual Verification

Use `TASKS.md` and `SCREEN_SPEC.md`. BINH-DEV owns Login and Ordering/Kitchen UI. QUANG owns forgotten/reset-password, users, tables/sessions and assistant UI. Feature members should coordinate integration before modifying shared auth, cart or navigation contracts.

**Current testing approach:** review rendered UI, manually test navigation, role access, loading/empty/error feedback, and real API interactions (including `409` conflicts), plus responsive/device checks. Do **not** prescribe automated E2E frameworks, E2E pipelines, or a test for each UI component now. Any future automated testing must be separately requested.

## 7. Decision Boundaries

Before implementing each screen, inspect actual backend routes/DTOs. If a contract is missing, mark blocked/partial rather than inventing endpoints, mock data as production behavior or frontend-only authority. Do not infer new statuses, features or schema from outdated mockups.
