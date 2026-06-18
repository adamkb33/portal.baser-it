# Booking Route Migration Todo

Goal: remove the embedded booking flow completely and make the customer-facing booking flow live only on our own website routes. Client sites should link to our booking URL with the company and optional theme context.

Canonical entry URL:

```txt
/booking/public/appointment/session?companyId=123&theme=fredrikstad-barbershop&reset=1
```

## Target Route Ownership

- [ ] Each booking route file should own its own `loader`, `action`, and default component.
- [ ] Delete route factory wrappers such as `createBookingSelectServicesLoader({ surface })`.
- [ ] Delete route factory wrappers such as `createBookingSelectServicesAction({ surface })`.
- [ ] Move route-owned page components from `_features/booking/session/**` into their matching route files.
- [ ] Keep abstractions only when they are genuinely shared domain or UI code.
- [ ] Keep shared services/utilities where useful, for example appointment session service, contact auth service, step navigation helpers, and reusable booking UI.
- [x] Do not keep a public/embed surface abstraction after `/embed` is removed.

## Phase 1: Remove Embedded Route Surface

- [x] Remove `EMBEDDED_ROUTES` from `app/lib/routing/route-tree.ts`.
- [x] Delete `app/lib/routing/embedded/routes.ts`.
- [x] Delete the full `app/routes/embed` route folder.
- [x] Delete `tools/embed-harness/index.html`.
- [x] Remove `/embed` references from route tests and route-map tests.
- [x] Remove embed integration docs or rewrite them as route-link integration docs:
  - [x] `docs/booking-embed-integration.md`
  - [x] `docs/booking-theme-implementation-plan.md`

## Phase 2: Replace Embed Config With Booking Context

- [x] Rename `app/lib/embed-config.server.ts` to `app/lib/booking-context.server.ts`.
- [x] Replace `embed_config` cookie with `booking_context`.
- [x] Change cookie scope from `Path=/embed` to `Path=/booking`.
- [x] Use first-party cookie defaults:
  - [x] `httpOnly: true`
  - [x] `sameSite: 'lax'`
  - [x] `secure: process.env.NODE_ENV === 'production'`
  - [x] reasonable max age, for example 4 hours or 24 hours
- [x] Store only validated values in the cookie:
  - [x] `companyId`
  - [x] `theme`
- [x] Drop `parentOrigin`; it only existed for iframe `postMessage`.
- [x] Rename helpers:
  - [x] `parseEmbedConfig` -> `parseBookingContext`
  - [x] `serializeEmbedConfig` -> `serializeBookingContext`
  - [x] `resolveEmbedTheme` -> `resolveBookingTheme`
- [x] Replace `app/lib/embed-config.server.test.ts` with booking context cookie tests.

## Phase 3: Rename Theme Shell

- [x] Rename `app/lib/embed-shell.ts` to `app/lib/booking-theme.ts`.
- [x] Rename exported types/constants:
  - [x] `EmbedThemeKey` -> `BookingThemeKey`
  - [x] `EMBED_THEME_KEYS` -> `BOOKING_THEME_KEYS`
  - [x] `EMBED_THEME_LABELS` -> `BOOKING_THEME_LABELS`
  - [x] `EMBED_THEME_TOKENS` -> `BOOKING_THEME_TOKENS`
  - [x] `isEmbedThemeKey` -> `isBookingThemeKey`
- [x] Decide whether to rename `app/lib/embed-themes` to `app/lib/booking-themes`.
- [x] Update imports in root layout, context parser, tests, and docs.
- [x] Rename `app/lib/embed-shell.test.ts` to booking theme tests.

## Phase 4: Apply Theme On Booking Routes

- [x] Update `app/routes/_features/root.loader.ts`:
  - [x] Read booking context instead of embed config.
  - [x] Return `bookingTheme` and `bookingContext`.
  - [x] Remove `embedTheme` and `embedConfig`.
