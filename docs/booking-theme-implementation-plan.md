# Booking Theme Implementation Plan

This document defines how to create, review, and ship a client-specific theme for the embedded public booking flow.

The booking flow must be themed through semantic CSS tokens. Components should not branch on a client name, and new booking UI should not use app-level color classes directly when a booking-specific token exists.

## Goal

A client theme should make the embedded booking flow feel native to the client's marketing site while preserving booking readability, accessibility, and interaction clarity.

The theme should control:

- Outer embed canvas.
- Booking cards and form surfaces.
- Text hierarchy.
- Borders and separators.
- Border widths.
- Button, field, card, panel, and badge radii.
- Card, panel, and floating action bar shadows.
- Primary actions.
- Hover, active, selected, and focus states.
- Small accent details.

The theme should not require:

- Duplicating booking components.
- Adding client-specific component logic.
- Injecting CSS from the host website into the iframe.
- Passing theme query parameters through every booking route.

## Current Theme Entry Points

Theme allowlist and token maps live in:

```text
app/lib/embed-shell.ts
```

Booking semantic token defaults live in:

```text
app/styles/booking-tokens.css
```

The selected embed theme is validated at `/embed`, stored in the path-scoped `embed_config` cookie, and applied by the root layout for `/embed/*` routes.

## Theme Naming

Use a stable, lowercase, URL-safe key:

```text
client-name
client-location-brand
fredrikstad-barbershop
```

Rules:

- Use lowercase kebab-case.
- Do not use spaces, uppercase letters, or special characters.
- Prefer a durable business or brand name over temporary campaign names.
- Keep the key stable after publishing because client iframe snippets may depend on it.

## Required Code Changes

To add a client theme:

1. Create a client theme file under `app/lib/embed-themes`.
2. Export the theme as a `CSSProperties` object.
3. Import the theme in `app/lib/embed-shell.ts`.
4. Add the theme key to `EMBED_THEME_KEYS`.
5. Add a human-readable label to `EMBED_THEME_LABELS`.
6. Add the imported theme to `EMBED_THEME_TOKENS`.
7. Use the new key in the iframe URL: `/embed?companyId=123&theme=client-name`.
8. Run typecheck and build.
9. Visually test the embedded contact, employee, service, time, overview, and success steps.

Example:

```text
app/lib/embed-themes/client-name.ts
```

```ts
import type { CSSProperties } from 'react';

export const clientNameTheme = {
  '--color-background': '#ffffff',
  '--color-surface': '#f7f5fb',
  '--color-border': '#ded6ea',
  '--color-text-primary': '#18111f',
  '--color-text-secondary': '#63576f',
  '--color-text-disabled': '#81768d',
  '--color-text-inverse': '#ffffff',
  '--color-primary': '#5b2ad6',
  '--color-primary-hover': '#4d21bd',
  '--color-primary-active': '#3f199f',
  '--color-primary-contrast': '#ffffff',
  '--color-interactive': '#5b2ad6',
  '--color-interactive-hover': '#4d21bd',
  '--color-interactive-active': '#3f199f',
  '--color-secondary': '#b8892f',

  '--color-booking-background': 'transparent',
  '--color-booking-surface': '#fffdf8',
  '--color-booking-surface-muted': '#f7f2fc',
  '--color-booking-surface-raised': '#fffdf8',
  '--color-booking-surface-subtle': '#fbf8ff',
  '--color-booking-surface-strong': '#efe5fb',
  '--color-booking-border': '#ded6ea',
  '--color-booking-border-strong': '#c5addf',
  '--color-booking-text': '#18111f',
  '--color-booking-text-muted': '#63576f',
  '--color-booking-action': '#5b2ad6',
  '--color-booking-action-hover': '#4d21bd',
  '--color-booking-action-muted': '#eee6ff',
  '--color-booking-action-ring': 'rgb(91 42 214 / 0.35)',
  '--color-booking-action-contrast': '#ffffff',
  '--color-booking-accent': '#b8892f',
  '--color-booking-accent-muted': '#f4ead8',

  '--radius-control': '9999px',
  '--radius-field': '14px',
  '--radius-card': '20px',
  '--radius-panel': '28px',
  '--radius-booking-control': '9999px',
  '--radius-booking-field': '14px',
  '--radius-booking-card': '20px',
  '--radius-booking-panel': '28px',

  '--border-control': '1px',
  '--border-card': '1px',
  '--border-selected': '3px',
  '--border-focus-ring': '3px',
  '--border-booking-control': '1px',
  '--border-booking-card': '1px',
  '--border-booking-selected': '3px',
  '--border-booking-focus-ring': '3px',

  '--shadow-card': '0 12px 34px rgb(91 42 214 / 0.10)',
  '--shadow-panel': '0 20px 56px rgb(91 42 214 / 0.14)',
  '--shadow-floating': '0 22px 70px rgb(91 42 214 / 0.18)',
  '--shadow-booking-card': '0 12px 34px rgb(91 42 214 / 0.10)',
  '--shadow-booking-panel': '0 20px 56px rgb(91 42 214 / 0.14)',
  '--shadow-booking-floating': '0 22px 70px rgb(91 42 214 / 0.18)',
} as CSSProperties;
```

