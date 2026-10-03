# Frontend implementation specification

## Data access rule

Pages never read `src/data/mock.ts`. Every read and write goes through
`src/services`, whose interfaces in `services/contracts.ts` are the frontend's
view of the future .NET 10 API. The in-memory adapter publishes a new snapshot
on every write and re-renders subscribed components, which is why a change on
the issue desk is immediately visible on the movement log, the audit trail and
the dashboard.

Guards belong in the service, not the form. A page reports the verdict it gets
back; it never decides on its own whether a file may be issued or a section
deleted.

## Route inventory

### Session

- `/login` sign-in (web password, mobile OTP, employee PIN, password recovery)

### Core

- `/` dashboard
- `/search` record search and locate
- `/rooms` room explorer
- `/rooms/:roomId` visual room detail, section drill-down
- `/files` file registry (filter, sort, page, export)
- `/files/new` create file
- `/files/:fileId` file detail, relocation, movement history

### Operations

- `/issue` issue desk (multi-file receipt, borrower list)
- `/return` return desk (partial returns)
- `/movement` movement log
- `/barcodes` barcode centre
- `/scan` scan validation (`/scan?p=<payload>` is the QR sticker target)

### Digitization

- `/digitization` employee batch list
- `/digitization/:batchId` batch detail with page review
- `/reports` reports and exports

### Administration (own layout)

- `/admin/users` logins, roles and the permission matrix
- `/admin/employees` employee registry
- `/admin/locations` location designer with layout revisions
- `/admin/bulk-import` bulk CSV ingest
- `/admin/maps` maps and file copies
- `/admin/media` media links (local only)
- `/admin/audit` activity log and login history

### Support

- `/support`
- `/settings`

## Barcode payload grammar

```
RR|FILE|<file_barcode>          also SHELF, ALMIRAH, SECTION, ROOM, AREA
https://<host>/scan?p=<url-encoded linear payload>
```

Linear labels are Code 128 set B, encoded by `src/lib/barcode.ts` with a
standard checksum. The human-readable value is always printed beneath the
symbol. `parseScan` mirrors the future `POST /api/barcodes/validate`: it
accepts the linear form or a QR URL, rejects an unknown prefix or subject code,
and refuses an empty value.

## Identity and location

- File identity is the barcode and never changes. Re-shelving never issues a new
  identity.
- Location is room → section → almirah → shelf. A file may only reference a
  shelf that exists and is Active.
- Re-scanning a digitization page creates the next `version`; it never
  overwrites an approved page.

## Shared behavior

- Desktop sidebar plus mobile drawer, filtered by the signed-in role.
- Sticky topbar with global search affordance.
- Dark mode with a grey-blue dark palette, not pure black.
- Back-to-top button appears after scrolling and hides near the top.
- `prefers-reduced-motion` reduces animation intensity.
- Every key page includes loading/error/empty-state concepts in its production design notes.
- Routes are code-split; the Suspense fallback keeps the shell mounted so the
  layout does not flash.
- Pagination always states the true collection total and the number of rows the
  browser actually loaded.

## Visual language

- Cool grey foundation.
- One muted teal accent.
- 12–16px radius for cards and 8–12px for controls.
- Minimal gradients.
- No generic AI-purple glow.
- No 3D in the first production visualizer.
- 10 custom SVG background elements are available under `/public/decorative/`.
- Masonry-style editorial cards are used on the dashboard knowledge surface.

## Responsive behavior

- `sm: 640px`
- `md: 768px`
- `lg: 1024px`
- `xl: 1280px`
- `2xl: 1536px`

The room visualizer keeps object positions proportional. Dense tables become horizontally scrollable or should use a mobile-specific card representation in production.
