# ROMS Frontend — API Integration Conventions

**Scope:** Frontend consumption of the already approved Spring Boot contract. This document does not create new backend endpoints; inspect the actual backend source/OpenAPI/approved API docs before implementing feature calls.

## 1. Base Client and Response Model

- Central Axios instance with configurable `VITE_API_BASE_URL` (include `/api` only once, consistent with server configuration). Browser-exposed `VITE_*` variables must **never** hold private keys.
- HTTP JSON properties are camelCase; request/response TypeScript DTOs reflect server contracts. Use `ApiResponse<T>` for JSON responses and `PageResponse<T>` inside `data` for paginated lists; `204` returns **no body**.

```ts
export type ApiResponse<T> = {
  success: true;
  message: string;
  data: T;
};
export type ApiErrorResponse = {
  success: false;
  message: string;
  error: { code: string; details: unknown | null };
};
export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
```

These shapes model approved envelope behavior, **not** every endpoint's yet-unconfirmed payload. Avoid treating the response as a raw array.

## 2. Approved Authentication Routes

| Method | Endpoint | FE behavior |
|---|---|---|
| POST | `/api/auth/login` | Send username/password; receive `data.accessToken`; browser receives refresh HttpOnly cookie |
| POST | `/api/auth/refresh` | Send credentials cookie; get rotated access token and refresh cookie |
| POST | `/api/auth/logout` | Send bearer and relevant cookies, clear in-memory access state; expect `204` |
| GET | `/api/auth/me` | Send bearer; retrieve current profile and role/table context |

Token claims are `sub`, `role`, `sid`, `iat`, `exp`; FE treats JWT as a bearer credential, **not** source of table ownership. Tablet assignment is enforced from backend `users.table_id`. Refresh rehydration on load, single-flight 401 recovery, and retry-loop prevention are shared responsibilities.

## 3. HTTP / Error Handling

| Code | FE response |
|---|---|
| 400 | Show field errors from `error.details` or concise request feedback |
| 401 | Attempt one authorized refresh when appropriate; otherwise return to Login |
| 403 | Display access-denied/no-permission state |
| 404 | Show resource-not-found view |
| 409 | Explain current-state conflict; refetch relevant server data |
| 500/network | Show retryable failure; do not expose stack traces |

No false success toast or optimistic completion if backend rejected the operation. Use Sonner for transient feedback; show validation near fields.

## 4. Ordering/Inventory Contracts

- Use real backend menu/sellability and order endpoints only after checking exact DTOs. `available_quantity` is obsolete; show derived sellability, manual menu status and disabled/out-of-stock state.
- On Order creation, backend validates combined recipe requirements and deducts stock transactionally. `409` rejects entire order; retain cart for correction and refetch sellability. Never manually deduct inventory in browser.
- Order cancellations are PENDING-only; UI hides/disables impossible actions but still handles backend `409` if state changes concurrently. Backend restores stock where authorized.
- Kitchen accepts Order `PENDING → COOKING` without another stock deduction. Individual item status follows `PENDING → COOKING → READY → COMPLETED`. Overall Order has **no READY**.
- Stock movement history is append-only; signed `quantityChange` expresses additions/consumption/compensation; actual `currentStock` must never be negative.
- REST commands and committed server response drive TanStack Query cache invalidation; STOMP events are notifications, not writes.

## 5. Images and Password Recovery

- Image upload: send file to an **approved backend** upload contract; backend integrates Cloudinary and persists image URL/metadata. The upload endpoint, allowed MIME types, size limit, main-image selection and deletion behavior **require endpoint verification**. Do not invent them or expose Cloudinary private credentials.
- Password recovery: use backend-provided request/verify/reset endpoints **after confirming their actual DTOs**. Email OTP is 6 digits, TTL 5 minutes and max 5 failed attempts; all verification and counters are enforced in backend Redis. Display a generic request response that does not disclose whether an email account exists.

## 6. Pagination, Time and Query Keys

- Server pagination uses `page` (0-based), `size`, `sort`; keep filter state in URL where useful. Dates/times in ISO 8601; show restaurant-local readable presentation after timezone agreement.
- TanStack Query keys include resource identity, filters, session/table context. On mutation success or STOMP event, invalidate the affected keys. Do not cache backend private auth tokens or current inventory inside persistent client storage.
- When an endpoint is missing, document which exact interaction is blocked. Pure UI prototyping may use clearly flagged mock data, but never mark API integration complete on mocks.

## 7. Contract Coordination

For each implemented feature, document verified method/path, request/response DTO, authorization, success/error statuses, and post-mutation invalidation. No generated API paths based only on a screen name or old mockup. Payment/reservations/suppliers are out of scope; report revenue/profit definitions need backend confirmation.
