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

Store palette in centralized CSS design tokens mapped to Tailwind semantic utilities. Never scatter hard-coded hex values through feature code. Core palette is fixed; exact muted/hover/border tokens can be derived consistently once in theme CSS after visual review. Ensure readable contrast, especially on pale blue.

## 2. Layout and Components

- Use one shared spacing scale (Tailwind), consistent radius/shadow and screen containers. Prefer white card surfaces on `background`; reserve `surface` for selected/highlight areas.
- Navigation should be consistent: Owner/Staff desktop sidebar, Kitchen high-visibility queue/KDS, Tablet touch-friendly menu/cart. Responsive: Owner/Staff desktop-first, Kitchen tablet-landscape/desktop, Customer tablet portrait/landscape, Login mobile/tablet/desktop.
- Use shared shadcn `Button`, `Input`, `Card`, `Dialog`, `Sheet`, `Table`, `Tabs`, `Select` as needed, not bespoke copies in each feature. Use Lucide icons only unless explicitly approved.
- Typography: **Be Vietnam Pro** recommended for Vietnamese UI if chosen/available; acceptable fallback `Inter, system-ui, sans-serif`. Font choice should be consolidated once in theme; no component-scoped arbitrary font imports.
- Tables/lists require empty/loading/error UX, readable filters and visible pagination when backend supports it.
- Forms: labels, helper/error feedback, required indicators, focus rings and keyboard operability. Use React Hook Form + Zod on complex forms.
- Tablet: touch controls and photo cards must be comfortable to tap; no hover-only critical actions.

## 3. Semantic Status Colors (Separate from Brand)

Use accessible, consistent tokens (final shades defined centrally) and **always display the state label/icon**, not color alone.

| State | Meaning / UI approach |
|---|---|
| Order `PENDING` | Amber/yellow + “Chờ tiếp nhận” |
| Order / Item `COOKING` | Blue + “Đang chế biến” |
| Item `READY` | Green/teal + “Sẵn sàng” (Order never READY) |
| Order / Item `COMPLETED` | Green + “Hoàn thành” |
| Order / Item `CANCELLED` | Red/neutral + “Đã hủy” |
| Low / Out of stock | Amber / red respectively + text |

Backend enums remain English. Status colors must not imply unsupported steps (such as order REJECTED or payment PAID).

## 4. Mockup Policy

- `login.html`: **primary visual reference** for Login composition; adapt styles to the approved theme and real React functionality.
- Other old HTML mockups: **optional references**, potentially outdated in colors, UI components and BE capabilities; do not replicate blindly.
- Antigravity may design other screens creatively **within this design system**, based on `SCREEN_SPEC.md` and verified backend capabilities.
- Every member reviews and adjusts UI, API wiring, responsive behavior and user journeys manually before marking completion.

## 5. Consistency Checklist

Navy/Sky Blue tokens, Vietnamese text, shared UI primitives, correct status labeling, loading/empty/error states, mobile/tablet overflow review, proper keyboard/focus behavior, verified real API instead of invented mocks.
