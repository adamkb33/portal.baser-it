# Booking Contact Root Flow

## Scope

This document covers the root booking contact flow. The loader is shared, and the UI switches based on session and auth state.

## Preconditions

- Route is loaded for booking contact.
- `session` may be present (with or without `userId`).
- `authSession` may be present.

## Loader

1. Loader runs for the booking contact route.
2. `authService.getUserSession(request)` fails with `AuthenticationError` → `authSession = null`.
3. `getSession(request)` returns a session without `userId`.
4. Loader returns `{ session, authSession }`.

## Actions

- No actions run for this flow.

## UI

- Switch on session/auth state (refer to flow files):
  - If `session` exists and `session.userId` is missing and `authSession` is null:
    - Render `NoUserSessionNoAuthUserFlow`.
    - Refer to `booking-contact-flow_session-null_auth-null.md` for UI details.
