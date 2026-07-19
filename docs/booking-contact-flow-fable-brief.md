# Booking Contact Flow UX Brief for Fable

Date: 2026-07-16

Purpose: give Fable/Claude enough context to propose a better public booking contact and verification flow. This document describes the current frontend behavior from the codebase, the user complaint, likely weak points, and the desired design constraints.

## User Complaint

A real user attempted to complete the public booking flow using email. They reported:

1. They entered their email during booking.
2. They did not receive or did not notice an email OTP/verification message.
3. They went back to the contact page.
4. The contact page then made them feel like they were unregistered or in an unexpected registration state.

Database diagnostics later showed the backend flow did work:

- User `1183` was created for `aaron@innotec.nu`.
- Email verification email was sent successfully.
- Email verification token was used successfully.
- Mobile OTP SMS was sent successfully.
- Mobile OTP was used successfully.
- Mobile number `+4794828881` was marked verified.
- Appointment session was linked to the user.
- Appointment confirmation email and SMS were sent successfully.
- Appointment reminder email was sent successfully.

Interpretation: the backend completed the identity and booking path, but the frontend flow made the user feel blocked, reset, or misclassified. The fix should focus on screen flow, state decisions, copy, and resilience.

## Relevant Current Routes

Route source:

- `app/lib/routing/booking/booking.routes.ts`
- `app/routes/booking/public/_utils/booking.route-map.ts`

Public booking appointment routes:

- `/booking/public/appointment/session/contact`
- `/booking/public/appointment/session/contact/sign-in`
- `/booking/public/appointment/session/contact/sign-up`
- `/booking/public/appointment/session/contact/verify-email`
- `/booking/public/appointment/session/contact/verify-mobile`
- `/booking/public/appointment/session/contact/collect-email`
- `/booking/public/appointment/session/contact/collect-mobile`
- `/booking/public/appointment/session/employee`
- `/booking/public/appointment/session/select-services`
- `/booking/public/appointment/session/select-time`
- `/booking/public/appointment/session/overview`
- `/booking/public/appointment/success`

Stepper source:

- `app/routes/booking/public/_utils/booking.step-navigation.ts`

The visible booking stepper treats contact as a single required step:

1. `contact` / "Bruker"
2. `employee` / "Velg behandler"
3. `select-services` / "Velg tjenester"
4. `select-time` / "Velg tidspunkt"
5. `overview` / "Oversikt"

Problem: "Bruker" is currently a large identity sub-flow with registration, sign-in, optional email, required mobile, email verification, SMS verification, provider completion, and pending session user behavior. The UI stepper does not expose that complexity.

## Current State Sources

### Appointment session cookie

Source:

- `app/routes/booking/public/_services/booking.appointment-session.service.server.ts`

Cookie:

- `appointment_session`
- HTTP-only
- `sameSite: lax`
- max age: 24 hours
- stores the backend appointment session ID

The frontend reads the cookie, calls `PublicAppointmentSessionController.getAppointmentSession`, and gets an `AppointmentSessionDto`.

Important fields used by the frontend:

- `session.sessionId`
- `session.companyId`
- `session.userId`
- selected profile/service/time fields used later in the booking flow

If the session is stale, several loaders clear the cookie and redirect back toward booking start.

### Verification token cookie

Source:

- `app/routes/booking/public/appointment/session/contact/_services/verification-token.service.server.ts`

The verification routes expect a `verification_session_token` cookie created from backend auth responses. This token is important for verification status, resend, and mobile code verification.

### Auth cookies

Source:

- `app/routes/auth/_features/auth.cookies.server`
- `app/lib/auth-service.ts`

Some sign-in/sign-up/verify actions set access and refresh cookies. Some intermediate states have an appointment session user without a fully completed auth state.

### Current user verification status

Sources:

- `ContactAuthService.getUserStatus(request)`
- `AuthController.userStatus()`
- `app/routes/api/auth/user-status/auth.user-status.api-route.ts`

The frontend uses `UserAuthStatusDto.nextStep`, with possible values:

- `COLLECT_EMAIL`
- `COLLECT_MOBILE`
- `VERIFY_EMAIL`
- `VERIFY_MOBILE`
- `DONE`

The frontend also checks user fields like:

