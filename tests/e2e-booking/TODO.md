# Booking E2E — remaining test coverage

What `public-booking.database.spec.ts` covers today, and what still needs writing before launch.
Ordered by "how likely is this to bite us in production".

## Covered now

- Guest books 3 services → verified contact, appointment + service rows, session cleared, success page + `.ics`
- Wrong SMS code rejected without consuming the challenge or attaching a user
- Contact edit: name-only change keeps the user, mobile change re-verifies and swaps the user, cancel restores
- Already-verified user skips the SMS step entirely
- A mistyped code is corrected with Backspace and submitted
- Multi-provider company shows the employee step and books the provider that was picked
- Two customers contesting one slot → second is bounced to select-time, exactly one appointment exists
- Expired challenge refused even with the correct code, and never consumed
- Same service twice → one row with quantity 2
- Customer cancels their own appointment (`cancelled_at` set)

---

## P0 — write these before launch

These are paths a real customer hits on day one, and none are exercised.

- [x] ~~**Two customers grab the same slot.**~~ Done — the loser is redirected to select-time and only one
      appointment is written. The test also proves both sessions really held the same slot first.
- [x] ~~**Company with more than one provider.**~~ Done — fixture now seeds company 2 (Anna + Bjørn).
- [ ] **Booking confirmation notifications.** `AppointmentNotificationDispatcher.sendConfirmationNotifications`
      fires customer email + SMS + in-app, `sendProviderBookingNotifications` fires provider email, and a reminder
      email is scheduled. Nothing asserts any of it. Confirm the dispatch rows/outbox exist and that a booking with
      **no email** (email is optional in the contact schema) still succeeds instead of throwing.
- [ ] **Cancellation — the rest of it.** `cancel-by-id` is covered for the happy path. Still open: that the slot
      actually frees up for rebooking, that cancelling someone else's appointment is refused, and the
      token-link `cancel` route (needs notification capture to get a real token).
- [ ] **OTP attempt lockout.** Currently unassertable — see the known bug note in the spec: `attempts` is rolled
      back, so `MAX_ATTEMPTS = 5` never engages. Once the backend is fixed, assert 5 wrong codes → `CHALLENGE_EXHAUSTED`
      and that a 6th attempt with the _correct_ code is still refused.

## P1 — likely to surface within the first weeks

- [x] ~~**Expired OTP challenge.**~~ Done. The resend-after-expiry recovery path is still untested.
- [ ] **Resend cooldown.** `booking.otp.resend-cooldown-seconds` (default 60). Assert an immediate resend is
      refused and does not create a second challenge row.
- [ ] **Rate limiting.** `OtpRateLimiter` caps per mobile / per IP / per company per hour. Seed challenge rows
      directly to cross the threshold, then assert the request is rejected and no new challenge is written.
- [ ] **Expired booking session.** Route already handles it (`Bookingøkten er utløpt. Start på nytt.`) but nothing
      tests it. Expire the session row, then continue → redirected to the start with the flash message.
- [ ] **No available slots.** Seed an unavailability period or a fully-booked day and assert the select-time page
      degrades sensibly instead of showing an enabled "Fortsett" that fails later.
- [ ] **Booking outside opening hours.** The fixture has no Sunday schedule — assert Sunday offers no slots.
- [x] ~~**Service quantity > 1.**~~ Done for quantity 2. `disableIncrement` and the effect on total duration
      are still untested.
- [ ] **Contact form validation.** Empty first/last name, malformed mobile, malformed email → inline errors,
      no `base.users` row created, no challenge sent.
- [ ] **Signed-in user path.** `session/contact/sign-in` is untested end to end.

## P2 — correctness polish

- [ ] **Bad URL parameters.** Missing/invalid `companyId`, invalid `theme`, invalid `appointmentId` on the success
      page, and a success page for an appointment owned by a _different_ user (authorization, not just 404).
- [ ] **Company not entitled to BOOKING.** Remove the `base.company_products` row and assert the public page refuses.
- [ ] **Back-button / re-submit.** Navigating back after confirming, or double-clicking "Bekreft timebestilling",
      must not create two appointments. Worth folding into the P0 double-booking spec.
- [ ] **`CONTACT_REPLACEMENT_PENDING`** (`PublicSubmitAppointmentSession.kt:50`) — confirming while a mobile
      replacement is mid-flight must be refused.
- [ ] **My appointments** (`booking.public.my-appointments`) — upcoming vs completed listing.
- [ ] **Timezone / DST.** Everything runs `Europe/Oslo`. Book across a DST boundary and assert the stored
      `start_time` and the `.ics` `DTSTART` agree.

---

## Harness work these depend on

- [x] ~~**Second booking profile in `seedBookingFixture`**~~ — company 2 seeds two providers, leaving company 1
      single-provider so the auto-skip branch stays covered.
- [ ] **A seed helper for "existing appointment"** so slot-conflict tests don't have to drive the UI twice.
- [ ] **Notification capture.** Decide between asserting DB/outbox rows or pointing SMTP/SMS at a stub in
      `run-booking-flow.ts` (the BRREG stub is the pattern to copy).
- [ ] **Per-test isolation for parallel runs.** `resetMutableBookingState` truncates shared tables, so the suite is
      pinned to `workers: 1`. Fine for now; revisit if the suite gets slow.
- [ ] **CI — belongs in the backend repo, not this one.** Deliberately not set up yet.
      A workflow here would trigger on portal changes, but the failure that actually bites is a
      _backend_ change breaking booking, and `render.yaml` auto-deploys backend commits to `main`.
      Put it in `adamkb33/pitell` instead: it checks itself out with the built-in `GITHUB_TOKEN`
      and this repo is public, so no PAT is needed anywhere.
      When setting it up: build the backend first (`./gradlew :src:app:classes`) so `bootRun` starts
      inside its boot timeout, install Chromium only, and raise `E2E_BACKEND_TIMEOUT_MS` on a cold
      runner. Testcontainers uses the runner's Docker, which `ubuntu-latest` provides.
      Until then, run `npm run test:e2e:booking` before deploying — it takes about a minute.

## Known bugs this suite has already found

1. **OTP attempts never persist** — `BookingChallengeService.verifyBookingChallenge` is `@Transactional` and throws
   a `RuntimeException` after saving the increment, so Spring rolls it back. Brute-force protection is inert.
2. **Repeatable demo seeds collide on user ID 1** against a fresh database, which is why the harness runs only
   versioned migrations.
3. ~~OTP input unusable after a rejected code~~ — fixed by rewriting `verification-code-input.tsx` as one
   native input.
4. Two flaky assertions of our own making, both now fixed: `locator.all()` does not auto-wait (service groups),
   and `boundingBox()` does not wait for layout (success heading). Worth remembering when adding tests.

---

Worth saying plainly: no suite makes launch failures impossible. Finishing P0 + P1 covers the paths that actually
carry money and customer trust; the rest reduces noise.
