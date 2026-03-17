# Runtime Reliability

## Objective

Make the frontend robust when auth state, company context, user input, or backend responses are imperfect.

## Planning Context

For this release pass, treat the earlier release items as already completed enough that they are not the active planning target:

- `0.0ab`
- `0.01`
- `0.01B-form-dialog-to-route-refactor`

This document is the active release workstream.

## What "Runtime Reliability" Means In This Project

This is not a styling pass. It is the route/runtime pass that ensures the app behaves intentionally when:

- auth tokens expire
- refresh fallback fails
- company context is missing
- route params or query params are invalid
- backend payloads are missing or partial
- actions fail after submit
- destructive actions succeed or fail
- nested booking flows lose state

The user should always either:

- stay in flow with a clear recovery path, or
- be redirected intentionally with an explicit reason

Raw crashes, silent empty UI, and route behavior that depends on fragile assumptions are not acceptable.

## Current Baseline

The codebase already has some good reliability foundations:

- [`root.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.tsx) has token-aware loader branches and a root `ErrorBoundary`.
- [`company.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.tsx) redirects missing company context and handles `COMPANY_CONTEXT_REQUIRED`.
- Several critical routes now render shared `Notice` or `CompanyEmptyState` recovery UI instead of crashing.
- Public booking session flows already guard invalid or missing `companyId` and redirect with flash feedback.
- Some auth and booking routes already have route-level tests around state transitions.

This means the workstream should focus on closing gaps, standardizing behavior, and removing remaining weak branches. It should not restart already-solved work.

## Status Legend

- `done`: currently acceptable for launch unless regressions are found
- `in progress`: mostly good baseline, but reliability gaps still remain
- `not started`: known risk area has not been tightened enough yet
- `blocked`: depends on backend/API contract or a prior product decision

## Reliability Priorities

1. auth and session transitions
2. company context and guarded company routes
3. public booking session continuity
4. loader/action failure behavior on company admin and booking admin routes
5. destructive-action feedback and redirect consistency

## Step-By-Step Execution Roadmap

This is the recommended implementation order for the runtime pass.

## Phase 1. Lock The Runtime Contract First

### Goal

Define the expected behavior before changing route code.

### Why Start Here

The project already has some reliability handling in place, but it is spread across loaders, actions, utility functions, redirects, flash helpers, and route tests. If this phase is skipped, later fixes will stay inconsistent.

### Add

- a guard matrix for [`root.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.tsx) and [`company.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.tsx)
- an auth/session matrix covering the routes already exercised by:
  - [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts)
  - [`auth-flow.server.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/_utils/auth-flow.server.test.ts)
  - [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx)
- a public booking continuity matrix covering the routes already exercised by:
  - [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts)
  - [`contact-auth.service.server.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/_services/contact-auth.service.server.test.ts)

### Do

1. Document every expected branch for missing auth, expired auth, refresh success, refresh failure, missing company context, and invalid booking session state.
2. Mark which branches already have tests and which do not.
3. Define the standard recovery outcomes:
   - stay in route with `Notice`
   - redirect with flash message
   - throw to route boundary
4. Define the standard fallback copy shape so routes stop inventing slightly different versions of the same message.

### Deliverable

- one explicit runtime-behavior matrix that the rest of the work follows

### Phase 1 Execution Checklist

Use this checklist to complete Phase 1 before changing broader route behavior.

#### 1. Guard Matrix For App Entry

Status: `not started`

Scope:

- [`root.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.tsx)
- [`company.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.tsx)

Branches to document:

- no access token and no refresh token
- no access token and valid refresh token
- expired access token and valid refresh token
- expired access token and no refresh token
- valid access token and valid company context
- valid access token and missing company context
- backend responds with `COMPANY_CONTEXT_REQUIRED`
- unexpected loader failure in root layout
- unexpected loader failure in company layout

For each branch, record:

- trigger
- expected result
- redirect target, if any
- flash message, if any
- whether a test already exists
- status

Definition of complete:

- every branch above is written down once
- every redirect target is explicit
- every silent `null` or implicit fallback is called out

Current matrix:

