# Product-Critical UX

## Objective

Make the launch-critical frontend flows complete, compact, consistent, and trustworthy across desktop and mobile.

This workstream is not a generic polish pass. It is a route-by-route UX hardening pass for the parts of the application users will actually depend on at launch.

## What We Are Implementing

We are implementing:

- complete route-state coverage
- consistent page structure
- compact and predictable action hierarchy
- mobile-safe route behavior
- coherent UX across all critical product flows

We are not implementing:

- performance optimization in this track
- release-ops work in this track
- a full redesign of every primitive in the codebase

## Execution Model

This workstream must be executed:

- route group by route group
- page by page
- critical component by critical component

The correct order is:

1. audit routes
2. identify UX gaps
3. fix route-level problems
4. refactor or improve shared components when the same UX issue appears across routes

That means the unit of work is not “all components in the repo.” The unit of work is “every critical route plus the shared components that control its UX.”

## Critical Route Groups

The launch-critical frontend route groups are:

1. auth
2. user/company-context
3. company dashboard
4. company admin
5. booking overview
6. booking admin
7. booking profile
8. booking appointments
9. notifications
10. timesheets

## Global UX Audit Criteria

Every critical route should be reviewed against the same UX checklist.

### Route-Level Checklist

- Does the route use the correct shared template or layout pattern?
- Is the page hierarchy clear?
- Is the visual spacing compact and consistent?
- Are primary and secondary actions obvious?
- Are destructive actions visually distinct and safe?
- Does the route behave correctly on mobile?
- Does the route have a loading state if it depends on async data?
- Does the route have an empty state where appropriate?
- Does the route have a validation error state if it includes forms?
- Does the route have a recoverable API failure state?
- Is success feedback clear and intentional?
- Is the copy understandable without internal context?

### Shared Component Checklist

Whenever a route fails the UX checklist, the following shared component groups should be evaluated:

- page templates
- navbar
- sidebar and mobile sidebar
- page headers and route links
- cards and metric surfaces
- tables and table toolbars
- forms and field groups
- accordions
- dialogs, sheets, and popovers
- selectors
- empty states
- notices and flash messages

## Route Inventory and Audit Plan

## 1. Auth

### Routes

- `app/routes/auth/sign-in/auth.sign-in.route.tsx`
- `app/routes/auth/sign-up/auth.sign-up.route.tsx`
- `app/routes/auth/forgot-password/auth.forgot-password.route.tsx`
- `app/routes/auth/reset-password/auth.reset-password.route.tsx`
- `app/routes/auth/respond-invite/auth.respond-invite.route.tsx`
- `app/routes/auth/respond-user-invite/auth.respond-user-invite.route.tsx`
- `app/routes/auth/collect-email/auth.collect-email.route.tsx`
- `app/routes/auth/collect-mobile/auth.collect-mobile.route.tsx`
- `app/routes/auth/check-email/auth.check-email.route.tsx`
- `app/routes/auth/verify-email/auth.verify-email.route.tsx`
- `app/routes/auth/verify-mobile/auth.verify-mobile.route.tsx`
- `app/routes/auth/sign-out/auth.sign-out.route.tsx`

### UX Goals

- compact and consistent auth surfaces
- clear step progression
- reliable error and recovery messaging
- no confusing route-state transitions

### Audit Focus

- form clarity
- validation and failure messaging
- step continuity
- submit-state feedback
- mobile spacing and keyboard safety

### Shared Components To Check

- `FormPageTemplate`
- `FormField`
- `Button`
- `Notice`
- verification inputs

## 2. User Company-Context

### Routes

- `app/routes/user/company-context/user.company-context.route.tsx`

### UX Goals

- make company switching feel deliberate and trustworthy
- make the route feel structurally aligned with the rest of the product
- keep the selection flow compact and obvious

### Audit Focus

- page clarity
- selection-card hierarchy
- empty state
- context-switch confidence
- copy clarity

### Shared Components To Check

- `PageTemplate`
- `Panel`
- `SelectionCard`
- `Grid`

