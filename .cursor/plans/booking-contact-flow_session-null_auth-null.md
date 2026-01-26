# Booking Contact Flow: userSession=null, authUser=null

## Scope

This flow describes the booking contact route behavior when there is an empty session (no user attached) and no authenticated user.

## Preconditions

- `session` exists but has no `userId` (no session user attached).
- `authUser` is `null` (user is not signed in).

## Loader

1. Loader runs for the booking contact route.
2. `getSession(request)` returns a session without `userId`.
3. `authService.getUserSession(request)` fails with `AuthenticationError`.
4. Loader returns `{ session, authSession: null }`.

## Actions

- No actions run.

## UI

- Show provider sign-in button(s).
- Show a primary CTA to sign in to an existing account.
- Show a secondary CTA to create a new user.

## Notes

- No further data fetching occurs (requirements, session user, pending user, or auth user lookups).
