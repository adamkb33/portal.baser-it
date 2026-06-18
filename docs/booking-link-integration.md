# Booking Link Integration

Client sites should link users to the public booking flow on our website. Booking no longer runs inside an iframe.

## Link Format

Use this URL format:

```txt
https://portal.pitell.no/booking/public/appointment/session?companyId=123&theme=fredrikstad-barbershop&reset=1
```

Parameters:

- `companyId` is required. It identifies the company the booking session should be created for.
- `theme` is optional. It applies the client theme and is persisted in the first-party `booking_context` cookie for the booking flow.
- `reset=1` is optional. Use it when the link should always start a fresh booking session.

## Theme Keys

Allowed theme keys:

- `pitell`
- `ocean`
- `sunset`
- `forest`
- `fredrikstad-barbershop`

If `theme` is omitted, the booking flow uses the current `booking_context` theme when present, otherwise `pitell`.

## Adding A Client Theme

To add a client-specific theme:

1. Add the theme tokens under `app/lib/booking-themes`.
2. Register the key in `BOOKING_THEME_KEYS` in `app/lib/booking-theme.ts`.
3. Add the label in `BOOKING_THEME_LABELS`.
4. Add the token map in `BOOKING_THEME_TOKENS`.
5. Use the new key in the client link as `theme=<key>`.

## Removed Embed Flow

Old `/embed` URLs and iframe integrations are removed. Clients should replace iframe snippets with a normal link or button to the booking URL.
