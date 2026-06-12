# Embedded Booking Implementation Plan

## Goal

Make the booking flow safely embeddable on customer websites through a copy-paste iframe or script snippet.

The embedded booking surface must:

- Render inside a customer website without redirecting end users away from that website.
- Reuse existing booking session, validation, API calls, forms, and step components.
- Avoid rendering the normal application chrome: navbar, sidebar, footer, app background, and admin navigation.
- Avoid browser-wide embed state such as an `embed_mode` cookie.
- Keep normal public booking URLs independent from embedded booking URLs.

## Current Problem

The current implementation uses `embed_mode` as a cookie-based shell switch. `/embed` sets the cookie, then redirects into `/booking/public/...`.

That leaks across browser tabs because cookies are shared by origin:

1. A user opens an embedded booking iframe.
2. The app sets `embed_mode=1`.
3. The same browser opens `/booking/public/...` in another tab.
4. The root layout sees the cookie and renders the stripped embed shell there too.

The root problem is using origin-wide browser state for page presentation mode.

## Chosen Approach

Use a dedicated embedded booking route namespace:

```text
/booking/public/...          normal public booking flow
/embed/booking/...           embedded booking flow
```

The URL path becomes the shell contract:

- `/booking/public/...` always renders the normal public booking surface.
- `/embed/booking/...` always renders the embedded booking surface.

No cookie should be required to decide whether app chrome is visible.

## Target Route Shape

Conceptual route structure:

```text
app/routes/
  booking/public/...
    existing public booking route adapters

  embed/
    embed.layout.tsx
    booking/
      embed.booking.layout.tsx
      appointment/
        session/
          embed.booking.appointment.session.route.tsx
          contact/
            embed.booking.appointment.session.contact.route.tsx
          employee/
            embed.booking.appointment.session.employee.route.tsx
          select-services/
            embed.booking.appointment.session.select-services.route.tsx
          select-time/
            embed.booking.appointment.session.select-time.route.tsx
          overview/
            embed.booking.appointment.session.overview.route.tsx
          success/
            embed.booking.appointment.success.route.tsx
      my-appointments/
        embed.booking.my-appointments.route.tsx
```

The embedded route files should be thin adapters over shared booking implementation. They should not duplicate business logic.

## Shared Feature Area

Shared booking code should live under:

```text
app/routes/_features/booking/
```

Suggested shape:

```text
app/routes/_features/booking/
  _components/                 # Cross-step booking UI only
    bottom-nav/
    booking.route-aware-stepper.tsx
    booking.service-quantity-control.tsx
  _services/                   # Cross-step booking services only
    appointment-session.service.server.ts
    contact-auth.service.server.ts
    contact-session.service.server.ts
    verification-token.service.server.ts
  _utils/                      # Cross-step booking utilities only
    booking.auth-step-error.ts
    booking.auth.utils.server.ts
    booking.auth.utils.ts
    booking.company-id-url.ts
    booking.require-authenticated-flow.server.ts
    booking.route-map.ts
    booking.step-navigation.ts
    booking.surface.ts
  embed/                       # Embed shell/helpers
    embed-messaging.ts
    embed-theme.ts
  session/
    booking.session.loader.ts
    booking.session.page.tsx
  contact/
    booking.contact.loader.ts
    booking.contact.action.ts
    booking.contact.page.tsx
    booking.contact.components.tsx
    _forms/
      booking.contact.submit-contact.form.tsx
    _schemas/
      booking.contact.submit-contact.form.schema.ts
    _utils/
      booking.contact.action-intents.ts
  contact-sign-in/
    booking.contact-sign-in.loader.ts
    booking.contact-sign-in.action.ts
    booking.contact-sign-in.page.tsx
    _forms/
      booking.contact-sign-in.form.tsx
  contact-sign-up/
    booking.contact-sign-up.loader.ts
    booking.contact-sign-up.action.ts
    booking.contact-sign-up.page.tsx
    _forms/
      booking.contact-sign-up.form.tsx
  contact-collect-email/
    booking.contact-collect-email.loader.ts
    booking.contact-collect-email.action.ts
    booking.contact-collect-email.page.tsx
  contact-collect-mobile/
    booking.contact-collect-mobile.loader.ts
    booking.contact-collect-mobile.action.ts
    booking.contact-collect-mobile.page.tsx
  contact-verify-email/
    booking.contact-verify-email.loader.ts
    booking.contact-verify-email.page.tsx
  contact-verify-mobile/
    booking.contact-verify-mobile.loader.ts
    booking.contact-verify-mobile.page.tsx
  employee/
    booking.employee.loader.ts
    booking.employee.action.ts
    booking.employee.page.tsx
  select-services/
    booking.select-services.loader.ts
    booking.select-services.action.ts
    booking.select-services.page.tsx
    booking.select-services.components.tsx
  select-time/
    booking.select-time.loader.ts
    booking.select-time.action.ts
    booking.select-time.page.tsx
    booking.select-time.components.tsx
    _utils/
      booking.select-time.utils.ts
  overview/
    booking.overview.loader.ts
    booking.overview.action.ts
    booking.overview.page.tsx
    _utils/
      booking.overview.formatting.ts
```

