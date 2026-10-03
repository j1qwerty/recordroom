# Record Room frontend

Frontend-first prototype for the Record Room Software digitization platform.

## What is included

- React + TypeScript + Vite
- Tailwind CSS v4
- Motion for restrained interaction animation
- `@chenglou/pretext` for measured masonry card distribution
- SVG record-room visualizer
- Search, file registry, file detail and location mapping
- Issue, return, movement and barcode workflows
- Digitization batch views
- Reports and administration pages
- Dark mode
- Ten lightweight SVG background motifs
- Firebase-ready inquiry and media-link storage
- External image URL preview/validation before Firestore save
- Netlify SPA configuration
- Comprehensive Markdown documentation under `docs/`

## Important scope boundary

This is the frontend-first phase. Mock data stands in for the eventual .NET 10 API. SQL Server, OCR, object storage, authentication, backend authorization and AI search are documented in `docs/` but are not shipped as backend services here.

## Prerequisites

- Node.js 22+
- pnpm 10+

To enable pnpm through Corepack after the source is complete:

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm --version
```

The project pins its package manager metadata to pnpm 10.15.0.

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Formatting

Format the complete source/document set:

```bash
pnpm format
```

Format one file or path:

```bash
pnpm format src/pages/SearchPage.tsx
pnpm format src/components
```

Check formatting without changing files:

```bash
pnpm format:check
```

The formatter uses Prettier and respects `.gitignore`.

## Other useful commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
pnpm clean
```

## Firebase setup

Copy `.env.example` to `.env.local` and add the Firebase web app values.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

The frontend uses Firestore only for lightweight data:

- `inquiries`
- `mediaAssets`

Do not put Firebase Admin SDK credentials or service-account JSON in the frontend project.

For image content, the frontend currently uses external image URLs. A user pastes a URL, the browser loads it for preview, and only after successful loading does the app allow the URL to be written to Firestore. Actual large-image/document storage should use a proper object-storage pipeline later.

## Netlify

`netlify.toml` already defines:

- `pnpm build` as the build command
- `dist` as the publish directory
- SPA fallback to `/index.html`
- Node 22

The Vite base path is `/`, which is the normal setup for a root Netlify site.

Set Firebase environment variables in Netlify Site configuration rather than committing them.

## Browser target

Use current evergreen Chromium, Firefox or Safari for development and testing. The app avoids browser-specific APIs for core workflows and has a reduced-motion path for accessibility.

## Design direction

This is a government/professional interface, so motion is subtle and functional. The visual system uses cool greys, a muted teal accent and a dark slate mode. It deliberately avoids pure-black backgrounds, heavy glassmorphism, neon gradients and distracting motion.

The design direction was informed by Taste Skill:

https://github.com/Leonxlnx/taste-skill

## Project documentation

Start with:

1. `docs/PRD.md`
2. `docs/PROJECT-SCOPE.md`
3. `docs/CLARIFICATIONS.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA-MODEL.md`
6. `docs/FRONTEND-SPEC.md`
7. `docs/IMPLEMENTATION-TODO.md`
8. `docs/SECURITY.md`
9. `docs/PERFORMANCE-AND-UX-REVIEW.md`
10. `docs/QA.md`

## Frontend routes

The frontend includes dashboard, global search, room explorer, room map, files, file detail, file creation, issue, return, movement, barcodes, digitization batches, reports, users/roles, location designer, audit, media/content, settings and support/inquiry.

## Pretext and masonry

The project uses the official `@chenglou/pretext` package from https://github.com/chenglou/pretext. A local `PretextMasonry` component uses Pretext text measurement for responsive card height estimates. The previously referenced `@shipitandpray/pretext-masonry` package has been removed because it does not exist in the npm registry.

## Production next step

Connect the exact frontend contracts to the documented .NET 10 backend architecture, then replace mock collections with paginated API endpoints. Keep file/document authorization server-side.
