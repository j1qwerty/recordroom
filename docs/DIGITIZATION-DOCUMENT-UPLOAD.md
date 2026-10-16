# Digitization document upload — PDF and images

Status: **Implemented in [PR #2 — Add secure, versioned scanned document uploads](https://github.com/j1qwerty/recordroom/pull/2).** The latest API and frontend CI checks passed on the current implementation.
The user's verbatim requirements below remain unchanged.

---

## 1. The owner's words, verbatim

This section is quoted exactly as given and is the authoritative requirement.

> this vps is for testing , we will deploy on vps with larger resources for prod,
>
> we will allow both pdfs and images , pdfs can of varous sizes as we support A0 to A4 and legal
>
> also while creating file, uploading file will be optional, and we can upload file form tables for details pages, we can also view files and etc, update to upload new pdf with proper versioning ,
>
> so ill make some PR and we will merge those, but first merge the current PR (Improve RecordRoom registry, e-office linking, and operations UX) then for this pdf and image ill create a new PR, till then save the instructions for that in a md file with my exact words for it also

---

## 2. What already exists

The current system records digitization pages and map uploads as **metadata only**. No bytes
are stored. This was confirmed by inspection on 2026-10-16:

| Surface | Endpoint | Input |
| --- | --- | --- |
| Digitization pages | `POST /api/digitization/batches/{id}/pages` | `PageUploadInput(FileBarcode, PageNo, FileName, Bulk)` |
| Maps | `POST /api/uploads/maps` | `MapUploadInput(FileBarcode, PageNo, FileName, SizeKb)` |

Neither endpoint accepts `multipart/form-data`. The frontend has no `<input type="file">` and
sends no `FormData`. The `.pdf` suffix in generated names is cosmetic:

```
record-room-frontend/src/services/impl/digitization.ts:134
  `${input.fileBarcode}-FILE-${input.pageNo}-V${nextVersion}.pdf`
```

Digitization progress, approve/reject, versioning and duplicate-page detection all work — they
track filenames, not documents.

### The legacy behaviour we are restoring

`jhs_digitization-og-php-app/application/controllers/User.php:578` performed a real
`move_uploaded_file()`:

- paths `uploads/<empcode>/service_book/`, `uploads/<empcode>/leave_report/`,
  `uploads/<empcode>/APAR/`, `uploads/<empcode>/Attachment/`
- maps at `uploads/<file_barcode>/map/` (line 4324)
- extension allowlist `jpeg, jpg, png, gif` (line 582)
- duplicate page-number detection via `checkDuplicatePageNo` (line 593)
- image compression with size-tiered quality (commented out at lines 609-619)
- naming `{empcode}-SR-{pageno}.{ext}`

Images only. PDF support is new and did not exist in the legacy app.

---

## 3. Requirements

### 3.1 Formats

Both **PDF and images** are accepted.

PDFs arrive in **widely varying sizes because the record set spans A0 through A4 and Legal**.
Any per-file size ceiling must therefore be generous, and page dimensions must not be validated
against a fixed paper size. A3/A2/A1/A0 scans and Legal (8.5x14in) are all valid input.

Image formats to match the legacy allowlist: `jpeg`, `jpg`, `png`, `gif`. TIFF is a candidate
for multi-page archival scans and needs a decision.

### 3.2 Upload is optional at creation

Creating a file record must **not** require a document. The registry has ~25 lakh records, so
most files will be catalogued first and digitised later. Create must succeed with no attachment.

### 3.3 Upload from detail-page tables

Documents are uploaded **from the tables on the detail pages** — the digitization page list and
the map list — not only from a dedicated upload screen. Each row in those tables needs an upload
affordance.

### 3.4 Viewing

Uploaded documents must be **viewable**. PDF needs an in-browser viewer; images need a preview.

### 3.5 Versioning on replacement

Uploading a new document for an existing page/file must **create a new version**, not overwrite.
Prior versions stay retrievable. The existing version counter on
`DigitizationPageDto.version` is the natural hook.

### 3.6 Environment note

The current VPS is a **test instance**. Production will be deployed to a VPS with larger
resources. Storage sizing and any object-storage decision should target production capacity,
while keeping the test deployment working.

---

## 4. Open questions for the owner

These are decisions the current code does not answer. Each one changes the schema or the
endpoints.

1. **Storage backend.** Local disk like the legacy app, or object storage? At 25 lakh records the
   answer is probably object storage, but that is a larger build. Production disk capacity is
   unknown until the production VPS is sized.
2. **PDF page semantics.** Is one uploaded PDF one page record, or does a multi-page PDF expand
   into N page rows? This changes the page-numbering model and the duplicate-page check. The
   owner's note about "various sizes" refers to paper dimensions, but a 500-page scan is a
   separate question.
3. **Page size ceiling.** A0 scans at high DPI produce very large files. What is the per-file
   limit?
4. **Storage paths.** Reuse the legacy folder convention
   (`uploads/<empcode>/<folder>/`, `uploads/<file_barcode>/map/`), or a content-addressed layout?
   The legacy convention is already modelled as `folder` on the batch.
5. **Virus scanning / content validation.** Confirm whether uploads must be scanned before
   becoming visible.
6. **Original download.** Should the as-received original be retained alongside any normalised
   derivative? `DigitizationPageDto` gained a document-size field in PR #1, which suggests
   sizing was already anticipated.

---

## 5. Notes for whoever builds this

- The contract seam is `record-room-frontend/src/services/contracts.ts`. Both
  `src/services/impl/` and `src/services/http/` must change in the same commit as the API.
- `tests/api-contract.test.ts` and `dotnet-api/scripts/test-api.ps1` both need to stay green.
- Business rules belong in exactly one place: the API under `VITE_API_MODE=http`, the in-memory
  adapter under `local`.
- `dotnet-api/scripts/audit-http-verbs.mjs` must pass — upload actions need explicit HTTP verb
  attributes.
- Multipart endpoints bypass the JSON `ApiResponse<T>` envelope. Decide whether upload errors
  return the same envelope shape the frontend client expects, or whether
  `src/services/http/client.ts` needs a separate multipart path.
- The frontend already has an in-browser image validation pattern: validate via `Image.onload`
  before accepting, reject unsafe protocols, handle broken URLs. Reuse it rather than
  reinventing it.
- Prerequisite PR #1 ("Improve RecordRoom registry, e-office linking, and operations UX") is
  merged, and added `RecordKind`, document size, and the e-office reference. Build on top of it.

---

## 3. Implementation decisions for the follow-up PR

These details supplement the verbatim requirement above; they do not replace it.

- **Formats:** PDF, JPG/JPEG, PNG and GIF. TIFF is not enabled in this iteration. The API checks the extension and file signature instead of trusting the browser's MIME type.
- **Size:** the default upload ceiling is **48 MiB**. nginx allows `client_max_body_size 50M` on the deploy, so 48 MiB leaves headroom for the multipart envelope and keeps the rejection coming from the API's validation message rather than an opaque proxy 413. Configure `FileStorage__MaxUploadBytes` to lower it further; the service caps the configured value at the 48 MiB default. Raising it above 50 MiB requires raising `client_max_body_size` in `deploy-recordroom.ps1` at the same time.
- **Private persistent storage:** PDF/image bytes are stored under a configurable directory outside `wwwroot`. SQL Server stores the metadata, randomly generated storage key, version, checksum, size, uploader and timestamp. Configure `FileStorage__RootPath` to a persistent backed-up volume for production.
- **Where uploads appear:** optional first scan on record creation, record-detail attachments, digitization-page rows, and map/copy rows. Each location provides view/preview and download where the browser supports it.
- **Versioning:** subsequent uploads create new rows/versions and preserve prior bytes; they do not overwrite a previously uploaded scan. Legacy metadata rows stay readable, but cannot be previewed until real content has been uploaded.
- **Page model:** one digitization page row points to one uploaded document version. Multipage PDFs are kept intact as a PDF; the service does not silently split PDF pages into separate digitization metadata rows.
- **Multipage PDFs (owner-confirmed: "pdf will have many pages"):** the API reads the PDF page count on upload and stores it as `PageCount`, alongside `PageIndex` for the page a given row represents. The bytes are never split into separate files — one upload stays one document. Rows carry a `PageIndex` so a preview opens on that page via the `#page=` fragment, and the UI labels the document as "N pages" rather than implying a single page. The page count is a best-effort scan of the uncompressed page tree (`PdfPageCounter`), so an encrypted PDF or one whose page tree sits in a compressed object stream yields `null`. A `null` count is rendered as *no label at all*; it is never shown as "1 page", because that would be a false claim about the document.
- **Local demo mode:** the in-memory adapter is only a UI/demo aid and holds file bytes in browser memory for the current session. It is not durable; use `VITE_API_MODE=http` with the .NET API for persistent storage.
- **Deployment and backups:** mount the document directory as persistent storage. Back up the volume and SQL Server together, since the database metadata references content in that volume. Apply the EF migration before using uploads.
- **Security gap to consider before production:** extension and signature checks are not a substitute for malware scanning. This iteration does not include an antivirus/quarantine pipeline, OCR, automatic PDF splitting, or cloud-object-storage integration.

See [`docs/scanned-document-storage.md`](scanned-document-storage.md) for configuration and deployment notes.
