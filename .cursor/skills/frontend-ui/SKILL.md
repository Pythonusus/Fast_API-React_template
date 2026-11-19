---
name: frontend-ui
description: >-
  Implement and restyle this repository's React Router frontend with Radix
  Themes. Use when building, changing, or reviewing pages, components, layout,
  color, type, motion, or dark mode under frontend/. Tokens and global styles
  stay in frontend/app/styles/. Custom CSS only when Radix Themes has no
  component or prop for the behavior.
---

# Frontend UI

## Stack

- React 19, React Router 8, Vite. Routes are files in `frontend/app/routes/`, wired from `frontend/app/routes.ts`.
- Components and layout primitives come from `@radix-ui/themes`. Icons come from `@radix-ui/react-icons`.
- Light and dark mode is `next-themes` (`attribute="class"`) plus the `Theme` provider in `frontend/app/root.tsx`. Read `resolvedTheme`, not `theme`, when deciding which icon or label to show.
- Do not add Tailwind, shadcn/ui, Phosphor, Heroicons, Lucide, GSAP, or a second component library.

## Radix first

Use a Themes component before writing markup. Common fits:

| Need | Use |
|---|---|
| Page frame, stack, grid | `Box`, `Flex`, `Grid`, `Container`, `Section` |
| Type and links | `Heading`, `Text`, `Link`, `Code` |
| Actions | `Button`, `IconButton` |
| Surfaces | `Card` via `CardBase` (`~/components/ui/card-base`) |
| Overlays | `Dialog`, `Popover`, `DropdownMenu`, `Tooltip`, `HoverCard` |
| Forms | `TextField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider` |
| Data | `Table`, `Tabs`, `Badge`, `Callout`, `Separator`, `ScrollArea` |

Spacing, radius, and type scale are props (`gap`, `p`, `size`, `radius`) or the matching Radix variables (`--space-*`, `--radius-*`, `--font-size-*`). Do not re-create those scales in CSS.

Write a custom element and a co-located stylesheet only when Themes has no component, and no prop, for the behavior. Say that limit in a short comment at the top of the CSS file, the way `card-base.css` does. Existing custom UI to extend rather than replace:

- `~/components/ui/card-base` — equal-height card, link color, hover scale
- `~/components/ui/pagination` — numbered pages plus optional "Show more"
- `~/components/ui/filter-toolbar` — icon buttons that open a `Popover`

## Folder tree

Keep this shape. Do not add `src/`, `components/ui/button.tsx` as a loose file, or a new global CSS entry.

```
frontend/app/
  root.tsx
  routes.ts
  styles/
    app.css            resets, font, layout defaults
    themes.css         light/dark Radix token overrides
    inner-html.css     shared prose for dangerouslySetInnerHTML
    motion.ts          durations shared by CSS variables and JS timeouts
  components/
    <feature>/
      index.tsx
      <feature>.css    only when Radix props are not enough
    ui/
      <name>/
        index.tsx
        <name>.css
  hooks/  api/  types/  utils/  common-texts/  assets/
```

- A reusable control with no feature knowledge goes in `components/ui/<name>/`.
- A feature (posts, header, footer) goes in `components/<feature>/`.
- Styles that exist only for one route sit next to that route: `routes/<route>.tsx` and `routes/<route>.css`.
- The module that owns the CSS imports it. Callers do not import the stylesheet.
- Import app code with the `~/` alias. Class names start with `app-`.

## Tokens and global styles

Change color, surface, and accent only in `frontend/app/styles/themes.css`.

- Override Radix tokens (`--color-background`, `--color-panel-solid`, `--color-surface`, `--accent-*`) on `:root .radix-themes` and `:root.dark .radix-themes`.
- A new custom variable uses a Radix color token (`var(--gray-5)`, `var(--accent-9)`), not a raw hex, unless the value is a Radix background or overlay token that Themes already treats as a literal.
- Do not create `tokens.json`, `tokens.css`, `design-system/`, or `MASTER.md` for this app.

Other global files, and only these:

| File | Holds |
|---|---|
| `frontend/app/styles/app.css` | Resets and the default font family |
| `frontend/app/styles/inner-html.css` | Prose for CMS HTML (`app-inner-html`) |
| `frontend/app/styles/motion.ts` | `--app-duration*`, `--app-ease`, and the matching `*_MS` constants |

`root.tsx` already imports the stylesheets and injects `MOTION_ROOT_CSS`. A new global file needs a reason that those four files cannot hold, and an import next to the existing ones.

Motion in component CSS uses `var(--app-duration)`, `var(--app-duration-fast)`, `var(--app-duration-enter)`, `var(--app-stagger)`, and `var(--app-ease)`. Honor `prefers-reduced-motion`.

Icons in product UI are `@radix-ui/react-icons`. Do not install another icon package for app chrome.

Look and anti-generic polish is `frontend-taste`, and only when the user explicitly asks for it. Ordinary pages, restyles, and control tweaks stay in this skill.
