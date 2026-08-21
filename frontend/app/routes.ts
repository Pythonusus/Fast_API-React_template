/**
 * Frontend route manifest used by React Router.
 *
 * This module exports the full route table for the app as a `RouteConfig`.
 * - `index("routes/home.tsx")` registers the root (`/`) index route.
 * - The object route registers `/about` and maps it to `routes/about.tsx`.
 *
 * Keep this file focused on route declarations only; route UI and data-loading
 * logic should live inside each route module under `app/routes/`.
 */

import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  {
    path: "about",
    file: "routes/about.tsx",
  },
] satisfies RouteConfig;
