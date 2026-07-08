# FullCalendar Schedule Migration Implementation Plan

## Objective

Replace the custom company booking schedule grid with a clean FullCalendar route rewrite while keeping the existing backend contract:

```ts
Booking.getScheduleOverview({
  query: {
    fromDateTime,
    toDateTime,
  },
});
```

Main route:

```txt
/company/booking/schedule
```

Primary implementation file:

```txt
app/routes/company/booking/schedule/company.booking.schedule.route.tsx
```

## Accepted decisions

- Employees can navigate back 4 weeks in read-only history.
- Past items remain visible, but editing/deleting past items is disabled.
- Appointment events navigate to `/company/booking/appointments/:appointmentId`.
- Remove the old calendar-local `appointment-details` dialog/action.
- Selecting a time range immediately navigates to create availability/unavailability.
- Mobile keeps the large `Tilgjengelig` / `Utilgjengelig` buttons as the primary creation flow.
- Touch range selection on mobile is secondary only if it behaves well.
- Use only MIT/open-source FullCalendar packages for now.
- Do not design the first version around multi-employee/resource columns.
- If `dailySchedules` is empty, still show an empty calendar.
- Cancelled appointments remain visible with muted/strikethrough styling.
- `noShow` appointments remain visible as `Avtale (ikke møtt)` with distinct styling.
- Use `slotDuration="00:30"` and `snapDuration="00:05"`.
- Use dynamic `slotMinTime` / `slotMaxTime` around working hours and events.
- Replace the old calendar directly after tests pass. Do not ship behind `?calendar=v2`.
- Add Playwright coverage for week navigation, appointment click, and mobile day view.
- Do not fix availability/unavailability list pagination in this migration.

## Rewrite strategy

Do not gradually bend the old pointer/ref/manual-grid route into FullCalendar. Preserve the valid loader/action contract, then rebuild the page around small focused modules:

- Keep the schedule loader and `Booking.getScheduleOverview` backend call.
- Keep the `delete-availability` action and its backend past-interval guard.
- Move calendar mapping into `_utils/fullcalendar-adapter.ts`.
- Move range-selection URL logic into a pure utility.
- Move FullCalendar rendering into `_components/schedule-calendar.tsx`.
- Keep the route file as a thin page shell: header, navigation, mobile day picker/buttons, calendar, and availability/unavailability detail handling.
- Remove the old appointment details fetcher/dialog and custom absolute-positioned grid state.

## TODO implementation checklist

Use this checklist as the coding order. Do not start cleanup until the new calendar renders and tests pass.

### 1. Dependencies

- [x] Install FullCalendar MIT packages:
  - [x] `@fullcalendar/react`
  - [x] `@fullcalendar/core`
  - [x] `@fullcalendar/timegrid`
  - [x] `@fullcalendar/interaction`
  - [x] `@fullcalendar/daygrid`
  - [x] `temporal-polyfill`
- [x] Confirm installed import paths compile in this repo.
- [x] Do not install Premium/resource packages.

Done when:

- [x] `package.json` and lockfile include the new packages.
- [x] `npm run typecheck` can resolve FullCalendar imports once the first component exists.

### 2. Date and navigation policy

- [x] Update `app/routes/company/booking/schedule/_utils/schedule-date.utils.ts`.
- [x] Allow navigation back 4 weeks from the current week.
- [x] Clamp dates older than 4 weeks to the earliest allowed week.
- [x] Allow navigation forward 4 weeks from the current week.
- [x] Clamp dates newer than 4 weeks to the latest allowed week.
- [x] Export/reuse shared constants for the 4-week boundaries.

Done when:

- [x] Unit tests prove current week, 4-weeks-forward, too-new dates, 4-weeks-back, and too-old dates resolve correctly.
- [x] The previous `PAST_WEEK_NAVIGATION_LIMIT` / `toSafeScheduleDate` contradiction is gone.

### 3. Adapter layer

- [x] Create `app/routes/company/booking/schedule/_utils/fullcalendar-adapter.ts`.
- [x] Implement `toCalendarEvents`.
- [x] Implement `toBusinessHours`.
- [x] Implement dynamic calendar window calculation for `slotMinTime`, `slotMaxTime`, `scrollTime`.
- [x] Implement helpers for appointment detail href and selection destination URLs if they keep route code smaller.
- [x] Keep all mapping code pure and unit-testable.

Done when:

- [x] Appointments, cancelled appointments, no-shows, availabilities, and unavailabilities map to FullCalendar events.
- [x] Cancelled appointments get muted/strikethrough class.
- [x] No-show appointments get distinct class and title.
- [x] Empty `dailySchedules` still returns safe calendar config.
- [x] Business hours use FullCalendar day numbers correctly.