- `user.email`
- `user.emailVerified`
- `user.mobileNumber`
- `user.mobileVerified`
- `user.hasPassword`
- `user.provider`

## Current Top-Level Contact Page Behavior

Source:

- `app/routes/booking/public/appointment/session/contact/booking.public.appointment.session.contact.route.tsx`
- `app/routes/booking/public/appointment/session/contact/_services/contact-session.service.server.ts`

Loader behavior:

1. Calls `ContactSessionService.getContactContext(request)`.
2. That reads:
   - appointment session
   - current auth from auth cookies
   - verification session token
3. It only resolves `sessionUser` if either auth exists or a verification token exists:
   - `const shouldResolveSessionUser = Boolean(auth) || Boolean(verificationSessionToken);`
4. If no session exists:
   - stale session clears cookie and redirects to appointment start
   - missing session redirects to session route with error
5. Otherwise returns:
   - `session`
   - `sessionUser`
   - `auth`
   - `verificationSessionToken`

UI behavior:

- Header:
  - label: `Kontakt`
  - title: `Hvordan vil du fortsette?`
  - description: `Velg en av de følgende metodene for å fortsette.`
- If `auth` exists:
  - shows "Innlogget bruker"
  - shows `Du er logget inn som`
  - primary button: `Fortsett med denne brukeren`
  - secondary actions: `Mine bookinger`, `Bytt bruker`
- If no `auth` but `sessionUser` exists:
  - shows `ContinueCard`
  - title: user name
  - description: `Vi fant en eksisterende bruker. Fortsett for å verifisere og gå videre.`
  - CTA: `Fortsett med denne brukeren`
- If no auth or if user clicked switch options:
  - shows Google provider buttons
  - shows `Logg inn`
  - shows `Opprett konto`

Important fragility:

- If the appointment session has `userId`, but there is no auth cookie and no verification token cookie, `sessionUser` is not fetched.
- In that state, the page may show generic login/sign-up choices rather than "we found your booking contact, continue verification".
- This maps closely to the complaint: going back can make the user feel unregistered or restarted even if backend session/user linkage exists.

Current contact page actions:

### Continue with authenticated user

Intent: `continue-with-authenticated-user`

Behavior:

1. Reads auth cookie.
2. Attaches `auth.id` to appointment session.
3. Redirects directly to employee step.

Potential issue:

- This does not call `userStatus` before moving forward. Later guarded routes may redirect back to verification if status is not `DONE`.

### Continue with session user

Intent: `continue-with-session-user`

Behavior:

1. Requires appointment session.
2. Requires `session.userId`.
3. Calls `ContactSessionService.getSessionUserStatus(request)`.
4. If no auth exists, redirects to sign-in with `email` and `provider` query params when available.
5. If auth exists, calls status again and redirects via `resolveAuthNextStepHref(profileStatus.nextStep)`.

Potential issue:

- This uses raw `resolveAuthNextStepHref`, not `resolveAuthStatusNextStepHref`. That means `VERIFY_EMAIL` maps to verify-email even though other parts of the flow normalize `VERIFY_EMAIL` away when mobile is sufficient.
- If no auth exists, it pushes the user into sign-in even when the appointment session already has a pending user.

### Continue with Google provider

Intent: `continue-with-provider`

Behavior:

1. Requires Google `idToken`.
2. Calls sign-in with redirectUrl.
3. Attaches returned user ID to appointment session.
4. Sets auth cookies if returned.
5. Sets verification token cookie if returned.
6. Redirects to `nextStepHref` from `resolvePostAuthRedirect`.

## Current Sign-Up Screen

Source:

- `app/routes/booking/public/appointment/session/contact/sign-up/booking.public.appointment.session.contact.sign-up.route.tsx`

UI:

- Header:
  - `Opprett konto`
  - `Opprett en konto for å fortsette booking.`
- Back link:
  - `Tilbake til kontakt`
- Fields:
  - Fornavn, required
  - Etternavn, required
  - E-post, optional
  - Mobilnummer, required
  - Passord, required
  - Bekreft passord, required
- Email helper:
  - `Valgfritt. Legg inn e-post hvis du også vil motta bekreftelse på e-post.`
- Mobile helper:
  - `Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.`
- Button:
  - `Opprett konto`

Action behavior:

