# Record Room Software

Physical record management + digitization platform for ~25 lakh files: room
visualization, file registry, barcodes, issue/return, movement tracking,
digitization batches, reports, audit.

## Repository layout

| Path | Status |
|---|---|
| `record-room-frontend/` | Complete React + TypeScript frontend, mock-service backed |
| `jhs_digitization-og-php-app/` | Legacy CodeIgniter PHP app — reference-only, do not edit |
| `dotnet-api/` | Planned .NET 10 backend (does not exist yet; build only after frontend is finalized) |
| `docs/` | PRD, scope, architecture, data model, frontend spec, QA, security, gap report |

## Where to start

1. `docs/PRD.md`, `docs/PROJECT-SCOPE.md`, `docs/CLARIFICATIONS.md`
2. `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `docs/FRONTEND-SPEC.md`
3. `docs/LEGACY-GAP-REPORT.md` — legacy-vs-frontend feature audit and status
4. `docs/IMPLEMENTATION-TODO.md`, `docs/QA.md`, `docs/SECURITY.md`
5. Design system: `docs/skills/design.md`; workflow prefs: `docs/skills/react-pnpm-skill (1).md`

## Frontend (the current build)

- Stack: React 19, TypeScript, Vite 7, Tailwind v4, Motion,
  `@chenglou/pretext`, TanStack Query (reserved for the API).
- **No Firebase.** This project does not use it (`AGENTS.md`); the dependency
  and the browser-side Firestore writer were removed. Inquiry and media pages
  are local-only until `dotnet-api/` provides endpoints.
- Data access goes through `src/services` — a typed service layer whose
  interfaces mirror the future API. Pages never import the seed data directly.
  The in-memory adapter persists to `localStorage` and publishes to React on
  every write, so a change on the issue desk appears on the movement log, the
  audit trail and the dashboard in the same tick.
- Routes: `/login`, `/`, `/search`, `/rooms`, `/rooms/:roomId`, `/files`,
  `/files/new`, `/files/:fileId`, `/issue`, `/return`, `/movement`,
  `/barcodes`, `/scan`, `/digitization`, `/digitization/:batchId`, `/reports`,
  `/support`, `/settings`, and `/admin/{users,employees,locations,bulk-import,maps,media,audit}`
  under their own administration layout.
- Setup: Node 22 + pnpm 10.15.0 — `corepack enable && corepack prepare
  pnpm@10.15.0 --activate && pnpm install && pnpm dev`. Full command and
  verify reference lives in `AGENTS.md`.
- Deploy: Netlify (`netlify.toml`, `pnpm build` → `dist`, SPA fallback). No
  environment variables required.

## Legacy app

`jhs_digitization-og-php-app/` is the original CodeIgniter 3 system (auth,
employee/digitization uploads with page versioning, file registry with barcode
checks, room→section→almirah→shelf hierarchy, single + multi-file issue/return,
reports/Excel exports, PDF stitching, OTP mobile API, ~14k `file_tbl` rows in
the shipped SQL dump). Keep it untouched; consult its controllers, models and
SQL before re-implementing any behaviour. Details in
`docs/LEGACY-GAP-REPORT.md`.

## Roadmap

1. Freeze `src/services/contracts.ts` as the API contract.
2. Scaffold `dotnet-api/` per `docs/ARCHITECTURE.md` + `docs/DATA-MODEL.md` and
   replace the in-memory adapter with paginated, authorized endpoints. SQLite is
   the dev store; SQL Server is the production target.