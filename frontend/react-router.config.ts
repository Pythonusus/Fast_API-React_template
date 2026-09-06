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
 *    - Route `clientLoader` functions fetch backend data in the browser.
 *    - If backend is unavailable, routes should show local fallback/error UI
 *      instead of failing the whole page.
 */
export default {
  // Disable server-side rendering at request time.
  ssr: false,
  // Keep static generation for route shells and hydrate dynamic parts on client.
  prerender: ["/", "/about"],
} satisfies Config;
