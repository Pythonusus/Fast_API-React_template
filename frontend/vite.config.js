import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Serve the dist folder in production, because it is mounted in backend.
  // During development, we serve the frontend from the root folder.
  // This is needed for hot reloading to work
  base: process.env.NODE_ENV === 'production' ? '/dist/' : '/',
  build: {
    target: 'es2022', // Support top-level await
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022', // Support top-level await for dependencies
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), '.'),
    },
  },
  // Development server configuration
  server: {
    proxy: {
      // Proxy API requests to backend in dev mode
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/process': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
