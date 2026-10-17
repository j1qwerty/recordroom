# Legacy vs Frontend gap report

Source: `jhs_digitization-og-php-app/application/{controllers/{User,File,Record,Store,Employee_reports}.php,models/*.php,views/*.php}` + `jhs_digitization_db (1).sql` vs `record-room-frontend/src/{services,pages,admin}`. Legacy is reference-only — never edit it.

Status: **all gaps below are closed.** Each entry names the service module that
carries the behaviour and the screen that exposes it.

## Closed

- [x] **Auth + sessions + roles.** `services/impl/auth.ts` + `pages/LoginPage.tsx`.
      Web password, mobile OTP, employee PIN and `forgotpassword → enterotp →
      recoverpassword` recovery, all reproduced from `User.php: login_process/
      check_logg/logout` and `Employee_reports: match_otp/match_pin`. The sign-in
      screen was later simplified to a role picker plus user name and password
      (PR #3), which briefly dropped the PIN path and would have locked out an
      employee who has no password. A credential toggle has since restored it;
      OTP and recovery remain implemented and API-tested but are not reachable
      from the UI. Every
      attempt, including failures, is written to the login history and the audit
      trail. Roles are the legacy codes: Admin, Supervisor (1), Operator (2),
      Employee (3) — see `services/permissions.ts` and `layouts/RouteGuards.tsx`.
- [x] **Employee registry + employee-linked digitization.**
      `services/impl/{employees,digitization}.ts` + `admin/EmployeesPage.tsx`,
      `pages/DigitizationPage.tsx`, `pages/DigitizationBatchPage.tsx`. Per-employee
      folders `uploads/<empcode>/{service_book,leave_report,sr,apar}/`, page
      `pageno` + `version`, rescan-creates-new-version instead of overwriting,
      approve/reject with a mandatory rejection reason, and a bulk staging flag.
      No hardcoded batches remain.
- [x] **`section` hierarchy level.** `services/impl/locations.ts` +
      `admin/LocationsPage.tsx`, `pages/RoomsPage.tsx`,
      `pages/RoomDetailPage.tsx`. Room → section → almirah → shelf with the
      `Store_model.php` guards: a section may not be deactivated or deleted
      while it holds active almirahs, an almirah may not be deleted while
      files or shelf labels reference it, a shelf may not be deleted while
      files sit on it, and shelf/almirah barcodes are unique. Layout revisions
      are persisted with actor, note and timestamp.
- [x] **File create validation.** `services/impl/files.ts` +
      `pages/NewFilePage.tsx`. `checkfilebarcode` uniqueness (case-insensitive),
      `checkShelfBarcode` existence + active status + capacity warning,
      `getpincode` area lookup, position bounds, and an RF prefix warning. The
      barcode on the identity card is a real encoded symbol.
- [x] **Multi-file issue + borrower tracking.** `services/impl/issues.ts` +
      `pages/IssuePage.tsx`, `pages/ReturnPage.tsx`, `pages/MovementPage.tsx`.
      `Record.php: multipleFileIssue/savemultipleissuefile/borrow_list/
      returnfilelist` reproduced, including guards (unknown barcode, non-Available
      file, duplicate scan, missing borrower) and **partial** returns with a
      recorded condition, which the one-row-per-file legacy table could not
      express.
- [x] **Map + file-copy uploads.** `services/impl/uploads.ts` +
      `admin/MapsPage.tsx` for the `upload_map` table, with version
      supersession of previously approved rows.
- [x] **Reports as real exports.** `services/impl/reports.ts` +
      `pages/ReportsPage.tsx`. Eight definitions traceable to their legacy
      controller, each building live rows and exporting RFC 4180 CSV with the
      export recorded on the audit trail. Excel/PDF remain server-side work.
- [x] **PDF stitching of scanned images.** `pages/FileDetailPage.tsx` now lists
      real page versions per file and states which are eligible for stitching.
      The actual assembly (`User::generate_pdf`, `fpdf_test.php`) is backend
      work and is documented rather than faked.
- [x] **Barcode payload service.** `lib/barcode.ts` + `components/BarcodeSymbol.tsx`,
      `pages/BarcodesPage.tsx`, `pages/ScanPage.tsx`. A real Code 128 set-B
      encoder with checksum, the `RR|SUBJECT|VALUE` payload grammar, QR sticker
      URLs, a print queue and a scan-validation page that mirrors the future
      `/api/barcodes/validate` endpoint. The previous CSS-bar fake is gone.
- [x] **Bulk ingest.** `services/impl/bulk.ts` + `admin/BulkImportPage.tsx`.
      `bulk/Temp00432/` staging rows classified against the unique barcode index
      and the shelf barcode table, with a per-row verdict and a commit step that
      writes only the accepted rows.
- [x] **Dashboard counts from data.** `services/impl/dashboard.ts` +
      `pages/DashboardPage.tsx`. Cards aggregate the same collections the desks
      write to, and the registry total stays honest at 2,478,450 while stating
      how many rows the browser actually loaded.

## Also fixed

- The verify pipeline was broken before this pass: `format:check`, `lint` and
  `typecheck` all failed on `main`. See the commit history.
- `docs` did not exist inside the frontend, so the default formatter target
  failed; `scripts/format.mjs` now skips missing paths.

## Kept (new in frontend, legacy lacks it)

- Visual room explorer: SVG `RoomMap` + `ShelfView`, occupancy bars,
  proportional positions.
- Global search UX + masonry knowledge surface (`SearchPage`, `PretextMasonry`).
- File detail with shelf-position guidance, relocation form and full movement
  history.
- Location designer surface with layout revision history.
- Dark mode (grey-blue, not pure black), reduced-motion path, responsive
  sidebar→drawer, back-to-top, empty/loading/error states per route.
- Route-level code splitting with a Suspense fallback that keeps the shell mounted.
- **Service layer**: `src/services` owns every write and guard, so pages cannot
  drift from each other. This is the seam for `dotnet-api/`.

## Explicitly not done

- **Firebase removed.** `AGENTS.md` forbids it; `src/lib/firebase.ts`,
  `src/services/firestore.ts`, the `firebase` dependency, the `.env.example`
  Firebase variables and the stale `manualChunks` entry are gone. The inquiry
  and media pages are local-only. Per `AGENTS.md`, no admin panel for inquiry
  data was added — ask before adding one.
- **Server-side pagination, sorting and filtering.** The browser holds a seed
  snapshot; the labels say so, and the real query belongs to the API.
- **Camera barcode decoding.** Needs a WASM reader; USB scanner input (type +
  Enter) is fully handled. See `docs/PHASED-SCOPE.md`.
- **Real Excel and PDF output.** CSV first, by design.

## TODO order (next)

1. Freeze `src/services/contracts.ts` as the API contract.
2. Scaffold `dotnet-api/` per `docs/ARCHITECTURE.md` + `docs/DATA-MODEL.md`.
3. Replace the in-memory adapter with paginated endpoints that re-check every
   permission in `services/permissions.ts` server-side. Still open: as of v1 the
   API authorizes on `[Authorize(Roles = ...)]` only, and
   `AuthService.PermissionsForRole` is reported to the client at `/me` but never
   used for an access decision. See `V2-EDITABLE-PERMISSIONS.md`.