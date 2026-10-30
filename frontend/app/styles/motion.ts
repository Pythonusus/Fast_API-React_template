/**
 * Single source for app motion timings.
 *
 * - JS timeouts import the ``*_MS`` constants.
 * - CSS uses ``var(--app-duration*)`` / ``var(--app-ease)`` from
 *   ``MOTION_ROOT_CSS``, injected once in ``root.tsx`` ``Layout``.
 *
 * Change values here only — both layers stay aligned.
 */

export const APP_DURATION_FAST_MS = 180;
export const APP_DURATION_MS = 220;
export const APP_DURATION_ENTER_MS = 350;
export const APP_STAGGER_MS = 45;
export const APP_EASE = "ease";

/** ``:root`` custom properties built from the constants above. */
export const MOTION_ROOT_CSS = `:root {
  --app-duration-fast: ${APP_DURATION_FAST_MS}ms;
  --app-duration: ${APP_DURATION_MS}ms;
  --app-duration-enter: ${APP_DURATION_ENTER_MS}ms;
  --app-stagger: ${APP_STAGGER_MS}ms;
  --app-ease: ${APP_EASE};
}`;
