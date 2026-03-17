# Design System Maturity

## Objective

Finish the migration from design variants and route-owned styling toward one shared frontend system with clear construction rules.

## Why This Workstream Exists

Without strict system boundaries, design drift will return after launch. The purpose of this workstream is not just cleanup. It is to make future UI work predictable.

## Scope

This workstream covers:

- templates
- shared page patterns
- token discipline
- removal of route-owned design wrappers
- UI documentation

## Work Required

### 1. Expand template coverage

Shared templates should be the default path for page construction.

Checklist:

- Verify all company routes use the established template pattern where appropriate.
- Verify non-sidebar workspace routes use the shared page shell.
- Reduce custom route shells unless structurally necessary.

Project-specific focus:

- company surfaces
- user company-context
- auth/form routes
- public booking routes later if they should converge structurally

### 2. Standardize shared section patterns

The same kind of information should look structurally similar across the app.

Checklist:

- metrics
- section panels
- empty states
- route-link groups
- table headers and toolbars
- compact accordion forms

Project-specific focus:

- booking
- company admin
- timesheets
- notifications

### 3. Enforce token discipline

Tokens should express the system, not just color utility classes.

Checklist:

- background
- surface
- border
- text
- interactive

Rules:

- avoid route-level one-off palettes
- avoid stacking multiple decorative layers without hierarchy
- keep nested surfaces deliberate
- prefer semantic tokens over custom class values

Project-specific focus:

- booking forms
- accordions
- tables
- cards
- sidebars
- navbar

### 4. Eliminate route-owned design variants

Routes should not quietly define their own design dialect.

Checklist:

- remove route-local wrappers that only exist for styling
- move reusable visual patterns into `app/ui`
- delete duplicates once the shared version exists

Project-specific focus:

- local cards
- special headers
- ad hoc section wrappers
- table action layouts

### 5. Improve documentation and discoverability

A system is only durable if people can find and follow it.

Checklist:

- document when to add a primitive
- document when to add an organism
- document when to add a template
- document what must stay out of route space
- expand UI catalog coverage for canonical patterns

Project-specific focus:

- `app/ui/specs.md`
- UI catalog route
- `docs/` guidance for teams

## Definition of Done

- The app reads as one coherent product.
- New UI work has a default implementation path.
- Shared UI decisions are documented and discoverable.

## Suggested Audit Output

For each pattern area, record:

- canonical shared component
- current drift examples
- migration target
- missing documentation
- status
