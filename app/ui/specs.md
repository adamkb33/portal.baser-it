# Design System Rulebook

> Version 1.0 — Absolute rules. No exceptions. No deviation.

---

## 0. Philosophy

This is a **zero-variance design system**. Every visual decision is made once, recorded here, and applied consistently everywhere. There is no room for interpretation, personal preference, or one-off styling. When in doubt, the answer is always: look it up here first, and if it is not here, do not build it until it is added to this document.

The aesthetic direction is **minimal and ultra-clean** — whitespace is structure, not emptiness. Decoration is banned unless it serves a direct functional purpose.

---

## 1. Token System

All tokens are defined in a single `app/styles/tokens.css` file using Tailwind v4's `@theme` block. This file is the **single source of truth** for every visual value in the project. Nothing that is not in `@theme` is used.

### 1.1 The Token File

```css
/* app/styles/tokens.css */
@import 'tailwindcss';

@theme {
  /* ─── Colors ──────────────────────────────────── */
  --color-black: #0a0a0a;
  --color-gray-950: #111111;
  --color-gray-900: #1a1a1a;
  --color-gray-800: #2c2c2c;
  --color-gray-700: #3d3d3d;
  --color-gray-600: #545454;
  --color-gray-500: #737373;
  --color-gray-400: #9a9a9a;
  --color-gray-300: #bebebe;
  --color-gray-200: #d4d4d4;
  --color-gray-100: #e8e8e8;
  --color-gray-50: #f5f5f5;
  --color-white: #fafafa;

  /* ─── Semantic Color Aliases ──────────────────── */
  --color-background: var(--color-white);
  --color-surface: var(--color-gray-50);
  --color-border: var(--color-gray-100);
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-500);
  --color-text-disabled: var(--color-gray-300);
  --color-text-inverse: var(--color-white);
  --color-interactive: var(--color-black);
  --color-interactive-hover: var(--color-gray-800);

  /* ─── Spacing ─────────────────────────────────── */
  --spacing-px: 1px;
  --spacing-0-5: 2px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-20: 80px;
  --spacing-24: 96px;
  --spacing-32: 128px;

  /* ─── Typography ──────────────────────────────── */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --leading-tight: 1.2;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  --tracking-tight: -0.02em;
  --tracking-normal: 0em;
  --tracking-wide: 0.04em;
  --tracking-widest: 0.1em;

  /* ─── Border Radius ───────────────────────────── */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* ─── Border Width ────────────────────────────── */
  --border-thin: 1px;
  --border-medium: 2px;

  /* ─── Shadows ─────────────────────────────────── */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px 0 rgb(0 0 0 / 0.08);
  --shadow-lg: 0 8px 24px 0 rgb(0 0 0 / 0.1);

  /* ─── Transitions ─────────────────────────────── */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-slow: 250ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  /* ─── Z-index ─────────────────────────────────── */
  --z-base: 0;
  --z-raised: 10;
  --z-overlay: 100;
  --z-modal: 200;
  --z-toast: 300;

  /* ─── Layout ──────────────────────────────────── */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1440px;
}
```

### 1.2 Token Rules

- **Rule T-1:** Every value used in a component must map to a token. If the value does not exist as a token, add the token first, then use it.
- **Rule T-2:** Arbitrary Tailwind values (square bracket syntax, e.g. `w-[340px]`) are **banned** with zero exceptions.
- **Rule T-3:** Never define colors, spacing, or sizing inline. Only Tailwind utility classes generated from `@theme` tokens are used.
- **Rule T-4:** Adding a new token requires a comment in the token file explaining why it exists. No silent additions.

---

## 2. Color System

The palette is **monochrome only**. There is no accent color, no brand color, and no color used for decorative purposes.

### 2.1 Semantic Usage Map

| Token               | When to use                                                |
| ------------------- | ---------------------------------------------------------- |
| `background`        | Page backgrounds only                                      |
| `surface`           | Cards, panels, inputs — anything raised off the background |
| `border`            | All borders, dividers, separators                          |
| `text-primary`      | All primary body copy and headings                         |
| `text-secondary`    | Supporting text, metadata, captions, labels                |
| `text-disabled`     | Disabled or inactive text                                  |
| `text-inverse`      | Text on dark/filled backgrounds                            |
| `interactive`       | Buttons (filled), active states, links                     |
| `interactive-hover` | Hover state of interactive elements                        |

### 2.2 Color Rules

- **Rule C-1:** Only semantic color tokens are applied in components. Raw scale values (e.g. `gray-700`) are never used directly in component JSX.
- **Rule C-2:** No color is used for meaning (no red for error, no green for success). States are communicated through text and iconography alone.
- **Rule C-3:** No gradients. No transparency effects. No blur (backdrop-filter). No color overlays.
- **Rule C-4:** Dark mode is not in scope. Do not add `dark:` variants.

