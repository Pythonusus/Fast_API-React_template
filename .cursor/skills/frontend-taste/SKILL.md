---
name: frontend-taste
description: >-
  Anti-generic look and copy for this repository's Radix Themes frontend.
  Use ONLY when the user explicitly asks for frontend-taste, "use taste",
  "polish the UI", "make it less generic", or "anti-slop". Do not use for
  ordinary frontend work, bug fixes, or small control tweaks — those stay
  on frontend-ui alone. Stack, folders, tokens, and Radix-first rules stay
  in the frontend-ui skill.
---

# Frontend taste

Read `.agents/skills/frontend-ui/SKILL.md` first and follow it for stack, folders, and tokens. This skill only decides look, structure, and copy. It is advice layered on Radix Themes — not a second design system.

Do not add a reference kit, deal script, browser gate, starter HTML, shader pack, Tailwind, shadcn, GSAP, a new font, a new icon set, `tokens.json`, or a `design-system/` folder.

A small edit to an existing control is out of scope. Finish with `frontend-ui` and stop.

## This repo first

- Implement with `@radix-ui/themes` props and `frontend/app/styles/themes.css`. Custom CSS only when Themes has no component or prop for the behavior (same rule as `frontend-ui`).
- Match the density of the nearest existing screen (posts list, post detail, home). An app page is not a marketing site.
- One primary action per view. Secondary actions stay quiet (`variant="ghost"`, `IconButton`).
- Color and accent changes go in `themes.css` as Radix token overrides. No raw hex palette inventing, no violet/lavender accent drift.
- Motion uses `var(--app-duration)`, `var(--app-duration-fast)`, `var(--app-duration-enter)`, `var(--app-stagger)`, and `var(--app-ease)`. Honor `prefers-reduced-motion`.

## Look (anti-generic)

- The screen should read as this product's job, not a template that could move to another product by renaming the title.
- A row of equal cards, each an icon plus a heading plus a sentence, is the default generic layout. Use a card row only for real records of the same kind (posts, files). Do not invent three feature slots to fill a grid.
- Do not wrap every region in a `Card`. Structure follows the task: list, detail, filter, form, dialog.
- Tables, tabs, and toolbars use Radix `Table` and `Tabs` and the existing `filter-toolbar`. Do not build a second dashboard kit.
- Equal left and right content edges. Prefer `Container` / `Flex` / `Grid` alignment over one-sided offsets, staggered columns, or decorative asymmetry.
- One composition per section: one purpose, one heading, usually one short supporting sentence.
- No glassmorphism stacks, gradient meshes, glow blobs, or display-font hero treatments unless the user explicitly asked for a marketing landing *and* those effects can be done with existing tokens and co-located CSS — still no new libraries.

## Copy

- Name the job the screen does. If the real sentence is unknown, keep the existing copy or ask.
- Headings use nouns that name the thing. Buttons are a verb plus an object.
- One hard fact on the first screen when the page sells or explains something; otherwise state what the user can do here.
- Do not use: seamless, elevate, unlock, empower, cutting-edge, next-gen, "welcome to", "your all-in-one", leverage, robust, streamline, delight, magic.
- Do not invent reviews, customers, metrics, or testimonials.
- An empty state says what is missing and the one action that fills it.

## Images and icons

- Use a real image or none. No abstract blobs, no stock "team collaborating", no fake product screenshots.
- Prefer the real product UI in the frame (this app's own screens) over mood photography.
- No caption or apologetic label under an image. Credits, if any, stay in one quiet footer line.
- Icons are `@radix-ui/react-icons`, and they are controls. Do not put a decorative icon in a circle above a heading. Do not add Lucide, Phosphor, Heroicons, or full-colour brand icon packs.

## Motion

- One hover response on the thing that can be clicked (button, link, linked card). Quiet: opacity, color, or a small translate — not tilt, parallax, scroll-jacking, or load-in choreography on app screens.
- Linked cards may lift slightly (as `CardBase` already does). Do not add timed tab carousels or looping card theatres.
- No fade-in-on-scroll for every section. No motion that hides content under `prefers-reduced-motion`.

## Landing pages (only when the user asks)

When the user explicitly wants a landing or marketing page:

- First viewport: brand or product name as the hero signal, one headline, one short supporting sentence, one CTA group, one dominant visual (real product UI or a real photograph). No stats strip, schedule, or secondary promo cluster in the first viewport.
- One idea on the first screen. Equal left and right edges. No caption under the hero image. No detached badges or promo chips on the hero.
- Output is still a route and components in the `frontend-ui` tree (Radix Themes + co-located CSS). Do not scaffold a parallel static site kit.

## Before finishing

- If the layout could move to another product without changing the words, rewrite the copy and the structure.
- If the change added a library, a font, a raw hex, Tailwind, shadcn, or a new global CSS file, remove it and use `frontend-ui`.
- The first screen does one job. The next job is navigation or the next real section, not a second hero.
- Check contrast and focus: Radix controls keep visible focus; custom CSS must not remove it.