Then register the imported theme:

```ts
import { clientNameTheme } from './embed-themes/client-name';

export const EMBED_THEME_KEYS = [
  'pitell',
  'ocean',
  'sunset',
  'forest',
  'fredrikstad-barbershop',
  'client-name',
] as const;

export const EMBED_THEME_LABELS: Record<EmbedThemeKey, string> = {
  pitell: 'Pitell',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
  'fredrikstad-barbershop': 'Fredrikstad Barbershop',
  'client-name': 'Client Name',
};

export const EMBED_THEME_TOKENS: Record<EmbedThemeKey, CSSProperties> = {
  // Existing themes...
  'client-name': clientNameTheme,
};
```

## Token Reference

These tokens are the theme contract for the booking flow.

The runtime implementation uses CSS custom properties because they inherit through the embedded booking subtree and can be overridden from one validated theme object. This follows the web platform model for custom properties and keeps the iframe safe: the host website chooses an allowlisted theme, while the booking app owns and sanitizes the actual token values. If tokens later need to move between Figma/design tooling and code, keep a parallel `.tokens.json` source shaped like the Design Tokens Community Group format and generate the CSS properties from it.

### Base App Tokens

Base tokens keep generic app components readable if they appear inside the embed.

| Token | Required | Use |
| --- | --- | --- |
| `--color-background` | Recommended | Generic page background fallback. |
| `--color-surface` | Recommended | Generic cards, panels, and muted surfaces. |
| `--color-border` | Recommended | Generic borders and separators. |
| `--color-overlay-surface` | Optional | Dialog/popover surface when used inside embed. |
| `--color-overlay-border` | Optional | Dialog/popover border when used inside embed. |
| `--color-text-primary` | Recommended | Generic primary text. |
| `--color-text-secondary` | Recommended | Generic secondary text. |
| `--color-text-disabled` | Optional | Disabled or low-emphasis text. |
| `--color-text-inverse` | Recommended | Text on dark/action backgrounds. |
| `--color-primary` | Recommended | Generic primary brand color. |
| `--color-primary-hover` | Recommended | Generic primary hover state. |
| `--color-primary-active` | Recommended | Generic primary active state. |
| `--color-primary-contrast` | Recommended | Text/icon color on primary backgrounds. |
| `--color-interactive` | Recommended | Generic links, selected states, and action controls. |
| `--color-interactive-hover` | Recommended | Generic interactive hover state. |
| `--color-interactive-active` | Optional | Generic interactive active state. |
| `--color-secondary` | Recommended | Small accent color. |
| `--color-tertiary` | Optional | Additional accent color if the base UI needs it. |
| `--radius-control` | Recommended | Generic buttons and compact actions. |
| `--radius-field` | Recommended | Generic text fields and form controls. |
| `--radius-card` | Recommended | Generic cards. |
| `--radius-panel` | Recommended | Generic larger panels and grouped sections. |
| `--radius-badge` | Optional | Generic chips, counters, avatars, and pills. |
| `--border-control` | Recommended | Generic control border width. |
| `--border-card` | Recommended | Generic card and panel border width. |
| `--border-selected` | Recommended | Generic selected-state border width. |
| `--border-focus-ring` | Recommended | Generic focus ring width. |
| `--shadow-card` | Recommended | Generic card elevation. Use `none` for flat client sites. |
| `--shadow-panel` | Recommended | Generic panel elevation. |
| `--shadow-floating` | Recommended | Generic floating/sticky UI elevation. |

