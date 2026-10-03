# QA checklist

## Frontend checks

- [ ] `pnpm format:check`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

## Manual functional checks

- [ ] Dashboard loads.
- [ ] Global search route opens.
- [ ] Search filters demo files.
- [ ] File detail opens from search and list.
- [ ] Room map opens and almirah selection changes shelf detail.
- [ ] Issue flow changes demo state.
- [ ] Return flow confirms destination.
- [ ] Barcode page previews label concept.
- [ ] Digitization batch detail opens.
- [ ] Reports open.
- [ ] Administration routes open.
- [ ] Media page rejects a broken image URL and accepts a loaded image.
- [ ] Support inquiry uses demo mode without Firebase and Firestore mode when configured.
- [ ] Dark mode persists locally.
- [ ] Back-to-top button appears after scrolling.

## Accessibility

- [ ] Keyboard can reach all interactive elements.
- [ ] Focus rings are visible.
- [ ] Icon-only buttons have accessible labels.
- [ ] Color is not the only way status is communicated.
- [ ] Reduced motion is respected.
- [ ] Tables have semantic headings.
- [ ] Images have alt text.

## Production gates

A frontend demo is not considered the production system until API authorization, database transactions, file storage security, OCR quality, backup/restore and load tests have all passed.
