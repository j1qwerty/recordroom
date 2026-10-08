# Record Room Software

Physical record management + digitization platform for ~25 lakh files: room
visualization, file registry, barcodes, issue/return, movement tracking,
digitization batches, reports, audit.

## Repository layout

| Path | Status |
|---|---|
| `record-room-frontend/` | Complete React + TypeScript frontend, API-backed in `http` mode |
| `jhs_digitization-og-php-app/` | Legacy CodeIgniter PHP app — reference-only, do not edit |
| `dotnet-api/` | .NET 10 + SQL Server backend implementing the frontend service contract |
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

## Legacy live project

Live CodeIgniter app on the Contabo VPS (bare IP + port, HTTP only):

- URL: `http://147.93.155.185:8080/`
- Login: `admin` / `admin123` (shown + pre-filled on the login screen)
- Deploy: `.\deploy-lagacy-recordroom.ps1` (add `-SkipConfirm` for CI)
- Web root: `/var/www/legacy-recordroom/html`, nginx site `legacy-recordroom`

## Modern app live project

React frontend + .NET 10 API on the same Contabo VPS (bare IP + port, HTTP
only — a bare IP cannot get a normal TLS certificate):

- Web: `http://147.93.155.185:8083/` (SPA served by nginx, calls same-origin `/api`)
- API health: `http://147.93.155.185:8083/api/health` (proxied to the API on `127.0.0.1:5006`)
- Swagger: `http://147.93.155.185:8083/swagger/`
- Login: `admin` / `Demo@12345` (also `supervisor`, `operator`, `employee`; mobile PIN `1234`)
- Deploy: `.\deploy-recordroom.ps1` — interactive menu `1` API only, `2` web only, `3` both
  (or `-Target api|web|both -SkipConfirm` for CI)
- VPS layout: web root `/var/www/recordroom/html`, API `/var/www/recordroom/app`
  (systemd `recordroom-api`), env `/etc/recordroom/recordroom.env`,
  nginx site `recordroom`, SQL Server database `RecordRoom` + login `recordroom_app`
- The API applies EF migrations and seeds the demo dataset on first boot.

## Roadmap

1. ~~Freeze `src/services/contracts.ts` as the API contract.~~ Done — `dotnet-api/`
   implements it and the frontend `http` adapter consumes it.
2. ~~Scaffold `dotnet-api/`~~ Done — .NET 10 + SQL Server, deployed live (see above).
   Remaining: harden for scale (persisted Hangfire storage, Redis cache, HTTPS
   via a domain).