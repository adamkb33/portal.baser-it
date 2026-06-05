# Booking Public Bottom Action Bar Spec

## Scope

- Domain: `app/routes/booking/public/appointment/*`
- Component location: `app/routes/_features/booking/_components/bottom-nav/*`
- This spec defines behavior only. No implementation details outside required public API and UX rules.

## Goal

- Provide a simple bottom action bar that works inside an embedded iframe and in standalone page usage.
- Keep primary booking actions reachable on both mobile and desktop without relying on page scroll position.

## Embedding Constraints

- The action bar must be rendered inside the route content flow.
- The action bar must not depend on parent-page DOM, parent CSS, or cross-window messaging.
- Do not use viewport docking logic for this variant.

## Visibility Rules

- Show on all booking session steps under `booking/public/appointment/session/*` where user navigation actions are relevant.
- Hide on terminal/special pages unless explicitly enabled:
  - `success`
  - `cancel`
  - `cancel-by-id`
- Allow per-route override via props/config so a route can opt out.

## Layout Rules

- Mobile and desktop both use the same in-flow action bar pattern at the bottom of step content.
- Mobile:
  - Compact height.
  - Icon-first actions with short labels.
  - Minimum tap target 44x44.
- Desktop:
  - Slightly wider container and spacing.
  - Can keep icon + label presentation.
  - Keep the same position in content flow.
- The action bar must center within content bounds.

## Action Model

- Support between 2 and 4 actions.
- Each action supports:
  - `label`
  - `to` (internal route, React Router navigation) when action type is `link`
  - `icon`
  - `variant` (`primary` | `secondary` | `ghost`)
  - `disabled`
  - `loading`
  - `type` (`link` | `button`)
  - `buttonType` (`button` | `submit`) for button actions
  - `form` for submit actions targeting forms
- One primary CTA is allowed and should be visually dominant.
- Back/previous action should always be available when the flow allows reverse navigation.

## Interaction Rules

- Internal navigation must use React Router `Link`/`NavLink` only.
- Keyboard and assistive tech requirements:
  - Focus-visible ring on actionable elements.
  - `aria-current="page"` support for active step links when applicable.
  - Disabled state communicated semantically.
- Loading state must prevent double-submit for action buttons.

## Content Safety

- The action bar must not overlap content because it is part of normal document flow.
- No extra bottom spacer should be required in route templates for this variant.

## Styling Rules

- Use shared semantic tokens only (`background`, `surface`, `border`, `text-*`, `interactive`).
- No raw `<a>` usage for internal actions.
- No arbitrary Tailwind values in route usage; add tokens/utilities first when needed.
- Reuse shared style primitives/class constants for repeated button treatment.
- Token usage must stay compatible with embed theme remapping (`EMBED_THEME_TOKENS`).

## Public Component Contract

- `BookingBottomActionBar` component must accept:
  - `actions: BottomActionBarAction[]`
  - `visible?: boolean`
  - `compact?: boolean` (mobile-focused density toggle)
  - `className?: string`
- `BottomActionBarAction` must include stable `id` for rendering keys.

## Route Integration Contract

- Route-level wrapper/helper should map current step context to nav actions.
- The mapper must be deterministic from route + loader/action state.
- No hardcoded duplicated nav JSX per route after integration.

## Acceptance Criteria

1. Bottom action bar appears at the end of step content (non-sticky).
2. No booking step content is blocked by the action bar.
3. Internal navigation uses React Router links only.
4. Button submit actions work through semantic forms.
5. Behavior is consistent across all session routes using shared config.

## Research Basis (Industry Conventions)

- Contextual bottom actions should be treated as action/tool bars, not top-level destination tabs.
  - Apple HIG (toolbars/tab bars): [https://developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines)
  - Material (bottom app bar vs bottom navigation): [https://m3.material.io/components/bottom-app-bar/overview](https://m3.material.io/components/bottom-app-bar/overview)

- Primary/secondary action clarity and consistency reduce decision friction in multistep flows.
  - Nielsen Norman Group (consistency and standards): [https://www.nngroup.com/articles/ten-usability-heuristics/](https://www.nngroup.com/articles/ten-usability-heuristics/)

- Touch targets should remain comfortably tappable.
  - WCAG target-size guidance: [https://www.w3.org/WAI/WCAG21/Understanding/target-size](https://www.w3.org/WAI/WCAG21/Understanding/target-size)