| Surface | Trigger | Current behavior | Redirect target | Flash | Existing test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `root.layout` | no access token and no refresh token | returns cleared-auth default response with `user: null`, `companyContext: null`, and flash banner payload preserved | none | preserved if present | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `done` |
| `root.layout` | no access token and valid refresh token | calls `refreshAndBuildResponse()`; on refresh success returns rebuilt authenticated loader data with refreshed cookies | none | preserved if present | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `done` |
| `root.layout` | no access token and valid refresh token, but refresh fails | `refreshAndBuildResponse()` logs failure and falls back to cleared-auth default response | none | preserved if present | not directly covered yet | `in progress` |
| `root.layout` | expired access token and valid refresh token | refresh branch runs and returns rebuilt authenticated loader data with refreshed cookies | none | preserved if present | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `done` |
| `root.layout` | expired access token and no refresh token | returns cleared-auth default response | none | preserved if present | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `done` |
| `root.layout` | valid access token | returns built user/navigation/company payload from `buildResponseData()` | none | preserved if present | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `done` |
| `root.layout` | valid access token, but user-context fetch fails | still returns authenticated payload, but with `userContext`/`companyContext` potentially missing because `buildResponseData()` soft-fails user-context fetch | none | preserved if present | not directly covered yet | `in progress` |
| `root.layout` | `AuthenticationError` thrown in loader path | catches and returns cleared-auth default response without flash message | none | cleared | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `done` |
| `root.layout` | unexpected non-`Response` error in loader | logs and rethrows; root `ErrorBoundary` renders fallback page with recovery links | none | none | covered in [`root.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.loader.test.ts) | `in progress` |
| `company.layout` | no auth payload | redirects immediately | `/` | none | covered in [`company.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.loader.test.ts) | `done` |
| `company.layout` | auth payload exists but has no `companyId` | redirects immediately | [`user.company-context`](/Users/adambaser/Documents/portal.pitell/app/routes/user/company-context/user.company-context.route.tsx) | none | covered in [`company.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.loader.test.ts) | `done` |
| `company.layout` | backend/API reports `COMPANY_CONTEXT_REQUIRED` | redirects with info flash | [`user.company-context`](/Users/adambaser/Documents/portal.pitell/app/routes/user/company-context/user.company-context.route.tsx) | info flash via `redirectWithInfo()` | covered in [`company.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.loader.test.ts) | `done` |
| `company.layout` | unexpected loader error | redirects with error flash to safe landing route | `/` | error flash via `redirectWithError()` | covered in [`company.layout.loader.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.loader.test.ts) | `done` |

Notes from code:

- [`root.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.tsx) has explicit loader branch logging for `no-tokens`, `refresh-only`, `expired-access-refresh`, `expired-access-no-refresh`, `access-token`, and `fallback-default`.
- [`_features/root.loader.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/_features/root.loader.ts) treats refresh failure as recoverable by clearing auth cookies and returning a default anonymous payload.
- [`company.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.tsx) now explicitly redirects with `redirectWithError()` on unexpected failures instead of silently returning `null`.

Immediate follow-up for this matrix:

- add tests for shell guard branches, since none were found during this pass
- add focused tests for root refresh-failure fallback and `buildResponseData()` soft-fail user-context branch

#### 2. Auth And Session Matrix

Status: `in progress`

Scope:

- [`auth.sign-in.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/sign-in/auth.sign-in.route.tsx)
- auth next-step utilities and verification routes
- [`auth.respond-user-invite.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.tsx)

Existing tests to map first:

