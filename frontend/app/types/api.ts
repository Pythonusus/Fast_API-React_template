/**
 * Shared TypeScript types for backend API contracts.
 *
 * This file (and others under `app/types/`) holds types that cross module
 * boundaries — typically request/response shapes used by `app/api/*` and
 * consumed by hooks, routes, or multiple components.
 *
 * What to add under `app/types/`:
 * - Backend DTO / JSON payload shapes (e.g. `TextResponse`, `User`, `Paginated<T>`)
 * - Shared domain unions/enums used in more than one feature
 * - Types imported by both API clients and UI (keeps contracts in one place)
 *
 * Prefer small focused files (`api.ts`, `user.ts`, …) over one giant barrel.
 * Re-export from an `index.ts` only if import paths become noisy.
 *
 * What to keep near components (or routes/hooks) instead:
 * - Props for a single component (`HeaderProps`, card item props)
 * - Local UI state shapes used only inside that module
 * - Event-handler / form-field types private to one form
 * - Anything unused outside its owning folder — colocate to avoid a dumping ground
 *
 * Rule of thumb: if only one component/file imports it, keep it next to that
 * file; if `app/api` or two+ features need it, put it here.
 */

/** Generic `{ message: string }` body returned by the example FastAPI endpoints. */
export type TextResponse = { message: string };
