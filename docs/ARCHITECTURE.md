# Architecture

## Frontend

- React + TypeScript + Vite.
- Tailwind CSS v4.
- Motion for small UI transitions.
- Phosphor Icons for a single icon family.
- React Router for application routes.
- TanStack Query is installed as the server-state boundary for later API integration.
- SVG is used for the physical room visualization.

## Backend target

The intended production backend remains:

`React -> ASP.NET Core Web API (.NET 10) -> Application -> EF Core 10 -> SQL Server`

with:

- Redis for cache/coordination.
- Background worker for OCR, imports, indexing, large reports and notifications.
- File/object storage for PDFs and scans.
- SignalR where real-time operational updates improve the workflow.

## Firebase boundary in this frontend build

`src/services/firestore.ts` contains narrow methods for inquiries and media-link metadata. Firebase initializes only when the Vite environment variables exist.

## Netlify

- `base: '/'` in Vite.
- `netlify.toml` defines the build command and SPA rewrite.
- `public/_redirects` is included as a second Netlify-compatible SPA fallback.
- Firebase environment variables should be configured in Netlify, never committed.

## Performance model

- Do not render the full 25-lakh-record collection in the browser.
- Use server-side pagination and filtering in the production API.
- Use virtualized tables/lists for high-volume screens.
- Use background jobs for large exports and digitization processing.
- Use stable SVG primitives instead of a 3D scene for the first room visualizer.
- Keep motion isolated to small components so scrolling does not cause broad React re-renders.