1. Requires mobile number before calling backend.
2. Calls `AuthController.signUp` through `ContactAuthService.signUp`.
3. Sets auth cookies if returned.
4. Requires appointment session.
5. Calls `setPendingSessionUser(session.sessionId, response.userId)`.
6. Builds verification token cookie from returned `verificationToken`.
7. Redirects using `resolveAuthNextStepHref(response.nextStep, { emailDelivery, mobileDelivery })`.

Current implication:

- Even in public booking, the screen is framed as account creation.
- Email is marked optional, but sign-up can still redirect to email verification if backend returns `VERIFY_EMAIL`.
- For users just trying to book, "Opprett konto" may feel like a separate account-registration task, not "enter contact info for booking".

## Current Sign-In Screen

Source:

- `app/routes/booking/public/appointment/session/contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx`

UI:

- Header:
  - `Logg inn`
  - `Logg inn for å fortsette booking.`
- Back link:
  - `Tilbake til kontakt`
- Panel title:
  - `Logg inn med e-post eller mobil`
- Google provider buttons are shown.
- Local fields:
  - E-post eller mobilnummer
  - Passord
- Button:
  - `Logg inn`

Action behavior:

1. Calls local or Google sign-in.
2. Attaches returned user ID to appointment session.
3. Sets auth cookies if returned.
4. Sets verification token cookie if returned.
5. Redirects to `nextStepHref` from `ContactAuthService.resolvePostAuthRedirect(response)`.

Potential issue:

- If the user came from a partially completed booking session and is asked to sign in, the screen does not clearly explain "we found your booking contact but need you to authenticate/continue".

## Current Collect Email Screen

Source:

- `app/routes/booking/public/appointment/session/contact/collect-email/booking.public.appointment.session.contact.collect-email.route.tsx`

UI:

- Header:
  - `Legg til e-post`
  - `E-post er valgfritt. Du kan fortsette uten e-post hvis mobilnummeret ditt er bekreftet.`
- Back link:
  - `Tilbake til kontakt`
- Field:
  - `E-post (valgfritt)`
- Button:
  - If email is empty: `Fortsett uten å lagre`
  - If email is filled: `Lagre og fortsett`
  - While submitting: `Lagrer...`

Action behavior:

1. Requires appointment session and `session.userId`.
2. If submitted email is empty, redirects directly to employee step.
3. If email is provided, calls `providerCompleteProfile`.
4. Redirects using `resolvePostAuthRedirect(response)`.

Important behavior:

- Empty email is a true skip path.
- The current UI now reflects that skip path.

## Current Collect Mobile Screen

Source:

- `app/routes/booking/public/appointment/session/contact/collect-mobile/booking.public.appointment.session.contact.collect-mobile.route.tsx`

UI:

- Header:
  - `Legg til ditt mobilnummer`
  - `Mobilnummer er påkrevd for å bestille time.`
- Back link:
  - `Tilbake til kontakt`
- Field:
  - Mobilnummer, required
- Helper:
  - `Vi bruker mobilnummeret ditt til å bekrefte bestillingen og sende viktig informasjon om timen.`
- Button:
  - `Fortsett`

Action behavior:

1. Requires appointment session and `session.userId`.
2. Requires mobile number.
3. Calls `providerCompleteProfile`.
4. Sets verification token cookie if returned.
5. Redirects to returned next step.

## Current Email Verification Screen

Source:

- `app/routes/booking/public/appointment/session/contact/verify-email/booking.public.appointment.session.contact.verify-email.route.tsx`

Loader behavior:

1. Requires appointment session and `session.userId`.
2. Calls `ContactAuthService.getUserStatus(request)`.
3. Requires auth status.
4. Requires verification session token cookie.
5. If `authStatus.nextStep !== 'VERIFY_EMAIL'`, redirects via `redirectAuthStatusNextStepHref(authStatus)`.
6. Otherwise renders the page.

UI:

- Header:
  - `Bekreft e-post`
  - `Klikk på lenken i e-posten for å fullføre verifiseringen.`
- Optional banner only when URL query `redirectUrl=booking`:
  - `Du kan nå fortsette med bookingen. Gå tilbake til bookingsteget for å fullføre.`
- Back/change link:
  - `Endre e-postadresse`
  - goes to collect-email
- Waiting card:
  - `Vi venter på bekreftelse`
  - `Når du bekrefter e-posten, tar vi deg videre automatisk.`