- [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts)
- [`auth-flow.server.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/_utils/auth-flow.server.test.ts)
- [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx)

Branches to document:

- local sign-in success
- Google sign-in success
- missing Google token
- sign-in failure from backend
- sign-in response with next step
- verification session missing
- verification session invalid
- invite token missing
- invite token invalid
- invite token expired or already used
- field validation failure before submit
- backend field validation failure after submit

For each branch, record:

- entry route
- trigger
- expected user-visible outcome
- cookie/header side effect, if any
- redirect target, if any
- existing test coverage
- status

Definition of complete:

- auth behavior is represented as one route matrix instead of scattered notes
- every next-step branch has an expected redirect
- every invite/verification failure has an intentional recovery path

Current matrix:

| Entry route | Trigger | Current behavior | Cookie/header side effect | Redirect target | Existing test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `auth.sign-in` action | Google provider selected and `idToken` missing | returns `400` data payload with user-visible error | none | none | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.sign-in` action | local sign-in success and `nextStep=DONE` with auth tokens | sets auth cookies and redirects | auth cookies via `authService.setAuthCookies()` | `/` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.sign-in` action | sign-in success and `nextStep=VERIFY_EMAIL` with verification token | sets verification cookie and redirects with delivery status params | verification cookie | `/auth/check-email?emailDelivery=...&mobileDelivery=...` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) and [`auth-flow.server.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/_utils/auth-flow.server.test.ts) | `done` |
| `auth.sign-in` action | sign-in response has no usable `nextStep` | redirects with warning flash fallback | may include existing headers | `auth.sign-in` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `in progress` |
| `auth.sign-in` action | backend sign-in failure | returns `data({ error })` with backend-derived message | none | none | partially covered (generic error path not asserted deeply) | `in progress` |
| `auth.sign-up` action | sign-up success with tokens and verification next-step | sets auth + verification cookies and redirects to resolved next step | auth and verification cookies | usually `/auth/check-email?...` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.sign-up` action | sign-up backend failure | returns `data({ error })` with status | none | none | no direct negative test in current matrix file | `not started` |
| `auth.check-email` loader | verification token exists and status is available | returns delivery state + verification token + `nextStep` | none | none | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.check-email` action | resend email with valid verification cookie | returns success payload and refreshes verification cookie | verification cookie refreshed | none | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.check-email` action | resend requested without verification cookie | returns `400` error payload | none | none | no direct test found | `not started` |
| `auth.verify-email` loader | missing token query param | hard redirect to sign-in | none | `auth.sign-in` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.verify-email` loader | verify succeeds and `nextStep=VERIFY_MOBILE` | sets verification cookie and redirects to verify-mobile | verification cookie set | `auth.verify-mobile` with token param | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.verify-email` loader | verify fails (invalid/expired token) | stays in route with `data({ error })` state and recovery copy | none | none | no direct negative-path test found | `in progress` |
| `auth.verify-mobile` loader | verification status says next step is not mobile verify | redirects to resolved next-step route | none | resolved by `resolveAuthNextStepHref()` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.verify-mobile` action | resend intent | returns success payload and refreshes verification cookie | verification cookie refreshed | none | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.verify-mobile` action | verify success with auth tokens | sets auth cookies and redirects home | auth cookies set | `/` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.verify-mobile` action | verify/resend without verification cookie | returns `400` error payload | none | none | no direct test found | `not started` |
| `auth.collect-email` + `auth.collect-mobile` loaders | invalid/missing `userId` | redirects to sign-in | none | `auth.sign-in` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.collect-email` + `auth.collect-mobile` actions | provider complete profile success | redirects to resolved next step | optional verification cookie | resolved by `resolveAuthPostRedirect()` | covered in [`auth.flow.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/auth.flow.routes.matrix.test.ts) | `done` |
| `auth.collect-email` + `auth.collect-mobile` actions | missing/invalid `userId` in POST | returns `400` payload | none | none | no direct test found | `not started` |
| `auth.respond-user-invite` loader | token missing | throws route `Response(400)` | none | none | covered in [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx) | `done` |
| `auth.respond-user-invite` loader | token invalid/expired/decode fails | returns `invalidInvite=true` for in-route recovery | none | none | covered in [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx) | `done` |
| `auth.respond-user-invite` action | required fields invalid before backend call | returns field-level `400` errors | none | none | covered in [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx) | `done` |
| `auth.respond-user-invite` action | backend validation fails | maps backend field errors + form error and returns `400` | none | none | covered in [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx) | `done` |
| `auth.respond-user-invite` action | success | sets auth cookies and redirects home | auth cookies set | `/` | covered in [`auth.respond-user-invite.route.test.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.test.tsx) | `done` |

Coverage gaps to close for this matrix:

- add negative-path tests for `auth.sign-up` backend failures
- add tests for missing verification cookie in `auth.check-email` and `auth.verify-mobile`
- add tests for `collect-email` / `collect-mobile` invalid `userId` in action
- add tests for `auth.verify-email` invalid/expired token loader path

#### 3. Public Booking Continuity Matrix

Status: `in progress`

Scope:

- [`booking.public.appointment.session.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/booking.public.appointment.session.route.tsx)
- nested booking contact/auth routes
- downstream employee/service/time/success/cancel routes

Existing tests to map first:

- [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts)
- [`contact-auth.service.server.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/_services/contact-auth.service.server.test.ts)
- [`auth.utils.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/_utils/auth.utils.test.ts)

Branches to document:

