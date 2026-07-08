# shadcn/ChatCN Component Inventory

Date: 2026-05-14

## Scope

Legacy shadcn/ChatCN components live under `app/components/ui`. The in-house design system lives under `app/ui` and should be imported through `~/ui`.

This inventory maps remaining legacy usage to migration targets. It includes:

- Direct imports from `~/components/ui/*` or `@/components/ui/*`.
- `app/ui/primitives/*` files that still re-export legacy components.
- Legacy component files that still exist even when they currently have no external direct imports.

## Direct Legacy Imports

### Migrated

The first migration bucket is complete. Direct imports for these atom-level components have been removed from application code:

- `button`
- `badge`
- `input`
- `label`
- `textarea`
- `alert`
- `card`
- `popover`

### Remaining

| Legacy component | Direct usage count | Current consumers                                                                                                                       | Preferred migration target                                                                                                          |
| ---------------- | -----------------: | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `dialog`         |                  2 | `app/components/pickers/service-picker.tsx`; `app/components/dialog/form-dialog.tsx`                                                    | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` from `~/ui` after replacing legacy-backed wrapper     |
| `carousel`       |                  1 | `app/components/pickers/service-picker.tsx`                                                                                             | `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselNext`, `CarouselPrevious` from `~/ui` after replacing legacy-backed wrapper |
| `select`         |                  3 | `app/components/pickers/contact-picker.tsx`; `app/components/dialog/form-dialog.tsx`; indirectly through `app/ui/primitives/select.tsx` | Product-specific select pattern or `Select` from `~/ui` after replacing legacy-backed wrapper                                       |
| `breadcrumb`     |                  1 | `app/components/layout/sidebar-breadcrums.tsx`                                                                                          | New in-house breadcrumb molecule, or route-local semantic nav markup                                                                |
| `form`           |                  1 | `app/routes/auth/sign-in/_forms/sign-in.form.tsx`                                                                                       | In-house form composition using `FormField`, `FieldMessage`, `Label`, `Input`; no drop-in replacement yet                           |

## In-House Wrappers Still Backed By Legacy

These imports look correct at call sites because they come from `~/ui`, but the primitive currently delegates to `app/components/ui`.

| `app/ui` wrapper                                | Legacy dependency                         | Migration note                                                                           |
| ----------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app/ui/primitives/alert-dialog.tsx`            | `~/components/ui/alert-dialog`            | Replace with Radix alert dialog styled directly with app tokens.                         |
| `app/ui/primitives/carousel.tsx`                | `~/components/ui/carousel`                | Replace with app-token wrapper or keep only if the shadcn file is promoted and restyled. |
| `app/ui/primitives/dialog.tsx`                  | `~/components/ui/dialog`                  | Replace with Radix dialog styled directly in `app/ui/primitives/dialog.tsx`.             |
| `app/ui/primitives/select.tsx`                  | `~/components/ui/select`                  | Highest-value primitive gap. Needs a product select pattern.                             |
| `app/ui/primitives/sheet.tsx`                   | `~/components/ui/sheet`                   | Replace with Radix dialog/sheet styled with tokens.                                      |
| `app/ui/primitives/verification-code-input.tsx` | `~/components/ui/verification-code-input` | Either promote/restyle or keep as feature-specific auth component.                       |

## Legacy Component Files Still Present

All files below remain in `app/components/ui`:

- `accordion.tsx`
- `alert-dialog.tsx`
- `alert.tsx`
- `badge.tsx`
- `breadcrumb.tsx`
- `button-group.tsx`
- `button.tsx`
- `card.tsx`
- `carousel.tsx`
- `checkbox.tsx`
- `dialog.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `input.tsx`
- `label.tsx`
- `popover.tsx`
- `progress.tsx`
- `select.tsx`
- `separator.tsx`
- `sheet.tsx`
- `sonner.tsx`
- `table.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `verification-code-input.tsx`

Files with no external direct imports may still be used internally by other legacy components. Do not delete them until the direct import and wrapper migrations above are complete.

## Suggested Migration Order

1. ✅ Replace direct low-risk atom imports: `button`, `badge`, `input`, `label`, `textarea`.
2. ✅ Replace direct message/surface imports: `alert`, `card`.
3. ✅ Replace date/filter popovers now that `~/ui` has tokenized `Popover`.
4. Build or finish in-house `Select`, then migrate `contact-picker` and `form-dialog`.
5. Replace legacy-backed `Dialog`, `AlertDialog`, `Sheet`, and `Carousel` wrappers inside `app/ui`.
6. Delete unused legacy component files only after `rg "~/components/ui|@/components/ui"` returns no application consumers and `app/ui/primitives` no longer re-exports from `app/components/ui`.

## Verification Commands

```bash
rg -n "from ['\"](?:~|@)/components/ui/[^'\"]+['\"]" app --glob '!app/components/ui/**'
rg -n "~/components/ui|@/components/ui" app/ui app/components/ui
find app/components/ui -maxdepth 1 -type f -name '*.tsx' -print | sort
```
