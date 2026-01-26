# Booking Contact Flow: userSession=null, authUser=null

## Scope

This flow describes the booking contact route behavior when there is an empty session (no user attached) and no authenticated user.

## Preconditions

- `session` exists but has no `userId` (no session user attached).
- `authUser` is `null` (user is not signed in).

## Loader

## Actions

- Sign-in (provider):
  - Use `auth.signin` route with a `fetcher` id.
- Sign-up:
  - Use the `auth` sign-up route with a `fetcher` id.

## UI

- Show provider sign-in button(s).
- Show a primary CTA to sign in to an existing account.
- Show a secondary CTA to create a new user.

## Notes

- No further data fetching occurs (requirements, session user, pending user, or auth user lookups).