- Sent card:
  - `E-post sendt`
  - `Sjekk innboksen til {email}.`
- Instructions:
  - `Åpne e-posten og klikk på lenken`
  - `Bekreft e-postadressen din for å fortsette.`
  - `Kom tilbake hit`
  - `Vi sjekker status automatisk og sender deg videre.`
- Resend button:
  - `Send e-posten på nytt`
  - disabled if there is no email

Client behavior:

1. Polls `/api/auth/user-status?userId={userId}` every 1 second.
2. Stops polling after 5 repeated errors.
3. If returned `nextStep` exists and is not `VERIFY_EMAIL`, navigates to `resolveAuthNextStepHref(data.nextStep)`.
4. Adds `companyId` query param if present in current URL.

Potential issues:

- The screen says to click a link, not enter an OTP. If the actual backend sends a magic link, this is correct. If it sends a code/OTP, copy is wrong.
- The screen has no manual "I have verified, continue" button. If polling fails or is delayed, the user can feel stuck.
- The special `redirectUrl=booking` banner says "Gå tilbake til bookingsteget", which is vague and may encourage browser back navigation instead of a safe flow button.
- The page depends on `verification_session_token`. If that cookie is missing, it redirects to the generic contact page.
- On successful polling, it uses raw `resolveAuthNextStepHref`, not the normalized status helper. That may reintroduce email/mobile ordering issues.

## Current Mobile Verification Screen

Source:

- `app/routes/booking/public/appointment/session/contact/verify-mobile/booking.public.appointment.session.contact.verify-mobile.route.tsx`

Loader behavior:

1. Requires appointment session and `session.userId`.
2. Requires verification session token cookie.
3. Calls `AuthController.verificationStatus({ verificationSessionToken })`.
4. If status `nextStep !== VERIFY_MOBILE`, redirects via raw `resolveAuthNextStepHref(verificationStatus.nextStep)`.
5. Otherwise renders the page.

UI:

- Header:
  - `Bekreft mobil`
  - `Skriv inn koden vi har sendt på SMS for å bekrefte mobilnummeret.`
- Back/change link:
  - `Endre mobilnummer`
- Error notice:
  - `Kunne ikke bekrefte kode`
- Resend error notice:
  - `Kunne ikke sende ny SMS`
- Initial delivery notices:
  - `Vi har sendt deg en SMS-kode.`
  - `Du har allerede en aktiv kode. Bruk den siste koden du mottok.`
  - `Vi klarte ikke å sende SMS-koden. Prøv igjen.`
- Verification code input:
  - 6 digits
- Submit:
  - `Bekreft kode`
- Resend:
  - `Send SMS på nytt`

Client behavior:

1. User enters 6-digit code.
2. Form posts to `/api/auth/verify-mobile`.
3. On success, client navigates to `resolveAuthNextStepHref(fetcher.data.nextStep)`.

Potential issues:

- It does not display the mobile number being verified.
- It depends on the verification token cookie; missing token redirects to generic contact page.
- If the backend says `VERIFY_EMAIL` after mobile, raw `resolveAuthNextStepHref` sends user to email verification.

## Current Auth Step Mapping

Source:

- `app/routes/booking/public/appointment/session/contact/_utils/auth.utils.ts`

Raw next-step mapping:

- `COLLECT_EMAIL` -> collect-email
- `COLLECT_MOBILE` -> collect-mobile
- `VERIFY_EMAIL` -> verify-email
- `VERIFY_MOBILE` -> verify-mobile
- `DONE` -> employee

Normalized auth-status mapping:

If `authStatus.nextStep` is `COLLECT_EMAIL` or `VERIFY_EMAIL`:

1. If no mobile number exists -> collect-mobile.
2. Else if mobile is not verified -> verify-mobile.
3. Else -> employee.

Otherwise it falls back to raw next-step mapping.

Important inconsistency:

- Some routes use `resolveAuthStatusNextStepHref(authStatus)`.
- Some routes use raw `resolveAuthNextStepHref(nextStep)`.
- This can produce different UI paths for the same user depending on where they refresh or navigate from.

Tests confirm this inconsistency is intentional/current:

- `auth.utils.test.ts` expects `VERIFY_EMAIL` to normalize to employee if mobile is already verified.
- `verify-mobile.route.test.ts` expects raw `VERIFY_EMAIL` from verification status to redirect to verify-email.

