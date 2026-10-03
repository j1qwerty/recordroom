# Implementation TODO and completion log

This checklist was created before implementation. Frontend scope is now marked complete. Backend services remain intentionally deferred because this delivery is frontend-first.

## Stage 0. Source and requirements

- [x] Review the supplied master PRD.
- [x] Preserve project scope and previous design decisions.
- [x] Resolve permanent file-ID vs physical-location identity.
- [x] Define room/almirah/shelf hierarchy.
- [x] Define barcode approach.
- [x] Define frontend-first boundary.

## Stage 1. Tooling and project foundation

- [x] Create React + TypeScript + Vite project files.
- [x] Configure Tailwind CSS v4.
- [x] Configure Prettier.
- [x] Add `pnpm format` script with optional file/path argument.
- [x] Add format-check, lint, typecheck, test, build and clean scripts.
- [x] Add `.gitignore` and `.env.example`.
- [x] Add Netlify SPA configuration.
- [x] Add Firebase-ready initialization. *(Superseded — Firebase removed in Stage 10 per `AGENTS.md`.)*
- [ ] Install dependencies only after source/docs are complete.

## Stage 2. Design system and frontend shell

- [x] Apply Taste Skill design read for a public-sector/trust-first interface.
- [x] Establish cool grey + muted teal visual system.
- [x] Establish dark mode palette.
- [x] Add responsive sidebar, topbar and page transitions.
- [x] Add reusable buttons, badges, cards, headers and modal patterns.
- [x] Add subtle animations and reduced-motion handling.
- [x] Add ten SVG decorative background elements.
- [x] Add scroll-aware back-to-top interaction.

## Stage 3. Core record-room UI

- [x] Dashboard.
- [x] Global search.
- [x] Record-room explorer.
- [x] Visual room map.
- [x] Almirah/shelf drill-down.
- [x] File registry.
- [x] File creation form.
- [x] File detail.
- [x] Physical location visualization.

## Stage 4. Operations UI

- [x] Issue desk.
- [x] Return desk.
- [x] Movement log.
- [x] Barcode center.
- [x] Digitization batch list.
- [x] Digitization batch detail.
- [x] Reports.

## Stage 5. Administration and integrations

- [x] Users and roles screen.
- [x] Employee registry screen.
- [x] Location designer screen with the `section` level.
- [x] Audit log screen with actor, IP and before/after state.
- [x] Login history screen.
- [x] Maps and file-copy uploads screen.
- [x] Bulk CSV import screen.
- [x] Media/link manager (local only).
- [x] Settings screen.
- [x] Support/inquiry screen (local only).
- [x] External image preview-before-save flow.

## Stage 6. Documentation

- [x] PRD converted to Markdown.
- [x] Project scope and source decisions.
- [x] Clarifications.
- [x] Architecture.
- [x] Data model.
- [x] Frontend specification.
- [x] Security requirements.
- [x] Performance/visual review.
- [x] QA checklist.
- [x] README with commands and deployment notes.
- [x] Taste Skill reference notes.

## Stage 7. Final review

- [x] Visual consistency review.
- [x] Performance review.
- [x] Security review.
- [x] Accessibility review.
- [x] Review animation intensity for government/professional use.
- [x] Check dark mode contrast and palette.
- [x] Check route coverage against PRD frontend page inventory.
- [x] Run dependency install and final build.
- [x] Run final browser smoke test after dependency install.
- [x] Package final zip.

## Stage 8. Deferred backend plan

- [ ] .NET 10 API.
- [ ] SQL Server schema and EF Core migrations.
- [ ] Identity and authorization policies.
- [ ] File/object storage.
- [ ] Barcode generation service.
- [ ] Issue/return transactional workflows.
- [ ] OCR worker.
- [ ] Full-text search.
- [ ] Semantic/vector search.
- [ ] AI retrieval with permission filtering.
- [ ] Large-import/reconciliation workers.
- [ ] Reports worker.
- [ ] SignalR operational updates.
- [ ] Production monitoring and DR.

## Stage 9. Post-delivery dependency correction

- [x] Reproduce the reported `ERR_PNPM_FETCH_404` dependency failure from the delivered manifest.
- [x] Verify the supplied GitHub repository `chenglou/pretext`.
- [x] Remove the invalid `@shipitandpray/pretext-masonry` dependency.
- [x] Upgrade the project to the published `@chenglou/pretext` package line.
- [x] Replace the third-party masonry import with the project-owned `PretextMasonry` component backed by Pretext text measurement.
- [x] Move ESLint from the end-of-life ESLint 9 line to ESLint 10.
- [x] Update the Prettier/formatting documentation to reflect the corrected dependency.
- [x] Re-run source-level manifest, import and JavaScript syntax checks.
- [x] Repackage the corrected frontend.
- [x] Run `pnpm install`, `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` in an environment with npm registry access.

## Stage 10. Verify pipeline repair and legacy gap closure

- [x] Repair the broken verify chain: `format:check`, `lint` and `typecheck` all
      failed on `main` (`eslint-plugin-react-refresh` config API, a renamed
      Phosphor icon, node globals missing from the scripts config, and a
      formatter target that did not exist).
- [x] Add the service layer: contracts, localStorage-backed store, role
      permission matrix, one implementation module per aggregate.
- [x] Close all eleven gaps in `docs/LEGACY-GAP-REPORT.md`.
- [x] Remove Firebase: dependency, `src/lib/firebase.ts`,
      `src/services/firestore.ts`, `.env.example` and the stale `manualChunks`
      entry. Inquiry and media links are local-only.
- [x] Replace the CSS-barcode placeholder with a real Code 128 set-B encoder,
      payload grammar and scan-validation page.
- [x] Add tests for the encoder, the CSV writer and every service guard
      (64 tests across 4 files).
- [x] Route-level code splitting; no bundle chunk over 500 kB.
- [x] Update `README.md`, `record-room-frontend/README.md`,
      `docs/FRONTEND-SPEC.md` and `AGENTS.md` to match the build.
