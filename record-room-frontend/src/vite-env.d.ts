/// <reference types="vite/client" />

/**
 * No environment variables are required by this frontend build.
 *
 * The app runs entirely on the local service layer in `src/services`. The
 * .NET 10 API will need a base URL once it exists — add
 * `readonly VITE_API_BASE_URL?: string;` at that point, not before, so no
 * placeholder credential ships in the bundle.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
