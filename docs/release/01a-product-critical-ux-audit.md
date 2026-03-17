# Product-Critical UX Audit

## Scope

This is the first-pass UX audit for launch-critical frontend flows.

It is based on:

- current route implementations
- shared template usage
- current table/form/accordion patterns
- obvious route-state handling
- mobile-risk patterns visible in code

This is not the final QA pass. It is the implementation-driving audit that identifies where Product-Critical UX work is required first.

## Status Legend

- `healthy`: good baseline, minor cleanup only
- `needs fixes`: usable, but important UX gaps remain
- `high priority`: launch-sensitive UX problems remain
- `not audited deeply yet`: only surface-level review so far

## Executive Summary

### Strongest Areas

- auth routes have a relatively strong shared-shell baseline through `FormPageTemplate`
- notifications are structurally one of the cleanest company subsystems
- company-context now uses the shared page shell and reads like part of the same product

### Highest-Risk UX Areas

- booking overview still carries too much visual drift and route-owned styling
- booking appointments still depends on legacy table/dialog surfaces and weak loader-error UX
- timesheets still depend on older calendar interaction patterns and have uneven failure handling
- company admin subroutes still mix strong shared structure with weak fallback/error presentation

### Repeating Systemic Problems

- route-owned manual CTA/link styling repeated in many routes
- legacy `ServerPaginatedTable` and dialog usage still shape key flows
- some routes return silent empty UI or plain red text instead of product-grade failure states
- some important flows have desktop-first interaction assumptions

## Route Group Audit

## 1. Auth

### Status

`needs fixes`

### What Is Working

- strong shared shell through `FormPageTemplate`
- submit/loading states are generally present
- auth flow routing appears deliberate
- sign-in, sign-up, reset-password, and invite flows have clear structural hierarchy

### Main UX Gaps

- auth variants (`emphasis`, `airy`, etc.) still create inconsistent surface tone between closely related routes
- secondary navigation patterns are inconsistent:
  - some routes use footer blocks
  - some use action links
  - some use inline return links
- field-level validation clarity is still mostly dependent on backend response text rather than deliberate inline UX
- invite-completion routes have dense information panels that may feel heavy on mobile

### High-Priority Route Notes

- [auth.sign-in.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/auth/sign-in/auth.sign-in.route.tsx)
  Good baseline. Needs consistency review for secondary links and auth-provider hierarchy.
- [auth.sign-up.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/auth/sign-up/auth.sign-up.route.tsx)
  Good form structure. Needs stronger password/help-state UX and consistency with sign-in footer/actions.
- [auth.respond-invite.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/auth/respond-invite/auth.respond-invite.route.tsx)
  Functional, but dense. Company/invite info block likely needs compaction and better scan hierarchy.

### Recommended Next Actions

- unify secondary navigation treatment across auth routes
- define one consistent success/error/help pattern for auth forms
- review invite routes specifically on mobile spacing and information density

## 2. User Company-Context

### Status

`needs fixes`

### What Is Working

- uses shared `PageTemplate`
- compact and coherent visual structure
- selection-card model is appropriate for the task
- empty state is present

### Main UX Gaps

- action failure is not surfaced in the UI even though the action can return `{ error }`
- no visible pending state when selecting a company
- selection grid may become visually dense on smaller screens or with many companies
- no explicit explanatory state if sign-in to the selected company fails

### High-Priority Route Notes

- [user.company-context.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/user/company-context/user.company-context.route.tsx)
  Structurally strong, but missing submission/error feedback. This is one of the clearest examples of “good shell, incomplete UX state.”

### Recommended Next Actions

- surface action errors in-route
- add pending/disabled interaction state for company switching
- test and possibly tighten the mobile grid/card behavior

## 3. Company Dashboard

### Status

`healthy`

### What Is Working

- strong use of `CompanyPageTemplate`
- clear summary structure
- empty state exists
- content is compact and legible

### Main UX Gaps

- very little route-level risk visible in code
- mostly a cleanup/consistency candidate rather than a broken experience

### High-Priority Route Notes

