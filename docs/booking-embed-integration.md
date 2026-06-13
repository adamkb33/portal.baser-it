# Booking Embed Integration

This document explains how to embed the public booking flow in an external page, how the session starts, which browser messages the embed sends to the parent page, and how styling is controlled through booking tokens.

## Entry Point

Use the `/embed` route as the integration entry point:

```html
<iframe
  id="pitell-booking"
  src="https://YOUR_PORTAL_DOMAIN/embed?companyId=1&theme=fredrikstad-barbershop&parentOrigin=https%3A%2F%2FCLIENT_DOMAIN"
  title="Bestill time"
  scrolling="no"
  style="display: block; width: 100%; height: 720px; border: 0; overflow: hidden"
></iframe>
```

Required query parameters:

| Parameter   | Required | Description                                                                                     |
| ----------- | -------- | ----------------------------------------------------------------------------------------------- |
| `companyId` | Yes      | Numeric company id for the company whose booking flow should start. Must be a positive integer. |

Optional query parameters:

| Parameter | Values                                                          | Description                                                                                                             |
| --------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `theme`   | `fredrikstad-barbershop`, `pitell`, `ocean`, `sunset`, `forest` | Selects a built-in embed theme. Defaults to `pitell`.                                                                   |
| `start`   | `contact`                                                       | Reserved start-step parameter. Only `contact` is currently valid.                                                       |
| `reset`   | `1`                                                             | Clears the existing appointment session before starting a new one. Use this when a host page has a "start over" action. |

Invalid or missing values return a `400` response with a small error payload. A valid request stores the validated embed config and redirects to:

```text
/embed/booking/appointment/session?companyId=1
```

The session route then validates that the company is booking-ready, creates or reuses an appointment session, and redirects the user to the contact step.

## Booking Flow

The embedded public booking flow is linear:

1. `contact` - identify, sign in, sign up, or verify the booking user.
2. `employee` - select the booking profile or employee.
3. `select-services` - select one or more services.
4. `select-time` - select date and time.
5. `overview` - review and confirm the booking.
6. `success` - confirmation page after the appointment is created.

The session state is stored server-side and referenced by the `appointment_session` cookie.

## Parent Page Resize Handling

Use `scrolling="no"` on the iframe and let the parent page own scrolling. The embedded booking flow measures its content and posts messages to the parent page:

| Message type         | Payload                          | When it fires                                                                       |
| -------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `embed:ready`        | `{ type, path }`                 | Once, when the embedded booking shell is active.                                    |
| `embed:step-changed` | `{ type, path }`                 | On route changes inside the embedded booking flow.                                  |
| `embed:resize`       | `{ type, path, height, reason }` | When the embedded content height changes. `reason` is `init`, `step`, or `content`. |

The raw iframe cannot resize itself without a parent-page listener. Browser security prevents iframe content from directly changing the parent DOM, so the listener below is required to avoid double scrolling.

Recommended host page script:

```html
<iframe
  id="pitell-booking"
  src="https://YOUR_PORTAL_DOMAIN/embed?companyId=1&theme=fredrikstad-barbershop&parentOrigin=https%3A%2F%2FCLIENT_DOMAIN"
  title="Bestill time"
  scrolling="no"
  style="display: block; width: 100%; height: 720px; border: 0; overflow: hidden"
></iframe>

<script>
  const iframe = document.getElementById('pitell-booking');
  const expectedOrigin = 'https://YOUR_PORTAL_DOMAIN';

  window.addEventListener('message', (event) => {
    if (event.origin !== expectedOrigin) return;

    const message = event.data;
    if (!message || typeof message !== 'object') return;

    if (message.type === 'embed:resize' && Number.isFinite(message.height)) {
      iframe.style.height = `${Math.max(320, message.height)}px`;
    }

    if (message.type === 'embed:step-changed') {
      iframe.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
</script>
```

Always validate `event.origin` in production before trusting a message.

## Cookie Requirements

Embed mode is route-based under `/embed/*`; cookies are not used to decide whether the global app shell is hidden.

The selected theme is stored in a short-lived, path-scoped config cookie so child actions and redirects do not need to keep appending `theme=...` to every URL.

