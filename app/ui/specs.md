# UI System Contract

This folder is the in-house component library for the application. `app/ui` is the shared system. `app/components/ui` is legacy and should not be used for new work.

The goal is simple: shared UI should be predictable, composable, and difficult to misuse.

## 1. Source Of Truth

- Tokens live in `app/styles/tokens.css`.
- Global base styling enters through `app/app.css`.
- Public shared UI exports live in `app/ui/index.ts`.
- New route and feature code should import from `~/ui`.

## 2. Layer Model

The system is split into five layers:

- `atoms`: single-purpose UI primitives such as `Button`, `Input`, `Text`, `Textarea`
- `molecules`: small compositions such as `FormField`, `FieldMessage`, `SectionHeader`
- `organisms`: reusable sections and interaction structures such as `Card`, `Panel`, `SelectionCard`, `Notice`
- `layout`: spatial primitives such as `Container`, `Stack`, `Inline`, `Cluster`, `Grid`
- `templates`: page-level shells such as `StepPageTemplate`

Routes and feature components compose these layers. They should not re-invent them.

## 3. Non-Negotiable Rules

### 3.1 Imports

- New shared UI belongs in `app/ui`.
- New feature UI belongs near the feature unless it is clearly reusable.
- New feature code must not import from `~/components/ui/*`.

### 3.2 Tokens

- Use semantic tokens only: `background`, `surface`, `border`, `text-*`, `interactive`.
- Do not use raw grayscale utility classes in JSX like `bg-gray-50`.
- Do not use arbitrary Tailwind values like `w-[37px]`.
- If a value is missing, add the token first.
- Spacing must come from the shared spacing scale and layout primitives before using one-off margin or padding classes.

### 3.3 Composition

- Atoms do one thing only.
- Molecules compose atoms, not page layout.
- Organisms solve reusable structural or interaction problems.
- Layout primitives control spacing, alignment, and width.
- Templates provide structure only; they do not own domain content.

### 3.4 Accessibility

- Inputs must be labelable.
- Error states must be readable without color alone.
- Keyboard interaction must be preserved for any interactive wrapper.
- Focus states must remain explicit.

### 3.5 Stability

- No `Math.random()` ids in components.
- Use stable React ids where needed.
- Avoid client-only assumptions for basic form or layout behavior.

## 4. Surface Rules

The system has three shared surface concepts. They are not interchangeable.

### `Card`

Use `Card` when you need a generic surfaced container with optional header, content, and footer.

- `default`: standard surfaced block
- `subtle`: quieter block with less visual weight
- `emphasis`: stronger surfaced block for higher priority content
- `interactive`: hover-responsive block for selectable or clickable content

### `Panel`

Use `Panel` when the surface also needs section structure:

- title
- description
- optional action
- grouped content beneath

If you only need a container, use `Card`. If you need a titled section, use `Panel`.

### `Notice`

Use `Notice` for passive messaging, empty states, and generic system guidance.

If the content is mostly content structure, use `Panel`. If the content is mostly messaging, use `Notice`.

## 5. Layout Rules

Use the layout primitives instead of ad hoc page structure:

- `Container`: horizontal bounds
- `Stack`: vertical rhythm
- `Inline`: one-dimensional alignment without wrapping assumptions
- `Cluster`: wrapped inline collections such as actions, tags, pills
- `Grid`: repeatable responsive grid structure

Layout primitives should replace most one-off flex/grid wrappers in route code over time.

## 5.1 Spacing Rules

The system uses a single spacing scale built on a 4px step with 8px as the main visual rhythm:

- `2xs`: 4px
- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

Use that scale by meaning, not by taste:

- `2xs` to `xs`: icon-to-text gaps, tight inline groups, dense control internals
- `sm` to `md`: default form field gaps, small cards, button groups, title-to-description spacing
- `lg` to `xl`: section spacing, card padding, panel-to-panel rhythm
- `2xl`: page-level separation only

Rules:

- Prefer `Stack` for vertical rhythm instead of chaining `mt-*`, `mb-*`, and `space-y-*`.
- Prefer `Inline` or `Cluster` for horizontal grouping instead of ad hoc `gap-*`.
- Prefer `Grid gap` for repeated layouts instead of custom child margins.
- The root shell owns page-level top and bottom padding through `app-content`.
- `Container` owns page gutters.
- `Card` and `Panel` own their internal padding.
- Routes should not add outer `py-*`, `pt-*`, or `pb-*` just to create page breathing room.
- Avoid mixing multiple spacing systems in the same block. One primitive should own the rhythm.
- Use tighter spacing to show relatedness, larger spacing to separate groups.
- Page spacing should be larger than component spacing.

Review questions:

1. Is this spacing expressing hierarchy or just decoration?
2. Could a layout primitive own this spacing instead of the route?
3. Is the gap between related items smaller than the gap between groups?
4. Is the page using at most 3-4 spacing sizes in one view?

## 6. Review Checklist

Every shared UI change should pass this checklist:

1. Does it belong in `app/ui`?
2. Does it use tokens rather than one-off values?
3. Is the component generic instead of feature-specific?
4. Is the API smaller than the JSX it replaces?
5. Does it preserve accessibility and keyboard behavior?
6. Does it reduce duplication instead of adding another near-duplicate abstraction?
7. Does it fit the current monochrome IBM Plex visual direction?

## 7. Migration Policy

- `app/components/ui` remains only as a legacy compatibility layer.
- Existing routes may keep using it until touched.
- When a route is actively edited, migrate touched shared UI to `~/ui` if a suitable equivalent exists.
- Do not port shadcn one-to-one. Rebuild only the primitives the product actually needs.

## 8. Immediate Next Gaps

The system is stronger now, but still needs:

- a select pattern
- a table opinion
- dialog and popover patterns
- a date input strategy
- reusable form orchestration patterns
- a full feature migration proving the system under real pressure

## 9. Working Rule

From this point forward:

- `app/ui` is the shared system
- `tokens.css` is the visual contract
- route code composes the system
- feature-specific UI stays out of the shared layer