- missing `companyId`
- invalid `companyId`
- existing session with same company
- existing session with different company
- session creation failure
- missing contact/session state on nested routes
- auth attach success/failure
- sign-up success/failure
- invalid step entry after partial progress
- success route entry without required prior state
- cancel route entry with invalid or missing state

For each branch, record:

- entry route
- trigger
- expected redirect or in-route recovery
- flash message, if any
- cookie/session side effect
- existing test coverage
- status

Definition of complete:

- booking continuity is described step by step
- every invalid-state redirect has a single expected target
- every session reset branch is explicit

Current matrix:

| Entry route | Trigger | Current behavior | Flash | Cookie/session side effect | Existing test | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `booking.public.appointment.session` loader | missing `companyId` and no existing session | redirect to public booking landing | error flash | none | no direct test found | `not started` |
| `booking.public.appointment.session` loader | invalid `companyId` format | redirect to public booking landing | error flash | none | no direct test found | `not started` |
| `booking.public.appointment.session` loader | existing session and same company | redirect to contact step | none | keeps existing session | no direct test found | `in progress` |
| `booking.public.appointment.session` loader | existing session and different company | resets old session, creates new one, redirects to contact | none | session cookie replaced | no direct test found | `not started` |
| `booking.public.appointment.session` loader | new valid company session | validates company booking, creates session, redirects to contact | none | sets session cookie | no direct test found | `in progress` |
| `booking.public.appointment.session` loader | unexpected startup failure | redirect to public booking landing | error flash | no guaranteed session | no direct test found | `not started` |
| `booking.public.appointment.session.contact` loader | missing contact session context | redirect back to session start | error flash | none | indirect only | `in progress` |
| `booking.public.appointment.session.contact` action | continue with authenticated user but auth missing | stay in contact flow | error flash | no attach | no direct test found | `not started` |
| `booking.public.appointment.session.contact` action | continue with session user but session/user missing | redirect back to session start or sign-in depending on branch | error flash or plain redirect | no state advance | no direct test found | `not started` |
| `booking.public.appointment.session.contact` action | provider continuation with invalid provider or missing Google token | stay in contact flow | error flash | none | partially covered in auth contact matrix | `in progress` |
| `booking.public.appointment.session.contact` action | provider continuation success | attach user and redirect by next-step resolver | info flash fallback only if resolver gives no step | may set auth and verification cookies | partially covered in [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts) | `in progress` |
| `booking.public.appointment.session.contact.sign-in` action | missing Google `idToken` | returns `400` in-route error payload | none | none | covered in [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts) | `done` |
| `booking.public.appointment.session.contact.sign-in` action | local/google sign-in success | attaches user to session and redirects to resolved next step | none | session user attachment; optional auth/verification cookies | covered in [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts) | `done` |
| `booking.public.appointment.session.contact.sign-up` action | signup fails or attach fails | returns explicit `400` error payload | none | no continuation | covered in [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts) | `done` |
| `booking.public.appointment.session.contact.sign-up` action | signup success | sets pending session user and redirects via post-auth resolver | info flash fallback if no resolver step | auth/verification cookies may be set | covered in [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts) | `done` |
| `booking.public.appointment.session.contact.collect-email/mobile` actions | complete profile success | redirect to resolved next step | info flash fallback if unresolved next step | may set verification cookie | covered in [`booking.contact-auth.routes.matrix.test.ts`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/contact/booking.contact-auth.routes.matrix.test.ts) | `done` |
| `booking.public.appointment.session.contact.verify-email` loader | missing session/user/auth status | redirects to session start | none | no continuation | no direct route-loader test found | `not started` |
| `booking.public.appointment.session.contact.verify-email` loader | missing verification cookie | redirects to contact step | none | no continuation | no direct route-loader test found | `not started` |
| `booking.public.appointment.session.contact.verify-mobile` loader | missing session/user/auth status | redirects to session start | none | no continuation | no direct route-loader test found | `not started` |
| `booking.public.appointment.session.contact.verify-mobile` loader | missing verification cookie | redirects to contact step | none | no continuation | no direct route-loader test found | `not started` |
| `booking.public.appointment.success` loader | missing/invalid `appointmentId` | redirects to public booking landing | none | none | no direct test found | `not started` |
| `booking.public.appointment.success` loader | missing `companyId` or validation failure | returns in-route error state instead of redirecting | none | none | no direct test found | `in progress` |
| `booking.public.appointment.cancel` loader | missing/invalid/expired cancel token | returns in-route error state with status `400` | none | none | no direct test found | `in progress` |
| `booking.public.appointment.cancel` action | cancel success | redirect to root with info flash | info flash | cancellation mutation completed | no direct test found | `not started` |
| `booking.public.appointment.cancel` action | cancel failure | returns in-route `400` error payload | none | no state change | no direct test found | `in progress` |

