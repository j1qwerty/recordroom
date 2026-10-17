# Record Room — feature inventory and roadmap

Inventory of what the platform **ships today (v1)** and what is **planned (v2)**,
with the library shortlist behind each v2 item.

- Verified against the repo working tree at `c24b2f3`.
- Every version below was read from the **NuGet / npm registry APIs**, not from
  blog posts or vendor marketing pages.
- Companion documents: `V2-EDITABLE-PERMISSIONS.md` (RBAC design),
  `PHASED-SCOPE.md` (product phases), `DATA-MODEL.md` (entities).

## Legend

| | |
|---|---|
| ✅ | Ships in v1 today |
| 🟡 | Partially built — the honest gap is stated |
| ➕ | v1 addition (small, ship in the current release) |
| 🔮 | v2 — planned, not built |
| ⚪ | Physical operation, deliberately not software |

---

# Part 1 — v1 (the current application)

## 1.1 What already ships

### Identity and access

| Feature | Where |
|---|---|
| Sign-in: role picker + user name + password | `pages/LoginPage.tsx` |
| Sign-in: 4-digit employee PIN (legacy `match_pin`), credential toggle | `pages/LoginPage.tsx` → `signInWithPin` |
| Four roles: Admin, Supervisor, Operator, Employee | `services/permissions.ts` |
| Route guards and permission-aware nav | `layouts/RouteGuards.tsx`, `Sidebar.tsx`, `AdminLayout.tsx` |
| Login history — every attempt including failures | `AuditLog`, `LoginHistory` |
| Mobile OTP + password recovery — **API-only, not reachable in the UI** | `api/auth/otp`, `api/auth/recovery` |

### Registry and physical record

