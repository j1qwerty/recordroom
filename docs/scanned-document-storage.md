# Scanned PDF and image storage

## What gets stored

RecordRoom stores scanned bytes on the API host's private filesystem and records metadata in SQL Server. The files are not saved under `wwwroot` and are not exposed as static public assets. Every uploaded version receives a generated storage key and a SHA-256 checksum. The original filename, file type, byte size, version, uploader and timestamp are recorded alongside it.

Supported extensions are PDF, JPG/JPEG, PNG and GIF. Both extension and file signature are checked by the API; the client-side file picker is only a convenience check. Default maximum size is 512 MiB. JPG/JPEG, PNG and GIF use the image preview; download is available for all allowed formats.

## Multipage PDFs

PDFs are accepted in any paper size, so A0 through A4 and Legal scans all work; no page dimension is validated and the size ceiling is generous.

A single upload may contain many pages. The bytes are stored once and never split into separate files, because splitting would lose the original scan. Instead the API reads the page tree and records the total as `PageCount`, and a digitization or map row can carry a `PageIndex` naming the page it represents. Previewing such a row opens the PDF at that page using the standard `#page=` fragment, so a 40-page file is navigable row by row without 40 copies of the document on disk.

Page counting is a best-effort scan of the uncompressed object structure (`Application/Services/PdfPageCounter.cs`). Encrypted PDFs, and PDFs whose page tree lives inside a compressed object stream (`/ObjStm`), cannot be counted this way and yield `null`. A `null` count is shown without a page label rather than as "1 page" — an unreadable count must not be reported as a single-page document. If a count turns out to be wrong for a specific producer, that is a candidate for a real PDF library later.

## Production deployment

Set these environment variables on the .NET API process:

- `FileStorage__RootPath=/var/lib/recordroom/documents`
- `FileStorage__MaxUploadBytes=536870912` (optional; omit to use the 512 MiB default, or set a smaller value)

Example Linux configuration:

```sh
export FileStorage__RootPath=/var/lib/recordroom/documents
export FileStorage__MaxUploadBytes=536870912
```

Create and mount `/var/lib/recordroom/documents` as a persistent volume and grant the API process write access. Do not put this directory behind a static web server. In a container deployment, mount a host volume at the same path. The default is `App_Data/documents` under the API content root, suitable for development only if that directory is persisted.

The API applies the EF Core migrations `20261016143000_AddScannedDocumentContent` and `20261016121603_AddDocumentPageCount` through its current database migration/startup mechanism. Deploy those migrations with the API release. Back up the document volume and SQL Server database together and test restoring both. Database-only backup can leave attachment metadata without bytes; volume-only restore can leave unreferenced content.

## UI workflow and versioning

A first attachment can be supplied during record creation or later from the record details. Digitization pages and maps/copies each have row-level document controls. Uploading a rescan adds a new version; older uploaded versions remain in storage, with their metadata and checksum. Legacy metadata-only rows remain in place and can receive a real file through the upload action.

The local in-memory frontend stores the bytes in browser memory only to exercise the UI and does not survive a reload. For durable uploads, configure the frontend to use the .NET API (`VITE_API_MODE=http`).

## Security and operational notes

Upload and preview/download routes require an authenticated session. Upload routes are restricted to Admin, Supervisor and Operator roles. Content responses use a private/no-store cache directive, nosniff headers and an inline/attachment disposition. Server-generated storage keys prevent the client filename from becoming a filesystem path.

The size ceiling is configurable, but reverse-proxy/IIS/Nginx limits should also be aligned with it. Large uploads require sufficient temporary memory/disk and timeout allowances on the client, API and proxy. For production, add antivirus/quarantine scanning and an operational orphan-file reconciliation job before accepting untrusted uploads at scale; signature checks alone do not guarantee that a file is safe.
