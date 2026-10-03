# Clarifications and resolved design decisions

## 1. File identity is separate from physical location

Permanent file IDs use a stable format such as `RF-0000124587`. A file's room, almirah or shelf is mutable data. Moving a file never changes its RF ID.

## 2. Human-readable codes remain simple

Recommended examples:

- Site: `SITE-001`
- Building: `BLD-001`
- Floor: `FL-02`
- Room: `RM-004`
- Almirah: `A-012`
- Rack: `RK-001`
- Shelf: `A-012-S-05`

A compound address can be displayed as `SITE-001 / BLD-001 / FL-02 / RM-004 / A-012 / S-05`.

## 3. Barcode payloads identify objects

Barcodes should carry object identities, not mutable location strings. Code 128 is the default linear barcode; QR can be supported for camera scanning.

## 4. Shelf position is approximate

The application should guide operators to the right physical area without pretending to know millimeter-level position. The first model uses file order and an approximate position such as 67% along a shelf. A future implementation may store normalized X/Y values.

## 5. First visualizer is 2D SVG

3D is deliberately deferred. SVG lets rooms, almirahs and shelves remain selectable DOM/SVG elements with low runtime cost and clear accessibility labels.

## 6. Architecture

Use a modular monolith plus background worker for the eventual backend. Avoid microservices until there is a demonstrated operational need.

## 7. AI search comes after deterministic search

Structured search and full-text search remain available. AI retrieval must filter by the user's authorization before documents are presented or summarized.

## 8. Firebase usage

Firebase/Firestore is suitable for small frontend-facing data such as inquiries, lightweight content records and media-link metadata. Large scans, PDFs and other binary record-room data should use approved document/object storage.

## 9. External image links

The frontend allows a user to paste an external image URL. The browser validates the URL by loading a preview. Only after successful validation may the URL be written to Firestore. No service-account secret or privileged storage key belongs in the browser.

## 10. Motion

Because this is a government/professional interface, motion is restrained and functional. Page transitions, hover states and the back-to-top interaction are subtle. `prefers-reduced-motion` is respected.

## 11. Correct Pretext repository and masonry implementation

The intended Pretext project is `chenglou/pretext` and the published npm package is `@chenglou/pretext`. The earlier frontend package reference to `@shipitandpray/pretext-masonry` was incorrect and caused an npm registry 404. The implementation now uses `@chenglou/pretext` directly through a local `PretextMasonry` component.
