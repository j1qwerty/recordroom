# UI redesign notes

Frontend-only change. `src/services/` contracts, the .NET API and the data model are untouched.

## What changed
- **Login** – web sign-in only (user name + password). OTP, PIN and OTP-reset removed from the UI.
- **Shell** – dark navigation rail grouped by task, top bar with working search (`/` focuses it),
  account menu, phone bottom tab bar (Home / Files / Scan / Issue / More).
- **Dashboard** – search first, "Start a task" shortcuts (role-aware), "Needs attention" queue
  (overdue, due, missing, pending review), summary tiles, room occupancy bars, recent movement.
- **Files** – tabs (All / Files / Maps), status chips, collapsible filters, table on desktop and
  cards on phones. Per-row: View file, Upload file, View map, Upload map, Move, and a More menu
  (details, copy barcode, show room, print label). Buttons a role cannot use are hidden.
- **Maps** – new top-level `/maps` page (also still at `/admin/maps`): search, view, new version,
  remove, and an "Upload map" flow (find file, then choose scan).
- **Foundations** – new tokens (`styles/global.css`), Public Sans + IBM Plex Mono, modals become
  bottom sheets on phones, 16px inputs on phones (no iOS zoom).

## Bug fixes found on the way
- Global resets (`button { font }`, `a { color }`) were unlayered and overrode Tailwind utilities
  (link buttons had dark text, buttons lost their weight). They now live in `@layer base`.
- `bg-accent`, `text-danger`, `bg-surface-muted` etc. were used but undefined; now mapped to tokens.
- Local adapter: first map upload no longer creates a phantom placeholder version.

## New files
`src/components/files/*`, `src/components/ShelfSpines.tsx`, `src/layouts/MobileTabBar.tsx`.

Fonts load from Google Fonts; offline, system fallbacks are used.
Run: `pnpm install && pnpm dev` (Node 22, pnpm 10.15).
