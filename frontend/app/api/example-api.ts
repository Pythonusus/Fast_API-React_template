/*
Functions to fetch data from the backend.

Use relative URLs like ("/api/hello"):
- In development, Vite dev server receives this request and forwards it using
  `server.proxy` from `frontend/vite.config.js` (for `/api` prefix) to backend.
- In production, Vite proxy is not running. Nginx serves frontend files and
  reverse-proxies `/api/*` requests to the backend service.
*/

import type { TextResponse } from "~/types/api";

export const fetchHello = async (): Promise<TextResponse> => {
  const response = await fetch("/api/hello");

  if (!response.ok) {
    throw new Error(`Failed to fetch hello message: ${response.status}`);
  }

  return response.json() as Promise<TextResponse>;
};

export const fetchAbout = async (): Promise<TextResponse> => {
  const response = await fetch("/api/about");

  if (!response.ok) {
    throw new Error(`Failed to fetch about message: ${response.status}`);
  }

  return response.json() as Promise<TextResponse>;
};

export const fetchMirror = async (message: string): Promise<TextResponse> => {
  const response = await fetch("/api/mirror", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch mirror message: ${response.status}`);
  }

  return response.json() as Promise<TextResponse>;
};