## Current Guard for Later Booking Steps

Source:

- `app/routes/booking/public/_utils/booking.require-authenticated-flow.server.ts`

Used by later booking steps such as overview and likely other protected booking steps.

Behavior:

1. Reads appointment session.
2. If stale, clears session cookie and redirects to appointment start.
3. If no session or no `session.userId`, redirects to contact.
4. Calls `ContactAuthService.getUserStatus(request)`.
5. If no auth status:
   - clears appointment session cookie
   - redirects to contact
6. If `authStatus.nextStep !== DONE`:
   - resolves normalized next step
   - if normalized next step is not employee, redirects to that verification/collection route
   - if normalized next step is employee, allows flow
7. Returns session when allowed.

High-risk behavior:

- A temporary failure to fetch auth status can clear the appointment session cookie.
- That can turn a recoverable state problem into a user-visible reset.
- The reported complaint may involve browser back/forward navigation plus missing auth status or missing verification token.

## Current Final Confirmation Flow

Source:

- `app/routes/booking/public/appointment/session/overview/booking.public.appointment.session.overview.route.tsx`

Overview loader:

- Requires authenticated booking flow.
- Fetches appointment session overview.
- Shows selected time, services, contact information, and employee.
- Contact section has an `Endre` link back to contact.

Overview action:

- Requires authenticated booking flow.
- Calls `submitAppointmentSession`.
- Redirects to `/booking/public/appointment/success?companyId={companyId}&appointmentId={appointmentId}`.

Current implication:

- Even after the user reaches overview, clicking "Endre" under contact can send them back into the same complex contact identity page.

## Current UI Weak Points Related to Complaint

1. The contact page can fail to show the known session user.
   - It only fetches `sessionUser` when auth or verification token exists.
   - If only `appointment_session` with `userId` exists, the UI may show generic login/create-account choices.

2. The contact page language is identity/account-first.
   - `Hvordan vil du fortsette?`
   - `Logg inn`
   - `Opprett konto`
   - This may be correct for an app account flow, but it is confusing during public booking where the user's mental model is "I am booking an appointment".

3. Email verification is passive and polling-dependent.
   - No manual "I verified, continue" action.
   - If the email is delayed, browser back becomes tempting.
   - If polling fails, the user only sees a muted notice.

4. The `redirectUrl=booking` copy may encourage unsafe navigation.
   - It says "Gå tilbake til bookingsteget" rather than presenting a clear button.

5. Missing verification token cookie sends users to generic contact.
   - If the cookie is lost, expired, or blocked, the UI does not recover from session user state.

6. Raw and normalized next-step mapping are inconsistent.
   - Some screens treat `VERIFY_EMAIL` as required.
   - Other screens skip email verification when mobile is verified because email is optional.

7. Later route guard can clear session on missing auth status.
   - This could make a backend-successful flow feel broken on frontend.

8. The mobile verification screen does not show the mobile number.
   - Desired flow says the user should see which mobile number was used.

9. The sign-up screen requires password and account creation.
   - This makes "booking contact info" feel like "registration".
   - If account creation is required by backend, UI should explain why in booking terms.

10. Going back to contact after verification may not show "continue your existing booking".

- It can show "Logg inn" / "Opprett konto" instead of a status-aware resumable card.

## Desired Future UX Principles

Fable should propose a flow where:

1. The user always sees one obvious next action.
2. Booking context is preserved and visible.
3. Going back never corrupts or hides known session state.
4. Contact, verification, sign-in, registration, and continuing an existing booking are visually distinct.
5. Every page load refetches current session/user verification status before choosing the screen.
6. A user who has already verified email or mobile is never asked to verify it again.
7. Delivery failure or delay is handled with calm recovery actions.
8. The user never needs to understand backend states like `nextStep`, `verificationSessionToken`, pending session user, auth cookies, or session user.

## Suggested Target Flow for Planning

This is not implemented yet. It is the preferred direction for Fable to refine.

### Step 1: Contact Identity Hub

Route could remain `/contact`, but UI should become status-aware.

Preferred loader behavior:

1. Always fetch appointment session.
2. If session has `userId`, always attempt to fetch status for that user or a session-user endpoint.
3. If auth/verification token is missing, still show a resumable session state from appointment session if possible.
4. Decide a single primary next action from normalized state.