The exact folder names can change during implementation, but the boundary should remain clear:

- Route files adapt URLs to shared code.
- Feature modules own booking behavior.
- Layouts own shell/chrome behavior.
- Step folders use domain names, not full route IDs.
- Files inside a step folder keep the domain prefix, for example `booking.contact.loader.ts`.
- Step-private helpers live beside the step in `_utils`, `_forms`, `_schemas`, or `_components`.
- Only cross-step helpers go in top-level `_utils`, `_components`, `_services`, etc.

Embedded route adapters can import from the same domain folder as public route adapters and pass `surface: 'embed'`.

Example public route adapter:

```ts
import { action } from '~/routes/_features/booking/contact/booking.contact.action';
import { loader } from '~/routes/_features/booking/contact/booking.contact.loader';
import { BookingContactPage as default } from '~/routes/_features/booking/contact/booking.contact.page';

export { action, loader };
```

Example embedded route adapter:

```ts
import { createBookingContactAction } from '~/routes/_features/booking/contact/booking.contact.action';
import { createBookingContactLoader } from '~/routes/_features/booking/contact/booking.contact.loader';
import { BookingContactPage as default } from '~/routes/_features/booking/contact/booking.contact.page';

export const loader = createBookingContactLoader({ surface: 'embed' });
export const action = createBookingContactAction({ surface: 'embed' });
```

This keeps the page component with the loader/action for that step. Shared UI used by multiple steps goes in top-level `_components`; small step-private UI should stay in that step folder as `booking.<step>.components.tsx` or under the step's `_components` folder when it grows.

## Surface Model

Introduce a booking surface type:

```ts
export type BookingSurface = 'public' | 'embed';
```

Shared loaders/actions should receive the active surface explicitly:

```ts
export const loader = createContactLoader({ surface: 'public' });
export const action = createContactAction({ surface: 'embed' });
```

This avoids guessing from cookies, iframe detection, or browser globals.

## Route Resolution

Current booking code often hard-codes public URLs:

```ts
ROUTES_MAP['booking.public.appointment.session.contact'].href;
```

Shared code needs route resolution by surface:

```ts
const routes = getBookingRouteMap(surface);
return redirect(routes.contact);
```

Example route map:

```ts
type BookingRouteMap = {
  entry: string;
  contact: string;
  signIn: string;
  signUp: string;
  collectEmail: string;
  collectMobile: string;
  verifyEmail: string;
  verifyMobile: string;
  employee: string;
  selectServices: string;
  selectTime: string;
  overview: string;
  success: string;
  cancel: string;
};
```

The public map points to `/booking/public/...`.

The embed map points to `/embed/booking/...`.

This is the main mechanism that allows public and embedded routes to share loaders/actions while staying in the correct URL namespace.

## Route Adapter Pattern

Use the same route adapter pattern for every extracted step.

Public route adapter:

```ts
export const loader = createContactLoader({ surface: 'public' });
export const action = createContactAction({ surface: 'public' });

export default ContactStepPage;
```

Embed route adapter:

```ts
export const loader = createContactLoader({ surface: 'embed' });
export const action = createContactAction({ surface: 'embed' });

export default ContactStepPage;
```

This duplicates small route files only. It should not duplicate services, validation, form components, API calls, or step UI.

## Concrete Refactoring Pattern

This is the current pattern to follow for the rest of the booking flow extraction.

### 1. Feature Module Owns Behavior

Each loader/action lives in the booking feature area as a factory that receives the surface explicitly.

```ts
type CreateBookingStepLoaderOptions = {
  surface: BookingSurface;
};

export function createBookingStepLoader({ surface }: CreateBookingStepLoaderOptions) {
  return async function bookingStepLoader(args: LoaderFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    // loader logic
    return redirect(routes.contact);
  };
}
```