| Feature | Where |
|---|---|
| File registry: filter, sort, page, honest `collectionTotal` | `pages/FilesPage.tsx`, `api/files` |
| CSV export from the registry and reports | `lib/csv` |
| File creation with legacy guards (unique barcode, shelf exists + active, known area, position in range) | `Application/Services/FilesService.cs` |
| File detail: relocate, e-office reference, movement trail, status | `pages/FileDetailPage.tsx` |
| Room → Section → Almirah → Shelf hierarchy with active/inactive and parent-removal guards | `api/locations`, `admin/LocationsPage.tsx` |
| Location designer + layout revision history | `api/locations/rooms/{id}/layout` |
| **Room creation** (audited, added in PR #3) | `POST /api/locations/rooms` |
| Shelf / almirah / section barcodes | `src/lib/barcode.ts` |

### Movement

| Feature | Where |
|---|---|
| Multi-file issue desk with borrower list | `pages/IssuePage.tsx`, `api/issues` |
| Return desk with **partial return** and recorded condition | `pages/ReturnPage.tsx` |
| Movement log derived from the same writes | `api/movements` |

### Digitisation (storage and workflow — **not** the scanning engine)

| Feature | Where |
|---|---|
| Employee-linked batches, one document folder each | `api/digitization` |
| Per-page versioning — a re-scan becomes the next version | `DigitizationPages` unique on (barcode, pageNo, version) |
| Duplicate-page handling, approve / reject review | `pages/DigitizationBatchPage.tsx` |
| Map and file-copy uploads with version supersession | `api/uploads`, `MapUploads` |
| Bulk CSV ingest, two-phase validate → commit | `api/bulk` |
| Document upload with signature + extension checks, 48 MiB cap | `PrivateDocumentStore` |
| **Encrypted at rest** (AES), token-gated byte access | `PrivateDocumentStore` |

### Barcodes, reports, admin

| Feature | Where |
|---|---|
| Real scannable **Code 128** encoder (not CSS gradients) | `src/lib/barcode.ts` |
| QR sticker payloads (`/scan?p=…`), print queue | `pages/BarcodesPage.tsx` |
| Scan-validation page resolving File/Shelf/Almirah/Section/Room/Area | `pages/ScanPage.tsx` |
| Reports catalogue, builds, overdue report, CSV export | `api/reports` |
| Dashboard aggregates | `api/dashboard` |
| Audit log with actor, role, IP, before/after | `api/audit` |
| Employees registry | `api/employees` |
| Users & roles, permission matrix (read-only) | `admin/UsersPage.tsx` |
| Inquiries + media links | `api/inquiries`, `api/media-links` |

### Shell and platform

| Feature | Where |
|---|---|
| Light / Blue / Dark themes, persisted | `AppShell.tsx`, `Topbar.tsx` |
| Ctrl/Cmd+K command palette, permission-filtered, debounced record search | `components/CommandPalette.tsx` |
| Dashboard redesigned around registry workflows, overdue items, room utilisation | `pages/DashboardPage.tsx` |
| Direct registry-row actions and deep links into upload / relocate panels | `pages/FilesPage.tsx` |
| SignalR realtime push, Hangfire recurring jobs, rate limiting | `Infrastructure/Realtime`, `Jobs`, `RateLimiting` |
| Route-level code splitting, Pinned sidebar, dark mode, reduced-motion path | `layouts/AppShell.tsx` |

**Verification state:** `dotnet build` 0 errors, `dotnet test` 112/112,
`test-api.ps1` 149/149, `pnpm test` 114/114 (with the API running).

---

## 1.2 Honest gaps in v1 — defects, not features

These are not roadmap items; they are things that are wrong or missing now.

| # | Gap | Impact |
|---|---|---|
| 1 | **The API does not enforce the permission matrix.** Authorization is `[Authorize(Roles = ...)]`; `PermissionsForRole` only feeds `/me`. | Revoking a permission changes the UI and nothing else. Design in `V2-EDITABLE-PERMISSIONS.md`. |
| 2 | **Search is non-sargable.** `f.Subject.ToLower().Contains(needle)` puts a function on the column, so `IX_Files_*` can never be used. | The registry degrades to a table scan as the collection grows toward ~25 lakh rows. |
| 3 | **No scan auto-submit.** Zero `onKeyDown` handlers exist; every scan depends on Enter reaching a form's `onSubmit`. | A real barcode gun works only if its trigger suffix is Enter, and there is no auto-advance on the multi-file issue desk. |
| 4 | **The `/` shortcut is decorative.** The Topbar renders a `<kbd>/</kbd>` hint but no handler exists. | Advertised shortcut does nothing. |
| 5 | **No in-app PDF reader.** Preview is a bare `<iframe>`, i.e. the browser plugin. | No page navigation, zoom, text search or rotation; inconsistent across browsers. |
| 6 | **Test-suite rate-limit fragility.** A throttled sign-in leaves no token, so every later request 401s. | One rate-limited login turns into a 19-test cascade of misleading 401s. |
| 7 | **No `.gitattributes`.** `core.autocrlf=true` vs Prettier's `endOfLine: 'lf'`. | `pnpm format:check` fails on 31 files and silently re-breaks on any checkout. |

---

## 1.3 v1 addition — in-app PDF reader ➕

**Replace the `<iframe>` in `components/DocumentUploadActions.tsx`.**

| Package | Version | Note |
|---|---|---|
| `react-pdf` | **11.0.0** (2026-09-10) | Requires React 19 ✓ and Node 22.13+ ✓ — both already satisfied |
| `pdfjs-dist` | **6.4.299** (2026-10-03) | Mozilla PDF.js, Apache-2.0, 3325 dependent projects |

Scope for v1: page navigation, jump-to-page, zoom in/out/fit-width, rotate,
in-document text search, download, and the existing `#page=` deep link honoured
from the registry row.

Two integration gotchas, both known now so they are not discovered later:

1. **pnpm must hoist `pdfjs-dist`.** They use pnpm 10.15.0, so add to `.npmrc`:
   ```
   public-hoist-pattern[]=pdfjs-dist
   ```
   (pnpm 11+ uses `publicHoistPattern` in `pnpm-workspace.yaml` instead.)
   Without this the worker import fails to resolve.
2. **Worker must be set in the same module** that renders `<Document>`:
   `pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()`
   `cMaps` (from `pdfjs-dist/cmaps`) and `standard_fonts` must be copied into
   the build, per the Vite guidance in the react-pdf README.

Acceptance: the registry, file detail, digitization batch and map rows all open
in the viewer; a gated private PDF renders without an Authorization header being
leaked; keyboard and screen-reader navigation works.

---

## 1.4 v1 addition — UI enhancements ➕

| # | Enhancement | Why |
|---|---|---|
| 1 | **Implement `/` (or delete the hint).** | The shortcut is advertised today and does nothing. Pick one and make them agree. |
| 2 | **Scan auto-advance on Enter.** Detect a fast keystroke burst and submit, then refocus. | Makes the multi-file issue desk actually usable with a barcode gun. |
| 3 | **Focus trap and scroll lock in `Modal`; focus return in `CommandPalette`.** | Keyboard and screen-reader users can currently tab out of an open dialog. |
| 4 | **Replace the spinner with skeleton loaders** matching each table's shape. | Less layout shift; the app already reserves space poorly on slow reads. |
| 5 | **Bulk selection and bulk actions on the registry table** (relocate, assign shelf, export). | Repeating a single-row action across hundreds of rows is the common real task. |
| 6 | **Registry table: sticky header + column show/hide.** | 25-lakh-row tables lose context while scrolling. |
| 7 | **One consistent flash/toast location**, replacing ad-hoc inline alerts. | Mixed placement reads as inconsistent product. |
| 8 | **Responsive audit below 768px** for the registry, issue desk and location designer. | The shell was adjusted for small screens; the data tables were not. |
| 9 | **Command palette: recent files, recent searches, and per-result match context.** | Makes the palette the fastest path for repeat operators. |

---

# Part 2 — v2

## 2.1 Scan composition studio 🔮

The gallery, enhancement and PDF generation work. This is the piece that turns
"we store scans" into "we digitise properly".

### Capabilities

- Multi-image upload as a **gallery** with thumbnails, not a file list.
- **Drag-and-drop reorder** of pages; order persisted server-side.
- **Replace** the image of any page without losing the version history.
- Insert a page, delete a page, duplicate a page.
- Apply enhancements **per page** or **to the whole batch**; keep the original.
- Side-by-side original / processed comparison before committing.
- **Generate a PDF** from the ordered images, optionally with the extracted OCR
  text as an invisible text layer so the result is searchable.
- Per-page rotation, and DPI captured at upload.

### Libraries

| Need | Package | Version | Why |
|---|---|---|---|
| Enhancement algorithms | `OpenCvSharp5` | **5.0.0.20261012** | Apache-2.0, 4,200+ commits since 2013; README says **5.x is "recommended for new projects"** and 4.x is maintenance-only |
| Linux native binaries | `OpenCvSharp5.official.runtime.linux-x64` | **5.0.0.20261012** | Deploy target is Linux (systemd on the VPS) |
| PDF generation | `QuestPDF` | **2026.9.1** | 35M downloads, 14.2k stars; code-first layout engine, images + text, headers/footers, page numbers, Linux support, AOT-ready |
| Drag-and-drop | `@dnd-kit/core` 6.3.1 / `@dnd-kit/sortable` 10.0.0 | Dec 2024 | Widely used, React 19 compatible — ⚠️ **last published Dec 2024, effectively stagnant** |
| Drag-and-drop (alt) | `@hello-pangea/dnd` | **18.0.1** | Actively forked mainline of react-beautiful-dnd; consider if dnd-kit's silence is a concern |

**Enhancement algorithms** (OpenCV):

| Operation | Approach |
|---|---|
| Deskew | dilate → `findContours` → `minAreaRect` → **median** angle → `warpAffine`. Use the median, not the mean — one bad contour ruins a mean. |
| Despeckle | `fastNlMeansDenoising`, or median blur for salt-and-pepper |
| Binarise / clean | adaptive threshold, then remove isolated components under a size floor |
| Crop / border removal | detect the document quad, `getPerspectiveTransform` + `warpPerspective` |
| Contrast / brighten | CLAHE for faded carbon copies |
| Rotate | 90° steps, plus arbitrary angle from deskew |

### Data model additions

| Table | Purpose |
|---|---|
| `ScanPageAssets` | one row per page: original blob id, processed blob id, page order, width/height/DPI, enhancement applied |
| `DocumentDerivatives` | generated PDFs: page span, source asset versions, whether an OCR text layer was included |

Keep the original blob forever — the tender's archival expectation is that you
can prove what was scanned.

## 2.2 OCR and search 🔮

| Engine | Version | Fit | Verdict |
|---|---|---|---|
| **`PaddleOcrNet`** | **2.4.0** | `net10.0`, ONNX Runtime, no Python, no sidecar, optional CUDA | **Best fit on paper** |
| **`PaddleOCR`** (Curiosity GmbH) | **26.9.x** | `net10.0`, AOT-ready, ships `PaddleOCR.Pdf` for PDFium rasterisation | Strong alternative |
| `Tesseract` (.NET wrapper) | **5.2.0** | CPU-only, tiny, Linux-native | Safe boring fallback |
| `PaddleOCRSharp` | 6.2.0 | Most established (.NET wrapper) | ❌ **No Linux runtime package exists — the VPS is Linux** |

Upstream PaddleOCR is now the accuracy leader — **PP-OCRv6** (2026-06-11) and
**PaddleOCR-VL-1.6** (96.3% on OmniDocBench), Apache-2.0, 100+ languages. The
.NET port runs the same models through ONNX Runtime.

⚠️ **Gate:** both top .NET options are young (`PaddleOcrNet` has 12 published
versions). **Run a POC against 100 real district records before committing.**
Benchmarks will not tell you how it handles stamped, handwritten or faded
carbon copies, which is the entire workload.

Architecture: a Hangfire job, modelled on the existing `mark-overdue-receipts`.
Models stored outside the web root, warmed once per process.

### Search

| Option | Verdict |
|---|---|
| **SQL Server full-text** (already installed) | **Start here.** No new infrastructure; stays transactionally consistent with `Files`, so no index-sync pipeline to go stale. |
| **OpenSearch** (Apache-2.0) | Escalate **only** if relevance demands it. Adds a JVM service to deploy, secure, back up and patch. |
| **Elasticsearch** | ❌ SSPL + Elastic License 2.0 since 2021 |
| **`Lucene.Net`** | ❌ **Landmine.** Verified on NuGet: stable is **3.0.3 from 2012**; 4.8.0 is still `beta00018`. Do not adopt. |

This also fixes gap #2 — an FTS index over the existing metadata columns is
worthwhile on its own, before any OCR exists.

## 2.3 Image quality and archival compliance 🔮

| Requirement | Approach |
|---|---|
| **200–300 DPI** | Read DPI from image metadata at upload; reject below 200 with a **field-level** error (the envelope plumbing now exists). |
| **PDF rasterisation** at fixed DPI | `PaddleOCR.Pdf` (PDFium) or `Docnet.Core` 2.6.0. Stay on **PDFsharp 6.5.0** — 7.0 is still preview. |
| **PDF/A validation** | `VellumPdf.Conformance` **2.3.3** — `net10.0`, in-process, no Docker, AOT-ready, machine-readable rule id + ISO clause + severity, ~99% veraPDF parity |
| **veraPDF as CI ground truth** | Industry standard (GPLv3/MPLv2), Java. Use in CI, not at runtime — there is no .NET port |
| Ghostscript | ⚠️ Known to emit PDF/A that **fails** veraPDF (Archivematica #1220). Fine for rasterising; do not use it to produce archival PDF. |
| `Codeuctivity.PdfAValidator` 3.0.208 | ❌ **AGPL-3.0** — licence contamination risk in government code; also stale since 2023 |
| Barcode auto-detect from a scan | `ZXing.Net` **0.16.11** — decode and auto-fill metadata via the existing `RR\|SUBJECT\|VALUE` grammar |

## 2.4 Records, permissions and handover 🔮

| Feature | Notes |
|---|---|
| Editable permission matrix | Full design — `role_permission` table, permission policies replacing `[Authorize(Roles)]`, Admin row locked — in `V2-EDITABLE-PERMISSIONS.md` |
| **Digitisation handover sign-off** | New entity: vendor, batch, page count, received-by, signed-off-by, signed-off-at, remarks. No library needed; write through the existing `IAuditWriter`. This is the only genuinely software-shaped item from tender phase 5. |
| Department / record-level scoping | `PRD.md` §16.2 and §18 describe a fuller pipeline (`RolePermission`, `UserRole`, `UserDelegation`). Larger than the matrix editor; not covered by it. |

## 2.5 Infrastructure 🔮

- Redis with persisted cache; Hangfire on SQL Server rather than in-memory.
- HTTPS via a domain (the VPS is on a bare IP, which cannot get a normal cert).
- CI that boots SQL Server so `test-api.ps1` and the contract suite always run.
- A barcode-gun simulator in CI, so scan flows are tested at gun speed.

---

# Part 3 — Verified library shortlist

Read from the NuGet/npm registry APIs. Dates are the published release date.

| Purpose | Package | Version | Published | Licence / note |
|---|---|---|---|---|
| OCR | `PaddleOcrNet` | 2.4.0 | — | ⚠️ young, POC first |
| OCR | `PaddleOCR` | 26.9.x | — | ⚠️ young; AOT-ready |
| OCR fallback | `Tesseract` | 5.2.0 | — | CPU-only |
| CV / enhancement | `OpenCvSharp5` | 5.0.0.20261012 | 2026-10-12 | Apache-2.0, recommended family |
| CV native (Linux) | `OpenCvSharp5.official.runtime.linux-x64` | 5.0.0.20261012 | 2026-10-12 | required on the VPS |
| PDF generation | `QuestPDF` | 2026.9.1 | 2026-09-25 | ⚠️ **Community licence** — free for non-profits/FOSS/< $1M revenue; verify eligibility |
| PDF/A validation | `VellumPdf.Conformance` | 2.3.3 | 2026-09-20 | ⚠️ young; 99% veraPDF parity claimed |
| PDF manipulation | `PDFsharp` | 6.5.0 | 2026-10-14 | MIT; **stay off 7.0 preview** |
| PDF rasterisation | `Docnet.Core` | 2.6.0 | — | |
| ONNX runtime | `Microsoft.ML.OnnxRuntime` | 1.31.0 | — | needed by the OCR choice |
| Barcode decode | `ZXing.Net` | 0.16.11 | 2025-10-25 | |
| ImageMagick fallback | `Magick.NET-Q8-AnyCPU` | 15.0.0 | 2026-10-10 | no deskew |
| PDF viewer | `react-pdf` | 11.0.0 | 2026-09-10 | React 19 ✓ |
| PDF viewer core | `pdfjs-dist` | 6.4.299 | 2026-10-03 | Apache-2.0 |
| Drag-and-drop | `@dnd-kit/*` | 6.3.1 / 10.0.0 | 2024-12 | ⚠️ stagnant |
| Drag-and-drop (alt) | `@hello-pangea/dnd` | 18.0.1 | 2025-02-09 | |

**Do not adopt:** `Lucene.Net` (stable is 2012-era), `iText` (AGPL or commercial),
`Codeuctivity.PdfAValidator` (AGPL-3.0), `Elasticsearch` (SSPL), Ghostscript as a
PDF/A producer, `PaddleOCRSharp` on Linux.

---

# Part 4 — Sequencing

| Step | Work | Gate |
|---|---|---|
| 1 | Close v1 defects 1–4, 6, 7 (search sargability, `/` shortcut, scan auto-submit, test throttling, `.gitattributes`) | `format:check`, `lint`, `typecheck`, `test`, `build`, `dotnet test`, `test-api.ps1` all green |
| 2 | **v1: PDF reader** + UI enhancements 1–4 | Replaces the bare `<iframe>` |
| 3 | **v1: UI enhancements** 5–9 | Bulk actions, responsive pass |
| 4 | SQL Server FTS over existing metadata | Solves the ~25-lakh-row degradation before OCR exists |
| 5 | Deskew / despeckle / DPI gate on upload | OpenCvSharp5 |
| 6 | **OCR POC on 100 real records** | ← **hard gate.** Pick an engine or stop |
| 7 | Scan gallery + reorder + replace; OCR tables; FTS over extracted text | |
| 8 | Generate PDF from images + invisible OCR text layer | QuestPDF |
| 9 | PDF/A validation gate at upload; veraPDF in CI | VellumPdf.Conformance |
| 10 | Handover sign-off entity and screen | Small, independent |
| 11 | Permission matrix per `V2-EDITABLE-PERMISSIONS.md` | Enforcement swap is its own reviewed commit |
| 12 | OpenSearch / vector search **only if** step 7 disappoints | |

---

# Part 5 — Out of software scope

These come from the tender SoW but are physical operations. Do not build
software for them.

| SoW item | Reality |
|---|---|
| Receiving, counting, secure handover of physical files | A receiving register could record it; the work itself is manual. |
| Unbinding, removing staples/pins, flattening creases, dusting | Physical. |
| Rebinding documents in original order | Physical. |
| Returning files to the department | Physical; the **digital sign-off** in §2.4 is the software part. |

The genuinely software-shaped tender scope is: **OCR, full-text search, image
enhancement, DPI and PDF/A compliance, and handover sign-off.**

---

# Part 6 — Standing risks

| Risk | Note |
|---|---|
| **Licence contamination** | `iText` and `Codeuctivity.PdfAValidator` are AGPL. QuestPDF is a community licence with a revenue threshold — confirm eligibility for a public-sector deployment before adopting. |
| **Supply chain** | The two best .NET OCR packages are young and low-adoption. For a government tender, prefer the option you can support, not the best benchmark. |
| **Data residency** | Cloud OCR (Textract / Document AI / Document Intelligence) puts Lucknow records outside your control. Treat as a procurement question, not a technical one. |
| **Retention vs discards** | Enhancement must never overwrite the original scan. Archival expectations require proving what was scanned. |
| **Model drift** | OCR models change. Pin the model version per stored page so re-running is reproducible. |