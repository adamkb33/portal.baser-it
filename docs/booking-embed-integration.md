# Booking Embed Integration

This document explains how to embed the public booking flow in an external page, how the session starts, which browser messages the embed sends to the parent page, and how styling is controlled through booking tokens.

## Entry Point

Use the `/embed` route as the integration entry point:

```html
<iframe
  id="pitell-booking"
  src="https://YOUR_PORTAL_DOMAIN/embed?companyId=123&theme=pitell"
  title="Bestill time"
  style="width: 100%; border: 0; min-height: 720px"
></iframe>
```

Required query parameters:

| Parameter | Required | Description |
| --- | --- | --- |
| `companyId` | Yes | Numeric company id for the company whose booking flow should start. Must be a positive integer. |

Optional query parameters:

| Parameter | Values | Description |
| --- | --- | --- |
| `theme` | `pitell`, `ocean`, `sunset`, `forest` | Selects a built-in embed theme. Defaults to `pitell`. |
| `start` | `contact` | Reserved start-step parameter. Only `contact` is currently valid. |
| `reset` | `1` | Clears the existing appointment session before starting a new one. Use this when a host page has a "start over" action. |

Invalid or missing values return a `400` response with a small error payload. A valid request redirects to:

```text
/booking/public/appointment/session?companyId=123
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

When the booking flow is running inside an iframe, it posts messages to the parent page:

| Message type | Payload | When it fires |
| --- | --- | --- |
| `embed:ready` | `{ type, mode }` | Once, when the embedded booking shell is active. |
| `embed:step-changed` | `{ type, step, path }` | On route changes inside the public booking flow. |
| `embed:resize` | `{ type, height }` | When the embedded content height changes. |

Recommended host page script:

```html
<iframe
  id="pitell-booking"
  src="https://YOUR_PORTAL_DOMAIN/embed?companyId=123&theme=ocean"
  title="Bestill time"
  style="width: 100%; border: 0; min-height: 720px"
></iframe>

<script>
  const iframe = document.getElementById('pitell-booking');
  const expectedOrigin = 'https://YOUR_PORTAL_DOMAIN';

  window.addEventListener('message', (event) => {
    if (event.origin !== expectedOrigin) return;

    const message = event.data;
    if (!message || typeof message !== 'object') return;

    if (message.type === 'embed:resize' && Number.isFinite(message.height)) {
      iframe.style.height = `${message.height}px`;
    }

    if (message.type === 'embed:step-changed') {
      console.debug('Booking step changed:', message.step, message.path);
    }
  });
</script>
```

Always validate `event.origin` in production before trusting a message.

## Cookie Requirements

The embed route sets two short-lived cookies:

| Cookie | Purpose | Max age |
| --- | --- | --- |
| `embed_mode` | Enables the compact embedded booking shell. | 4 hours |
| `embed_theme` | Stores the selected built-in theme key. | 4 hours |

On HTTPS requests these cookies are emitted with `SameSite=None; Secure`, which is required for cross-site iframe usage. On non-HTTPS local requests they are emitted with `SameSite=Lax` for local development.

The appointment flow also uses `appointment_session` for the booking session id. It is currently configured as `SameSite=Lax`, so fully third-party cross-site iframe deployments should be tested carefully. Same-site embeds, same parent domain, or same-site subdomain deployments are the safest configuration with the current cookie policy.

## Styling Model

External pages cannot directly style the contents of a cross-origin iframe. The supported styling surface is token-based:

1. The host page chooses a theme through `/embed?theme=...`.
2. The app stores that theme in `embed_theme`.
3. `app/routes/booking/public/booking.public.layout.tsx` applies the selected token map to the booking public layout.
4. Booking components consume semantic Tailwind classes backed by CSS variables.

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

| Theme | Description |
| --- | --- |
| `pitell` | Default app styling. Uses the base design tokens. |
| `ocean` | Light blue background and blue action color. |
| `sunset` | Warm peach background and red-orange action color. |
| `forest` | Light green background and green action color. |

Example:

```html
<iframe src="https://YOUR_PORTAL_DOMAIN/embed?companyId=123&theme=forest"></iframe>
```

## Adding A Custom Theme

To add a customer-specific theme, update `app/lib/embed-shell.ts`.

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
  } as CSSProperties,
};
```

Then embed with:

```html
<iframe src="https://YOUR_PORTAL_DOMAIN/embed?companyId=123&theme=customer"></iframe>
```

## Token Reference

These are the main tokens used by the embedded booking flow.

Base semantic tokens:

| Token | Use |
| --- | --- |
| `--color-background` | Main page background. |
| `--color-surface` | Cards, panels, and muted UI surfaces. |
| `--color-border` | Borders and separators. |
| `--color-text-primary` | Primary readable text. |
| `--color-text-secondary` | Secondary text, descriptions, metadata. |
| `--color-text-inverse` | Text on dark or action backgrounds. |
| `--color-interactive` | Primary actions and selected states. |
| `--color-interactive-hover` | Hover state for primary actions. |
| `--color-secondary` | Secondary accents used in derived appointment colors. |

Booking aliases from `app/styles/booking-tokens.css`:

| Alias | Resolves to |
| --- | --- |
| `--color-booking-background` | `--color-background` |
| `--color-booking-surface` | `--color-surface` |
| `--color-booking-surface-muted` | `--color-surface` |
| `--color-booking-border` | `--color-border` |
| `--color-booking-text` | `--color-text-primary` |
| `--color-booking-text-muted` | `--color-text-secondary` |
| `--color-booking-text-inverse` | `--color-text-inverse` |
| `--color-booking-action` | `--color-interactive` |
| `--color-booking-action-hover` | `--color-interactive-hover` |
| `--color-booking-action-contrast` | `--color-text-inverse` |

Use booking aliases in booking UI classes when adding new booking components:

```tsx
<button className="bg-booking-action text-booking-action-contrast hover:bg-booking-action-hover">
  Fortsett
</button>
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