---

## 3. Typography

The project uses a **single font: Inter**. It is loaded via Google Fonts. No other font is ever introduced.

### 3.1 Type Scale

Only the following size + weight + leading combinations are permitted. Each has a single defined purpose:

| Role         | Size   | Weight     | Leading   | Tracking | Usage                             |
| ------------ | ------ | ---------- | --------- | -------- | --------------------------------- |
| `display`    | `5xl`  | `semibold` | `tight`   | `tight`  | Hero headlines, page titles       |
| `heading-lg` | `3xl`  | `semibold` | `tight`   | `tight`  | Section headings                  |
| `heading-md` | `2xl`  | `semibold` | `snug`    | `normal` | Card headings, modal titles       |
| `heading-sm` | `xl`   | `medium`   | `snug`    | `normal` | Sub-headings                      |
| `body-lg`    | `lg`   | `regular`  | `relaxed` | `normal` | Lead paragraphs                   |
| `body`       | `base` | `regular`  | `normal`  | `normal` | All body copy                     |
| `body-sm`    | `sm`   | `regular`  | `normal`  | `normal` | Secondary copy, descriptions      |
| `label`      | `sm`   | `medium`   | `normal`  | `wide`   | Form labels, tags, table headers  |
| `caption`    | `xs`   | `regular`  | `normal`  | `wide`   | Metadata, timestamps, footnotes   |
| `overline`   | `xs`   | `medium`   | `normal`  | `widest` | Section eyebrows, category labels |

### 3.2 Typography Rules

- **Rule TY-1:** Only combinations from the table above are used. No one-off size or weight combinations.
- **Rule TY-2:** No italic text except inside native browser elements (e.g. `<blockquote>`).
- **Rule TY-3:** No underline except for inline links within body copy.
- **Rule TY-4:** Text alignment is `left` by default. `center` is permitted only in empty states and hero sections. `right` is permitted only in table number columns.
- **Rule TY-5:** Maximum line length (measure) is `65ch` for body copy.
- **Rule TY-6:** `font-sans` is set globally on `<body>` and never repeated on individual components.

---

## 4. Spacing & Layout

The spacing scale uses a **4px base unit**. Every margin, padding, and gap value must be a multiple of 4.

### 4.1 Layout Rules

- **Rule SP-1:** The page has one centered container with a max-width of `container-xl` (1280px) and horizontal padding of `spacing-6` (24px) on mobile, `spacing-8` (32px) on tablet and up.
- **Rule SP-2:** All layout is built with CSS Grid or Flexbox via Tailwind. No absolute positioning for layout purposes (only for overlays and decorative elements).
- **Rule SP-3:** Section vertical rhythm uses only `spacing-16`, `spacing-20`, or `spacing-24` as top/bottom padding. Nothing else.
- **Rule SP-4:** Component internal padding uses only `spacing-4`, `spacing-6`, or `spacing-8`. Never mix different padding values on the same axis of one element.
- **Rule SP-5:** Gaps between grid/flex children use only `spacing-2`, `spacing-4`, `spacing-6`, or `spacing-8`.

### 4.2 Grid System

The layout grid is **12 columns**. Column counts per breakpoint:

| Breakpoint     | Columns |
| -------------- | ------- |
| `sm` (< 768px) | 4       |
| `md` (768px+)  | 8       |
| `lg` (1024px+) | 12      |

- **Rule SP-6:** Content regions never span odd column counts (no 3, 5, 7, 9, 11 span values).
- **Rule SP-7:** No nested grids deeper than 2 levels.

---

## 5. Borders & Surfaces

### 5.1 Rules

- **Rule B-1:** Borders use `border-thin` (1px) and `border` color token only. `border-medium` (2px) is reserved for focus rings exclusively.
- **Rule B-2:** Border radius follows a strict mapping by component type:
  - Inputs, selects, textareas → `radius-sm`
  - Cards, panels, modals, dropdowns → `radius-md`
  - Pills, tags, badges → `radius-full`
  - Buttons → `radius-sm`
  - Page-level containers → `radius-none`
- **Rule B-3:** No decorative borders. A border is only added when it separates distinct interactive or content regions.
- **Rule B-4:** Shadows use `shadow-sm` for hover elevation, `shadow-md` for raised cards, `shadow-lg` for modals and overlays. Shadows are never stacked.

---

## 6. Motion & Transitions

Motion is subtle and functional. It confirms interactions — it does not entertain.

