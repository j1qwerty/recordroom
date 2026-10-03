# Record Room Software

Physical record management + digitization platform for ~25 lakh files: room visualization, file registry, barcodes, issue/return, movement tracking, digitization batches, reports, audit.

## Repository layout

| Path | Status |
|---|---|
| `record-room-frontend/` | Active React + TypeScript + Vite frontend (frontend-first phase, mock data) |
| `jhs_digitization-og-php-app/` | Legacy CodeIgniter PHP app — reference-only, do not edit |
| `dotnet-api/` | Planned .NET 10 backend (does not exist yet; build only after frontend is finalized) |
| `docs/` | PRD, scope, architecture, data model, frontend spec, QA, security, gap report |

## Where to start

1. `docs/PRD.md`, `docs/PROJECT-SCOPE.md`, `docs/CLARIFICATIONS.md`
2. `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `docs/FRONTEND-SPEC.md`
3. `docs/LEGACY-GAP-REPORT.md` — legacy-vs-frontend feature audit + TODO
4. `docs/IMPLEMENTATION-TODO.md`, `docs/QA.md`, `docs/SECURITY.md`
5. Design system: `docs/skills/design.md`; workflow prefs: `docs/skills/react-pnpm-skill (1).md`

## Frontend (the current build)

- Stack: React 19, TypeScript, Vite 7, Tailwind v4, Motion, `@chenglou/pretext` masonry, TanStack Query (installed for future API use), Firebase (env-gated, `inquiries` + `mediaAssets` only).
- Routes: `/` dashboard, `/search`, `/rooms`, `/rooms/:roomId`, `/files`, `/files/new`, `/files/:fileId`, `/issue`, `/return`, `/movement`, `/barcodes`, `/digitization`, `/digitization/:batchId`, `/reports`, `/admin/users`, `/admin/locations`, `/admin/audit`, `/admin/media`, `/settings`, `/support`.
- Mock data in `src/data/mock.ts` (2 rooms, 6 files) stands in for the full collection; `src/services/firestore.ts` degrades to demo mode without env vars.
- Setup: needs Node 22 + pnpm 10.15.0 — `corepack enable && corepack prepare pnpm@10.15.0 --activate && pnpm install && pnpm dev`. Full command/verify reference lives in `AGENTS.md` (single source of truth, not repeated here).
- Deploy: Netlify (`netlify.toml`, `pnpm build` → `dist`, SPA fallback to `/index.html`); Firebase vars set in Netlify site config.

## Legacy app

`jhs_digitization-og-php-app/` is the original CodeIgniter 3 system (auth, employee/digitization uploads with page-versioning, file registry with barcode checks, room→section→almirah→shelf hierarchy, single + multi-file issue/return, reports/Excel exports, PDF stitching, OTP mobile API, ~14k `file_tbl` rows in the shipped SQL dump). Keep it untouched; consult its controllers/models/SQL before re-implementing any behavior. Details in `docs/LEGACY-GAP-REPORT.md`.

## Roadmap

1. Close the frontend gaps in `docs/LEGACY-GAP-REPORT.md` (auth screens, employee-linked digitization, section level, multi-file issue, Excel/PDF exports, audit depth — all mock-first).
2. Freeze frontend contracts, then scaffold `dotnet-api/` per `docs/ARCHITECTURE.md` + `docs/DATA-MODEL.md` and replace mocks with paginated endpoints.
