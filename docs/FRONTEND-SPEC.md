# Frontend implementation specification

## Route inventory

### Core

- `/` dashboard
- `/search` record search and locate
- `/rooms` room explorer
- `/rooms/:roomId` visual room detail
- `/files` file registry
- `/files/new` create file
- `/files/:fileId` file detail

### Operations

- `/issue` issue desk
- `/return` return desk
- `/movement` movement log
- `/barcodes` barcode center

### Digitization

- `/digitization` batch list
- `/digitization/:batchId` batch detail
- `/reports` reports and exports

### Administration

- `/admin/users`
- `/admin/locations`
- `/admin/audit`
- `/admin/media`
- `/settings`

### Support

- `/support`

## Shared behavior

- Desktop sidebar plus mobile drawer.
- Sticky topbar with global search affordance.
- Dark mode with a grey-blue dark palette, not pure black.
- Back-to-top button appears after scrolling and hides near the top.
- `prefers-reduced-motion` reduces animation intensity.
- Every key page includes loading/error/empty-state concepts in its production design notes.

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
