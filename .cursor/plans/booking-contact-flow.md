# Booking Contact Flow

## Scope
This document covers the booking contact step only, using the embedded signup flow on the booking contact page (no separate `/auth/sign-up` path). Required signup fields: given name, family name, email, mobile, password, confirm.

## Inputs and APIs
- Session state: `session`, `authUser`, `sessionUser`, `requirements`, `pendingUser`.
- Booking endpoints:
  - `GET /public/appointment-session/{sessionId}/requirements`
  - `GET /public/appointment-session/{sessionId}/user-status`
  - `GET /public/appointment-session/{sessionId}/pending-user`
  - `POST /public/appointment-session/{sessionId}/set-pending-user`
  - `DELETE /public/appointment-session/{sessionId}/pending-user`
  - `POST /public/appointment-session/{sessionId}/attach-user`
  - Clear session user endpoint (newly generated; confirm exact path/method)
- Identity endpoints:
  - `signUp`
  - `signIn` (LOCAL or provider)
  - `providerCompleteProfile`
  - `resendVerification`
  - `verificationSessionToken` (from `signUp`, used to resend verification without auth)

## NextStep rules
`nextStep` drives UI state and follow-up requests:
- `COLLECT_EMAIL` → collect email before continuing.
- `COLLECT_MOBILE` → collect mobile before continuing.
- `VERIFY_EMAIL` → prompt for email verification, allow resend.
- `VERIFY_MOBILE` → prompt for SMS verification, allow resend.
- `ATTACH_SESSION` or `DONE` → attach and continue to next booking step.

## Flow narrative (explicit response handling)

### Signup (embedded form)
1. User submits valid form (name, email, mobile, password).
2. Call `signUp`.
3. If `nextStep` = `SIGN_IN`:
   - Call `signIn` (LOCAL) immediately with the same credentials.
   - On success → `set-pending-user`, then `attach-user`.
   - Continue to next booking step.
4. If `nextStep` = `VERIFY_*`:
   - Store `verificationSessionToken` from the response.
   - Stay on contact page and show next-step panel.
   - Allow resend via `resendVerification` using `verificationSessionToken` (no auth).
5. If `nextStep` = `COLLECT_*`:
   - Stay on contact page and show next-step panel.
   - Prompt user to sign in if collection requires auth.

### Sign-in (LOCAL or provider)
1. User signs in via local form or provider.
2. On success → call `set-pending-user`.
3. If `nextStep` = `COLLECT_*`:
   - Show profile completion form.
   - Submit via `providerCompleteProfile`.
4. If `nextStep` = `VERIFY_*`:
   - Show verification required panel.
   - Allow `resendVerification`.
5. If `nextStep` = `ATTACH_SESSION` or `DONE`:
   - Call `attach-user`.
   - Continue to next booking step.

### Session user attached but visitor not logged in
1. Show session user details (name, email, mobile, verification status).
2. “Fortsett med denne brukeren” requires sign-in first:
   - Prompt local/provider sign-in.
   - If logged-in user matches session user → attach and continue.
   - If mismatch → show mismatch warning and do not attach.
3. If session user has verified both email and mobile:
   - Show the signup accordion (create different user).

### Provider complete profile
1. Submit missing email/mobile via `providerCompleteProfile`.
2. On success → call `set-pending-user`.
3. If `nextStep` = `ATTACH_SESSION` or `DONE` → attach and continue.
4. Otherwise show next-step panel and keep pending state visible.

## UI state handling

### pendingUser present
- Show status panel with `nextStep` copy.
- If `COLLECT_*` → show minimal input form and submit to `providerCompleteProfile`.
- If `VERIFY_*` → show resend button.
- Hide main sign-in/sign-up forms.
- Show Reset CTA.

### signup response without pending user
- When `signUp` returns `VERIFY_*`, show next-step panel inside signup accordion.
- Include resend CTA using `verificationSessionToken` and display email/SMS delivery status.

### sessionUser exists but visitor not logged in
- Show session user summary (name, email, mobile, verification status).
- Primary CTA: “Fortsett med denne brukeren”.
  - Prompts sign-in first, then attach on match.
- If the session user is fully verified (email + mobile), show the signup accordion.
- Secondary CTA: “Fortsett med en annen bruker”.
  - Call clear session user endpoint.
  - Reset UI to the normal sign-in/sign-up view.

### authUser matches sessionUser
- Show user summary.
- Allow continue (attach if `nextStep` allows).

### authUser mismatch
- Show warning that logged in user differs from session user.
- Show sign-in options and “create different user”.

## Reset behavior
- Reset CTA is visible whenever a pending user exists.
- On click → `DELETE /pending-user`.
- UI resets: clear form inputs and collapse signup accordion.

## Continue with different user
- Visible when a session user exists and visitor is not logged in.
- On click → clear session user endpoint.
- After clear: show the default sign-in/signup state and remove the session summary panel.

## Mermaid flow
```mermaid
flowchart TD
  start[bookingContact] --> signupForm
  start --> signInForm
  start --> sessionUserPanel

  signupForm -->|submit| signUp
  signUp -->|ok| setPending
  setPending --> nextStepCheck

  signInForm -->|success| setPending

  sessionUserPanel -->|continue with this user| userStatusCheck
  sessionUserPanel -->|continue with different user| clearSessionUser
  sessionUserPanel -->|requires sign-in| signInForm
  userStatusCheck -->|ATTACH_SESSION or DONE| attachUser
  clearSessionUser --> start

  nextStepCheck -->|COLLECT_EMAIL| collectEmail
  nextStepCheck -->|COLLECT_MOBILE| collectMobile
  nextStepCheck -->|VERIFY_EMAIL| verifyEmail
  nextStepCheck -->|VERIFY_MOBILE| verifyMobile
  nextStepCheck -->|ATTACH_SESSION or DONE| attachUser

  collectEmail -->|submit providerCompleteProfile| setPending
  collectMobile -->|submit providerCompleteProfile| setPending
  verifyEmail -->|resendVerification| verifyEmail
  verifyMobile -->|resendVerification| verifyMobile

  attachUser --> nextStep[bookingNextStep]
  pendingReset[resetPending] -->|DELETE pending-user| start
```