Actions follow the same shape:

```ts
type CreateBookingStepActionOptions = {
  surface: BookingSurface;
};

export function createBookingStepAction({ surface }: CreateBookingStepActionOptions) {
  return async function bookingStepAction(args: ActionFunctionArgs) {
    const routes = getBookingRouteMap(surface);

    // action logic
    return redirect(routes.employee);
  };
}
```

Rules:

- Do not read the URL to decide whether the route is public or embedded.
- Do not read cookies to decide whether the route is public or embedded.
- Do not use iframe detection, browser globals, or root layout context for route behavior.
- The route adapter passes the surface. The feature module consumes that surface.
- Use `getBookingRouteMap(surface)` once near the top of the loader/action and route through that map.
- Do not export public-surface compatibility aliases from feature files.
- Avoid snake_case exports such as `booking_contact_sign_in_action`.
- Feature files export `create...` factories and page/components only.
- Route files create the concrete `loader` and `action`:

```ts
export const loader = createBookingContactCollectEmailLoader({ surface: 'public' });
export const action = createBookingContactCollectEmailAction({ surface: 'public' });
```

### 2. Public And Embed Routes Are Thin Adapters

Public adapter:

```ts
import { createBookingSessionContactAction } from '~/routes/_features/booking/session/contact/booking.session.contact.action';
import { createBookingSessionContactLoader } from '~/routes/_features/booking/session/contact/booking.session.contact.loader';
import { BookingSessionContactPage } from '~/routes/_features/booking/session/contact/booking.session.contact.page';

export const loader = createBookingSessionContactLoader({ surface: 'public' });
export const action = createBookingSessionContactAction({ surface: 'public' });

export default BookingSessionContactPage;
```

Embed adapter:

```ts
import { createBookingSessionContactAction } from '~/routes/_features/booking/session/contact/booking.session.contact.action';
import { createBookingSessionContactLoader } from '~/routes/_features/booking/session/contact/booking.session.contact.loader';
import { BookingSessionContactPage } from '~/routes/_features/booking/session/contact/booking.session.contact.page';

export const loader = createBookingSessionContactLoader({ surface: 'embed' });
export const action = createBookingSessionContactAction({ surface: 'embed' });

export default BookingSessionContactPage;
```

Adapter rules:

- Route files should contain no business logic.
- Route files should contain no API calls.
- Route files should contain no validation logic beyond route-framework wiring.
- Route files should not import `ROUTES_MAP` for booking flow navigation.
- Route files should not dynamically import local services.
- Route files should only adapt the route surface to shared feature code and export the page.

### 3. Pages Stay Shared

Page components live beside their loader/action in the relevant feature step folder.

Current examples:

```text
app/routes/_features/booking/session/booking.session.page.tsx
app/routes/_features/booking/session/contact/booking.session.contact.page.tsx
```

Page rules:

- Keep UI consistent with existing booking UI primitives and semantic tokens.
- Shared page components should work for both public and embedded routes.
- If a page needs route-specific behavior, prefer loader/action data or explicit props over reading global route mode.
- Step-private UI belongs under that step's `_components`, `_forms`, `_schemas`, or `_utils`.
- Cross-step UI belongs under `app/routes/_features/booking/_components`.

### 4. Static Imports Only For Local Code

Use static imports for local services, utilities, pages, forms, and components.

Allowed:

```ts
import { AppointmentSessionService } from '~/routes/_features/booking/_services/booking.appointment-session.service.server';
```

Avoid:

```ts
const { AppointmentSessionService } = await import(
  '~/routes/_features/booking/_services/booking.appointment-session.service.server'
);
```

Dynamic imports make the flow harder to trace, mock, typecheck, and refactor. Only use them when there is a concrete code-splitting or circular-dependency reason, and document that reason next to the import.

### 5. Route Resolution Is Surface-Aware

Shared code should not use public route IDs directly:

```ts
ROUTES_MAP['booking.public.appointment.session.contact'].href;
```

Use the surface route map instead:

```ts
const routes = getBookingRouteMap(surface);
return redirect(routes.contact);
```

Auth next-step helpers must also be surface-aware:

```ts
resolveAuthNextStepHref(nextStep, surface);
ContactAuthService.resolvePostAuthRedirect(response, { surface });
```

Do not add helpers that infer the surface from `request.url`, `location.pathname`, cookies, or root context. We removed `useBookingNavigation(url, route)` for this reason.