## 3. Company Dashboard

### Routes

- `app/routes/company/company.route.tsx`

### UX Goals

- clear high-level entry into the company workspace
- coherent summary rhythm
- no design drift away from the established booking-led pattern

### Audit Focus

- metric clarity
- route-link clarity
- summary panel usefulness
- mobile readability

### Shared Components To Check

- `CompanyPageTemplate`
- `CompanyMetricCard`
- `Panel`
- shared empty-state patterns

## 4. Company Admin

### Routes

- `app/routes/company/admin/company.admin.route.tsx`
- `app/routes/company/admin/employees/company.admin.employees.route.tsx`
- `app/routes/company/admin/contacts/company.admin.contacts.route.tsx`
- `app/routes/company/admin/settings/company.admin.settings.route.tsx`

### UX Goals

- consistent administrative overview
- stable table behavior
- compact create/edit/invite actions
- predictable management flows

### Audit Focus

- accordion overview clarity
- employee and contact table states
- invite/edit dialog quality
- CTA priority
- settings page consistency

### Shared Components To Check

- `CompanyPageTemplate`
- `Accordion`
- table shell and toolbar
- dialogs/forms
- `Notice`

## 5. Booking Overview

### Routes

- `app/routes/company/booking/company.booking.route.tsx`

### UX Goals

- use this as the benchmark for compact layout rhythm
- keep the dashboard readable despite dense information
- maintain clear subsection separation without design noise

### Audit Focus

- metric card readability
- accordion scanability
- subsection emphasis
- mobile collapse behavior

### Shared Components To Check

- `CompanyPageTemplate`
- `Accordion`
- `Card`
- metric display patterns

## 6. Booking Admin

### Routes

- `app/routes/company/booking/admin/company.booking.admin.route.tsx`
- `app/routes/company/booking/admin/service-groups/company.booking.admin.service-groups.route.tsx`
- `app/routes/company/booking/admin/service-groups/services/company.booking.admin.service-groups.services.route.tsx`
- `app/routes/company/booking/admin/settings/company.booking.admin.settings.route.tsx`

### UX Goals

- consistent admin-shell behavior across booking admin
- stable, compact table management flows
- reduced visual noise

### Audit Focus

- route-link pattern
- table action consistency
- empty states for services/service groups
- form dialog behavior
- settings page fit with system

### Shared Components To Check

- `CompanyPageTemplate`
- server-paginated table stack
- dialogs/forms
- `ButtonGroup`
- notices

## 7. Booking Profile

### Routes

- `app/routes/company/booking/profile/company.booking.profile.route.tsx`
- `app/routes/company/booking/profile/create/company.booking.profile.create.route.tsx`
- `app/routes/company/booking/profile/edit/company.booking.profile.edit.route.tsx`
- `app/routes/company/booking/profile/schedule-unavailability/company.booking.profile.schedule-unavailability.route.tsx`

### UX Goals

- make create/edit profile flows compact and understandable
- keep route-based forms preferable to dialog/accordion sprawl
- ensure profile state is obvious

### Audit Focus

- profile overview clarity
- create vs edit entry points
- accordion-form usability
- service selector compactness
- daily schedule clarity
- image and description section clarity

### Shared Components To Check

- `CompanyPageTemplate`
- booking profile form
- `Accordion`
- `Checkbox`
- `Textarea`
- services selector

## 8. Booking Appointments

### Routes

- `app/routes/company/booking/appointments/company.booking.appointments.route.tsx`
- `app/routes/company/booking/appointments/create/company.booking.appointments.create.route.tsx`
- `app/routes/company/booking/appointments/create/existing-user/company.booking.appointments.create.existing-user.route.tsx`
- `app/routes/company/booking/appointments/create/new-user/company.booking.appointments.create.new-user.route.tsx`

### UX Goals

- preserve a compact, trustworthy booking-operation flow
- keep list, create, and confirmation states coherent
- avoid table/form visual drift

### Audit Focus

