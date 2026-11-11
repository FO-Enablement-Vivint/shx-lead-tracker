# shx-lead-tracker — Design Soul

Derived from the code on 2026-11-11. The app has **two separate visual systems**
that must not leak into each other:

- **Pro app** — light theme, Tailwind + shadcn/ui, tokens in `app/globals.css`
  as space-separated HSL triplets consumed as `hsl(var(--x))`.
- **Manager View** (`/manage`) — dark theme, plain semantic CSS in
  `src/manage/manage.css`, every selector scoped under `.manage`, variables
  prefixed `--m-`. It uses neither Tailwind utilities nor shadcn.

## Tokens

### Pro app (`app/globals.css`)

| Token | Value | Used in |
|---|---|---|
| `--background` | `220 14% 94%` | page background, app shells |
| `--foreground` | `222 47% 11%` | body text |
| `--card` | `0 0% 100%` | cards, popovers, mobile header and bottom nav |
| `--primary` | `145 50% 38%` | buttons, logo chip, active pills, links, focus ring |
| `--secondary` | `24 95% 53%` | secondary buttons and badges (orange) |
| `--accent` | `202 95% 46%` | ghost/outline button hover |
| `--muted` | `220 14% 89%` | empty-state circle, table header, hover |
| `--muted-foreground` | `220 9% 40%` | secondary text |
| `--destructive` | `0 84% 60%` | destructive buttons, error icons |
| `--border` | `220 13% 82%` | global borders, inputs |
| `--header-bg` | `150 35% 14%` | desktop sidebar |
| `--header-foreground` | `145 20% 95%` | sidebar text |
| `--header-muted` | `145 12% 55%` | inactive sidebar items |
| `--header-border` | `150 25% 22%` | sidebar borders, active item background |
| `--radius` | `0.5rem` | `rounded-lg`; `md` is radius - 2px, `sm` is radius - 4px |
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | body; Inter loads via an `@import` in `globals.css` |

Lead status colors are `--status-new` (blue), `--status-progress` (amber),
`--status-success` (green), `--status-closed` (red) and `--status-default`
(gray), applied through the `.badge-status-*` utilities from `statusColors.ts`.
Warning (proxy bar) uses `--warning-bg`, `--warning-border` and `--warning-text`.

### Manager View (`src/manage/manage.css`)

| Token | Value | Used in |
|---|---|---|
| `--m-bg` | `hsl(222 18% 7%)` | page background |
| `--m-surface` | `hsl(222 14% 11%)` | cards, stats, table wrap, dialogs |
| `--m-surface-2` | `hsl(222 12% 14%)` | inputs and selects |
| `--m-border` | `hsl(220 13% 19%)` | default borders |
| `--m-text` | `hsl(220 20% 94%)` | body text |
| `--m-muted` | `hsl(220 9% 63%)` | secondary text, table headers |
| `--m-header-bg` | `hsl(150 35% 14%)` | sidebar and mobile header |
| `--m-header-text` | `hsl(145 20% 95%)` | sidebar text |
| `--m-header-border` | `hsl(150 25% 22%)` | sidebar borders |
| `--m-primary` | `hsl(145 55% 46%)` | buttons, links, active bar |
| `--m-on-primary` | `hsl(150 40% 7%)` | text on primary buttons (near-black) |
| `--m-brand` | `hsl(145 50% 38%)` | SHX logo chip; equals Pro `--primary` |
| `--m-danger` | `hsl(0 78% 68%)` | inline error text |
| `--m-radius` | `12px` | cards, dialogs (`--m-radius-sm` is 8px) |

Action-button tones are set per variant (`.btn-blue`, `.btn-cyan`, `.btn-amber`,
`.btn-orange`, `.btn-gray`, `.btn-red`) via `--m-fill`, `--m-tone` and
`--m-on-fill`; `.btn-danger` and `.btn-quiet` are separate. Base type is
14px/1.5 Inter; table headers are 11px uppercase.

**Brand mark:** `BRAND_GREEN = '#309159'` in `src/brandIcon.tsx` is hsl(145 50% 38%)
as hex; keep it equal to Pro `--primary`.

## Component Conventions

