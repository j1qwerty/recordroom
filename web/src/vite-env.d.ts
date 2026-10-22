/// <reference types="vite/client" />

/**
 * `VITE_API_MODE` selects the service implementation: `local` (default) uses the
 * in-memory adapter, `http` talks to the .NET 10 API.
 *
 * `VITE_API_BASE_URL` is read only in `http` mode. Neither is required: with no
 * `.env` file the app runs entirely on the local service layer.
 *
 * There is deliberately no Firebase configuration here. See AGENTS.md.
 */
interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'local' | 'http';
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