Coverage gaps to close for this matrix:

- add loader tests for `booking.public.appointment.session` branching (missing/invalid companyId, same-company session, switched-company session)
- add loader tests for contact verify-email and verify-mobile branch guards
- add loader tests for success and cancel entry edge cases
- add action tests for cancel route success/failure

#### 4. Recovery Pattern Contract

Status: `done`

Purpose:

Define when the frontend should use each recovery style.

Contract to write down:

- use in-route `Notice` when the user can retry in the same route
- use redirect plus flash message when the current route state is no longer valid
- use route error boundary only for unrecoverable route failures
- use empty state only when empty data is a valid product state, not when loading failed

Copy rules to write down:

- one standard pattern for auth/session expiry
- one standard pattern for invalid invite/verification state
- one standard pattern for invalid edit or missing route param
- one standard pattern for generic backend failure that still allows retry

Definition of complete:

- the route groups above can point to one shared recovery contract
- similar runtime failures no longer require route authors to invent custom wording

Current contract:

| Failure type | Preferred pattern | Route behavior contract | Example routes |
| --- | --- | --- | --- |
| Retryable same-route failure (validation or recoverable API error) | in-route `Notice` or field error payload | keep user on same route, preserve input values when possible, return `data(..., { status: 400 })` | auth invite action, contact sign-up/sign-in, admin form routes |
| Invalid route precondition (missing required param/token/session) | redirect with flash when user must restart flow | redirect to nearest valid entry point and provide explicit flash reason | booking session start, contact flow guards |
| Expected empty dataset | empty-state UI | render empty state only when data absence is valid domain state | timesheets empty, notifications empty |
| Loader failure where route cannot continue but app can recover | redirect with error/info flash | avoid silent `null` branch; route should not continue in ambiguous state | company context required, booking startup failures |
| Unrecoverable route/runtime exception | route `ErrorBoundary` | only use boundary for unexpected crashes after known recoveries are exhausted | root boundary and explicit route boundaries |

Copy normalization rules:

- auth/session expiry: "Innloggingen er utløpt. Logg inn på nytt for å fortsette."
- invalid invite/verification token: "Lenken er ugyldig eller utløpt. Be om en ny lenke og prøv igjen."
- invalid edit/missing param: "Vi fant ikke ressursen du prøvde å åpne. Gå tilbake og prøv igjen."
- generic backend retryable failure: "Noe gikk galt. Prøv igjen."

Implementation notes:

- use `redirectWithError` or `redirectWithInfo` for cross-route recovery that needs one clear next step
- use `data({ error })` for same-route retry paths
- avoid returning raw `null` in loader catch paths unless route intentionally has a valid anonymous state
- keep recovery copy short and action-oriented, and do not expose raw backend exception details

#### 5. Phase 1 Exit Criteria

Phase 1 is complete only when all of the following are true:

- the guard matrix exists
- the auth/session matrix exists
- the public booking continuity matrix exists
- the recovery pattern contract exists
- gaps in existing test coverage are explicitly marked
- every item above has a status of either `done` or `blocked`

## Phase 2. Tighten The Global Shell

### Goal

Make the root and company shells safe enough that downstream route failures do not feel random.

### Start With

- [`root.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.tsx)
- [`company.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.tsx)

### Add

- a more intentional root error fallback with a safe next action
- clearer handling for unexpected failures in company layout
- targeted tests for the guard branches that are not already covered

### Do

1. Replace the plain root fallback with a product-grade recovery state.
2. Stop swallowing unexpected company-layout failures silently.
3. Verify the redirect target for each guard branch.
4. Add or extend tests for the missing shell-level branches.

### Deliverable

- stable route-entry behavior for all guarded app surfaces

## Phase 3. Finish Auth And Session Reliability

### Goal

Make auth transitions fully predictable and fully covered.

### Start With

- [`auth.sign-in.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/sign-in/auth.sign-in.route.tsx)
- auth next-step routing utilities
- verification/collection routes
- [`auth.respond-user-invite.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.tsx)

### Add