- [company.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/company.route.tsx)
  Good baseline and a decent example for simple company-domain pages.

### Recommended Next Actions

- keep this as a reference surface
- only revisit if template rhythm changes globally

## 4. Company Admin

### Status

`needs fixes`

### What Is Working

- top-level admin overview uses the shared template well
- admin overview has meaningful empty fallback
- employees route uses shared tabs and table structure

### Main UX Gaps

- top-level admin overview still uses route-owned metric and header helpers instead of canonical shared organisms
- employees and contacts routes still fall back to plain red error text instead of product-grade notices or empty-state patterns
- contacts and service-management subroutes still rely on legacy table/dialog flows
- CTA consistency across employees/contacts/settings is not fully normalized

### High-Priority Route Notes

- [company.admin.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/company.admin.route.tsx)
  Good overview shell, but still partially route-owned in its information presentation.
- [company.admin.employees.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/employees/company.admin.employees.route.tsx)
  Major UX gap: error state is a plain centered red string, not a company-system notice or empty state.
- [company.admin.contacts.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/admin/contacts/company.admin.contacts.route.tsx)
  Same problem pattern as employees. Table flow works, but route-grade failure UX is weak.

### Recommended Next Actions

- replace plain error text fallbacks with shared notice/empty-state treatment
- continue migrating admin subroute dialogs/tables toward the in-house UI system
- extract repeated route-level info-card patterns if they remain useful

## 5. Booking Overview

### Status

`high priority`

### What Is Working

- page shell and high-level dashboard intent are correct
- route links and hero metrics exist
- accordion structure supports dense information segmentation

### Main UX Gaps

- this route still has too much route-owned visual language
- many surfaces still use mixed classes like `bg-primary/10`, `bg-muted/30`, `text-muted-foreground`, and one-off styling instead of the stricter token/template system
- if metrics fail to load, the route returns an empty fragment instead of a usable failure state
- this page is supposed to be the visual benchmark for the company booking domain, so drift here is especially costly

### High-Priority Route Notes

- [company.booking.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/company.booking.route.tsx)
  Strong information architecture, weak system discipline. Needs a focused cleanup pass to become the canonical booking surface.

### Recommended Next Actions

- add explicit loader-error fallback
- reduce non-token visual drift
- move remaining route-owned metric/subsection presentation into shared patterns where practical

## 6. Booking Admin

### Status

`needs fixes`

### What Is Working

- top-level booking admin page uses `CompanyPageTemplate`
- information architecture is simple and understandable
- service groups route has functioning table/search/create/edit/delete flows

### Main UX Gaps

- booking admin still depends on legacy server-side table and dialog patterns
- route-level cards and metric cards still carry one-off accent styling
- service groups and service tables need stronger error-state UX and more consistent primary-action behavior
- some copy and labels still feel transitional rather than final

### High-Priority Route Notes

- [company.booking.admin.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/admin/company.booking.admin.route.tsx)
  Good shell, but route-owned card rhythm still needs tightening.
- [company.booking.admin.service-groups.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/admin/service-groups/company.booking.admin.service-groups.route.tsx)
  Functional, but strongly shaped by legacy dialog/table architecture and weak error display conventions.

### Recommended Next Actions

- normalize booking admin cards and actions to shared system patterns
- improve failure/empty handling in service-group and service-management routes
- continue reducing legacy dialog/table dependence

## 7. Booking Profile

### Status

`needs fixes`

### What Is Working

- route-based create/edit flow is the right direction
- compact accordion form structure is in place
- services and schedule sections are logically grouped
- profile overview uses a coherent template shell

### Main UX Gaps

- profile overview still mixes tokenized surfaces with older utility-style color decisions
- overview page has a lot of route-owned presentation that should become more canonical if this flow is strategically important
- profile/no-profile states need explicit confirmation that the user understands what is missing and what to do next
- schedule and services sections remain high-density areas that need careful mobile QA

### High-Priority Route Notes

- [company.booking.profile.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/profile/company.booking.profile.route.tsx)
  Strong feature direction, but still visually mixed.