### 6. Naming

Use clear domain names rather than route IDs.

Current accepted naming:

```text
booking.session.loader.ts
booking.session.page.tsx
booking.session.contact.loader.ts
booking.session.contact.action.ts
booking.session.contact.page.tsx
booking.contact.collect-email.loader.ts
booking.contact.collect-email.action.ts
```

Factory names should describe the step:

```ts
createBookingSessionLoader
createBookingSessionContactLoader
createBookingSessionContactAction
createBookingContactCollectEmailLoader
createBookingContactCollectEmailAction
```

### 7. Verification After Each Step

After extracting each step:

- Run `npm run typecheck`.
- Run focused tests for the moved feature files and the public route adapters.
- Search for stale patterns:

```text
await import(
useBookingNavigation
ROUTES_MAP['booking.public
```

Some `ROUTES_MAP['booking.public...']` references can remain temporarily in public route files that have not been extracted yet, but extracted shared feature files should not introduce new public-only route references.

## Embed Layout Responsibilities

Move embed-specific behavior out of the root layout and into an embed layout.

The embed layout should own:

- Chrome-free wrapper.
- Embed-safe width and padding.
- Theme application from validated embed config.
- iframe `postMessage` events:
  - `embed:ready`
  - `embed:step-changed`
  - `embed:resize`
- `ResizeObserver` based height publishing.
- Parent origin handling.
- Future customer embed configuration.

The root layout should not need to know whether a page is embedded. It should render the normal app shell for normal routes and let the embed route tree own embed behavior.

## `/embed` Entry Route

The existing `/embed` route can remain as a convenience entry point for customer snippets, but it should no longer set `embed_mode`.

Old behavior:

```text
/embed?companyId=123
  -> sets embed_mode cookie
  -> redirects to /booking/public/appointment/session?companyId=123
```

Target behavior:

```text
/embed?companyId=123&theme=ocean
  -> validates params
  -> stores validated theme in embed_config scoped to /embed
  -> redirects to /embed/booking/appointment/session?companyId=123
```

The generated customer iframe can also point directly to:

```text
/embed/booking/appointment/session?companyId=123&theme=ocean
```

## Cookie Usage

Do not use cookies to determine shell visibility.

Cookies may still be used for booking session state if required, but they should be scoped intentionally and should not imply UI mode.

If embedded booking needs third-party iframe session cookies in production, evaluate browser constraints separately:

- `SameSite=None; Secure` for third-party iframe cookies.
- Partitioned cookies where supported.
- Storage Access API only if the flow requires user-granted access to unpartitioned cookies.

This is session persistence work, not layout mode work.

## Migration Sequence

1. Extract shared booking services, utilities, forms, schemas, and reusable components into `app/routes/_features/booking`.
2. Add `BookingSurface` and shared route maps for `public` and `embed`.
3. Refactor public booking loaders/actions to use shared factories and route maps while keeping current behavior.
4. Add the embed layout and embed booking route adapters.
5. Change `/embed` to redirect into `/embed/booking/...` without setting `embed_mode`.
6. Move iframe messaging and resize behavior from the root layout into the embed layout.
7. Remove `embed_mode` shell switching from root loader/root layout.
8. Decide how theme persists during embed navigation.
9. Update route tests and add embed-specific regression tests.

## Progress Log

Completed so far:

- Routing definitions were moved out of the monolithic `route-tree.ts` into focused modules under `app/lib/routing/*/routes.ts`.
- `app/lib/routing/route-tree.ts` now composes `AUTH_ROUTES`, `USER_ROUTES`, `SYSTEM_ADMIN_ROUTES`, `COMPANY_ROUTES`, `BOOKING_ROUTES`, and `EMBEDDED_ROUTES`.
- `API_ROUTES_TREE` was moved to `app/lib/routing/api/routes.ts`.
- Route map and navigation helper functions were moved to `app/lib/routing/route-utils.ts`.
- Embedded route definitions were added under `app/lib/routing/embedded/routes.ts`.
- Embedded route entries now include the appointment session flow, success, cancel, and `my-appointments`.
- Placeholder route/layout files were added under `app/routes/embed/...` so React Router type generation can resolve the embedded route tree.
- `npm run typecheck` passes after the routing split.

Not done yet:

- Embedded routes are not wired to shared booking loaders/actions yet.
- Embedded layout is only a placeholder outlet, not the final iframe shell.
- `/embed` still needs to be changed from cookie setup to embedded route entry/redirect.
- Root layout still owns the old embed-shell behavior until the embed layout replaces it.
- Booking feature extraction has started with shared route resolution utilities only; loaders/actions/pages have not moved yet.
- `BookingSurface`, `getBookingRouteMap`, and `getBookingRouteHref` now exist under `app/routes/_features/booking/_utils`.
- Focused route-map tests and `npm run typecheck` pass after adding the shared route-resolution foundation.
- Session-level shared code has been moved into `_features/booking`: appointment session service, step navigation, authenticated flow guard, bottom action bar, route-aware stepper, and service quantity control.
- The public session entry route is now a thin adapter over `createBookingSessionLoader({ surface: 'public' })` and `BookingSessionPage`.
- The authenticated flow guard is moved, but it still depends on public contact auth helpers until the contact flow is extracted.

## Current Booking Flow Inventory

The existing public booking session flow currently lives under:

```text
app/routes/booking/public/appointment/session/
```

Current route files:

- `booking.public.appointment.session.route.tsx`
- `contact/booking.public.appointment.session.contact.layout.tsx`
- `contact/booking.public.appointment.session.contact.route.tsx`
- `contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx`
- `contact/sign-up/booking.public.appointment.session.contact.sign-up.route.tsx`
- `contact/collect-email/booking.public.appointment.session.contact.collect-email.route.tsx`
- `contact/collect-mobile/booking.public.appointment.session.contact.collect-mobile.route.tsx`
- `contact/verify-email/booking.public.appointment.session.contact.verify-email.route.tsx`
- `contact/verify-mobile/booking.public.appointment.session.contact.verify-mobile.route.tsx`
- `employee/booking.public.appointment.session.employee.route.tsx`
- `select-services/booking.public.appointment.session.select-services.route.tsx`
- `select-time/booking.public.appointment.session.select-time.route.tsx`
- `overview/booking.public.appointment.session.overview.route.tsx`

Current shared-ish route-local code:

- Session-level components moved to `_features/booking/_components`: `bottom-nav`, `booking.route-aware-stepper.tsx`, `booking.service-quantity-control.tsx`.
- Session-level service moved to `_features/booking/_services/booking.appointment-session.service.server.ts`.
- Session-level utilities moved to `_features/booking/_utils`: `booking.require-authenticated-flow.server.ts`, `booking.step-navigation.ts`.
- Contact forms: `contact/_forms/auth-signin.fetcher-form.tsx`, `contact/_forms/auth-signup.fetcher-form.tsx`, `contact/_forms/submit-contact.form.tsx`.
- Contact schemas: `contact/_schemas/submit-contact.form.schema.ts`.
- Contact services: `contact/_services/contact-auth.service.server.ts`, `contact/_services/contact-session.service.server.ts`, `contact/_services/verification-token.service.server.ts`.
- Contact utilities: `contact/_utils/action-intents.ts`, `contact/_utils/auth-step-error.ts`, `contact/_utils/auth.utils.server.ts`, `contact/_utils/auth.utils.ts`, `contact/_utils/company-id-url.ts`.
- Contact components: `contact/_components/clear-session-action.tsx`.

Current route-resolution risks:

- The booking session flow has many direct `ROUTES_MAP['booking.public...']` references.
- Those references appear in redirects, fallback redirects, links, forms, and auth next-step helpers.
- These must become surface-aware before the same loaders/actions can safely power `/embed/booking/...`.
- The existing `select-time/_features` files appear to have confusing names: `appointment.session.select-time.loader.ts` currently contains action-like behavior, while `appointment.session.select-time.action.ts` currently contains loader-like behavior. Fix naming during extraction rather than moving that confusion into the shared feature area.

## Testing Plan

Add tests for:

- Visiting `/embed?companyId=123` redirects to `/embed/booking/appointment/session?companyId=123`.
- Invalid `companyId` returns `400`.
- Invalid theme returns `400`.
- `/embed` no longer sets `embed_mode`.
- `/embed/booking/...` renders without navbar/sidebar/footer.
- `/booking/public/...` renders normal public shell even after visiting `/embed/...`.
- Public booking redirects stay under `/booking/public/...`.
- Embed booking redirects stay under `/embed/booking/...`.
- Shared contact/session actions work for both `surface: 'public'` and `surface: 'embed'`.

## Todo Checklist

### 1. Baseline Inventory

