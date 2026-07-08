# Booking Schedule Route Requirements

## Scope

- Route: `company/booking/schedule`
- Role guard: `ADMIN` or `EMPLOYEE` (company user only)
- Sidebar placement: same hierarchy level as booking profile, appointments, administration

## Data + SDK

- Use `Booking.getScheduleOverview` for weekly data (`fromDateTime`/`toDateTime`)
- Use real SDK endpoints for details/edit/delete
- Do not implement actions not present in SDK (for unavailability: no delete endpoint)

## Calendar Rendering Model

- Custom in-app weekly grid (no external calendar library)
- 7 day columns + left hour column
- Grid resolution: 5-minute precision for placement/selection
- Full day range rendered: `00:00` to `24:00` (scrollable)
- Weekday header row (`Mon...Sun`) is sticky while vertical scrolling

## Viewport + Scrolling

- Calendar viewport is fixed height and starts around working day focus
- Current baseline viewport: `06:00` to `17:00` height (`~11h` visual window)
- User can scroll to full-day boundaries (`00:00` and `24:00`)
- Hour labels naturally change as user scrolls

## Working Hours Rules

- If entire week has no working hours (`dailySchedules` empty): do not render calendar; show fallback notice
- Working-day background should be visually distinct from non-working-day background
- Past days have separate visual treatment

## Selection + Actions

- Selection happens directly in grid
- Selected interval is shown inside the selected block with readable time label
- Header actions are conditionally rendered only when interval is selected
- Action visibility is exclusive:
  - Inside working hours: show `Marker utilgjengelig`
  - Outside working hours: show `Legg til tilgjengelighet`
- `Nullstill` clears current selection

## Routing + Redirects

- `Legg til tilgjengelighet` routes to availability create page with prefilled:
  - `date`, `startTime`, `endTime`
- Include optional `redirectTo` so successful create can return to schedule page
- Unavailability edit flow uses prefilled `from/to` + optional `redirectTo`

## Past Interval Constraints

- Past availability/unavailability intervals are not editable
- Past availability intervals are not deletable
- Enforce both in UI and server actions (not only client-side)

## Dialog Behavior

- Clicking appointment opens details dialog with existing appointment-detail pattern
- Clicking availability/unavailability opens compact details
- On delete availability action from dialog, dialog closes immediately

## Feedback/Flash Pattern

- Use project-standard flash message architecture (`setFlashMessage` / redirect flash helpers)
- Success/error should be shown via global flash banner pattern, not ad-hoc local banners