- **shadcn/ui lives in `packages/components/ui/*`**, imported as `@project/components/ui/...`; `cn()` is clsx + tailwind-merge.
- **Variants use cva.** Button: `default | destructive | outline | secondary | ghost | link`, sizes `default h-9 | sm h-8 | lg h-10 | icon`. Lead statuses bypass variants and use `getStatusColorWithHover(status)` → `.badge-status-*`.
- **Icons are `lucide-react`**, sized `h-4 w-4` (default), `h-3.5 w-3.5` (dense) or `h-5 w-5`.
- **Toasts are `sonner`**, mounted only in `App.tsx`, not under `/manage`.
- **Tables:** `@tanstack/react-table` in `LeadsTable.tsx`; sortable headers are ghost Buttons with `ArrowUpDown`, header cells are `text-xs font-semibold uppercase tracking-wide text-muted-foreground`.
- **Pro layout:** desktop (`md` and up) has the green `AppSidebar`; below `md` there is a sticky `MobileNav` header, a fixed bottom tab bar and a managers-only "More" sheet. Leads render as a table at `lg` and a card list below. Content needs `pb-20 md:pb-5` to clear the bottom nav.
- **Manager layout:** the sidebar is hidden below 768px in favor of a mobile header and tabs. Tables switch to cards through the `useCardMode` hook (overflow-driven with hysteresis), not a breakpoint; cells carry `data-label` for the card labels.
- **Manager View uses plain semantic classes** (`.card`, `.stat`, `.table-wrap`, `.muted`, `.error`, `.ok`, `.btn-sm`, `.btn-{color}`, `.m-dialog*`) and native `<dialog>.showModal()`, not Radix.
- **New CSS for the Manager View goes in `manage.css` under `.manage` with `--m-*` variables.**
- **Active tab lives in the URL hash** (`#tab=…`) so refresh and back work.

## Interaction Rules

- **Destructive actions always confirm.** Pro app: Radix `AlertDialog` with a destructive-styled action. Manager team actions: a native `<dialog>` that runs a **dry-run preview first**, then confirms with counts or names in the button label ("Assign N leads", "Offboard {name}"). Only irreversible Manager actions use `btn-danger` (Force Reclaim yes, stale Reclaim no).
- **Dialogs block dismissal while saving:** Cancel, × and Esc do nothing mid-save. Long Airtable-automation waits say so ("this waits for Airtable's automations, so it can take up to a minute").
- **Closing a lead requires a reason**, shown inline as "Close reason is required for this status".
- **Optimistic updates revert on failure** with a toast reading "Failed to update — reverting" or "…change was reverted".
- **Toast wording:** success is "<Thing> updated successfully", failure is "Failed to …".
- **Loading:** profile load is a spinning ring; data tabs use skeletons; refresh icons spin; buttons switch to progressive labels ("Assigning…", "Reverting…").
- **Empty states** are search-aware ("No leads found" vs "No leads available"); the Manager View uses a single full-width muted row.
- **Errors:** render crashes go to `RuntimeErrorFallback`; in-page failures use an `Alert` with Retry; the Manager View uses inline `.error` / `.ok` lines.
- **403 renders Access Denied** with the server's message verbatim; the server is the gate and the screen only explains it.
- **Self-Gen attachment failures** keep the logged activity and show a "Retry upload" banner instead of failing the whole save.
- **Search is debounced** (500 ms on Leads and Closed; 400 ms on Unassigned).
- **Proxy mode is always visible:** an amber "Proxy Mode — viewing as …" bar with an Exit button.

## Known drift (not yet fixed)

- `--header-muted` is `145 12% 55%` in Pro but `--m-header-muted` is `145 12% 62%` in the Manager View, with no comment saying whether that is intentional contrast.
- `.dark` in `globals.css` mirrors the light values and no `ThemeProvider` exists, so there is no real theme switching.
- The Admin page uses `window.confirm` instead of the dialog pattern above.
- The Manager View's font depends on Inter loading from the Pro stylesheet's `@import`.
- Several unrelated reds exist (`--destructive`, `--status-closed`, `--m-danger`, `.btn-danger`, `.btn-red`) with no single danger token.

## Decisions

### The Manager View is a separate, scoped dark theme — 2026-11-11
- **Context:** Managers need dense admin tables and dialogs that the Pro app's light shadcn theme does not suit, and both live in one Next.js app sharing one global stylesheet.
- **Decision:** Build the Manager View with its own CSS file scoped under `.manage` and `--m-*` variables, without Tailwind utilities or shadcn.
- **Why:** Scoping lets the two themes coexist without restyling each other. The cost: shadcn/Radix components rendered in portals (sheet, dropdown, select) land on `body`, outside `.manage`, so adding one to the Manager View would render light-themed.