- [x] List every route currently under `app/routes/booking/public/appointment/session`.
- [x] Identify all route files that export loaders.
- [x] Identify all route files that export actions.
- [x] Identify all route-local services under `_services`.
- [x] Identify all route-local utilities under `_utils`.
- [x] Identify all route-local forms, schemas, and reusable components.
- [x] Identify every use of `ROUTES_MAP['booking.public...']` inside the booking session flow.
- [x] Identify every redirect that must become surface-aware.
- [x] Identify every link or form action that must stay inside the active surface namespace.
- [x] Confirm whether `app/routes/_features/booking` has existing code that must be preserved.
- [x] Record the current booking-flow inventory in this implementation plan.
- [x] Record the `select-time` local loader/action filename mismatch as extraction risk.

### 2. Shared Feature Structure

- [x] Create `app/routes/_features/booking/_components`.
- [x] Create `app/routes/_features/booking/_services`.
- [x] Create `app/routes/_features/booking/_utils`.
- [ ] Create `app/routes/_features/booking/embed`.
- [x] Create a domain feature folder for `session`.
- [ ] Create a domain feature folder for `contact`.
- [ ] Create `contact/_forms`, `contact/_schemas`, and `contact/_utils` as needed.
- [ ] Create a domain feature folder for `contact-sign-in`.
- [ ] Create `contact-sign-in/_forms` as needed.
- [ ] Create a domain feature folder for `contact-sign-up`.
- [ ] Create `contact-sign-up/_forms` as needed.
- [ ] Create a domain feature folder for `contact-collect-email`.
- [ ] Create a domain feature folder for `contact-collect-mobile`.
- [ ] Create a domain feature folder for `contact-verify-email`.
- [ ] Create a domain feature folder for `contact-verify-mobile`.
- [x] Create a domain feature folder for `employee`.
- [x] Create a domain feature folder for `select-services`.
- [x] Create a domain feature folder for `select-time`.
- [ ] Create `select-time/_utils` as needed.
- [x] Create a domain feature folder for `overview`.
- [ ] Create `overview/_utils` as needed.
- [x] Add `surface.ts` with `BookingSurface = 'public' | 'embed'`.
- [x] Add `route-map.ts` with public and embed route maps.
- [x] Add helpers for resolving route paths by surface.
- [x] Add tests for route-map resolution.

### 3. Move Shared Session Code

- [x] Move `appointment-session.service.server.ts` into the shared booking feature area.
- [x] Move `step-navigation.ts` into the shared booking feature area.
- [x] Move `require-authenticated-booking-flow.server.ts` into the shared booking feature area.
- [x] Move session-level reusable components into `app/routes/_features/booking/_components`.
- [x] Move the session entry loader into `session/booking.session.loader.ts`.
- [x] Move the session entry page into `session/booking.session.page.tsx`.
- [x] Update imports in existing public routes after each move.
- [x] Run focused typecheck or tests after the session-code move.
- [x] Make `requireAuthenticatedBookingFlow` surface-aware after contact auth helpers move.

### 4. Move Shared Contact Code

- [x] Move `contact-session.service.server.ts`.
- [x] Move `contact-auth.service.server.ts`.
- [x] Move `verification-token.service.server.ts`.
- [x] Move contact auth utilities.
- [x] Move contact action intent constants.
- [x] Move contact schemas.
- [x] Move contact forms.
- [x] Move contact reusable components.
- [x] Update imports in existing public contact routes after each move.
- [x] Run focused contact/auth booking route tests after the contact-code move.

### 5. Surface-Aware Loaders And Actions

