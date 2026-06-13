# CompanyMetricCard To KpiCard Audit

Created: 2026-06-14

Goal: replace all `CompanyMetricCard` usage with `KpiCard`, then remove the
legacy `CompanyMetricCard` export/component if no consumers remain.

## API Mapping

- `CompanyMetricCard label` -> `KpiCard label`
- `CompanyMetricCard value` -> `KpiCard value`
- `CompanyMetricCard icon` -> `KpiCard icon`
- `CompanyMetricCard meta` -> `KpiCard compare`
- `CompanyMetricCard data-accent` or wrapper `accent` -> `KpiCard tone`
- Old `accent="info"` -> `tone="info"` or `tone="primary"` depending on nearby color intent.
- Old `accent="success"` -> `tone="success"`.
- Old neutral/default cards -> choose `primary`, `info`, `success`, `warning`, `danger`, or `purple` based on metric meaning.

## Batch 1 - Company Admin And Booking Admin

- [x] `app/routes/company/admin/company.admin.route.tsx`
  - Replace import and three hero metric cards.
  - Replace local `MetricTile` helper output with `KpiCard` if it wraps `CompanyMetricCard`.
- [x] `app/routes/company/admin/settings/company.admin.settings.route.tsx`
  - Replace three settings hero metric cards.
- [x] `app/routes/company/booking/admin/company.booking.admin.route.tsx`
  - Replace `AdminMetricCard` wrapper output with `KpiCard`.
- [x] `app/routes/company/booking/admin/settings/company.booking.admin.settings.route.tsx`
  - Replace `SettingsMetricCard` wrapper output with `KpiCard`.

## Batch 2 - Booking Profile And Schedule

- [x] `app/routes/company/booking/profile/company.booking.profile.route.tsx`
  - Replace two remaining `CompanyMetricCard` cards in profile details.
- [x] `app/routes/company/booking/schedule-unavailability/company.booking.schedule-unavailability.route.tsx`
  - Replace three hero metric cards.

## Batch 3 - Timesheet

- [x] `app/routes/company/timesheet/company.timesheet.route.tsx`
  - Replace four timesheet hero metric cards.
- [x] `app/routes/company/timesheet/admin/submissions/company.timesheet.admin.submissions.route.tsx`
  - Replace four submissions hero metric cards.

## Batch 4 - Notifications

- [x] `app/routes/company/notifications/company.notifications.route.tsx`
  - Replace three notification summary metric cards.
- [x] `app/routes/company/notifications/view/company.notifications.view.route.tsx`
  - Replace three notification detail metric cards.

## Cleanup

- [x] Remove `CompanyMetricCard` export from `app/ui/organisms/index.ts`.
- [x] Delete `app/ui/organisms/company-metric-card.tsx` if unused.
- [x] Confirm `rg "CompanyMetricCard" app --glob '!build/**'` only matches this audit/history docs or no code.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
