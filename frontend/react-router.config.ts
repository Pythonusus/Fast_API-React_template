import type { Config } from "@react-router/dev/config";

/**
 * Rendering strategy for this project:
 *
 * 1) No runtime SSR:
 *    - `ssr: false` means the app does not render pages on the server per request.
 *    - All route interactivity and dynamic data loading happen in the browser.
 *
 * 2) Static generation (SSG) for page shell:
 *    - `prerender` builds static HTML files for `/` and `/about` at build time.
 *    - This static HTML includes shared layout content like header/footer and
 *      static route text, so pages can load quickly.
 *
 * 3) Client-side rendering (CSR) for dynamic content:
 *    - Routes fetch backend data in the browser after hydration via `useEffect`.
 *    - If backend is unavailable, routes show local fallback/error UI
 *      instead of failing the whole page.
 */
export default {
  // Disable server-side rendering at request time.
  ssr: false,

  /**
   * Build-time static HTML for listed paths. With `ssr: false`, unlisted routes
   * still work as pure SPA navigations (no HTML file until the client renders).
   *
   * Add:
   * - Public marketing / content pages (home, about, docs landing, etc.)
   * - Routes whose shell/text is known at build time (layout, headings, nav)
   * - High-traffic entry URLs where first paint and SEO matter
   *
   * Do not add:
   * - Auth-only or personalized pages (dashboard, settings, profile)
   * - Routes with path/query params you cannot enumerate at build time
   *   (e.g. `/users/:id`, search results) unless you list every concrete URL
   * - Pages that must reflect live/private data in the initial HTML
   * - Error routes (404) — handled by the CSR because here you can add only solid urls,
   *   but for 404 page we need to handle unknown urls.
   * - Huge numbers of low-value URLs (slows builds; little SEO/UX gain)
   *
   * Tip: keep shells static here; load backend data after hydration (as home/about do).
   */
  prerender: ["/", "/about"],
} satisfies Config;