- [booking-profile-form.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/profile/_components/booking-profile-form.tsx)
  One of the most important UX-heavy components in the app. Needs explicit mobile and state audit.

### Recommended Next Actions

- refine no-profile/create-entry messaging
- tighten overview-page consistency with the company booking visual system
- test services and schedule sections heavily on mobile

## 8. Booking Appointments

### Status

`high priority`

### What Is Working

- strong overall route structure
- clear hero metrics
- clear primary action
- create-flow branching exists and is understandable

### Main UX Gaps

- still depends on legacy `ServerPaginatedTable` and legacy dialog components
- loader error is swallowed into an empty dataset, which risks showing a misleading “no appointments” state instead of a failure state
- route uses mixed legacy/new component boundaries in a high-value workflow
- mobile and desktop action consistency still depends on table stack behavior rather than fully shared company patterns

### High-Priority Route Notes

- [company.booking.appointments.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/booking/appointments/company.booking.appointments.route.tsx)
  This is a core operating route and should not rely on silent fallback behavior.

### Recommended Next Actions

- show loader error explicitly
- continue migrating the table/dialog stack to shared `~/ui` abstractions
- audit create-flow selectors as a unified UX sequence

## 9. Notifications

### Status

`healthy`

### What Is Working

- strong use of shared template
- loader error is surfaced with `Notice`
- list/detail route pair feels coherent
- metric summary is simple and readable

### Main UX Gaps

- filter density and mobile scanability still need real-device QA
- row components should be reviewed for density and readability under long content

### High-Priority Route Notes

- [company.notifications.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/notifications/company.notifications.route.tsx)
  One of the cleanest current list views.
- [company.notifications.view.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/notifications/view/company.notifications.view.route.tsx)
  Good detail-view pattern and a decent reference for compact detail pages.

### Recommended Next Actions

- do a mobile/density check
- keep as a reference implementation for list/detail consistency

## 10. Timesheets

### Status

`high priority`

### What Is Working

- route shell and hero metrics are aligned with company patterns
- admin submissions route has better notice handling than some other admin flows
- timesheet admin grouping model is conceptually solid

### Main UX Gaps

- main timesheet route still depends on legacy `CalendarView` outside the in-house UI system
- main timesheet loader does not appear to have explicit recoverable error handling
- popover-hover interaction is desktop-biased and may not translate well to touch
- status color classes remain old-style utility decisions instead of a stricter token model
- timesheet filters and calendar-heavy flows remain high-complexity UX areas

### High-Priority Route Notes

- [company.timesheet.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/timesheet/company.timesheet.route.tsx)
  High-risk route because it combines calendar interaction, edit-entry routing, and older component dependencies.
- [company.timesheet.admin.submissions.route.tsx](/Users/adambaser/Documents/portal.pitell/app/routes/company/timesheet/admin/submissions/company.timesheet.admin.submissions.route.tsx)
  Better state handling than the main timesheet page, but still needs compactness and mobile verification.

### Recommended Next Actions

- add stronger failure handling for the main timesheet route
- audit calendar interaction for touch/mobile behavior
- evaluate whether `CalendarView` should be wrapped or migrated into `app/ui`

## Shared Component Findings

## Strong Shared Foundations

- `PageTemplate`
- `CompanyPageTemplate`
- `FormPageTemplate`
- `CompanyMetricCard`
- `Notice`

These give the app a credible structural baseline.

## Shared UX Hotspots

- legacy `ServerPaginatedTable`
- legacy dialogs in critical CRUD flows
- `CalendarView`
- route-owned metric tiles/cards/subsection wrappers
- repeated manual route-link buttons

These are the main shared surfaces still causing route-level UX inconsistency.

## Priority Fix Order

1. booking overview
2. booking appointments
3. timesheets
4. company admin subroute error/fallback handling
5. company-context submission feedback
6. auth consistency cleanup

## Recommended Next Step

Turn this audit into an execution tracker by adding per-route statuses directly in this file or a companion checklist:

- `not started`
- `in progress`
- `blocked`
- `done`
