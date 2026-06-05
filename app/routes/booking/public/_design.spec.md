# Booking Public Design Spec

## Scope

- Domain: `app/routes/booking/public/*`
- Primary focus: appointment session flow
  - contact
  - employee
  - select-services
  - select-time
  - overview
- This spec defines visual hierarchy, component consistency, and interaction consistency.

## Goals

- Improve visual differentiation between parent and nested content blocks.
- Keep UI consistent across all booking-public steps.
- Use design tokens only (no ad hoc colors).
- Reduce cognitive load with progressive disclosure for long content sets.

## Non-Negotiable Rules

1. Use only semantic design tokens from:
   - `app/styles/tokens.css`
   - `app/styles/booking-tokens.css`
2. No raw hardcoded colors in route/component JSX.
3. No `<a>` for internal navigation; use React Router `Link`/`NavLink`.
4. Reuse shared UI primitives and patterns before adding new one-off wrappers.
5. Token usage must remain compatible with embed theme overrides:
   - Components must consume semantic tokens/aliases only.
   - No fixed brand hues in booking-public route code.
   - `EMBED_THEME_TOKENS` must be able to remap colors without visual breakage.

## Visual Hierarchy System

### Surface Levels

Use 4 explicit surface levels and do not skip levels inside nested UI:

- `S0` Page base:
  - `bg-booking-background` (or `bg-background` via booking alias)
- `S1` Section surface:
  - `bg-booking-surface` with `border-booking-border`
- `S2` Nested container inside S1:
  - `bg-surface-variant-1` with `border-border`
- `S3` Item/tile inside S2:
  - `bg-surface-variant-2` or `bg-background` depending on emphasis

Rule:
- A child container must be at least one surface level apart from its parent.
- Avoid parent/child using identical background unless child is intentionally borderless.
- Avoid more than 3 visible nested container levels in one viewport section (depth budget).

### Parent/Child Differentiation

When there is card-in-card or div-in-div:

- Parent gets stronger boundary:
  - border + subtle surface (`S1`)
- Child gets lighter or alternate surface:
  - `S2`/`S3`
- Never use same background and same border contrast for both levels.

### Emphasis Rules

- Primary decision/action areas:
  - may use `surface-primary-subtle` or `surface-accent-subtle`
- Informational/summary groups:
  - default to neutral surfaces (`S1`/`S2`)
- Destructive/warning states:
  - use existing semantic/destructive tokens only

### State Clarity Rules

- Interactive states must remain distinguishable from surface levels:
  - hover/focus/active should not collapse into the same tone as neutral container surfaces.
- Selection states should use semantic accent surfaces (e.g. `surface-accent-subtle`) instead of ad hoc opacity stacks.
- Disabled states must remain legible and must not rely on opacity-only for meaning.

## Spacing and Rhythm

- Preferred spacing set per page: max 4 sizes (`xs`, `sm`, `md`, `lg`) plus occasional `xl`.
- Page structure:
  - section-to-section: `lg` or `xl`
  - block-to-block inside panel/card: `md`
  - item-to-item inside dense list: `xs` or `sm`
- Use `Stack`/`Grid` primitives where possible; avoid margin-chaining.
- Avoid mixing token spacing and arbitrary utility spacing in the same block.

## Typography Consistency

- Titles: shared heading variants only.
- Section labels/meta: `label` or `caption`, not one-off text styling.
- Dense metadata (service duration/price etc): `caption` or `body-sm`, consistently per section.
- Avoid introducing arbitrary text-size classes.

## Component Consistency Contract

- For comparable sections across steps (summary, selectable lists, info cards):
  - use same shell pattern (title row + optional action + content block)
- Keep action placement predictable:
  - edit/change links consistently at section top-right
- Use one primary action bar pattern per step (current bottom action bar pattern).

### Service Quantity Selector Contract (Select Services)

- Service selection is quantity-based, not boolean.
- Control states for each service card must be:
  - `quantity = 0`: one full-width primary button labeled `Velg`.
  - `quantity = 1`: one full-width primary button with a `+` affordance to add another unit.
  - `quantity > 1`: a compact stepper-style group with decrement (`-`) and increment (`+`) controls and visible current quantity.
- Quantity controls must use semantic buttons (keyboard operable, focus-visible, disabled semantics when relevant).
- Visual treatment of these controls must remain consistent with employee/select-services card state language.

### Reuse Matrix (When To Use What)

- Use `Panel` for titled section containers with section-level context.
- Use `Card` for neutral grouped content blocks within sections.
- Use `KeyValueList` for summary metadata pairs.
- Use `Accordion` for progressive reveal and long lists.
- Do not create new route-specific wrappers if one of the above patterns fits.

