/*
Functions to fetch data from the backend.

Use relative URLs like ("/api/hello"):
- In development, Vite dev server receives this request and forwards it using
  `server.proxy` from `frontend/vite.config.js` (for `/api` prefix) to backend.
- In production, Vite proxy is not running. Nginx serves frontend files and
  reverse-proxies `/api/*` requests to the backend service.
*/

export async function fetchHello() {
  const response = await fetch("/api/hello");

  if (!response.ok) {
    throw new Error(`Failed to fetch hello message: ${response.status}`);
  }

  return response.json();
}