- [x] Extract the session entry loader into `session/booking.session.loader.ts`.
- [x] Extract the session entry page into `session/booking.session.page.tsx`.
- [x] Extract the contact step loader into `session/contact/booking.session.contact.loader.ts`.
- [x] Extract the contact step action into `session/contact/booking.session.contact.action.ts`.
- [x] Extract the contact step page into `session/contact/booking.session.contact.page.tsx`.
- [x] Extract contact step-private UI into `session/contact/_components`.
- [x] Extract contact sign-in loader/action/page into `session/contact/sign-in/booking.contact.sign-in.*`.
- [x] Extract contact sign-up loader/action/page into `session/contact/sign-up/booking.contact.sign-up.*`.
- [x] Extract collect-email loader/action into `session/contact/collect-email/booking.contact.collect-email.*`.
- [x] Extract collect-email page into `session/contact/collect-email/booking.contact.collect-email.page.tsx`.
- [x] Extract collect-mobile loader/action/page into `session/contact/collect-mobile/booking.contact.collect-mobile.*`.
- [x] Extract verify-email loader/page into `session/contact/verify-email/booking.contact.verify-email.*`.
- [x] Extract verify-mobile loader/page into `session/contact/verify-mobile/booking.contact.verify-mobile.*`.
- [x] Extract employee loader/action/page into `employee/booking.employee.*`.
- [x] Extract select-services loader/action/page into `select-services/booking.select-services.*`.
- [ ] Extract select-services step-private UI into `select-services/booking.select-services.components.tsx` or `select-services/_components`.
- [x] Extract select-time loader/action/page into `select-time/booking.select-time.*`.
- [ ] Extract select-time step-private UI/helpers into `select-time/booking.select-time.components.tsx` and `select-time/_utils`.
- [x] Extract overview loader/action/page into `overview/booking.overview.*`.
- [ ] Extract overview formatting helpers into `overview/_utils`.
- [x] Keep public contact and collect-email route files as thin adapters after extraction.
- [x] Keep all extracted public route files as thin re-export adapters after each extraction.
- [x] Replace hard-coded public redirects with surface-aware route map lookups in extracted session feature files.
- [x] Replace hard-coded public fallback redirects with surface-aware route map lookups in extracted session feature files.
- [x] Keep public route behavior unchanged while using `surface: 'public'`.
- [ ] Add focused tests for public route adapters after factory extraction.

### 6. Embed Route Tree