- [x] Update `app/routes/root.layout.tsx`:
  - [x] Remove `/embed` route detection.
  - [x] Add booking route detection for `/booking/public`.
  - [x] Apply `BOOKING_THEME_TOKENS[loaderData.bookingTheme]` on booking pages.
  - [x] Remove transparent embed shell behavior.
  - [x] Remove `data-embed-root`.
- [x] Update all consumers of `loaderData.embedTheme` and `loaderData.embedConfig`.

## Phase 5: Simplify Appointment Session Cookie

- [x] Update `app/routes/_features/booking/_services/booking.appointment-session.service.server.ts`.
- [x] Delete `isEmbedRequest`.
- [x] Delete `getAppointmentSessionCookieOptions`.
- [x] Remove `SameSite=None` and forced `Secure` iframe-specific behavior.
- [x] Always serialize `appointment_session` with the normal first-party cookie config.
- [x] Update session service tests.

## Phase 6: Collapse Booking Route Map

- [x] Delete `app/routes/_features/booking/_utils/booking.surface.ts`.
- [x] Update `app/routes/_features/booking/_utils/booking.route-map.ts`.
- [x] Remove embedded route IDs from `booking.route-map.ts`.
- [x] Remove `surface` argument from:
  - [x] `getBookingRouteMap`
  - [x] `getBookingRouteHref`
- [x] Update all loaders/actions/services to call route map helpers without `surface`.
- [x] Update `app/routes/_features/booking/_utils/booking.route-map.test.ts` to assert public routes only.

## Phase 7: Update Booking Session Entry Loader

- [x] Update `app/routes/booking/public/appointment/session/booking.public.appointment.session.route.tsx`.
- [x] Accept `companyId` from URL first.
- [x] Accept `theme` from URL first.
- [x] Validate `companyId`.
- [x] Validate `theme`.
- [x] Persist validated context to `booking_context`.
- [x] Create or reuse appointment session.
- [x] On stale appointment session:
  - [x] clear stale `appointment_session`
  - [x] recreate from URL `companyId` if present
  - [x] fall back to `booking_context.companyId` only if URL is missing
- [x] Redirect to `/booking/public/appointment/session/contact`.
- [x] Keep backend appointment session as source of truth after creation.
- [x] Update `app/routes/booking/public/appointment/session/booking.session.loader.test.ts`.

## Phase 8: Remove Factory Surface Arguments

- [x] Remove `surface` options from all booking loader/action factories.
- [x] Update public route files to call loaders/actions without `{ surface: 'public' }`.
- [x] Update `requireAuthenticatedBookingFlow` to use public booking routes directly.
- [x] Update contact auth helpers:
  - [x] `resolveAuthNextStepHref`
  - [x] `resolveAuthStatusNextStepHref`
  - [x] `redirectAuthStatusNextStepHref`
  - [x] `ContactAuthService.resolvePostAuthRedirect`
- [x] Update tests under:
  - [x] `app/tests/require-authenticated-booking-flow.server.test.ts`
  - [x] `app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts`
  - [x] `app/routes/booking/public/appointment/session/contact/_utils/auth.utils.test.ts`

## Phase 9: Move Booking Flow Code Into Route Folders

Do this after the surface abstraction is gone, so each route can own its loader/action/page directly.

- [x] Move session entry code into:
  - [x] `app/routes/booking/public/appointment/session/booking.public.appointment.session.route.tsx`
- [x] Move contact step code into:
  - [x] `app/routes/booking/public/appointment/session/contact/booking.public.appointment.session.contact.route.tsx`
  - [x] `app/routes/booking/public/appointment/session/contact/booking.public.appointment.session.contact.layout.tsx`
- [x] Move sign-in code into:
  - [x] `app/routes/booking/public/appointment/session/contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx`
- [x] Move sign-up code into:
  - [x] `app/routes/booking/public/appointment/session/contact/sign-up/booking.public.appointment.session.contact.sign-up.route.tsx`
- [x] Move collect-email code into:
  - [x] `app/routes/booking/public/appointment/session/contact/collect-email/booking.public.appointment.session.contact.collect-email.route.tsx`