- missing matrix cases for invalid verification state and return-to behavior
- normalized recovery copy for expired/invalid invite and verification flows
- explicit coverage for any remaining untested auth branches

### Do

1. Audit the existing auth matrix tests against the actual route branches.
2. Add missing tests before changing behavior.
3. Normalize route responses so similar failures produce similar user-facing recovery.
4. Verify cookie-setting and redirect behavior for all successful auth next steps.

### Deliverable

- a closed auth/session matrix with no ambiguous recovery branches

## Phase 4. Finish Public Booking Session Continuity

### Goal

Make the public booking journey resilient when session state is partial, stale, or mismatched.

### Start With

- [`booking.public.appointment.session.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/booking.public.appointment.session.route.tsx)
- booking contact/auth nested routes
- employee, service, time, success, and cancel routes

### Add

- a full redirect matrix for each invalid-state branch
- missing tests for session loss and company/session mismatch
- standard flash/recovery handling across public booking entry points

### Do

1. Trace the booking flow from session start to success/cancel.
2. Record the required redirect target for each invalid branch.
3. Add tests for branches where state can be lost after partial progress.
4. Normalize flash-based recovery so the flow does not feel inconsistent between steps.

### Deliverable

- end-to-end booking session continuity that is documented and test-backed

## Phase 5. Fix Destructive And Mutation Reliability In Company Admin

### Goal

Make admin mutations route-owned, recoverable, and explicit.

### Start With

- [`company.admin.contacts.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/contacts/company.admin.contacts.route.tsx)
- [`company.admin.employees.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/employees/company.admin.employees.route.tsx)
- route-based create/edit employee and contact pages

### Add

- a mutation checklist for delete, cancel invite, create, and edit
- explicit stale-id and unauthorized handling
- route-owned success/failure feedback where API-route submission is still leaking through

### Do

1. Audit all admin mutations one by one.
2. Prioritize moving contact deletion away from client submission to API routes if the route should own the outcome.
3. Verify create/edit flows preserve values and surface backend validation correctly.
4. Standardize post-mutation success and failure feedback.

### Deliverable

- company admin flows that fail clearly and recover predictably

## Phase 6. Fix Destructive And Mutation Reliability In Booking Admin

### Goal

Make service-group and service management safe under invalid ids, stale state, and mutation failure.

### Start With

- [`company.booking.admin.service-groups.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/admin/service-groups/company.booking.admin.service-groups.route.tsx)
- [`company.booking.admin.service-groups.services.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/admin/service-groups/services/company.booking.admin.service-groups.services.route.tsx)
- related create/edit service-group and service routes

### Add

- invalid-id handling checks for edit pages
- image-upload/image-removal failure checks for services
- mutation outcome rules for create, update, and delete

### Do

1. Audit all query-param and edit-id assumptions.
2. Verify that missing or stale ids do not degrade into weak fallback behavior.
3. Audit service image mutation branches explicitly.
4. Standardize create/update/delete recovery and feedback.

### Deliverable

- booking admin mutations that behave intentionally under failure

## Phase 7. Finish Booking Profile And Timesheet Runtime Gaps

### Goal

Close the remaining form-heavy reliability gaps after the guard and admin systems are stable.

### Start With

- booking profile create/edit routes
- schedule unavailability routes
- [`company.timesheet.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/timesheet/company.timesheet.route.tsx)
- timesheet register/edit/admin submission routes

### Add

- invalid-id and stale-status handling checks for timesheet edit/admin flows
- dependent-validation checks for booking profile forms
- explicit destructive-action review for profile media and schedule items

### Do

1. Audit booking profile validation and retry behavior.
2. Audit schedule unavailability mutation behavior.
3. Audit timesheet create/edit/register/admin submission flows as one system.
4. Add tests where route behavior depends on entry status or stale edit state.

### Deliverable

- form-heavy company workflows that remain stable under invalid or partial state

## Phase 8. Final Reliability Pass

### Goal

Convert the work from "seems better" into release-ready proof.

### Add

- final checklist pass against this document
- status markers updated across every route group
- explicit list of accepted debt, if any remains

### Do

1. Re-run the runtime matrices and verify implemented branches match documented behavior.
2. Update each route group status from `in progress` to `done` only when code, recovery UX, and tests line up.
3. Capture any intentionally deferred reliability debt in a separate tracked list instead of leaving it implicit.

### Deliverable

- a release-ready runtime reliability checklist with only explicit, accepted exceptions

## Route Inventory And Current Status

