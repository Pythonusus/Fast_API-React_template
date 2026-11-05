import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

// Host `npm run dev` talks to a backend on localhost:8000 (`make start-backend`).
// compose.dev.yaml sets DEV_BACKEND_URL to the backend container.
const backend_url = process.env.DEV_BACKEND_URL ?? "http://localhost:8000";

// Presigned URLs use /s3/ on this dev server. compose.dev.yaml points the
// proxy at the minio container. Host dev falls back to a local MinIO.
const s3_url = process.env.DEV_S3_URL ?? "http://localhost:9000";

export default defineConfig({
  // React Router plugin for SSG + CSR mode.
  // SSR is disabled in `react-router.config.ts`.
  plugins: [reactRouter()],
  // Load `.env` / `.env.*` from the repo root (shared with backend & compose).
  // Only keys prefixed with `VITE_` are exposed to client code.
  envDir: path.resolve(import.meta.dirname, ".."),
  // Allows to use `~` as a shortcut for `src/app` in imports.
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "app"),
    },
  },

  // Development server configuration
  server: {
    // compose.dev.yaml sets this so file events cross the Docker bind mount.
    // Host `npm run dev` keeps native filesystem watches.
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
    },
    proxy: {
      // Proxy API requests to backend in dev mode
      "/api": {
        target: backend_url,
        changeOrigin: true,
      },
      "/metrics": {
        target: backend_url,
        changeOrigin: true,
      },
      "/docs": {
        target: backend_url,
        changeOrigin: true,
      },
      "/redoc": {
        target: backend_url,
        changeOrigin: true,
      },
      "/openapi.json": {
        target: backend_url,
        changeOrigin: true,
      },
      // Must match backend.app.settings.admin_url_prefix.
      // In a real app, use a less obvious path (same as settings + nginx)
      // to cut bot noise scanning /admin. Not a security control.
      // changeOrigin stays off. Starlette redirects /admin to /admin/
      // using the Host header. With changeOrigin, that Host is
      // backend:8080 and the browser is sent somewhere it cannot open.
      "/admin": {
        target: backend_url,
        changeOrigin: false,
      },
      // Must match the /s3/ prefix of S3_PUBLIC_URL in compose.dev.yaml.
      // changeOrigin stays off: SigV4 is signed for the browser Host
      // (localhost:5173), and MinIO checks that header.
      // The rewrite strips /s3 so MinIO sees the path that was signed.
      "/s3": {
        target: s3_url,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/s3/, ""),
      },
    },
  },
});