- [x] Move collect-mobile code into:
  - [x] `app/routes/booking/public/appointment/session/contact/collect-mobile/booking.public.appointment.session.contact.collect-mobile.route.tsx`
- [x] Move verify-email code into:
  - [x] `app/routes/booking/public/appointment/session/contact/verify-email/booking.public.appointment.session.contact.verify-email.route.tsx`
- [x] Move verify-mobile code into:
  - [x] `app/routes/booking/public/appointment/session/contact/verify-mobile/booking.public.appointment.session.contact.verify-mobile.route.tsx`
- [x] Move employee step code into:
  - [x] `app/routes/booking/public/appointment/session/employee/booking.public.appointment.session.employee.route.tsx`
- [x] Move select-services step code into:
  - [x] `app/routes/booking/public/appointment/session/select-services/booking.public.appointment.session.select-services.route.tsx`
- [x] Move select-time step code into:
  - [x] `app/routes/booking/public/appointment/session/select-time/booking.public.appointment.session.select-time.route.tsx`
- [x] Move overview step code into:
  - [x] `app/routes/booking/public/appointment/session/overview/booking.public.appointment.session.overview.route.tsx`
- [x] Delete route-specific files from `app/routes/_features/booking/session`.
- [x] Keep genuinely shared code under `_features/booking`, for example:
  - [x] bottom nav
  - [x] stepper
  - [x] appointment session service
  - [x] small shared utilities

## Phase 10: Update Public Booking Pages

- [x] Update `app/routes/booking/public/appointment/booking.public.appointment.route.tsx`.
- [x] Ensure generated start URLs include `companyId`.
- [x] Preserve `theme` only when entering from a themed client link.
- [x] Decide whether the company chooser should use default `pitell` theme or preserve current `booking_context.theme`.
- [x] Update `app/routes/booking/public/my-appointments/booking.public.my-appointments.route.tsx`.
- [x] Remove dynamic public/embed surface detection in my appointments.
- [x] Ensure “book again” links route to public session only.

## Phase 11: Remove Embed CSS And Layout Behavior

- [x] Update `app/app.css`.
- [x] Delete all `[data-embed-mode='fragment']` rules.
- [x] Check booking layout spacing after deletion.
- [x] Add route-owned booking layout styles only if needed.

## Phase 12: Documentation For Clients

- [x] Create a new client integration doc, for example `docs/booking-link-integration.md`.
- [x] Document the link format:
  - [x] required `companyId`
  - [x] optional `theme`
  - [x] optional `reset=1`
- [x] Document that booking happens on our website, not in an iframe.
- [x] Document allowed theme keys.
- [x] Document how to add a client-specific theme.
- [x] Document old `/embed` URLs as removed/deprecated.

## Phase 13: Verification

- [x] Run route type generation/build if required by React Router.
- [x] Run focused frontend tests:
  - [x] booking route map tests
  - [x] booking session loader tests
  - [x] contact auth route matrix tests
  - [x] root loader/layout tests
- [ ] Run broader test suite if time allows.
- [ ] Manually verify:
  - [ ] `/booking/public/appointment/session?companyId=123`
  - [ ] `/booking/public/appointment/session?companyId=123&theme=fredrikstad-barbershop`
  - [ ] stale session cookie recovery
  - [ ] `reset=1` starts fresh
  - [ ] contact sign-in/sign-up flow
  - [ ] select employee
  - [ ] select services
  - [ ] select time
  - [ ] overview submit
  - [ ] success page
  - [ ] cancellation links

## Migration Notes

- The appointment session should remain the source of truth for the selected company after session creation.
- The booking context cookie is only for route entry, theme persistence, and recovery.
- Avoid keeping `companyId` in every step URL once the session exists.
- Avoid keeping `theme` in every step URL once the cookie is set.
- Do not preserve iframe-specific `postMessage`, transparent background, resize observer, or third-party cookie behavior.