## 1. Global Shell And Route Guards

### Status

`in progress`

### Routes

- [`root.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/root.layout.tsx)
- [`company.layout.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.layout.tsx)

### What Is Already Good

- root loader explicitly handles:
  - no tokens
  - refresh-only state
  - expired access token with refresh
  - expired access token without refresh
- root loader logs start, success, and error branches
- root error boundary prevents raw route crashes from surfacing unhandled
- company layout redirects users without company context
- company layout recognizes backend `COMPANY_CONTEXT_REQUIRED`

### Remaining Reliability Gaps

- root error boundary still renders a very plain fallback and does not guide the user to the next safe action
- company layout swallows non-context errors by returning `null`, which may hide unexpected failures
- guard behavior is not yet documented as a single expected matrix

### Required Work

- define the expected guard matrix for:
  - no auth
  - expired auth with refresh
  - expired auth without refresh
  - authenticated without company context
  - backend company-context rejection
- tighten the fallback for unexpected company-layout failures
- ensure global error fallback gives the user a safe next step

## 2. Auth And Session Flows

### Status

`in progress`

### Routes

- [`auth.sign-in.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/sign-in/auth.sign-in.route.tsx)
- [`auth.respond-user-invite.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-user-invite/auth.respond-user-invite.route.tsx)
- auth verification and collection routes under [`app/routes/auth`](/Users/adambaser/Documents/portal.pitell/app/routes/auth)

### What Is Already Good

- sign-in returns controlled error payloads and logs critical branches
- sign-in explicitly handles missing Google token and missing expected payload branch
- respond-user-invite validates invite token state in both loader and action
- respond-user-invite maps backend validation errors to field-level feedback
- several auth routes already use route-owned recovery states instead of raw exceptions

### Remaining Reliability Gaps

- auth behavior is distributed across many routes and utilities, but not tracked as one tested session-transition matrix
- invalid verification state and return-to behavior still need a single audit pass
- some failures still depend on backend message quality rather than a normalized frontend contract

### Required Work

- audit the full auth journey matrix:
  - unauthenticated entry
  - expired session
  - sign-in success with next step
  - invalid verification session
  - invalid invite token
  - already-used or expired invite
- standardize fallback copy for auth recovery states
- identify any auth routes still missing explicit route-level test coverage

## 3. Company Context

### Status

`done`

### Route

- [`user.company-context.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/user/company-context/user.company-context.route.tsx)

### Why It Is Considered Done

- loader failure falls back safely to an empty list
- action failure is surfaced in-route through shared `Notice`
- submit interactions are disabled during pending state
- empty state exists and uses shared page primitives

### Follow-Up

- keep this route as the reference pattern for guarded selection flows

## 4. Company Admin Reliability

### Status

`in progress`

### Routes

- [`company.admin.employees.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/employees/company.admin.employees.route.tsx)
- [`company.admin.contacts.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/contacts/company.admin.contacts.route.tsx)
- create/edit employee routes
- create/edit contact routes

### What Is Already Good

- employees route now renders shared `Notice` on loader failure
- contacts route now renders shared `Notice` on loader failure
- create/edit employee routes use route actions instead of dialog-local submission
- create/edit contact routes exist and support route-based recovery

### Remaining Reliability Gaps

- contacts still delete through API-route submission from the client
- contacts and other admin tables still depend on legacy `ServerPaginatedTable`
- destructive-action success/failure feedback is not consistently owned by the route
- query-param based edit routing still needs validation review

### Required Work

- audit delete/cancel flows for:
  - success flash
  - failure flash
  - stale item id
  - unauthorized response
- confirm create/edit routes preserve user input and show clear backend validation failures
- reduce API-route dependence where route actions should own the mutation

## 5. Booking Overview And Booking Admin

### Status

`in progress`

### Routes

- [`company.booking.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/company.booking.route.tsx)
- [`company.booking.admin.service-groups.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/admin/service-groups/company.booking.admin.service-groups.route.tsx)
- [`company.booking.admin.service-groups.services.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/admin/service-groups/services/company.booking.admin.service-groups.services.route.tsx)
- related create/edit service-group and service routes

### What Is Already Good

- booking overview now renders a company empty state when metrics cannot be loaded
- service-group list and service list both surface loader failures through `Notice`
- services route intentionally redirects when no service groups exist
- create/edit routes exist for service groups and services

### Remaining Reliability Gaps

