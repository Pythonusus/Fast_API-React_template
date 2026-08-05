import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

const backend_url = "http://localhost:8000";

export default defineConfig({
  // React Router plugin for SSG + CSR mode.
  // SSR is disabled in `react-router.config.ts`.
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "app"),
    },
  },

  // Development server configuration
  server: {
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
      "/openapi.json": {
        target: backend_url,
        changeOrigin: true,
      },
    },
  },
});
