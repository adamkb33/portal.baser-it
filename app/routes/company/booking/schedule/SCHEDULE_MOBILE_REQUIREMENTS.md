# Booking Schedule Mobile Requirements

## Scope

- Route: `company/booking/schedule`
- Focus: mobile interaction + readability only
- Desktop behavior should remain intact

## Current Mobile Gaps (Quick Scan)

1. Interval selection is mouse-only (`onMouseDown/onMouseMove/onMouseUp`), so touch devices cannot reliably select `from/to`.
2. Grid is always `50px + 7 columns` in one viewport, which compresses day columns too much on small screens.
3. Selected interval label and item text are too small on mobile (`text-[10px]` and `text-[11px]`), unreadable for short intervals.
4. Small intervals do not guarantee readable label area when height is low.
5. Current scroll model is vertical only; no defined mobile strategy for horizontal navigation across 7 days.

## Mobile UX Requirements

### 1) Touch-first interval selection

- Replace mouse-only selection logic with pointer/touch-capable handling.
- Must support:
  - tap-hold-drag to create interval
  - drag updates in 5-minute increments
  - release to commit selection
- Prevent accidental selection when tapping existing schedule items.

### 2) Mobile layout strategy

- On small screens, avoid squeezing 7 columns into unreadable widths.
- Implement one of these patterns (preferred order):
  1. Horizontal scrollable day columns with fixed minimum column width.
  2. Alternate day pager (one day at a time) if horizontal scroll proves unstable.
- Hour column and day headers must stay visually aligned while scrolling.

### 3) Readability standards

- Minimum readable text sizes on mobile:
  - selected interval label: at least `text-xs`
  - schedule item text/time: at least `text-xs`
- Selected block must always render text with sufficient contrast.
- If interval height is too small, show compact badge/tooltip fallback instead of clipped unreadable text.
- For calendar item blocks, simplify labels:
  - show only item type label (`Avtale`, `Tilgjengelig`, `Utilgjengelig`)
  - do **not** render start/end hour text inside the item block
  - detailed time remains available in dialog/details view after click

### 4) Selection visibility

- Selected range must remain clearly visible during drag.
- Start/end times must be visible either:
  - inside the selected block, or
  - in a pinned mobile action bar when block is too small.

### 5) Action affordances after selection

- Existing action rules remain:
  - inside working hours: `Marker utilgjengelig`
  - outside working hours: `Legg til tilgjengelighet`
- On mobile, action buttons must be reachable without precision tap targets.
- Minimum touch target should be ~44px height.

## Technical Constraints

- Keep 5-minute selection precision.
- Keep existing role/auth behavior and SDK integrations unchanged.
- Keep flash message architecture unchanged.
- Preserve desktop interactions.

## Acceptance Criteria

1. On iOS/Android touch, user can select `from/to` interval reliably.
2. Selection appears and updates during drag without jitter.
3. Interval label is readable on mobile for normal short bookings.
4. Day columns are navigable on small screens without overlap/compression.
5. Existing conditional action logic still works after selection.
6. No regression in desktop selection/edit/delete flows.

## Out of Scope (This Pass)

- Redesigning appointment details dialog.
- Changing business rules for past-time blocking.
- Backend/API contract changes.