### Booking Tokens

Booking tokens are the preferred surface for client-specific booking styling.

| Token | Required | Use |
| --- | --- | --- |
| `--color-booking-background` | Yes | Outer embedded booking canvas. Use `transparent` or a neutral page-like color. |
| `--color-booking-surface` | Yes | Main booking panels, content sections, and normal card surfaces. |
| `--color-booking-surface-muted` | Yes | Secondary sections, grouped areas, and quiet blocks. |
| `--color-booking-surface-raised` | Yes | Cards/forms that need clearer separation from the page. |
| `--color-booking-surface-subtle` | Yes | Alternating rows, low-emphasis service cards, and soft highlights. |
| `--color-booking-surface-strong` | Yes | Selected or higher-emphasis non-action surfaces. |
| `--color-booking-border` | Yes | Normal booking borders and dividers. |
| `--color-booking-border-strong` | Yes | Selected card borders, active states, and important separators. |
| `--color-booking-text` | Yes | Main booking text. |
| `--color-booking-text-muted` | Yes | Descriptions, metadata, helper text, and secondary labels. |
| `--color-booking-text-inverse` | Recommended | Text on dark booking surfaces if needed. |
| `--color-booking-action` | Yes | Primary buttons, selected controls, progress states, and important links. |
| `--color-booking-action-hover` | Yes | Hover state for primary booking actions. |
| `--color-booking-action-muted` | Yes | Low-emphasis selected backgrounds, subtle action hints, and badges. |
| `--color-booking-action-ring` | Yes | Focus ring color. Must be visible on light and muted surfaces. |
| `--color-booking-action-contrast` | Yes | Text/icon color on `--color-booking-action`. |
| `--color-booking-accent` | Recommended | Small decorative or premium accent. Do not use as a large background. |
| `--color-booking-accent-muted` | Recommended | Quiet accent badges or soft accent panels. |
| `--color-booking-appointment-ongoing-surface` | Optional | Ongoing appointment state surface. |
| `--color-booking-appointment-ongoing-chip` | Optional | Ongoing appointment chip/badge. |
| `--color-booking-appointment-recent-surface` | Optional | Recent appointment state surface. |
| `--radius-booking-control` | Yes | Booking buttons, links, date/time chips, and compact controls. |
| `--radius-booking-field` | Yes | Booking inputs and media thumbnails. |
| `--radius-booking-card` | Yes | Booking service cards and summary blocks. |
| `--radius-booking-panel` | Yes | Booking grouped sections and sticky action bar shell. |
| `--radius-booking-badge` | Yes | Booking counters, avatars, and status pills. |
| `--border-booking-control` | Yes | Booking control border width. |
| `--border-booking-card` | Yes | Booking card and panel border width. |
| `--border-booking-selected` | Yes | Booking selected-state border width. |
| `--border-booking-focus-ring` | Yes | Booking focus ring width. |
| `--shadow-booking-card` | Yes | Booking card elevation. |
| `--shadow-booking-panel` | Yes | Booking larger panel elevation. |
| `--shadow-booking-floating` | Yes | Booking sticky/floating action bar elevation. |

