import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const backend_url = "http://localhost:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Resolve aliases for the project
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "."),
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
