/*
Frontend application configuration.
Check the .env.example file in the root directory for more information.
*/

export const DEVELOPMENT =
  (import.meta.env.DEVELOPMENT ?? "").toLowerCase() === "true";
