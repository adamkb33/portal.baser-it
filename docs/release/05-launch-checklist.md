# Frontend Launch Checklist

## Route Readiness

- All critical routes use a shared template or approved shared layout pattern.
- No major route depends on route-owned page chrome for its core structure.
- All critical routes have loading, empty, success, and failure states.
- Mobile layouts are verified for all critical journeys.

## UX Readiness

- CTA hierarchy is consistent.
- Empty states are intentional.
- Error states explain what happened and what to do next.
- Form save and failure states are clear.

## Engineering Readiness

- `npm run typecheck` is clean.
- Remaining legacy `~/components/ui/*` usage is tracked and accepted explicitly.
- High-risk route logic has test coverage.
- Shared UI lives in `app/ui`, not scattered through route folders.

## Reliability Readiness

- Route guards behave intentionally.
- Auth/session transitions are stable.
- Company-context transitions are stable.
- Destructive actions have safe user feedback.
- Flash messages and redirect-based feedback are reliable.

## Design-System Readiness

- Shared templates are used consistently.
- Shared section patterns are visible across the app.
- Token usage is consistent across major surfaces.
- Route-owned design variants are removed or explicitly tracked as debt.

## Execution Tracking

Use the following status markers while working through the launch pass:

- `not started`
- `in progress`
- `blocked`
- `done`