- appointment table states
- header action clarity
- create flow branching
- contact/service/date-time selector usability
- mobile appointment row quality

### Shared Components To Check

- `CompanyPageTemplate`
- table shell
- contact selector
- services selector
- date-time selector
- popover/calendar behavior

## 9. Notifications

### Routes

- `app/routes/company/notifications/company.notifications.route.tsx`
- `app/routes/company/notifications/view/company.notifications.view.route.tsx`

### UX Goals

- make list and detail views read as the same subsystem
- make filter state and status state obvious
- avoid dense unreadable rows

### Audit Focus

- filter card clarity
- row density and readability
- status semantics
- detail view hierarchy
- empty and failure states

### Shared Components To Check

- `CompanyPageTemplate`
- notifications filter card
- notification row components
- badges and notices

## 10. Timesheets

### Routes

- `app/routes/company/timesheet/company.timesheet.route.tsx`
- `app/routes/company/timesheet/register/company.timesheet.register.route.tsx`
- `app/routes/company/timesheet/edit-hours/company.timesheet.edit-hours.route.tsx`
- `app/routes/company/timesheet/edit-range/company.timesheet.edit-range.route.tsx`
- `app/routes/company/timesheet/admin/company.timesheet.admin.route.tsx`
- `app/routes/company/timesheet/admin/submissions/company.timesheet.admin.submissions.route.tsx`

### UX Goals

- make timesheet registration and editing feel reliable and low-friction
- make admin review flows understandable
- reduce friction in calendar and filter-heavy interfaces

### Audit Focus

- week navigation clarity
- filters and query state
- edit flows
- submission status clarity
- calendar readability
- admin submission grouping

### Shared Components To Check

- `CompanyPageTemplate`
- timesheet filters
- calendar components
- submission cards and status sections
- forms and notices

## Route Review Template

Use this checklist for each audited route:

### Route

- path:
- file:
- route group:
- launch criticality:

### Template and Structure

- correct template used:
- page hierarchy clear:
- spacing compact and consistent:
- mobile layout acceptable:

### States

- loading:
- empty:
- success:
- validation failure:
- API failure:
- permission/context failure:

### Actions

- primary action clear:
- secondary action clear:
- destructive action safe:
- route links clear:

### Copy

- title clear:
- descriptions clear:
- field labels clear:
- error messages clear:
- success messages clear:

### Shared Component Issues

- templates:
- forms:
- tables:
- cards:
- overlays:
- selectors:

### Status

- status:
- priority:
- notes:

## Shared Component Audit Targets

The following shared frontend surfaces should be audited in parallel with the route pass because they influence multiple flows:

### Layout and Navigation

- `app/routes/root.layout.tsx`
- `app/routes/company/company.layout.tsx`
- `app/routes/_components/sidebar.tsx`
- `app/routes/_components/mobile-sidebar.tsx`
- `app/components/layout/navbar.tsx`

### Templates

- `app/ui/templates/page-template.tsx`
- `app/ui/templates/company-page-template.tsx`
- `app/ui/templates/form-page-template.tsx`
- `app/ui/templates/sticky-footer-page-template.tsx`

### Shared Interaction Surfaces

- accordion primitives
- table primitives and table header/footer stack
- dialogs, sheets, popovers
- form controls
- notices and flash banners

### Domain-Heavy Shared Components

- booking selectors
- booking profile form
- timesheet filters
- notification filters
- company metric cards

## Definition of Done

- Every critical route has been audited using the same checklist.
- Every launch-critical route has complete UX state coverage.
- The app uses consistent templates and action hierarchy across route groups.
- Mobile behavior is acceptable for all critical journeys.
- Shared component issues discovered during the audit are either fixed or tracked explicitly.

## Immediate Next Step

Turn this file into an execution log by adding status markers route by route:

- `not started`
- `in progress`
- `blocked`
- `done`

See also:

- [01a-product-critical-ux-audit.md](/Users/adambaser/Documents/portal.pitell/docs/release/01a-product-critical-ux-audit.md)
