# AGENTS.md

## Scope order

1. Finalize `record-room-frontend/` first (mock-first, no backend dependency).
2. Only then create `dotnet-api/` (planned .NET 10 API + SQL Server) on root.
3. `jhs_digitization-og-php-app/` is the legacy working app — **reference-only, never edit**. For any feature doubt (frontend or future dotnet), read it before implementing. (A nested byte-identical duplicate `jhs_digitization-og-php-app/jhs_digitization/` was removed; the outer copy is canonical.)

## Legacy reference (when in doubt)

- Auth/roles/employees/digitization/uploads/reports: `jhs_digitization-og-php-app/application/controllers/User.php` + `application/models/User_model.php`
- File registry + barcode uniqueness: `application/controllers/File.php`, `application/models/File_model.php`
- Issue/return (single + multi-file): `application/controllers/Record.php`, `application/models/Record_model.php`
- Location hierarchy room→section→almirah→shelf + active/inactive guards: `application/controllers/Store.php`, `application/models/Store_model.php`
- Schema: `jhs_digitization-og-php-app/jhs_digitization_db (1).sql` (`file_tbl`, `issue_file_tbl`, `upload_file`, `room_tbl`, `section_tbl`, `almirah_tbl`, `shelf_tbl`, `activity_log_tbl`)
- Full gap analysis: `docs/LEGACY-GAP-REPORT.md`

## Ask-first rule

Firebase is not used in this project — do not introduce it (no Firestore, no Firebase SDK, no `VITE_FIREBASE_*` vars). Persistence for inquiries/media waits for `dotnet-api/`.
If an admin panel for contact/inquiry-type data was not explicitly requested, **ask the user first** before adding one. Never silently add it.

## Frontend setup (`record-room-frontend/`)

- Requires Node.js 22+, pnpm 10.15.0: `corepack enable && corepack prepare pnpm@10.15.0 --activate`
- `pnpm install`, `pnpm dev` (port 5173, `strictPort: true`)
- All commands run from `record-room-frontend/`. pnpm is mandatory — no npm fallback locally.

## Verify (CI order, `.github/workflows/ci.yml`)

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

## Boundaries that agents get wrong

- Mock data (`src/data/mock.ts`: 2 rooms, 6 files) stands in for ~25 lakh records. Keep the `Showing 1-6 of 2,478,450`-style labels honest; real pagination/sort/filter belongs to the future API, not the browser.
- No Firebase: existing `src/lib/firebase.ts` / `src/services/firestore.ts` are unused — do not wire, extend, or add env vars for them. Inquiry/media pages stay demo/local-only until `dotnet-api/` provides real endpoints.
- Image URLs: validate in-browser (`Image.onload` preview must succeed before accept); reject unsafe protocols; handle broken/changed URLs.
- New admin code goes under `src/admin/` with its own layout; UI hiding is not authorization.
- Local workflow: git commit at every significant step, conventional messages. No ZIP deliverables.