### 4. Adapter tests

- [x] Add `app/routes/company/booking/schedule/_utils/fullcalendar-adapter.test.ts`.
- [x] Test event kind mapping.
- [x] Test class names for cancelled and no-show appointments.
- [x] Test business-hours day mapping.
- [x] Test dynamic visible hours with schedules.
- [x] Test dynamic visible hours with events but no schedules.
- [x] Test empty calendar window fallback.

Done when:

- [x] Focused adapter tests pass.

### 5. FullCalendar component

- [x] Create `app/routes/company/booking/schedule/_components/schedule-calendar.tsx`.
- [x] Configure `timeGridWeek` for desktop.
- [x] Configure `timeGridDay` for mobile.
- [x] Use `headerToolbar={false}` to keep the route's existing header.
- [x] Use `timeZone="Europe/Oslo"`.
- [x] Use `locale="nb"` or the correct FullCalendar Norwegian locale setup.
- [x] Use `slotDuration="00:30"` and `snapDuration="00:05"`.
- [x] Use dynamic `slotMinTime`, `slotMaxTime`, and `scrollTime`.
- [x] Enable `selectable`, `selectMirror`, and past-selection blocking.
- [x] Keep `editable={false}`.

Done when:

- [ ] Component renders a week calendar on desktop.
- [ ] Component renders a day calendar on mobile.
- [x] Component receives all data via props and does not call backend directly.

### 6. Clean route rewrite

- [x] Rewrite `app/routes/company/booking/schedule/company.booking.schedule.route.tsx` around the preserved loader/action contract.
- [x] Keep the existing loader and `Booking.getScheduleOverview` backend call.
- [x] Replace manual `ScheduleDesktopView` rendering with `ScheduleCalendar`.
- [x] Preserve existing custom week navigation header.
- [x] Preserve existing mobile day picker or replace it with an equivalent day picker.
- [x] Keep the large mobile `Tilgjengelig` / `Utilgjengelig` buttons.
- [x] Remove the appointment-details fetcher/dialog flow.
- [x] Remove `intent = 'appointment-details'` from the action.
- [x] Keep only `delete-availability` action behavior.

Done when:

- [x] `/company/booking/schedule` renders FullCalendar using real loader data.
- [x] Appointments click through to `/company/booking/appointments/:appointmentId`.
- [x] Availability/unavailability clicks keep current edit/view behavior.
- [x] Past availability/unavailability is view-only.

### 7. Range selection behavior

- [x] Port or reuse `isWithinWorkHours`.
- [x] Convert selected FullCalendar dates to Europe/Oslo local date/time params.
- [x] If selection is inside working hours, navigate immediately to unavailability create.
- [x] If selection is outside working hours, navigate immediately to availability create.
- [x] Do not add a confirm/sticky selection bar.
- [x] Block selecting past ranges.

Done when:

- [x] Selecting inside working hours opens `/company/booking/schedule-unavailability/create?...`.
- [x] Selecting outside working hours opens `/company/booking/schedule/availabilities?...`.
- [x] Past selection does nothing.

### 8. Styling

- [x] Add route-scoped FullCalendar styles using existing project CSS conventions.
- [x] Style appointment events.
- [x] Style availability events.
- [x] Style unavailability events.
- [x] Style cancelled appointments as muted/strikethrough.
- [x] Style no-show appointments distinctly.
- [x] Style business hours as background availability context.
- [ ] Style past time as visually muted.
- [x] Check mobile event text overflow.

Done when:

- [ ] Calendar visually fits the company booking UI.
- [ ] Events remain readable on desktop and mobile.
- [x] No nested-card look is introduced.

### 9. Route/unit tests

- [ ] Add/update route tests for the schedule loader.
- [ ] Test `getScheduleOverview` receives correct `fromDateTime` / `toDateTime`.
- [ ] Test too-old date clamps to 4-week boundary.
- [ ] Test `delete-availability` still validates ID.
- [ ] Test `delete-availability` still fetches availability before deleting.
- [ ] Test no `appointment-details` action path remains.
- [ ] Test selection URL helpers if implemented.

Done when:

- [ ] Focused schedule route/unit tests pass.

### 10. Playwright smoke tests

- [ ] Add a desktop schedule smoke test.
- [ ] Desktop test loads `/company/booking/schedule`.
- [ ] Desktop test navigates next/previous week.
- [ ] Desktop test clicks an appointment and verifies detail-route navigation.
- [ ] Add a mobile schedule smoke test.
- [ ] Mobile test verifies day picker changes visible day.
- [ ] Mobile test verifies large create buttons are visible and usable.