Preferred UI states:

- New booking contact:
  - Primary: enter contact details.
  - Secondary: sign in if already a customer.
- Existing pending contact:
  - Show name/email/mobile known for the appointment session.
  - Primary: continue verification or continue booking.
  - Secondary: change contact.
- Authenticated user:
  - Show logged-in user and whether it matches session contact.
  - Primary: continue booking.
  - Secondary: switch user.
- Verification needed:
  - Do not show generic sign-up.
  - Show exactly what remains: verify email or verify mobile.

### Step 2: Contact Info

Prefer one booking-oriented screen over "Opprett konto" when possible.

The screen should answer:

- Why do we need this?
- What will be verified?
- What is optional?
- What happens next?

Potential copy:

- Title: `Kontaktinformasjon`
- Description: `Vi bruker mobilnummeret ditt til å bekrefte bookingen og sende viktig informasjon om timen. E-post er valgfritt.`
- Primary button when mobile required: `Fortsett til SMS-bekreftelse`
- If email entered and email verification is actually required: `Fortsett til e-postbekreftelse`
- If backend requires password/account, explain it in booking terms instead of leading with "Opprett konto".

### Step 3: Email Verification

Only show this if email verification is truly required.

UI should include:

- The exact email address.
- Clear mechanism:
  - If magic link: `Klikk på lenken i e-posten`.
  - If OTP code: show code input.
- Primary recovery:
  - `Jeg har bekreftet - fortsett`
  - This should manually refetch status.
- Secondary:
  - `Send e-post på nytt`
  - `Endre e-post`
- If delivery fails:
  - Tell user clearly.
  - Keep session state.
  - Offer resend/change/continue without email if allowed.

Avoid:

- Telling the user to "go back".
- Sending them to generic contact unless there is no recoverable session.

### Step 4: Mobile Verification

Show this if mobile verification is required.

UI should include:

- The exact mobile number.
- 6-digit code input.
- Primary: `Bekreft kode`
- Secondary:
  - `Send SMS på nytt`
  - `Endre mobilnummer`
- If code was already used or mobile already verified:
  - Auto-continue or show `Fortsett til booking`.

### Step 5: Continue Booking

After status is `DONE` or normalized equivalent:

- Go directly to the next incomplete booking step.
- If contact step is complete, usually route to employee or the first incomplete booking step.
- Do not route back to contact unless the user explicitly chooses to edit contact.

### Step 6: Final Confirmation

After submitting overview:

- Show success page only.
- Include appointment details.
- Do not offer actions that send user into registration unless needed for account management.

## Implementation Questions Fable Should Answer

1. Should public booking require account creation/password at all, or should it use a guest contact model with verified mobile?
2. If the backend still requires account creation, how should the UI phrase this without making the user feel diverted from booking?
3. Should email verification be optional when mobile is verified?
4. Should `VERIFY_EMAIL` always normalize away in booking if mobile is verified?
5. What endpoint should the frontend use to recover session user state when auth cookies and verification token are absent but `appointment_session.userId` exists?
6. Should `requireAuthenticatedBookingFlow` stop clearing appointment session on missing auth status?
7. Should verification screens have explicit manual "continue/check status" buttons in addition to polling?
8. Should the contact step become a nested state machine with a single server-side resolver for next UI state?
9. Should all routes use one normalized redirect resolver instead of mixing raw and normalized mapping?
10. How should browser back be handled from email/mobile verification screens?

## Required Research Before Planning

Before proposing the new flow, Fable should research how strong consumer and enterprise applications handle similar public booking, checkout, onboarding, identity verification, and interrupted verification flows.

Research should include:

1. Enterprise appointment/booking products:
   - How products like Calendly, Fresha, Square Appointments, Google appointment scheduling, Microsoft Bookings, healthcare portals, and service marketplaces collect contact details.
   - Whether they require account creation before booking or allow guest booking.
   - How they communicate optional vs required contact channels.
   - How they handle returning users without making them feel forced into registration.

2. Checkout and conversion-oriented flows:
   - How ecommerce checkout handles guest checkout, sign-in prompts, account creation after checkout, and abandoned/interrupted flows.
   - How checkout flows preserve cart/session state when identity verification or payment steps fail.
   - Which patterns reduce drop-off: single primary CTA, progress indication, resumable sessions, and delayed account creation.