| Cookie         | Purpose                                                      | Scope                          |
| -------------- | ------------------------------------------------------------ | ------------------------------ |
| `embed_config` | Stores validated embed configuration, currently `{ theme }`. | `Path=/embed`, 4 hour max age. |

This avoids leaking embed state into normal public routes while still preserving the selected theme through back/forward navigation, form submissions, and server redirects.

The appointment flow uses `appointment_session` for the booking session id. Cross-site iframe deployments require this cookie to be emitted with `SameSite=None; Secure` in embed mode. See [portal-embed-cookie-fix-spec.md](portal-embed-cookie-fix-spec.md) for the portal-side implementation spec.

## Styling Model

External pages cannot directly style the contents of a cross-origin iframe. The supported styling surface is token-based:

1. The host page chooses a theme through `/embed?theme=...`.
2. The app validates the theme key against the allowlist.
3. The app stores the selected theme in `embed_config` scoped to `/embed`.
4. The root embed surface applies the selected token map as CSS custom properties.
5. Booking components consume semantic Tailwind classes backed by those CSS variables.

The client website cannot override classes inside a cross-origin iframe directly. To make each client feel native, add a validated theme preset that maps the client's brand to semantic tokens for color, radius, border width, focus rings, and elevation. Keep Pitell as the default `pitell` theme.

Built-in theme presets live in:

```text
app/lib/embed-shell.ts
```

The shared token layers live in:

```text
app/styles/tokens.css
app/styles/booking-tokens.css
```

## Available Embed Themes

| Theme                    | Description                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pitell`                 | Default app styling. Uses the base design tokens.                                                                                                             |
| `ocean`                  | Light blue background and blue action color.                                                                                                                  |
| `sunset`                 | Warm peach background and red-orange action color.                                                                                                            |
| `forest`                 | Light green background and green action color.                                                                                                                |
| `fredrikstad-barbershop` | Seamless marketing-site embed theme with transparent outer canvas, charcoal surfaces, warm gold actions, and square controls matching Fredrikstad Barbershop. |

Example:

```html
<iframe
  src="https://YOUR_PORTAL_DOMAIN/embed?companyId=1&theme=fredrikstad-barbershop&parentOrigin=https%3A%2F%2FCLIENT_DOMAIN"
></iframe>
```

## Adding A Custom Theme

To add a customer-specific theme, update `app/lib/embed-shell.ts`.

For the full client theme implementation process, token contract, and QA checklist, see [booking-theme-implementation-plan.md](booking-theme-implementation-plan.md).

1. Add the theme key to `EMBED_THEME_KEYS`.
2. Add a readable label to `EMBED_THEME_LABELS`.
3. Add a token map to `EMBED_THEME_TOKENS`.
4. Use the new theme key in the iframe URL.

Example:

```ts
export const EMBED_THEME_KEYS = ['pitell', 'ocean', 'sunset', 'forest', 'customer'] as const;

export const EMBED_THEME_LABELS: Record<EmbedThemeKey, string> = {
  pitell: 'Pitell',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
  customer: 'Customer',
};