### 6.1 Permitted Transitions

| Interaction      | Property                                     | Duration       | Easing         |
| ---------------- | -------------------------------------------- | -------------- | -------------- |
| Button hover     | `background-color`, `color`                  | `fast` (100ms) | `ease-default` |
| Link hover       | `color`                                      | `fast` (100ms) | `ease-default` |
| Input focus      | `border-color`, `box-shadow`                 | `fast` (100ms) | `ease-default` |
| Dropdown open    | `opacity`, `transform` (translateY -4px → 0) | `base` (150ms) | `ease-out`     |
| Modal open       | `opacity`, `transform` (scale 0.97 → 1)      | `slow` (250ms) | `ease-out`     |
| Page transition  | `opacity`                                    | `slow` (250ms) | `ease-out`     |
| Toast enter/exit | `opacity`, `transform` (translateY)          | `base` (150ms) | `ease-out`     |

### 6.2 Motion Rules

- **Rule M-1:** Only `opacity` and `transform` are animated. Never animate `height`, `width`, `padding`, `margin`, or `color` alone.
- **Rule M-2:** No looping animations. No keyframe animations except loading spinners.
- **Rule M-3:** Loading spinners use a single `spin` animation at 600ms linear loop.
- **Rule M-4:** All transitions respect `prefers-reduced-motion`. Wrap all motion in a `motion-safe:` Tailwind variant.
- **Rule M-5:** Staggered animations (e.g. list items fading in) are not permitted. Every element enters at the same time.

---

## 7. Atomic Hierarchy

The project uses the classic five-level atomic design model. Each level has strict rules on what it may contain.

### 7.1 Folder Structure

```
app/
├── components/
│   ├── atoms/          # Primitive, single-purpose UI elements
│   ├── molecules/      # Compositions of atoms with a single function
│   ├── organisms/      # Complex, self-contained UI sections
│   └── templates/      # Page layout shells with slot regions
├── routes/             # React Router v7 route files (pages)
│   └── [route-name]/
│       ├── route.tsx   # The route component (page)
│       └── [route-specific organisms if needed]
├── styles/
│   └── tokens.css      # The @theme token file — only CSS file in the project
└── lib/                # Utilities, hooks, non-UI logic
```

### 7.2 Atom Rules

An atom is a **single HTML element** with no children that are other components.

- **Permitted atoms:** Button, Input, Label, Textarea, Select, Checkbox, Radio, Badge, Avatar, Icon, Divider, Spinner, Link, Text (typography wrapper)
- **Rule A-1:** An atom renders a single root element. No wrappers unless the wrapper is semantically required (e.g. a label wrapping an input).
- **Rule A-2:** Atoms accept only these prop categories: `variant`, `size`, `disabled`, `className` (for layout overrides from parent only — never for style overrides), and native HTML attributes.
- **Rule A-3:** Atoms contain no business logic and no data fetching.
- **Rule A-4:** Atoms never have internal margin. Spacing between atoms is always the responsibility of the parent.
- **Rule A-5:** An atom's `className` prop may only be used to pass layout-related classes from the parent (`w-full`, `col-span-6`, etc.). Style overrides via className are banned.

### 7.3 Molecule Rules

A molecule is a **functional composition of 2–5 atoms** that does one thing.

- **Permitted molecules:** FormField (label + input + error), SearchBar, Card (header + body), NavItem, MenuItem, Stat, AvatarGroup, InputGroup, EmptyState
- **Rule MO-1:** A molecule contains only atoms and other molecules. Never an organism.
- **Rule MO-2:** A molecule has a single, describable function (e.g. "a labeled input with validation feedback").
- **Rule MO-3:** A molecule may have local state (e.g. toggle open/closed) but no server state and no side effects.
- **Rule MO-4:** Molecules are never more than 80 lines of JSX.

### 7.4 Organism Rules

An organism is a **self-contained, reusable section** of the UI.

- **Permitted organisms:** Navbar, Sidebar, DataTable, Form, Modal, CommandMenu, PageHeader, FilterBar, Notification, Toast
- **Rule OR-1:** Organisms may contain atoms, molecules, and other organisms.
- **Rule OR-2:** Organisms may accept server data as props or call hooks internally. They may have side effects.
- **Rule OR-3:** An organism maps to a single user-facing concept (e.g. "the navigation bar" or "the data table"). If it cannot be named in 3 words it is too large.
- **Rule OR-4:** Organisms are never copy-pasted between routes. If an organism is needed in two places, it lives in `components/organisms/` and is imported in both.

### 7.5 Template Rules

A template is a **layout shell** that defines regions for organisms and has no content of its own.