Done when:

- [ ] Focused Playwright schedule tests pass.

### 11. Cleanup

- [x] Delete old manual calendar implementation after the new one passes tests.
- [x] Remove unused imports, refs, state, and helpers from the schedule route.
- [x] Delete `schedule-layout.utils.ts` if unused.
- [x] Delete `schedule-desktop-view.tsx` if unused.
- [x] Keep or rename `schedule-mobile-view.tsx` only if the day picker is reused.
- [x] Trim unused types from `schedule.types.ts`.
- [x] Keep date/time/window utilities only if the adapter still uses them.

Done when:

- [x] `rg` finds no references to deleted manual-grid code.
- [x] Typecheck passes.

### 12. Final verification

- [x] Run focused schedule tests.
- [x] Run `npm run typecheck`.
- [ ] Run focused Playwright tests.
- [x] Run formatting.
- [x] Run `npm run build`.
- [ ] Manually inspect desktop calendar.
- [ ] Manually inspect mobile calendar.

Done when:

- [ ] All commands pass or any remaining failures are documented with reason.
- [ ] Acceptance criteria below are satisfied.

## Backend and data contract

The route loader keeps the current week-range contract:

```txt
?date=YYYY-MM-DD
```

Loader computes:

```ts
const range = toWeekRange(date);
const fromDateTime = formatDateBoundaryInTimeZone(range.fromDate, 'start');
const toDateTime = formatDateBoundaryInTimeZone(range.toDate, 'end');
```

Then calls:

```ts
Booking.getScheduleOverview({ query: { fromDateTime, toDateTime } });
```

The relevant response shape:

```ts
type CompanyUserScheduleOverviewDto = {
  profileId: number;
  dailySchedules: DailyScheduleDto[];
  appointments: ScheduleAppointmentDto[];
  unavailabilities: ScheduleUnavailabilityDto[];
  availabilities: ScheduleAvailabilityDto[];
};
```

No backend changes are planned.

## Step 1 — Install dependencies

Install the FullCalendar packages needed for a non-resource week/day time grid:

```txt
@fullcalendar/react
@fullcalendar/core
@fullcalendar/timegrid
@fullcalendar/interaction
@fullcalendar/daygrid
temporal-polyfill
```

Notes:

- Use MIT/open-source packages only.
- Do not add FullCalendar Premium/resource packages.
- Verify package version and import paths during install. If v7 entrypoints differ, follow the installed version's official imports.

## Step 2 — Route/date utilities

Update:

```txt
app/routes/company/booking/schedule/_utils/schedule-date.utils.ts
```

Required changes:

- Replace the current `toSafeScheduleDate` clamp that prevents past weeks.
- Allow navigation back 4 weeks from the current week.
- Clamp anything earlier than that boundary to the earliest allowed week.
- Allow navigation forward 4 weeks from the current week.
- Clamp anything later than that boundary to the latest allowed week.

Expected behavior:

```ts
const PAST_WEEK_NAVIGATION_LIMIT = 4;
const FUTURE_WEEK_NAVIGATION_LIMIT = 4;
validRange.start = startOfWeek(today) - 4 weeks;
```

The previous contradiction must be removed:

- `PAST_WEEK_NAVIGATION_LIMIT = 4` should match the route-date clamp.
- Previous weeks are read-only through UI guards.

## Step 3 — FullCalendar adapter

Create:

```txt
app/routes/company/booking/schedule/_utils/fullcalendar-adapter.ts
```

Responsibilities:

- Convert `CompanyUserScheduleOverviewDto` into FullCalendar `EventInput[]`.
- Convert `DailyScheduleDto[]` into FullCalendar `businessHours`.
- Compute dynamic visible window inputs for `slotMinTime`, `slotMaxTime`, and `scrollTime`.
- Keep all date/time conversions explicitly aligned with `Europe/Oslo`.

Suggested exports:

```ts
export function toCalendarEvents(overview: CompanyUserScheduleOverviewDto): EventInput[];
export function toBusinessHours(dailySchedules: DailyScheduleDto[]): BusinessHoursInput;
export function getScheduleCalendarWindow(overview: CompanyUserScheduleOverviewDto): {
  slotMinTime: string;
  slotMaxTime: string;
  scrollTime: string;
};
export function getAppointmentDetailHref(appointmentId: number): string;
```

Event mapping:

```ts
appointments -> {
  id: `appointment-${id}`,
  title: noShow ? 'Avtale (ikke møtt)' : 'Avtale',
  start,
  end,
  classNames: [
    'schedule-event',
    'schedule-event-appointment',
    cancelledAt ? 'schedule-event-cancelled' : '',
    noShow ? 'schedule-event-no-show' : '',
  ],
  extendedProps: {
    kind: 'appointment',
    appointmentId: id,
    cancelledAt,
    noShow,
  },
}

availabilities -> {
  id: `availability-${id}`,
  title: 'Tilgjengelig',
  start,
  end,
  classNames: ['schedule-event', 'schedule-event-availability'],
  extendedProps: {
    kind: 'availability',
    availabilityId: id,
  },
}

unavailabilities -> {
  id: `unavailability-${profileId}-${startTime}-${endTime}`,
  title: 'Utilgjengelig',
  start,
  end,
  classNames: ['schedule-event', 'schedule-event-unavailability'],
  extendedProps: {
    kind: 'unavailability',
  },
}
```

Business-hours mapping:

```txt
SUNDAY=0
MONDAY=1
TUESDAY=2
WEDNESDAY=3
THURSDAY=4
FRIDAY=5
SATURDAY=6
```

Cancelled appointments:

- Keep them visible.
- Add muted/strikethrough class.

No-show appointments:

- Keep them visible.
- Add distinct no-show class.

Unit tests:

```txt
app/routes/company/booking/schedule/_utils/fullcalendar-adapter.test.ts
```

Cover:

- Appointment, cancelled appointment, no-show appointment mapping.
- Availability and unavailability mapping.
- Business-hours day-number mapping.
- Empty `dailySchedules` still returns calendar-safe config.
- Dynamic visible window with only events.
- Dynamic visible window with schedules and events.

## Step 4 — FullCalendar component

Create:

```txt
app/routes/company/booking/schedule/_components/schedule-calendar.tsx
```

Component responsibilities:

- Render FullCalendar.
- Keep calendar configuration isolated from the route component.
- Expose callbacks for date navigation, event click, and range selection.

Suggested props:

```ts
type ScheduleCalendarProps = {
  date: string;
  events: EventInput[];
  businessHours: BusinessHoursInput;
  slotMinTime: string;
  slotMaxTime: string;
  scrollTime: string;
  validRangeStart: string;
  isMobileLayout: boolean;
  mobileDayKey: string | null;
  onVisibleDateChange: (date: string) => void;
  onEventClick: (event: EventApi) => void;
  onRangeSelect: (selection: DateSelectArg) => void;
};
```

Base configuration:

```tsx
<FullCalendar
  plugins={[timeGridPlugin, interactionPlugin]}
  initialView={isMobileLayout ? 'timeGridDay' : 'timeGridWeek'}
  initialDate={isMobileLayout && mobileDayKey ? mobileDayKey : date}
  firstDay={1}
  locale="nb"
  timeZone="Europe/Oslo"
  headerToolbar={false}
  allDaySlot={false}
  nowIndicator
  selectable
  selectMirror
  editable={false}
  slotDuration="00:30"
  snapDuration="00:05"
  slotMinTime={slotMinTime}
  slotMaxTime={slotMaxTime}
  scrollTime={scrollTime}
  validRange={{ start: validRangeStart }}
  businessHours={businessHours}
  events={events}
  eventClick={...}
  select={...}
  selectAllow={...}
/>
```

Past selection guard:

- Block selection starting before now.
- Past appointments/availability/unavailability can still be clicked for viewing.

Mobile:

- `timeGridDay` driven by the existing day picker.
- Keep large mobile create buttons.
- Long-press select may remain enabled only if it does not fight page scrolling.

## Step 5 — Route integration

Update:

```txt
app/routes/company/booking/schedule/company.booking.schedule.route.tsx
```

Keep:

- Loader range logic.
- `Booking.getScheduleOverview`.
- Existing custom header/week navigation.
- Existing mobile day picker.
- Existing availability/unavailability creation routes.
- Existing availability delete action with server-side past guard.

Remove:

- Manual grid rendering through `ScheduleDesktopView`.
- `toPositionedItems` and lane layout usage.
- Hour-row state and `HOUR_ROW_HEIGHT_PX`.
- Manual scroll-centering refs.
- Calendar-local appointment details dialog.
- `intent = 'appointment-details'` action.
- `CompanyUserAppointmentController.getAppointmentById({ query: { appointmentId } })` from this route.

Keep the action only for:

```ts
intent === 'delete-availability';
```

Event click behavior:

```ts
appointment:
  navigate(ROUTES_MAP['company.booking.appointments.detail'].href.replace(':appointmentId', String(appointmentId)))

availability:
  open existing detail/edit/delete affordance
  if past: view-only, no edit/delete

unavailability:
  if future: navigate to existing edit flow
  if past: view-only, no edit
```

