/**
 * Frontend application configuration.
 *
 * Custom values come from the repo-root `.env` (see `.env.example`).
 * Vite loads that file via `envDir` in `vite.config.ts`.
 * Only keys that start with `VITE_` are exposed on `import.meta.env`.
 *
 * Vite also always injects these built-ins — do not put them in `.env`:
 * - `import.meta.env.DEV` — `true` while `npm run dev` / non-production `NODE_ENV`
 * - `import.meta.env.PROD` — opposite of `DEV` (production `NODE_ENV`)
 * - `import.meta.env.MODE` — Vite mode string (`development`, `production`, …)
 * - `import.meta.env.BASE_URL` — app base path from Vite's `base` option
 * - `import.meta.env.SSR` — `true` during server render (false in this CSR app)
 *
 * Docs: https://vite.dev/guide/env-and-mode
 */

// Vite built-in: `true` for `npm run dev`, `false` for `npm run build`.
export const DEVELOPMENT = import.meta.env.DEV;

// HTML lang attribute to use for the document.
export const HTML_LANG = import.meta.env.VITE_HTML_LANG || "ru-RU";

// Default page size for ``GET /api/posts`` list pagination.
// Keep this ≤ ``POSTS_MAX_PAGE_SIZE``.
// Planned: move to ``VITE_POSTS_PAGE_SIZE`` once env wiring is ready.
export const POSTS_PAGE_SIZE = 12;

// Backend ``limit`` upper bound from ``Query(..., le=100)``.
export const POSTS_MAX_PAGE_SIZE = 100;
