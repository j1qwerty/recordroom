# Digitization document upload — PDF and images

Status: **specification only, not built.** No PR opened yet.
Author of requirement: project owner.
Follow-up PR: to be opened by the project owner.

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