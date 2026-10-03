# Legacy vs Frontend gap report

Source: `jhs_digitization-og-php-app/application/{controllers/{User,File,Record,Store,Employee_reports}.php,models/*.php,views/*.php}` + `jhs_digitization_db (1).sql` vs `record-room-frontend/src/{pages/*,data/mock.ts,services/firestore.ts}`. Legacy is reference-only — never edit it.

## Missing in frontend (legacy has it, mock-first TODO)

- [ ] Auth + sessions + roles: login/logout, `drm_login` roles, OTP/PIN + forgot-password/recover, `login_history` (legacy `User.php: login_process/check_logg/logout`, `forgotpassword/enterotp/otpsubmit/recoverpassword`, `Employee_reports: match_otp/match_pin`). Frontend has zero login; `UsersPage`/`SettingsPage` are static.
- [ ] Employee registry + employee-linked digitization: employee CRUD/search/pagination, per-employee folders `uploads/<empcode>/{service_book,leave_report,sr,apar}/` with `pageno+version` + duplicate-page check + approve/reject + bulk flag (legacy `User.php: employee/uploadservice*/upload_*`, `User_model.php`). Frontend digitization batches (`041/040/039`) are hardcoded, no employee link, no versioning.
- [ ] `section` hierarchy level: legacy is room→section→almirah→shelf with barcode/status guards (`Store.php`, `Store_model.php: checkRoomSectionAvail/checkSectionAlmirahAvail/...`). Frontend models room→unit→shelf only; `LocationsAdminPage` add/save/delete are no-ops, no guards, no history.
- [ ] File create validation: shelf-barcode must exist/active, `file_barcode` unique AJAX check, pincode/area lookup (legacy `File.php: checkfilebarcode/checkShelfBarcode/getpincode`). `NewFilePage` only fakes an RF-ID + CSS barcode, no validation.
- [ ] Multi-file issue + borrower tracking: legacy `Record.php: multipleFileIssue/savemultipleissuefile/borrow_list/returnfilelist`, `issue_file_tbl`, Available↔Issued flips. Frontend `IssuePage`/`ReturnPage` are single-file local banners; `MovementPage` rows are hardcoded.
- [ ] Map + file-copy uploads: `upload_map` / `upload_file` tables, `uploadfile/upload_map/viewmap/viewfilecopy` views. No equivalent page in frontend.
- [ ] Reports as real exports: login-history/detail-login/audit/document/SR-LR-APAR/mobile-registration/OTP/no-update-vs-update Excel exports (`User.php: *ExcelFile/*updatereportexcel*`). `ReportsPage` buttons are dead; `AuditPage` has 4 static rows, no actor/IP/before-after.
- [ ] PDF stitching of scanned images (`User::generate_pdf`, `fpdf_test.php`). `FileDetailPage` digital-document slot is placeholder text; Print/Download are no-ops.
- [ ] Barcode payload service: real Code128/QR payloads, scan-validation endpoint, print queue, reprint audit. `BarcodesPage` preview/print are no-ops with CSS bars.
- [ ] Bulk ingest: `bulk_upload` view + `rename_files_folders/renaming_process` + `bulk/Temp00432|Temp00433/` staging. `FilesPage` Bulk-import is a dummy button.
- [ ] Dashboard search + counts from data: `search_dashboard_file`, last-five pagination. `DashboardPage` stat cards (2,478,450 / 96.8% / 148 / 64.2%) and events are hardcoded against 6 mock rows.

## New in frontend (legacy lacks it — keep)

- Visual room explorer: SVG `RoomMap` + `ShelfView`, occupancy bars, proportional positions (`RoomsPage`, `RoomDetailPage`, `components/RoomMap.tsx`).
- Global search UX + masonry knowledge surface (`SearchPage`, `PretextMasonry` via `@chenglou/pretext`).
- File detail with shelf-position guidance + location history affordance (`FileDetailPage`).
- Location designer surface, capacity planning, reports/audit/settings/support shells (`LocationsAdminPage`, `ReportsPage`, `AuditPage`, `SettingsPage`, `MediaPage`, `SupportPage`).
- Dark mode (grey-blue, not pure black), reduced-motion path, responsive sidebar→drawer, back-to-top, empty/loading/error states per spec.
- Firestore boundary done right: env-gated init, `inquiries` + `mediaAssets` only, `Image.onload` URL validation before save, demo-mode fallback (`src/lib/firebase.ts`, `src/services/firestore.ts`).
- Production wiring: pnpm 10.15 + Node 22, `format:check → lint → typecheck → test → build` CI, Netlify SPA fallback (`netlify.toml` + `public/_redirects`), `no-explicit-any` lint gate.

## TODO order (frontend-first, mock-first)

1. Auth shell (mock roles) + route structure; real OIDC/RBAC waits for `dotnet-api/`.
2. Employee entity + link digitization batches to employees with page-version list + approve/reject states.
3. Add `section` level to types/mock/room views + shelf-occupancy guards in location admin.
4. File-create validation (unique barcode, shelf must exist/active) against mock registry.
5. Multi-file issue flow + borrower list + return list, still local state.
6. Reports/audit from mock event log (actor, timestamp, before/after) with CSV export first, Excel/PDF later.
7. Barcode payload format doc + printable labels; scan-validation stub ready for API swap.
8. Freeze contracts → scaffold `dotnet-api/` per `docs/ARCHITECTURE.md` + `docs/DATA-MODEL.md`.