3. Verification and OTP UX:
   - Best practices for email magic links, email OTP codes, SMS OTP codes, resend timing, fallback actions, and delayed delivery.
   - How screens should explain "check your email/SMS" without making users navigate away unsafely.
   - When to use automatic polling, manual "I have verified" buttons, or both.
   - How to show the exact email/mobile being verified and make change actions safe.

4. Enterprise resilience patterns:
   - How robust apps recover when auth/session cookies are missing but a backend session still exists.
   - How to design state machines so refresh/back/forward navigation is idempotent.
   - How to avoid clearing a valuable in-progress booking session on transient auth-status errors.
   - How to handle partial identity states without exposing backend terminology to users.

5. UX writing and accessibility guidelines:
   - Recommended copy for "continue", "verify", "resend", "change contact info", and "continue as guest".
   - How to avoid account-centric language when the user's goal is booking an appointment.
   - How to present errors and recovery options accessibly.
   - How to keep one obvious primary action per screen.

The research output should summarize:

- Common patterns found across mature products.
- Which patterns are most relevant to this booking flow.
- Which patterns should be avoided because they would increase friction or confusion.
- How the researched patterns map to the current route/state architecture in this app.
- A recommended target flow that is both user-friendly and realistic to implement in this codebase.

## Concrete Code Areas Likely Needing Change

- `app/routes/booking/public/appointment/session/contact/_services/contact-session.service.server.ts`
  - Always resolve session-linked user state when `session.userId` exists.

- `app/routes/booking/public/appointment/session/contact/booking.public.appointment.session.contact.route.tsx`
  - Replace generic login/sign-up hub with state-aware resume UI.

- `app/routes/booking/public/appointment/session/contact/_utils/auth.utils.ts`
  - Consolidate raw vs normalized next-step behavior.

- `app/routes/booking/public/appointment/session/contact/verify-email/booking.public.appointment.session.contact.verify-email.route.tsx`
  - Add manual continue/check status.
  - Improve delivery-failure and delayed-email recovery.
  - Avoid vague "go back" copy.

- `app/routes/booking/public/appointment/session/contact/verify-mobile/booking.public.appointment.session.contact.verify-mobile.route.tsx`
  - Show mobile number.
  - Normalize redirect behavior after verification/status fetch.

- `app/routes/booking/public/_utils/booking.require-authenticated-flow.server.ts`
  - Avoid clearing appointment session on transient auth-status failure.
  - Redirect to a recoverable contact status screen instead.

- `app/routes/booking/public/appointment/session/contact/sign-up/booking.public.appointment.session.contact.sign-up.route.tsx`
  - Reframe as booking contact info if possible.
  - If account creation remains, explain it clearly.

- `app/routes/booking/public/appointment/session/contact/sign-in/booking.public.appointment.session.contact.sign-in.route.tsx`
  - Clarify when sign-in is required versus optional.

## Acceptance Criteria for the Future Solution

1. Refreshing any contact/verification route preserves the appointment session and routes to the correct current state.
2. Browser back from verify-email or verify-mobile does not show a misleading unregistered state.
3. A session with `userId` never appears as a brand-new user state unless the backend confirms the user/session is invalid.
4. Email delivery failure or delay has clear resend, change, and manual status-check recovery.
5. If mobile is already verified and email is optional, the user is sent forward, not back to email verification.
6. Every verification screen displays the actual email/mobile being verified.
7. There is one canonical frontend resolver for booking contact state.
8. Tests cover:
   - session with userId but no auth token
   - missing verification token but recoverable session user
   - email verified then back to contact
   - mobile verified then back to contact
   - delayed email with manual status check
   - auth status temporary failure
   - final success does not route back into contact

## Summary for Fable

The current frontend technically supports sign-up, sign-in, email verification, mobile verification, and appointment submission. The main UX problem is that these are exposed as account/auth states rather than a clear booking contact journey. The frontend also has inconsistent state resolution and redirect mapping, especially around `VERIFY_EMAIL`, `session.userId`, missing verification cookies, and auth-status failures.

The plan should create a single resilient booking-contact state machine and a UI that always says: "here is the contact we have, here is what remains, here is the one next action."