Range select behavior:

```ts
if selected range is inside dailySchedules:
  navigate('/company/booking/schedule-unavailability/create?from=...&to=...&redirectTo=...')
else:
  navigate('/company/booking/schedule/availabilities?date=...&startTime=...&endTime=...&redirectTo=...')
```

No sticky/confirm selection bar.

## Step 6 — Styling

Add route-scoped FullCalendar styles near the schedule route styling location. Prefer route CSS or existing app CSS conventions.

Required classes:

```css
.schedule-event-appointment {
}
.schedule-event-availability {
}
.schedule-event-unavailability {
}
.schedule-event-cancelled {
}
.schedule-event-no-show {
}
```

Styling requirements:

- Match existing booking/company design tokens.
- Business hours should read as availability background, not a competing event.
- Cancelled appointments: muted and strikethrough.
- No-show appointments: visible and distinct.
- Past time: visually muted.
- Event text must not overflow badly on mobile.
- The calendar should not become a nested-card UI.

## Step 7 — Delete old calendar implementation

After the FullCalendar implementation passes tests, remove the old manual calendar files if no longer referenced:

```txt
app/routes/company/booking/schedule/_components/schedule-desktop-view.tsx
app/routes/company/booking/schedule/_components/schedule-mobile-view.tsx
app/routes/company/booking/schedule/_utils/schedule-layout.utils.ts
```

Only delete `schedule-mobile-view.tsx` if the new implementation inlines or replaces the day picker. If the day picker is reused, keep or rename it.

Also remove now-unused code from:

```txt
app/routes/company/booking/schedule/_types/schedule.types.ts
app/routes/company/booking/schedule/_utils/schedule-window.utils.ts
app/routes/company/booking/schedule/_utils/schedule-time.utils.ts
```

Do not delete utility functions still needed by the new adapter.

## Step 8 — Tests

Unit tests:

- Adapter event mapping.
- Business hours mapping.
- Dynamic calendar window calculation.
- Past navigation clamp.
- Selection destination helper:
  - inside working hours → unavailability create URL
  - outside working hours → availability create URL

Route tests:

- Loader still calls `Booking.getScheduleOverview` with `fromDateTime` and `toDateTime`.
- Invalid/too-old/too-new `date` clamps to the accepted 4-week boundary.
- Schedule action rejects invalid `delete-availability`.
- Schedule action keeps the current server-side past guard before deleting availability.
- No `appointment-details` action remains.

Playwright:

- Desktop smoke:
  - Load `/company/booking/schedule`.
  - Navigate next week and previous week.
  - Click appointment event.
  - Assert navigation to `/company/booking/appointments/:appointmentId`.
- Mobile smoke:
  - Use mobile viewport.
  - Day picker changes visible day.
  - Large `Tilgjengelig` / `Utilgjengelig` buttons are present and usable.
- Visual sanity:
  - Overlapping events render without covering each other incoherently.
  - Cancelled appointment appears muted/struck.
  - No-show appointment appears distinct.

## Step 9 — Verification commands

Run focused tests first:

```txt
npm test -- app/routes/company/booking/schedule --run
```

Run typecheck:

```txt
npm run typecheck
```

Run relevant Playwright tests:

```txt
npm run test:e2e
```

If the full e2e suite is too broad, add/run a focused schedule spec and document the exact command.

Run formatting:

```txt
npm run format
```

## Cutover acceptance criteria

- `/company/booking/schedule` renders FullCalendar, not the custom absolute-positioned grid.
- Loader still fetches schedule data by visible week range.
- Week navigation reloads the correct date range.
- Employees can navigate back 4 weeks, read-only.
- Employees can navigate forward 4 weeks; next/previous buttons disable at the min/max boundary.
- Empty `dailySchedules` still shows an empty calendar.
- Appointments navigate to `/company/booking/appointments/:appointmentId`.
- Cancelled appointments are visible with muted/strikethrough styling.
- No-show appointments are visible and distinct.
- Selecting a future range immediately navigates to the correct create flow.
- Availability and unavailability past items are view-only.
- Availability delete still uses the backend `getAvailability` guard before `deleteAvailability`.
- Mobile day view works with the existing large creation buttons.
- Desktop and mobile Playwright smoke tests pass.
- Typecheck passes.

## Out of scope

- FullCalendar Premium/resource columns.
- Multi-employee calendar view.
- Drag/drop or resize editing of existing events.
- Availability list pagination cleanup.
- Unavailability list pagination cleanup.
- Backend API changes.