- destructive service-group and service actions still rely on dialog confirmation plus mutation paths that need a full reliability audit
- route behavior for invalid edit ids and stale query params is not yet documented here
- service management still depends on older table patterns and split mutation handling

### Required Work

- test invalid `id` and missing `id` behavior for edit routes
- verify image-related failures on service edit/create flows
- confirm deletion, create, and update routes always return intentional feedback

## 6. Booking Profile

### Status

`in progress`

### Routes

- booking profile overview/create/edit routes
- [`company.booking.profile.schedule-unavailability.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/profile/schedule-unavailability/company.booking.profile.schedule-unavailability.route.tsx)
- schedule unavailability create/edit routes

### What Is Already Good

- route-based create/edit flows exist
- schedule-unavailability routes already return controlled error payloads in several branches

### Remaining Reliability Gaps

- complex schedule and profile forms still need a full backend-validation audit
- retry behavior and post-save success messaging are not yet tracked in one place
- image/profile-related destructive actions still need explicit reliability review

### Required Work

- verify required/dependent validation across create/edit flows
- verify safe behavior for empty profile, partial profile, and missing schedule data
- audit delete/remove flows for images and schedule items

## 7. Public Booking Session Flow

### Status

`in progress`

### Routes

- [`booking.public.appointment.session.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment/session/booking.public.appointment.session.route.tsx)
- public booking contact/auth nested routes
- employee, service, time, cancel, and success routes under [`app/routes/booking/public/appointment`](/Users/adambaser/Documents/portal.pitell/app/routes/booking/public/appointment)

### What Is Already Good

- missing or invalid `companyId` is handled explicitly
- existing session/company mismatch is handled by resetting session state
- failure to start booking redirects with flash feedback
- booking contact/auth flow already has matrix-style test files

### Remaining Reliability Gaps

- nested booking continuity still depends on several redirect branches and cookie/session assumptions
- route recovery after partial progress needs a deliberate audit
- public flow failure states are spread across multiple files and easy to drift

### Required Work

- audit session continuity across:
  - new session start
  - company mismatch
  - contact step
  - auth attach/sign-up
  - employee selection
  - service selection
  - time selection
  - success/cancel
- document the expected redirect target for each invalid-state branch
- extend tests where booking session state can be lost or mismatched

## 8. Notifications

### Status

`done`

### Route

- [`company.notifications.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/notifications/company.notifications.route.tsx)

### Why It Is Considered Done

- loader returns controlled fallback payload
- route renders shared `Notice` on failure
- filter and pagination state are preserved in-route

## 9. Timesheets

### Status

`in progress`

### Routes

- [`company.timesheet.route.tsx`](/Users/adambaser/Documents/portal.pitell/app/routes/company/timesheet/company.timesheet.route.tsx)
- register/edit-hours/edit-range routes
- admin submissions routes

### What Is Already Good

- main timesheet route returns controlled fallback data
- failure state is surfaced through shared `Notice`
- empty state exists
- editable-entry routing is constrained by status and entry mode

### Remaining Reliability Gaps

- create/edit/register/admin flows have not yet been audited as one system
- calendar-driven interaction may still hide invalid-state or stale-entry edge cases
- decline/edit/resubmit behavior needs an explicit runtime review

### Required Work

- audit create/edit/register flows for invalid ids, stale status, and backend validation
- verify admin submission review flows for failure feedback
- verify destructive or state-changing transitions always return a clear next step

## Execution Checklist

Use this when working through the runtime pass:

- `in progress` Build an auth/session transition matrix and mark covered routes/tests.
- `in progress` Build a company-route guard matrix for root/company layouts.
- `not started` Audit destructive actions across contacts, employees, service groups, services, and profile media.
- `not started` Audit invalid-id handling across all route-based create/edit pages added by the form-dialog refactor.
- `not started` Audit booking public nested-flow continuity end to end.
- `not started` Audit timesheet create/edit/admin submission failure behavior end to end.
- `not started` Normalize fallback copy and recovery affordances where routes still rely on generic backend messages.

## Definition Of Done

- Core guarded routes behave intentionally for missing auth, expired auth, and missing company context.
- Critical loaders and actions either recover in-route or redirect with an explicit reason.
- All launch-critical destructive actions provide clear success/failure feedback.
- Route-based create/edit flows handle invalid params, stale state, and backend validation without surprising crashes.
- Public booking session continuity is covered by an explicit route matrix and supporting tests.