## Overview Page Rules

### Section Structure

Overview must have clearly separated blocks:

1. Time summary (`S1` with `S2` key-value content)
2. Contact + provider summary (`S1`, split columns where needed)
3. Services summary (`S1`) with progressive reveal behavior

Each block must maintain the same internal pattern:
- header row
- optional “Endre” action
- content area with differentiated nested surfaces

### Selected Services Progressive Reveal

For selected services in overview:

- Show max 3 service rows/cards by default.
- If selected service count > 3:
  - show compact “Vis flere” control
  - expanding reveals remaining services in-place
  - control toggles to “Vis færre” when expanded
- Use accessible disclosure pattern:
  - either existing Accordion primitive or explicit button + `aria-expanded` + controlled region
- Preserve stable order from selected services list.
- Preserve keyboard focus context when expanding/collapsing (focus should remain on toggle control).

Display behavior:
- Default (collapsed): first 3 services
- Expanded: all services
- Summary label should indicate hidden count when collapsed:
  - e.g. `+7 flere`

### Long Content Handling

- In expanded mode, avoid excessive scroll-jump:
  - keep animation subtle or instant; no large motion dependencies
- Prevent layout break on small screens:
  - service rows stack cleanly
- If service count is high (e.g. 10+), default collapsed state must remain compact and scannable.

## Booking Public Step Consistency

Across contact, employee, services, time, overview:

- Use same background/surface hierarchy model.
- Use same card/panel radius and border treatment scale.
- Keep CTA placement and priority consistent:
  - primary action on right/last position in action bar
  - secondary/back action as outline/secondary style
- Employee and select-services routes must share the same selection-card state language:
  - neutral card (`S2`) at rest
  - subtle surface lift on hover
  - selected state via semantic interactive border/ring and check badge, not heavy visual effects

## Accessibility Requirements

- Color contrast must remain compliant for text on all chosen surfaces.
- Interactive controls:
  - minimum 44x44 target where touch-primary
- Expand/collapse controls:
  - keyboard-operable
  - proper `aria-expanded` and relation to expanded content region
- Toggle copy must be explicit:
  - collapsed: `Vis flere`
  - expanded: `Vis færre`
- Do not encode critical meaning by color alone.

## Performance & Stability

- Avoid repaint-heavy visual effects in frequently re-rendered step content.
- Prefer CSS token-level styling over runtime-computed inline color values.
- Preserve stable keys for repeated lists to avoid reflow and state drift.

## Anti-Patterns (Disallowed)

- Card-in-card with identical surface and border treatment.
- Arbitrary color utilities when semantic token exists.
- Divergent action placement between steps for equivalent actions.
- Long service list fully expanded by default on overview.
- Creating route-specific mini-design systems that duplicate shared UI primitives.

## Research-Informed Guidelines

These rules align with:

- Nielsen Norman Group principles on visual hierarchy and progressive disclosure.
- Material guidance on surface hierarchy and consistent action placement.
- Apple HIG conventions for grouped content and predictable navigation/action patterns.
- WCAG expectations for target size and state communication.

Reference links:
- Nielsen Norman Group, Progressive Disclosure:
  [https://www.nngroup.com/articles/progressive-disclosure/](https://www.nngroup.com/articles/progressive-disclosure/)
- Nielsen Norman Group, Visual Hierarchy:
  [https://www.nngroup.com/articles/visual-hierarchy-ux-definition/](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
- Material Design, Color Roles & Surfaces:
  [https://m3.material.io/styles/color/roles](https://m3.material.io/styles/color/roles)
- Material Design, Lists (density/scannability patterns):
  [https://m3.material.io/components/lists/overview](https://m3.material.io/components/lists/overview)
- Apple Human Interface Guidelines, Visual Design:
  [https://developer.apple.com/design/human-interface-guidelines](https://developer.apple.com/design/human-interface-guidelines)
- WCAG Understanding (Target Size, 44x44 guidance context):
  [https://www.w3.org/WAI/WCAG21/Understanding/target-size](https://www.w3.org/WAI/WCAG21/Understanding/target-size)

Implementation note:
- Use these as rationale; local token system remains source of truth.

## Acceptance Criteria

1. Nested parent/child containers are visually distinguishable using tokenized surfaces.
2. No hardcoded/non-token colors are introduced in booking-public route code.
3. Overview page defaults to showing max 3 selected services.
4. Overview page supports accessible expand/collapse for additional services.
5. Section structure and action placement look consistent across session steps.