## Theme Design Rules

Use these rules when choosing token values:

- Keep `--color-booking-background` transparent for seamless iframe embeds unless the client page needs a solid neutral canvas.
- Do not make form fields, cards, or important content containers transparent.
- Use near-white, brand-tinted, or soft neutral surfaces for readability.
- Primary action text must have strong contrast against `--color-booking-action`.
- Focus rings must be visible against `--color-booking-surface`, `--color-booking-surface-muted`, and `--color-booking-background`.
- Accent colors should be used for small badges, separators, icons, or highlights.
- Avoid large accent-color backgrounds unless the accent is also the primary action color.
- Do not use a heavy outer border or large shell shadow for embedded themes.
- Selected states should be obvious without relying on color alone. Pair color with borders, check icons, or labels where possible.

## Component Authoring Rules

When adding or refactoring booking UI, use booking tokens first.

Preferred examples:

```tsx
<section className="border border-booking-border bg-booking-surface text-booking-text">
  <p className="text-booking-text-muted">Velg en tjeneste</p>
</section>
```

```tsx
<button className="bg-booking-action text-booking-action-contrast hover:bg-booking-action-hover focus-visible:ring-booking-action-ring">
  Fortsett
</button>
```

Avoid these in booking flow components when a booking token exists:

```tsx
<div className="bg-background text-text-primary border-border" />
<button className="bg-primary text-primary-foreground" />
```

Allowed exceptions:

- Shared design-system primitives that intentionally consume base app tokens.
- Non-color layout classes such as spacing, sizing, display, and typography.
- Temporary migration code with a follow-up task in the implementation plan.

## Visual QA Checklist

Before shipping a new client theme, verify:

- Contact step is readable for logged-in and logged-out users.
- Sign-in, sign-up, verify email, and verify mobile forms are readable.
- Employee selection shows hover, selected, disabled, and empty states clearly.
- Service selection cards do not blend into the page background.
- Quantity controls remain legible in default, hover, selected, and disabled states.
- Multi-quantity warnings are visible without looking like errors.
- Time selection does not shift horizontally and selected times are obvious.
- Overview cards have enough separation between services, time, customer, and confirmation actions.
- Success/confirmation state feels complete and not detached from the host page.
- Focus states are visible using keyboard navigation.
- Button text is readable on primary action backgrounds.
- The iframe outer area does not render a large white or gray app shell behind the flow.

## Implementation Checklist

Use this checklist for every new client theme:

- [ ] Collect the client's brand colors, page background color, text colors, and button states.
- [ ] Decide whether the embed canvas should be `transparent` or a neutral page-like color.
- [ ] Define primary action, hover, active, and contrast colors.
- [ ] Define main, muted, raised, subtle, and strong booking surfaces.
- [ ] Define normal and strong booking borders.
- [ ] Define primary and muted booking text.
- [ ] Define focus ring color.
- [ ] Define accent and muted accent colors if the brand needs them.
- [ ] Add the theme key to `EMBED_THEME_KEYS`.
- [ ] Add the label to `EMBED_THEME_LABELS`.
- [ ] Add the complete token map to `EMBED_THEME_TOKENS`.
- [ ] Confirm `/embed?companyId=...&theme=...` accepts the theme.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Visually test the full booking flow in the embed.
- [ ] Test iframe resize behavior on the client page or a realistic host-page fixture.
- [ ] Update client integration documentation with the final iframe URL.

## Future Direction

The current implementation uses server-allowlisted theme presets. That is the safest model for production because token values are controlled by the app.

If client-controlled theming becomes necessary, the next step should be a constrained token override API:

- Keep the same booking token names.
- Validate allowed token keys server-side.
- Validate color formats server-side.
- Reject unsafe CSS values.
- Store approved token sets per company.
- Continue applying tokens at the embed root instead of inside individual components.

Do not allow arbitrary host-page CSS injection into the iframe.
