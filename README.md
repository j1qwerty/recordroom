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

## Run it locally

Two servers, two fixed ports. The frontend works alone; the API is only needed
for `http` mode.

### 0. Prerequisites (once)

- Node.js 22+ and pnpm 10.15.0 — `corepack enable && corepack prepare pnpm@10.15.0 --activate`
- .NET 10 SDK
- SQL Server Express or Developer on `localhost`

The API's default connection string is `Server=localhost;…;Trusted_Connection=True`,
which does **not** resolve LocalDB — it needs a real instance listening on the
machine. SQL Server installs as a service called `MSSQLSERVER` and does **not**
start on boot, so on a fresh machine:

```powershell
# from an Administrator PowerShell — a normal shell gets "Access is denied"
Start-Service MSSQLSERVER      # or: net start MSSQLSERVER
```

Check it without starting anything: `Get-Service MSSQLSERVER`. If it reports
`Stopped`, the API will boot but `/api/health` will report the database as
unreachable — it does not crash on an unreachable database, so a green console
does not mean the database is up.

First boot of the API creates the `RecordRoom` database, applies the EF migrations
and seeds the demo dataset, so there is no manual SQL step.

### 1. API — terminal 1

```powershell
cd dotnet-api/src/RecordRoom.Api
dotnet run --urls http://localhost:5199
```

- Health: <http://localhost:5199/api/health>
- Swagger: <http://localhost:5199/swagger/>

`--urls` is required. There is no `launchSettings.json` in this project, so a bare
`dotnet run` binds the default port 5000 instead and the frontend will not find it.

### 2. Frontend — terminal 2

```powershell
cd record-room-frontend
pnpm install
pnpm dev                       # http://localhost:5173
```

The port is `strictPort`, so a busy 5173 fails loudly rather than silently moving.

### 3. Pick the data source

With no `.env` file at all the app runs in `local` mode against the in-memory
adapter and needs no backend. To use the API instead:

```powershell
copy .env.example .env.local    # set VITE_API_MODE=http
```

Keep `VITE_API_BASE_URL=http://localhost:5199`, then **restart `pnpm dev`** — Vite
only reads env files at startup. Cross-origin works out of the box because the
API's default `Cors:AllowedOrigins` is already `http://localhost:5173`.

| | `local` (default) | `http` |
| --- | --- | --- |
| Backend needed | no | yes |
| Data | `src/data/mock.ts`, persisted to `localStorage` | SQL Server via the API |
| Business rules enforced by | the in-memory adapter | the API |
| Admin password | `demo1234` | `Demo@12345` |

⚠️ **The demo password differs by mode, and this trips people up.** The in-memory
adapter seeds `demo1234` (`record-room-frontend/src/services/impl/auth.ts:17`)
while the API seeder uses `Demo@12345`
(`dotnet-api/src/RecordRoom.Api/Infrastructure/Data/DatabaseSeeder.cs:14`). Neither
is a mistake — they are two separate seed paths — but flipping `.env.local` to
`http` will make the password you were just given stop working.

Logins in both modes: `admin`, `supervisor`, `operator`, `employee`, plus
`deputy.ceo` (deactivated, to exercise the refusal path). Mobile PIN is `1234`.

### Optional: one origin instead of two

`vite.config.ts` proxies `/api` and `/hubs` when `RR_API_PROXY` is set, which keeps
the browser on `http://localhost:5173` and sidesteps CORS entirely — useful when
pointing at a deployed API:

```powershell
$env:RR_API_PROXY = 'http://147.93.155.185:8083'
```

Pair it with an **empty** `VITE_API_BASE_URL`. `http/client.ts` falls back to
`http://localhost:5199` when that variable is undefined, so the proxy is bypassed
unless the variable is present and empty. Clear it with
`Remove-Item Env:RR_API_PROXY`.

## Frontend (the current build)

- Stack: React 19, TypeScript, Vite 7, Tailwind v4, Motion,
  `@chenglou/pretext`, TanStack Query (reserved for the API).
- **No Firebase.** This project does not use it (`AGENTS.md`); the dependency
  and the browser-side Firestore writer were removed. Inquiries and media links
  are served by `dotnet-api/` (`/api/inquiries`, `/api/media-links`).
- Data access goes through `src/services` — a typed service layer whose
  interfaces `dotnet-api/` implements. Pages never import the seed data directly.
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