# AGENTS.md

## Scope order

1. `record-room-frontend/` and `dotnet-api/` now both exist and are wired together. The frontend runs standalone against its in-memory adapter; `dotnet-api/` is the real backend.
2. `jhs_digitization-og-php-app/` is the legacy working app — **reference-only, never edit**. For any feature doubt, read it before changing either modern project. (A nested byte-identical duplicate `jhs_digitization-og-php-app/jhs_digitization/` was removed; the outer copy is canonical.)

## Legacy reference (when in doubt)

- Auth/roles/employees/digitization/uploads/reports: `jhs_digitization-og-php-app/application/controllers/User.php` + `application/models/User_model.php`
- File registry + barcode uniqueness: `application/controllers/File.php`, `application/models/File_model.php`
- Issue/return (single + multi-file): `application/controllers/Record.php`, `application/models/Record_model.php`
- Location hierarchy room→section→almirah→shelf + active/inactive guards: `application/controllers/Store.php`, `application/models/Store_model.php`
- Schema: `jhs_digitization-og-php-app/jhs_digitization_db (1).sql` (`file_tbl`, `issue_file_tbl`, `upload_file`, `room_tbl`, `section_tbl`, `almirah_tbl`, `shelf_tbl`, `activity_log_tbl`)
- Full gap analysis: `docs/LEGACY-GAP-REPORT.md`

## Ask-first rule

Firebase is not used in this project - do not introduce it (no Firestore, no Firebase SDK, no `VITE_FIREBASE_*` vars). The dependency, `src/lib/firebase.ts` and `src/services/firestore.ts` have been removed. Inquiries and media links are served by `dotnet-api/`.

If an admin panel for contact/inquiry-type data was not explicitly requested, **ask the user first** before adding one. Never silently add it.

## Frontend setup (`record-room-frontend/`)

- Requires Node.js 22+, pnpm 10.15.0: `corepack enable && corepack prepare pnpm@10.15.0 --activate`
- `pnpm install`, `pnpm dev` (port 5173, `strictPort: true`)
- All commands run from `record-room-frontend/`. pnpm is mandatory — no npm fallback locally.
- Defaults to the in-memory adapter. To run against the API, copy `.env.example` to `.env.local` and set `VITE_API_MODE=http`.

## API setup (`dotnet-api/`)

- Requires .NET 10 SDK and a reachable SQL Server. See `dotnet-api/README.md`.
- `cd src/RecordRoom.Api && dotnet run --urls http://localhost:5199`
- Applies EF migrations and seeds the demo dataset if the registry is empty.
- Tests: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\test-api.ps1` (142 assertions, no browser). Plus `dotnet test` for the pure-logic unit tests.

## Verify

### Frontend, in this order

```
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- `pnpm format <path>` formats one file/dir; bare `pnpm format` formats `src scripts docs public` + configs. Prettier: single-quote, semicolons, 100-col.
- `pnpm test` = `vitest run` (node env); single test: `pnpm vitest run tests/utils.test.ts`. `pnpm clean` removes build output.
- ESLint: `@typescript-eslint/no-explicit-any` is `error` — do not introduce `any`.
- `tests/api-contract.test.ts` runs the frontend adapter against a live API and **skips itself when the API is not reachable**. Start the API first to get its 19 assertions.

### API

```
dotnet build
dotnet test
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\test-api.ps1
```

## Boundaries that agents get wrong

- The service contract (`src/services/contracts.ts`) is **asynchronous**. Every method returns a `Promise`. Reads must go through `useQuery` in `src/hooks/useService.ts`; never derive rows from a synchronous snapshot.
- `useQuery` derives `loading` from a request key and discards responses whose deps changed. Do not re-implement that inline in a page, and do not call `setState` synchronously in an effect — the React lint rules reject both.
- Two implementations satisfy the contract: `src/services/impl/` (in-memory, seeded from `src/data/mock.ts`) and `src/services/http/` (the API). `VITE_API_MODE` selects one and defaults to `local`.
- Business rules and guards belong in exactly one place: the API when `VITE_API_MODE=http`, the in-memory adapter when `local`. Do not duplicate a guard into a page.
- Mock data (`src/data/mock.ts`: 3 rooms, sections, 14 files) stands in for ~25 lakh records. Keep `Showing 1-14 of 2,478,450`-style labels honest. Under `http` the figure comes from the API as `Page.collectionTotal`; under `local` it is the `REGISTRY_TOTAL` fallback.
- `useDb()` returns the **local** snapshot and is empty under the HTTP adapter. If a page needs a real number or row, read it from a service.
- Image URLs: validate in-browser (`Image.onload` preview must succeed before accept); reject unsafe protocols; handle broken/changed URLs.
- New admin code goes under `src/admin/` with its own layout. UI hiding is not authorization — `src/services/permissions.ts` is UX gating only, and `[Authorize(Roles = ...)]` in `dotnet-api/` is the boundary.
- The permission matrix on `/admin/users` is **read-only in v1 — do not add editing unless the user asks.** The four role lists are hardcoded in `services/permissions.ts` and hand-duplicated in `AuthService.PermissionsForRole`. Note that as of v1 the API authorizes on role *name* only and never enforces that list. The v2 design (DB-backed table, permission policies replacing `[Authorize(Roles = ...)]`, Admin row locked) is `docs/V2-EDITABLE-PERMISSIONS.md`.
- Local workflow: git commit at every significant step, conventional messages. No ZIP deliverables.

## Contract seam

`record-room-frontend/src/services/contracts.ts` is the shared contract. `dotnet-api/` implements it as HTTP endpoints, and `src/services/http/` adapts those endpoints back to the frontend types. When either side changes:

1. Change the contract.
2. Change both implementations in the same commit.
3. `tests/api-contract.test.ts` and `dotnet-api/scripts/test-api.ps1` should both still pass.

Status strings cross the wire as words (`"Partially returned"`, `"Under Digitization"`), not enum names. `dotnet-api/src/RecordRoom.Api/Application/Display.cs` owns that mapping and must round-trip, since the UI filters by the same string it renders.