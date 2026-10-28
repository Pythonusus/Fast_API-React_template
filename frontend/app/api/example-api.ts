/*
Functions to fetch data from the backend.

Use relative URLs like ("/api/hello"):
- In development, Vite dev server receives this request and forwards it using
  `server.proxy` from `frontend/vite.config.js` (for `/api` prefix) to backend.
- In production, Vite proxy is not running. Nginx serves frontend files and
  reverse-proxies `/api/*` requests to the backend service.
*/

import { parseResponseJson } from "~/api/parse-json";
import { fetchDataError } from "~/common-texts/errors";
import { textResponseSchema, type TextResponse } from "~/types/api";

// Fetch hello message from the backend.
export const fetchHello = async (
  signal?: AbortSignal,
): Promise<TextResponse> => {
  const response = await fetch("/api/hello", { signal });

  if (!response.ok) {
    throw new Error(fetchDataError(response.status));
  }

  return parseResponseJson(response, textResponseSchema);
};

// Fetch about message from the backend.
export const fetchAbout = async (
  signal?: AbortSignal,
): Promise<TextResponse> => {
  const response = await fetch("/api/about", { signal });

  if (!response.ok) {
    throw new Error(fetchDataError(response.status));
  }

  return parseResponseJson(response, textResponseSchema);
};

// Send message to the backend mirror endpoint.
export const fetchMirror = async (
  message: string,
  signal?: AbortSignal,
): Promise<TextResponse> => {
  const response = await fetch("/api/mirror", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    throw new Error(fetchDataError(response.status));
  }

  return parseResponseJson(response, textResponseSchema);
};
