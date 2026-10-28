# Record Room — work plan

A living tracker: what we are working on now, and everything left to do,
split into **v1** (small, ship in the current release) and **v2** (the
digitisation engine and platform hardening).

- Snapshot: **2026-10-28**
- Feature inventory, verified library versions and licence notes: `Recordroom-features.md`
- Editable permission design: `V2-EDITABLE-PERMISSIONS.md`
- Tender-phase scope split and phasing: `PHASED-SCOPE.md`
- API deployment and operations: `../dotnet-api/README.md`
- Tender bid document (the user is drafting this in Word):
  git history `4d988d2` — `Record_Room_Management_Digitization_Proposal_v2.docx`.
  This plan is the software-side companion to that document.

Verification short-form used below:

- **API checks** = `dotnet build` + `dotnet test` + `scripts\test-api.ps1`
- **Web checks** = `pnpm format:check` + `lint` + `typecheck` + `test` + `build`

---

## 1. Where we are now

### Recently finished and on `main`

| Work | Commit | State |
|---|---|---|
| Reported UI fixes: mojibake in Users/Locations/Login, sticky desktop sidebar | `191d219` | shipped |
| v2 permissions design doc + parity-claim corrections | `d2eaa2c` | shipped |
| README run-it-locally, real passwords, SQL triage notes | `6227317` → `62622f1` | shipped |
| `System.Security.Cryptography.Pkcs` pinned to 9.0.21 | `40c4300` | shipped |
| Critical: Redis-unconfigured no longer 500s every request | `30da20a` | shipped |
| PR #3 merged (ui workflow redesign, room creation) | `bdc4921` | shipped |
| PIN sign-in restored + error envelope normalised + test harness fix | `c24b2f3` | shipped |
| Feature inventory and roadmap | `becc7a4` | shipped |
| Tender proposal (Word) | `4d988d2` | shipped (user) |

Verification state: API checks green (`dotnet test` 112/112, `test-api.ps1`
149/149), Web checks green except `format:check` (see §2.1 item 7) and one
pending full `pnpm test` run (§1.2).

### In flight / pending right now

| # | Item | Status | Next action |
|---|---|---|---|
| 1 | One clean full `pnpm test` since `c24b2f3` | **pending** | Run after ≥110 s of API idle — API-backed suites share a 10-logins/60s budget and back-to-back runs trip it, cascading into misleading 401 mass-failures |
| 2 | `.gitattributes` + CRLF renormalisation | **offered, not approved** | Add `* text=auto eol=lf` + `git add --renormalize .`; user to approve since it rewrites ends-of-lines repo-wide |
| 3 | Barcode-gun scanner simulator (`scripts/barcode-gun.ahk`) | **deferred** | Write the AutoHotkey simulator, then verify `IssuePage` handles rapid consecutive scans (no `onKeyDown` exists anywhere — every scan path depends on Enter reaching a form submit) |
| 4 | Docs reorganisation (`docs/skills/`) | **user work in progress** | Working tree has deletions/moves — do not touch or commit as part of anyone else's change |

### Decisions already taken (do not re-litigate)

- Library picks (OCR, search, image enhancement, PDF/A, viewer, PDF generation)
  are settled in `Recordroom-features.md` Part 3 — versions verified against
  the NuGet/npm registries, not vendor pages.
- OCR has a **hard gate**: POC on ~100 real district records before committing
  to an engine. Benchmarks do not cover stamped or faded carbon copies, which
  is the actual workload.
- SQL Server FTS is the search plan; OpenSearch only if OCR-era relevance
  demands it.
- Enhancement always preserves the original scan — archival work must be able
  to prove what was scanned.
- Data-residency rule: no cloud OCR for a government tender.

---

## 2. v1 — what we need to do

Everything here is small and can ship in the current release. Order matters
(loosely): defects first, then the reader, then the UI enhancements.

### 2.1 Close the known defects

| # | Defect | Fix | Done when |
|---|---|---|---|
| 1 | Search is non-sargable — `Contains()` on lowered columns disables `IX_Files_*` | Make the query sargable; add a proper index over the effective columns | Registry search plan reported by SQL Server no longer scans |
| 2 | No scan auto-submit — zero `onKeyDown` handlers; scan depends on Enter reaching a form's `onSubmit` | Detect a fast keystroke burst and submit + refocus (also unblocks the gun simulator) | Gun-style rapid input issues files on the issue desk without touching the mouse |
| 3 | The `/` shortcut is decorative — Topbar advertises it, no handler exists | Implement it (focus the record search) or delete the hint — make the two agree | Pressing `/` moves focus to search |
| 4 | Test-suite rate-limit fragility — one throttled login cascades into 401 failures | Wait between API-touching runs locally; make the first sign-in failure abort the suite instead of 401-cascading | A throttled login fails one assertion, not nineteen |
| 5 | No `.gitattributes` — `core.autocrlf=true` vs Prettier `endOfLine: 'lf'` | `* text=auto eol=lf` + renormalisation (approved item above) | `pnpm format:check` passes on a fresh checkout |
| 6 | No in-app PDF reader — preview is a bare `<iframe>` (the browser plugin) | §2.2 | Viewer replaces the iframe everywhere |