- [x] Add route-tree entries for `/embed`.
- [x] Add route-tree entries for `/embed/booking`.
- [x] Add route-tree entries for `/embed/booking/appointment/session`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact/sign-in`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact/sign-up`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact/collect-email`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact/collect-mobile`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact/verify-email`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/contact/verify-mobile`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/employee`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/select-services`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/select-time`.
- [x] Add route-tree entries for `/embed/booking/appointment/session/overview`.
- [x] Add route-tree entries for embedded success/cancel routes if needed.
- [x] Add route-tree entry for `/embed/booking/my-appointments`.
- [x] Ensure embed navigation entries are hidden from normal navbar/sidebar/footer navigation.
- [x] Decide whether embed routes should use generated route-tree layout files or explicit route config entries.
- [x] Add placeholder route/layout files for generated embedded route entries.

### 7. Embed Layout

- [x] Create the embed layout file.
- [x] Add a chrome-free wrapper.
- [x] Add embed-safe content padding and max-width rules.
- [x] Move `embed:ready` postMessage behavior into the embed layout.
- [x] Move `embed:step-changed` postMessage behavior into the embed layout.
- [x] Move `embed:resize` ResizeObserver behavior into the embed layout.
- [ ] Add parent-origin resolution in the embed layout.
- [ ] Add a safe target-origin strategy for postMessage.
- [ ] Apply embed theme tokens from validated embed config.
- [x] Ensure the embed layout does not render navbar, sidebar, footer, or root app background.

### 8. Embed Route Adapters

- [x] Add an embed session entry route adapter using `surface: 'embed'`.
- [x] Add an embed contact layout route adapter using `surface: 'embed'`.
- [x] Add an embed contact route adapter using `surface: 'embed'`.
- [x] Add embed contact auth child route adapters if those child routes remain part of the iframe flow.
- [x] Add an embed employee route adapter using `surface: 'embed'`.
- [x] Add an embed select-services route adapter using `surface: 'embed'`.
- [x] Add an embed select-time route adapter using `surface: 'embed'`.
- [x] Add an embed overview route adapter using `surface: 'embed'`.
- [x] Add embed success/cancel route adapters if required.
- [x] Verify internal redirects remain under `/embed/booking/...` for extracted contact routes.
- [x] Verify internal links remain under `/embed/booking/...` for extracted contact routes.
- [x] Verify internal redirects remain under `/embed/booking/...`.
- [x] Verify internal links remain under `/embed/booking/...`.

### 9. `/embed` Entry Route

- [x] Change `/embed` so it no longer sets `embed_mode`.
- [x] Keep `companyId` validation.
- [x] Keep theme validation.
- [x] Preserve optional `reset=1` behavior if it is still needed.
- [x] Redirect valid requests to `/embed/booking/appointment/session`.
- [x] Preserve `companyId` in the redirect URL.
- [x] Preserve validated theme in the redirect URL or embed config.
- [x] Update `/embed` route tests.
- [x] Confirm invalid `/embed` requests never fall back to normal public booking routes.

### 10. Root Layout Cleanup

- [x] Remove `shouldUseEmbedShell` usage from `root.layout.tsx`.
- [x] Remove embed shell rendering branch from `root.layout.tsx`.
- [x] Remove iframe postMessage helpers from `root.layout.tsx`.
- [x] Remove `contentRef`, `hasSentReadyRef`, and `lastHeightRef` if they are only used for embed behavior.
- [x] Remove `embedMode` from `RootOutletContext` if no longer needed by normal routes.
- [x] Remove `embedTheme` from `RootOutletContext` if no longer needed by normal routes.
- [x] Remove embed cookie reading from root loader data if no longer needed.
- [ ] Update root layout tests.
- [x] Confirm normal app shell still renders for authenticated and unauthenticated users.

### 11. Theme And Configuration

- [x] Decide whether theme is query-param based, config based, or both.
- [x] Ensure theme values are allowlisted.
- [x] Ensure invalid theme values return a clear `400` or fall back intentionally.
- [ ] Ensure theme persists across embed route navigation.
- [ ] Move embed theme helpers out of `lib/embed-shell.ts` if that file becomes obsolete.
- [x] Remove unused `embed_mode` cookie helpers after migration.
- [ ] Keep only session-related cookies in the booking flow.

### 12. Customer Snippet

- [ ] Define the recommended iframe snippet format.
- [ ] Define required snippet parameters.
- [ ] Define optional snippet parameters.
- [ ] Decide whether to provide a script wrapper for automatic iframe resizing.
- [ ] If a script wrapper is added, validate incoming `postMessage` events.
- [ ] Document the expected `embed:ready`, `embed:step-changed`, and `embed:resize` messages.
- [ ] Document allowed parent origins or deployment-level frame policy requirements.

### 13. Regression Tests

- [ ] Add a test proving `/booking/public/...` does not enter embed mode after visiting `/embed/...`.
- [ ] Add a test proving `/embed/booking/...` renders without app chrome.
- [ ] Add a test proving `/booking/public/...` still renders the normal shell.
- [ ] Add redirect tests for public surface route factories.
- [ ] Add redirect tests for embed surface route factories.
- [x] Add tests for invalid embed params.
- [x] Add tests for valid embed theme params.
- [x] Add tests for reset behavior if retained.
- [ ] Run existing booking public route tests.
- [x] Run existing contact auth matrix tests.
- [ ] Run root layout tests.

### 14. Cleanup And Removal

- [x] Remove obsolete `embed_mode` cookie constants.
- [x] Remove obsolete shell-scope helper tests.
- [x] Remove unused imports created during migration.
- [x] Remove old route-local files after imports are fully migrated.
- [x] Confirm no duplicate booking business logic remains in embed route files.
- [x] Confirm all embed route files are thin adapters.
- [x] Confirm all public route files remain behaviorally unchanged.
- [ ] Run formatting.
- [x] Run typecheck.
- [x] Run the relevant Vitest suite for the route-map foundation.
- [x] Run the relevant Vitest suite after the session-code move.
- [x] Run the relevant Vitest suite after contact loader/action extraction.
- [x] Run the relevant Vitest suite after contact child-route extraction.
- [x] Run the relevant Vitest suite after remaining loader/action extraction.

### 15. Routing Structure Cleanup

- [x] Move auth route definitions into `app/lib/routing/auth/routes.ts`.
- [x] Move user route definitions into `app/lib/routing/user/routes.ts`.
- [x] Move system-admin route definitions into `app/lib/routing/system-admin/routes.ts`.
- [x] Move company route definitions into `app/lib/routing/company/routes.ts`.
- [x] Move booking route definitions into `app/lib/routing/booking/routes.ts`.
- [x] Move API route definitions into `app/lib/routing/api/routes.ts`.
- [x] Keep embedded route definitions in `app/lib/routing/embedded/routes.ts`.
- [x] Move route map helpers into `app/lib/routing/route-utils.ts`.
- [x] Move navigation filtering helpers into `app/lib/routing/route-utils.ts`.
- [x] Keep `route-tree.ts` as the route composition and public export surface.

## Expected Outcome

After the refactor, embedded booking is selected by URL namespace instead of browser state.

That gives a hard guarantee:

- An iframe using `/embed/booking/...` gets the embedded shell.
- A normal tab using `/booking/public/...` gets the normal shell.
- One tab cannot accidentally change another tab's layout by setting a cookie.
