# Record Room frontend

Frontend-first build of the Record Room Software digitization platform. The
app is complete against the scope in `docs/LEGACY-GAP-REPORT.md`: every legacy
workflow that had a frontend gap now has a working screen, backed by a typed
service layer instead of hardcoded mock arrays.

## Stack

React 19 · TypeScript · Vite 7 · Tailwind CSS v4 · Motion ·
`@chenglou/pretext` · TanStack Query (reserved for the API) · Phosphor icons.

No backend dependency. No Firebase — see `AGENTS.md`.

## Architecture

```
src/
  types/          domain types mirroring the legacy SQL schema
  data/mock.ts    seed dataset only (2 rooms, 3 sections each, 14 files)
  services/       the data layer — pages never import src/data
    contracts.ts  interfaces = the future .NET 10 API surface
    store.ts      single serialisable snapshot + localStorage + subscriptions
    permissions.ts role → capability matrix (UX gating only)
    impl/         one module per aggregate, all guards live here
  hooks/          useDb / useService / useSession React bindings
  layouts/        AppShell, Topbar, Sidebar, RouteGuards
  admin/          administration routes with their own layout
  pages/          operational routes
  lib/            csv export, Code 128 encoder + payload grammar, utils
```

`src/services` is the seam. Replacing the in-memory adapter with `fetch`
against `dotnet-api/` touches that folder and nothing else.

## What is included

- Sign-in as one of the four legacy roles, with a user name and either a
  password or a 4-digit PIN. The PIN path (`match_pin`) is kept so an employee
  who has no password is never locked out; it is reached from the same screen
  via a toggle, not a separate mode. Mobile OTP and password recovery remain
  implemented and API-tested but are not reachable from this screen. Every
  attempt, including failures, is written to the login history.
- Role-aware shell: four legacy roles (Admin, Supervisor, Operator, Employee)
  with a visible permission matrix and route guards.
- File registry with real filtering, sorting, paging and CSV export, kept
  honest about the ~25 lakh rows the browser does not hold.
- File creation with the legacy guards: unique barcode, shelf must exist and be
  active, area must be a known master area, position in range.
- Multi-file issue desk with a borrower list, and a return desk that supports
  partial returns with a recorded condition.
- Movement log fed by the same writes that change the data.
- Room → section → almirah → shelf hierarchy, with the legacy parent-removal
  and status guards, shelf barcodes and layout revision history.
- Employee registry and employee-linked digitization batches with per-page
  versioning, duplicate-page handling, approve/reject and bulk staging.
- Maps and file-copy uploads with version supersession.
- Bulk CSV ingest validated against the registry before commit.
- Barcode centre with a real Code 128 encoder, QR sticker payloads, a print
  queue and a scan-validation page.
- Reports that build real rows from the service collections and export CSV,
  recording the export on the audit trail.
- Audit log with actor, role, IP and before/after state, plus login history.
- Room explorer, SVG room map, shelf drill-down, dark mode, reduced-motion
  path, route-level code splitting.

## Scope boundary

SQL Server, SQLite, object storage, OCR, real authentication, server-side
authorization and AI search are documented in `docs/` but not shipped here.
The permission matrix in `src/services/permissions.ts` hides controls; it is
not authorization. `docs/SECURITY.md` requires the backend to re-check every
capability.

## Prerequisites

- Node.js 22+
- pnpm 10.15.0 (pinned in `package.json`)

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm --version
```

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:5173, strictPort
pnpm format     # src, scripts, public and root configs
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
pnpm clean
```

Run the verify chain in CI order: `format:check → lint → typecheck → test →
build`. To format one path: `pnpm format src/pages/IssuePage.tsx`.

## Tests

`pnpm test` runs Vitest in a Node environment and covers the Code 128 encoder
and payload grammar, the CSV writer, and every service guard (file validation,
multi-file issue and partial return, location hierarchy guards, digitization
versioning, bulk classification, auth, reports).

## Demo accounts

All accounts use the password `demo1234` (the PIN flow uses `1234`):

| User name | Role | Can |
|---|---|---|
| `admin` | Admin | everything |
| `supervisor` | Supervisor | approve digitization, edit locations and employees |
| `operator` | Operator | run the issue, return and scanning desks |
| `employee` | Employee | read-only |

## Local data

Changes persist in `localStorage` under `rr-db-v1`. Settings → *Reset to seed
data* clears it.

## Netlify

`netlify.toml` sets `pnpm build`, publishes `dist` and falls back to
`/index.html`. No environment variables are required.

## Design direction

Government/professional interface: cool greys, a muted teal accent, a dark
slate mode, restrained functional motion. No pure black, no glassmorphism, no
neon gradients. Informed by
[taste-skill](https://github.com/Leonxlnx/taste-skill); see
`docs/skills/design.md`.

## Next step

Freeze the contracts in `src/services/contracts.ts` and implement the .NET 10
API against them, then swap the adapter.