(Permission-matrix enforcement is deliberately *not* a v1 defect — the design
for it exists in `V2-EDITABLE-PERMISSIONS.md` and the work is §3.7.)

### 2.2 In-app PDF reader

| Package | Version | Why this one |
|---|---|---|
| `react-pdf` | **11.0.0** (2026-09-10) | React 19 ✓, Node 22.13+ ✓ — both already satisfied |
| `pdfjs-dist` | **6.4.299** (2026-10-03) | Mozilla PDF.js, Apache-2.0, the standard |

Scope for v1: page navigation, jump-to-page, zoom in/out/fit-width, rotate,
in-document text search, download; keep the existing `#page=` deep link working
from registry rows.

Known integration requirements (documented so they are not rediscovered):

- pnpm must hoist `pdfjs-dist` — `public-hoist-pattern[]=pdfjs-dist` in
  `.npmrc` (pnpm 10.15.0), or the worker import silently fails.
- Worker + `cMaps` + `standard_fonts` wired per the Vite guidance in the
  react-pdf README, set in the same module that renders `<Document>`.

Sits in `components/DocumentUploadActions.tsx`, which currently renders the
iframe — used by registry, file detail, digitisation batch and map rows.

### 2.3 UI enhancements

| # | Enhancement | Rationale |
|---|---|---|
| 1 | Scan auto-advance on Enter (shared with defect #2 above) | Usability with real barcode guns |
| 2 | Focus trap + scroll lock in `Modal`, focus return in `CommandPalette` | Keyboard/SR users can currently tab out of an open dialog |
| 3 | Skeleton loaders matching each table's shape, replacing the spinner | Less layout shift while reads resolve |
| 4 | Bulk selection + bulk actions on the registry table (relocate, assign shelf, export) | Repeating single-row actions across hundreds of rows is the common real task |
| 5 | Registry table: sticky header + column show/hide | 25-lakh-scale tables lose context while scrolling |
| 6 | One consistent flash/toast location | Mixed placement reads as an inconsistent product |
| 7 | Responsive audit below 768px for registry, issue desk, location designer | The shell was adjusted for small screens; the data tables were not |
| 8 | Command palette: recent files, recent searches, per-result match context | Fastest path for repeat operators |

### v1 definition of done

- [ ] All API checks and Web checks green on a clean checkout (including `format:check`)
- [ ] Full `pnpm test` clean **including** `tests/api-contract.test.ts` against a live API
- [ ] PIN/password/OTP states verified in the browser
- [ ] PDF reader live everywhere the iframe is, in all three themes
- [ ] `scripts/barcode-gun.ahk` written and issue-desk rapid-scan behaviour verified

---

## 3. v2 — what we need to do

The digitisation engine and platform hardening. Full library tables live in
`Recordroom-features.md`; only the essentials are repeated here.

### 3.1 Search at scale

1. Sargable registry query + index (may land early under v1 — §2.1 #1).
2. SQL Server **full-text** index over existing metadata columns — no new
   infrastructure, stays transactionally consistent, no index-sync drift.
3. Escalate to OpenSearch (Apache-2.0) **only** if OCR-era relevance demands it.
4. Avoid: Elasticsearch (SSPL), `Lucene.Net` (stable release is 2012-era;
   4.8.0 still beta).

### 3.2 Image quality gates (OpenCvSharp5)

`OpenCvSharp5` **5.0.0.20261012** + `OpenCvSharp5.official.runtime.linux-x64`
(deploy target is Linux). Operations: deskew (median angle via
`minAreaRect`, not mean), despeckle (`fastNlMeansDenoising`), binarise +
small-component removal, document-quad crop, CLAHE contrast, rotate.

- **DPI gate:** read image metadata at upload; reject below 200 DPI with a
  field-level error (the `ApiResponse` envelope plumbing exists since `c24b2f3`).
- Every enhancement keeps the original scan untouched (versioned, of which
  blob the processed copy derives).

### 3.3 OCR pipeline (hard POC gate first)

1. **Gate: POC on ~100 real district records.** Candidates: `PaddleOcrNet`
   2.4.0 (ONNX, no Python, CUDA-optional) vs `PaddleOCR` 26.9.x (AOT-ready).
   Fallback: `Tesseract` 5.2.0. Not usable: `PaddleOCRSharp` (no Linux runtime).
   No cloud OCR — data residency.
2. Hangfire job modelled on the existing `mark-overdue-receipts`; models stored
   outside the web root, warmed once per process; pinned model version recorded
   per stored page for reproducibility.
3. Extracted text stored in OCR tables → full-text indexed (§3.1).

### 3.4 Scan composition studio

The gallery work that turns "we store scans" into "we digitise properly":

- Multi-image upload as a thumbnail **gallery**
- **Drag-and-drop reorder** (`@dnd-kit/*` 6.3.1/10.0.0 — last release Dec 2024;
  alternative `@hello-pangea/dnd` 18.0.1), persisted server-side
- **Replace / insert / delete / duplicate / rotate** any page without losing
  version history
- Per-page or batch enhancement; original-vs-processed compare before commit
- Data model: `ScanPageAssets` (original blob, processed blob, order, DPI,
  enhancement applied) and `DocumentDerivatives` (generated PDFs and their
  source versions)

### 3.5 PDF generation from scans

`QuestPDF` **2026.9.1**: ordered page images + optional invisible OCR text
layer (searchable output), header/footer, page numbers, Linux support.
Documented: rasterisation stays on `PDFsharp` 6.5.0 (7.0 is preview) /
`Docnet.Core` 2.6.0.

### 3.6 PDF/A compliance gate

`VellumPdf.Conformance` **2.3.3** — in-process validation with rule id + ISO
clause + severity; veraPDF as CI ground truth. Ghostscript must not produce
archival PDF (known to emit veraPDF failures). `Codeuctivity.PdfAValidator` is
AGPL — do not adopt.

### 3.7 Editable permission matrix

Per `V2-EDITABLE-PERMISSIONS.md`: DB-backed `role_permission` table, permission
policies replacing `[Authorize(Roles = ...)]` (today the API authorises on role
name only and never enforces the matrix), Admin row locked against self-lockout
server-side. **v1 stays read-only** — no editing until the user asks.

### 3.8 Handover sign-off

New `DigitizationHandover` entity: vendor, batch, page count, received-by,
signed-off-by, signed-off-at, remarks — written through the existing
`IAuditWriter`. This is the only genuinely software-shaped item in tender
phase 5; the unbinding/rebinding/return-to-department work around it is
physical and stays out of software (§5 of `Recordroom-features.md`).

### 3.9 Infrastructure hardening

- Redis with persisted cache; Hangfire on SQL Server storage, not in-memory
- HTTPS via a domain (VPS currently on a bare IP)
- CI that boots SQL Server so `test-api.ps1` and the frontend contract suite
  always run; add the barcode-gun simulator as a CI flow

---

## 4. Sequencing

The agreed order, with the gate that can stop it:

| # | Work | Gate |
|---|---|---|
| 1 | v1 defects (§2.1) — contains the sargability fix up front | all checks green |
| 2 | v1 PDF reader (§2.2) + UI enhancements (§2.3) | reader replaces every iframe |
| 3 | SQL FTS over existing metadata (§3.1) | search behaves at scale before OCR exists |
| 4 | Deskew / despeckle / DPI rejection (§3.2) | — |
| 5 | OCR POC on ~100 real records (§3.3) | **hard gate — pick an engine or stop** |
| 6 | Scan gallery + reorder + replace; OCR tables; FTS over extracted text (§3.4, §3.3) | — |
| 7 | PDF generation with invisible text layer (§3.5) | — |
| 8 | PDF/A validation gate + veraPDF in CI (§3.6) | — |
| 9 | Handover sign-off (§3.8) | small, independent |
| 10 | Permission matrix per the design doc (§3.7) | enforcement swap is its own reviewed commit |
| 11 | OpenSearch only if step 6 disappoints (§3.1) | — |

---

## 5. Waiting on the user

| Decision | Needed for |
|---|---|
| Approve `.gitattributes` + renormalisation | v1 done (§2.1 #5) |
| Supply ~100 real records for the OCR POC | the hard gate (§3.3) |
| Confirm QuestPDF licence eligibility (community licence has a revenue threshold) | §3.5 |
| `scripts/barcode-gun.ahk` — priority, or later | v1 definition of done |
| Confirm which SQL Server instance before touching the API (the ssh-tunnel prod-DB hazard is documented in the README) | every destructive API test run |