- **Rule TP-1:** Templates contain no text, data, or atoms. They contain only layout elements (`div`, `main`, `aside`, etc.) and organism slot props.
- **Rule TP-2:** Every page must use exactly one template. Pages do not define their own layout.
- **Rule TP-3:** Templates are not route-specific. A template is reusable across multiple pages.
- **Permitted templates:** `DefaultLayout` (navbar + main content), `SidebarLayout` (navbar + sidebar + content), `AuthLayout` (centered single-column), `BlankLayout` (no chrome)

### 7.6 Page Rules

A page is a **route component** that lives in `app/routes/`. It composes one template and fills it with organisms.

- **Rule PG-1:** Pages live in `app/routes/[route-name]/route.tsx`.
- **Rule PG-2:** A page's only job is to: select a template, fetch or pass data, and compose organisms within that template. No layout code in a page.
- **Rule PG-3:** Pages never import atoms or molecules directly. They compose organisms only.
- **Rule PG-4:** Page files are never longer than 120 lines. If they are, organisms need to be extracted.
- **Rule PG-5:** Every page has a loader/action in the same `route.tsx` file (React Router v7 convention). Data logic does not leak into organisms.

---

## 8. Component Authoring Rules

These rules apply to all components at every level.

- **Rule CA-1:** One component per file. File name matches component name exactly (PascalCase).
- **Rule CA-2:** No inline styles (`style={{}}`). Ever.
- **Rule CA-3:** No Tailwind `!important` modifier (`!`-prefixed classes).
- **Rule CA-4:** `cn()` (a classnames/clsx utility) is the only way to conditionally apply classes.
- **Rule CA-5:** Components never set their own `width` or `margin`. Sizing and external spacing is the parent's responsibility.
- **Rule CA-6:** Every interactive component has a visible focus state using `focus-visible:ring-2 focus-visible:ring-interactive`.
- **Rule CA-7:** Every image has an explicit `alt` attribute.
- **Rule CA-8:** Components have no default `export default`. All exports are named exports.

---

## 9. Adding New Design to the Project

Before any new UI work begins, answer these questions in order:

1. **Does a token exist for this value?** → If no, add it to `tokens.css` first.
2. **Does a component exist for this element?** → If no, determine its atomic level and build it.
3. **Does a template exist for this layout?** → If no, build the template before building the page.
4. **Is this a one-off style?** → If yes, it is not permitted. Generalise it or do not build it.

### 9.1 Checklist for a New Atom

- [ ] Single root element
- [ ] No internal margin
- [ ] Accepts `variant` and `size` props if applicable
- [ ] Visible focus state implemented
- [ ] Uses only token-based Tailwind classes
- [ ] File is named in PascalCase and is a named export

### 9.2 Checklist for a New Molecule

- [ ] Contains only atoms
- [ ] Has a single describable function
- [ ] Under 80 lines of JSX
- [ ] No server state or side effects
- [ ] Named as a noun ("FormField", not "RenderFormField")

### 9.3 Checklist for a New Organism

- [ ] Maps to a single user-facing concept
- [ ] Composable (accepts content via props, not hardcoded)
- [ ] Does not duplicate an existing organism
- [ ] Named as a noun

### 9.4 Checklist for a New Page

- [ ] Uses exactly one template
- [ ] Imports organisms only (no atoms or molecules)
- [ ] Under 120 lines
- [ ] Loader/action defined in the same file
- [ ] Route file follows `app/routes/[name]/route.tsx` convention

---

## 10. What Is Banned

The following are explicitly prohibited at all times:

| Banned                                     | Reason                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| Arbitrary Tailwind values `w-[340px]`      | Breaks token system                                  |
| Custom CSS files (other than `tokens.css`) | Tailwind-only rule                                   |
| `@apply` in any CSS file                   | Tailwind v4 deprecates it; styles live in components |
| Inline `style={{}}` props                  | Bypasses token system                                |
| Colors outside the monochrome scale        | Visual variance                                      |
| Any font other than Inter                  | Visual variance                                      |
| Gradients                                  | Decorative                                           |
| `backdrop-filter` / blur effects           | Decorative                                           |
| `dark:` variants                           | Out of scope                                         |
| Staggered animations                       | Out of scope                                         |
| Looping animations (except spinner)        | Distracting                                          |
| `!important` classes                       | Specificity wars                                     |
| Hardcoded hex/rgb values                   | Use tokens                                           |
| `default export` in component files        | Inconsistent imports                                 |
| Nesting grid more than 2 levels deep       | Layout complexity                                    |

---

_This document is the design contract for the project. Any deviation requires updating this document first and reaching team consensus before implementation._