export const EMBED_THEME_TOKENS: Record<EmbedThemeKey, CSSProperties> = {
  // existing themes...
  customer: {
    '--color-background': '#ffffff',
    '--color-surface': '#f7f8fa',
    '--color-border': '#d8dde6',
    '--color-text-primary': '#172033',
    '--color-text-secondary': '#5f6b7a',
    '--color-interactive': '#0057b8',
    '--color-interactive-hover': '#004a9d',
    '--radius-control': '9999px',
    '--radius-field': '12px',
    '--radius-card': '18px',
    '--radius-panel': '24px',
    '--border-control': '1px',
    '--border-card': '1px',
    '--border-selected': '3px',
    '--shadow-card': '0 10px 30px rgb(0 87 184 / 0.10)',
    '--shadow-panel': '0 18px 48px rgb(0 87 184 / 0.14)',
  } as CSSProperties,
};
```

Then embed with:

```html
<iframe src="https://YOUR_PORTAL_DOMAIN/embed?companyId=1&theme=customer"></iframe>
```

## Token Reference

These are the main tokens used by the embedded booking flow.

Base semantic tokens:

| Token                       | Use                                                   |
| --------------------------- | ----------------------------------------------------- |
| `--color-background`        | Main page background.                                 |
| `--color-surface`           | Cards, panels, and muted UI surfaces.                 |
| `--color-border`            | Borders and separators.                               |
| `--color-text-primary`      | Primary readable text.                                |
| `--color-text-secondary`    | Secondary text, descriptions, metadata.               |
| `--color-text-inverse`      | Text on dark or action backgrounds.                   |
| `--color-interactive`       | Primary actions and selected states.                  |
| `--color-interactive-hover` | Hover state for primary actions.                      |
| `--color-secondary`         | Secondary accents used in derived appointment colors. |
| `--radius-control`          | Generic button/action radius.                         |
| `--radius-field`            | Generic input radius.                                 |
| `--radius-card`             | Generic card radius.                                  |
| `--radius-panel`            | Generic panel radius.                                 |
| `--border-control`          | Generic control border width.                         |
| `--border-card`             | Generic card border width.                            |
| `--border-selected`         | Generic selected-state border width.                  |
| `--border-focus-ring`       | Generic focus ring width.                             |
| `--shadow-card`             | Generic card shadow.                                  |
| `--shadow-panel`            | Generic panel shadow.                                 |
| `--shadow-floating`         | Generic sticky/floating UI shadow.                    |

Booking aliases from `app/styles/booking-tokens.css`:

| Alias                             | Resolves to                 |
| --------------------------------- | --------------------------- |
| `--color-booking-background`      | `--color-background`        |
| `--color-booking-surface`         | `--color-surface`           |
| `--color-booking-surface-muted`   | `--color-surface`           |
| `--color-booking-border`          | `--color-border`            |
| `--color-booking-text`            | `--color-text-primary`      |
| `--color-booking-text-muted`      | `--color-text-secondary`    |
| `--color-booking-text-inverse`    | `--color-text-inverse`      |
| `--color-booking-action`          | `--color-interactive`       |
| `--color-booking-action-hover`    | `--color-interactive-hover` |
| `--color-booking-action-contrast` | `--color-text-inverse`      |
| `--radius-booking-control`        | `--radius-control`          |
| `--radius-booking-field`          | `--radius-field`            |
| `--radius-booking-card`           | `--radius-card`             |
| `--radius-booking-panel`          | `--radius-panel`            |
| `--radius-booking-badge`          | `--radius-badge`            |
| `--border-booking-control`        | `--border-control`          |
| `--border-booking-card`           | `--border-card`             |
| `--border-booking-selected`       | `--border-selected`         |
| `--border-booking-focus-ring`     | `--border-focus-ring`       |
| `--shadow-booking-card`           | `--shadow-card`             |
| `--shadow-booking-panel`          | `--shadow-panel`            |
| `--shadow-booking-floating`       | `--shadow-floating`         |

Use booking aliases in booking UI classes when adding new booking components:

```tsx
<button className="bg-booking-action text-booking-action-contrast hover:bg-booking-action-hover">Fortsett</button>
```

For surfaces and selectable cards:

```tsx
<div className="border border-booking-border bg-booking-surface text-booking-text">
  <p className="text-booking-text-muted">Velg en tjeneste</p>
</div>
```

## Host Page Styling

The host page should style only the iframe container and surrounding layout:

```css
.booking-frame-shell {
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
}

.booking-frame-shell iframe {
  display: block;
  width: 100%;
  border: 0;
}
```

Internal colors, borders, surfaces, and selected states should be controlled by embed themes and booking tokens, not by trying to inject CSS into the iframe.

## Operational Checklist

Before publishing an embed:

- Confirm the `companyId` belongs to a booking-ready company.
- Use HTTPS for production iframe embeds.
- Validate parent-page `message` events by origin.
- Wire `embed:resize` so the iframe height follows the booking content.
- Choose one of the built-in themes or add a customer-specific token preset.
- Test contact, employee, service, time, overview, success, and restart behavior.
- Test cookies in the real deployment topology, especially if the iframe is embedded on a different registrable domain.
