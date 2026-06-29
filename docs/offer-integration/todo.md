# Offer Integration Enterprise Todo

This document tracks the Offer frontend implementation from the current minimal slice toward a professional, production-grade quote/offer workspace.

## Research Notes

Enterprise quote/CPQ systems tend to optimize for these jobs:

- Fast quote creation from customer context, reusable catalog items, and guided templates.
- Clear quote lifecycle states with explicit actions, auditability, and read-only terminal states.
- Line item editing with trustworthy totals, VAT, validation, and pricing snapshots.
- Recipient management with customer contacts, revocation, resend, and visible delivery/access state.
- Public recipient review that feels like a polished offer document, not a raw data page.
- Approval/governance hooks for discounts, special pricing, and non-standard terms when the domain grows.
- Quote-to-cash extension points for signature, contract, invoicing, billing, and downstream fulfillment later.

Local UI constraints:

- New work should use `~/ui`, not legacy `~/components/ui`.
- Feature-specific Offer UI should live under `app/routes/company/offer`.
- Use React Router loaders/actions and progressive forms.
- Use semantic tokens and the shared page templates.
- Norwegian UI copy is the default.

## Product Experience Target

The Offer area should feel like an operational company tool: dense enough for repeated use, clear enough for first-time use, and structured around the lifecycle of a quote.

Primary company-user workflow:

1. Find or create the customer by organization number.
2. Select a template.
3. Fill template-specific data.
4. Add line items manually or from catalog.
5. Select or create recipients.
6. Review totals and recipient state.
7. Send the offer.
8. Track messages and recipient access.
9. Edit while allowed.
10. Keep accepted, declined, cancelled, and expired offers readable.

Primary public-recipient workflow:

1. Open token link.
2. Read a polished offer summary with company/customer context, terms, lines, totals, and expiry.
3. Ask a question if the offer is open.
4. Accept or decline.
5. See terminal state clearly after action.

## Done

### Documentation

- [x] Created `docs/offer-integration/plan.md`.
- [x] Created this implementation todo.
- [x] Reviewed `docs/offer-integration/_frontend-integration.md`.
- [x] Reviewed generated Offer SDK and current routing/UI conventions.

### API And Access Plumbing

- [x] Confirmed generated Offer SDK exists under `app/api/generated/offer`.
- [x] Confirmed Offer runtime config exists in `app/api/config/offer-client.ts`.
- [x] Added Offer generated client auth header support in `app/api/utils/with-auth.ts`.
- [x] Added `OFFER` to company product routing support in `app/lib/routing/route-utils.ts`.
- [x] Added `OFFER` to `AuthenticatedUserPayload.companyProducts` in `app/lib/auth-service.ts`.
- [x] Added `OFFER` to system-admin product assignment options.
- [x] Added `FileText` route icon support.
- [x] Fixed generated Base contact SDK method mismatches so `npm run typecheck` is clean.

### Routes

- [x] Added company Offer sidebar route:
  - route ID: `company.offer`
  - path: `/company/offers`
  - product gated by `OFFER`
  - roles: `ADMIN`, `EMPLOYEE`
- [x] Added company Offer child routes:
  - [x] `company.offer.create` -> `/company/offers/create`
  - [x] `company.offer.detail` -> `/company/offers/:offerId`
  - [x] `company.offer.catalog` -> `/company/offers/catalog`
- [x] Added public Offer route:
  - route ID: `offer.public`
  - path: `/offer/public/:token`
  - public access

### Current Minimal Company UI

- [x] Added company Offer list page.
  - [x] Calls `Offer.getOffers`.
  - [x] Supports status filtering.
  - [x] Shows basic KPI cards.
  - [x] Links rows to detail pages.
  - [x] Links to create and catalog.
- [x] Added minimal create draft page.
  - [x] Loads templates.
  - [x] Loads catalog items.
  - [x] Resolves customer by org number.
  - [x] Creates draft offer.
  - [x] Redirects to detail.
- [x] Added minimal detail page.
  - [x] Loads offer, lines, recipients, messages, templates, catalog items, and customer contacts.
  - [x] Replaces offer lines.
  - [x] Creates customer contacts.
  - [x] Saves recipients.
  - [x] Sends, resends, cancels.
  - [x] Revokes recipients and enables recipient tokens.
  - [x] Sends company messages.
  - [x] Uses backend `openForAction` and `expired`.
- [x] Added minimal catalog page.
  - [x] Lists catalog items.
  - [x] Creates catalog items.
  - [x] Deactivates catalog items.

### Current Minimal Public UI

- [x] Added public token page.
  - [x] Loads public offer by token.
  - [x] Accepts offer.
  - [x] Declines offer.
  - [x] Sends public message.
  - [x] Disables actions when closed.

### Verification

- [x] `npm run build` passes.
- [x] `npm run typecheck` passes.

## Current Limitations

- [ ] Company list does not show customer display names.
- [ ] Company list does not show totals because the list DTO does not expose totals.
- [ ] Create flow uses raw JSON for template data.
- [ ] Create flow does not guide users through contacts, recipients, or initial lines.
- [ ] Detail line editing is replace-all and basic.
- [ ] Recipient management does not show generated public token values.
- [ ] Detail page does not edit offer metadata/template data.
- [ ] Catalog page cannot update existing catalog items.
- [ ] Public page renders `snapshot` as JSON.
- [ ] Public page does not show message history because the backend lacks a public message-list endpoint.
- [ ] There are no focused tests for Offer routes/actions yet.

## Phase 1: Foundation Hardening

Goal: make the existing minimal slice safe enough to build on.

- [x] Move duplicated Offer status labels, badge variants, date/money helpers, and action predicates into `app/routes/company/offer/_utils`.
- [x] Add `offer-status.ts`.
- [x] Add `offer-money.ts`.
- [x] Add `offer-lines.ts`.
- [x] Add `offer-template-data.ts`.
- [x] Add `offer-route-paths.ts` because detail href composition is used by multiple routes.
- [x] Add shared `offer-status-badge.tsx`.
- [x] Replace raw internal `<a>` usage with `Link` everywhere in Offer routes.
- [x] Add stable field naming and parsing helpers for dynamic line forms.
- [x] Add basic action intent constants to avoid string drift.
- [ ] Update product-related UI copy to include `OFFER` wherever the product list is described.

Acceptance:

- [x] `npm run typecheck` passes.
- [x] `npm run build` passes.
- [x] Offer route files are thinner and shared logic is not duplicated.

## Phase 2: Enterprise Create Flow

Goal: replace the raw draft form with a guided create flow that prevents bad drafts.

Recommended route strategy:

- Keep `/company/offers/create` as a single route for now.
- Use sections or tabs inside the route instead of adding multi-step URLs until the data model stabilizes.
- Preserve progressive enhancement with normal React Router forms.

Todo:

- [x] Add a guided create layout with sections:
  - [x] Customer
  - [x] Template
  - [x] Offer details
  - [x] Lines
  - [x] Recipients
  - [x] Review
- [x] Replace guessed template-specific fields with a renderer driven by `OfferTemplateDto.fields`.
- [x] Add available-template chooser/list that shows backend templates before field entry.
- [x] Render `OfferTemplateFieldDto` types from backend metadata:
  - [x] `text`
  - [x] `textarea`
  - [x] `date`
  - [x] `panel_selector`
  - [x] unsupported/read-only fallback
- [x] Parse submitted template values by iterating the selected template fields, not by template ID.
- [x] Validate required template fields and backend-provided `validation.pattern`.
- [x] Persist template data with exact backend field keys in `CreateOfferRequest.data`.
- [x] Remove hard-coded `blank` and `paint_job` create-form field assumptions.
- [x] Resolve customer by org number during submit with clear validation/error feedback:
  - [x] empty
  - [ ] searching/resolving
  - [x] resolved
  - [x] failed
- [ ] Load customer contacts after customer resolution.
- [x] Create customer contacts during create flow.
- [x] Select recipients during create flow.
- [x] Add initial lines during create flow.
- [x] Add dynamic add/remove controls for initial line rows.
- [x] Add dynamic add/remove controls for recipient rows.
- [ ] Apply catalog items to line forms as copied snapshots.
- [x] Show calculated preview before draft creation.
- [x] Keep send as an explicit action after draft creation.

Acceptance:

- [x] User can create a draft with customer, backend-rendered template data, lines, and recipients in one flow.
- [ ] Invalid org number, missing template, missing required template fields, invalid template patterns, empty recipients, and invalid line price cannot create a broken draft.
- [x] Form errors preserve values.
- [x] UI copy is Norwegian and action oriented.

## Phase 3: Professional Offer Detail Workspace

Goal: turn `/company/offers/:offerId` into the main enterprise offer workspace.

Recommended layout:

- Header: status, customer, template, valid-until, revision, actions.
- Left/main column: offer content and line editor.
- Right/support column: totals, recipients, activity, messages, action state.
- On mobile: stacked sections with sticky bottom action bar only for primary safe actions.

Todo:

- [ ] Split detail page into feature components:
  - [ ] `offer-status-badge.tsx`
  - [ ] `offer-header-summary.tsx`
  - [ ] `offer-action-bar.tsx`
  - [ ] `offer-template-editor.tsx`
  - [ ] `offer-line-editor.tsx`
  - [ ] `offer-totals-summary.tsx`
  - [ ] `offer-recipient-selector.tsx`
  - [ ] `offer-message-thread.tsx`
  - [ ] `offer-activity-panel.tsx`
- [ ] Add metadata editing:
  - [ ] `validUntil`
  - [ ] template data
  - [ ] template-specific fields
- [ ] Persist metadata with `Offer.updateOffer`.
- [ ] Replace line editing with a proper line item editor:
  - [ ] add row
  - [ ] duplicate row
  - [ ] remove row
  - [ ] reorder row
  - [ ] apply catalog item
  - [ ] inline validation
  - [ ] keyboard-friendly row editing
- [ ] Show totals from backend `OfferLineSetDto`.
- [ ] Save lines with `Offer.replaceOfferLines`.
- [ ] Improve recipient management:
  - [ ] selected/available split
  - [ ] create contact inline
  - [ ] revoke confirmation
  - [ ] enable token result display
  - [ ] sent/opened/revoked indicators
- [ ] Add message composer with pending state and validation.
- [ ] Add read-only mode for terminal/expired offers.
- [ ] Add destructive-action confirmations for cancel, revoke, delete when available.

Acceptance:

- [ ] A company user can manage the full editable offer without leaving the detail page.
- [ ] Terminal offers are readable but cannot be modified.
- [ ] Primary actions are obvious and secondary actions do not compete visually.
- [ ] Totals and recipient state are always visible or one click away.

## Phase 4: Catalog Management

Goal: make catalog items a reliable enterprise pricing tool, not just a create/deactivate form.

Todo:

- [ ] Add catalog item update form using `Offer.updateCatalogItem`.
- [ ] Add active/inactive filters.
- [ ] Add search by item name.
- [ ] Add inline edit or edit dialog.
- [ ] Add deactivation confirmation.
- [ ] Add empty state with create action.
- [ ] Add guidance that catalog changes do not mutate existing offer line snapshots.
- [ ] Add catalog item picker component reusable in the line editor.

Acceptance:

- [ ] User can create, update, deactivate, search, and reuse catalog items.
- [ ] UI makes snapshot behavior explicit.

## Phase 5: Public Offer Experience

Goal: make the recipient page feel like a professional offer document.

Todo:

- [ ] Replace raw JSON snapshot with a polished summary renderer.
- [ ] Add public offer components:
  - [ ] `public-offer-header.tsx`
  - [ ] `public-offer-summary.tsx`
  - [ ] `public-offer-lines.tsx`
  - [ ] `public-offer-totals.tsx`
  - [ ] `public-offer-actions.tsx`
  - [ ] `public-offer-message-form.tsx`
- [ ] Render template-specific content from `PublicOfferPageDto.template.fields` and `PublicOfferPageDto.snapshot`.
  - [ ] `text`
  - [ ] `textarea`
  - [ ] `date`
  - [ ] `panel_selector`
  - [ ] unsupported/read-only fallback
- [ ] Show recipient identity and sent/revision information.
- [ ] Show valid-until and expired state clearly.
- [ ] Add decline reason field with character guidance.
- [ ] Add confirmation state after accept/decline.
- [ ] Add mobile-first action layout.
- [ ] Add branded but restrained public layout using existing tokens.
- [ ] If backend adds public messages endpoint, render conversation history.

Acceptance:

- [ ] Recipient can understand what is being offered without seeing raw JSON.
- [ ] Accept/decline state is unambiguous.
- [ ] Expired/closed offers are still readable.

## Phase 6: Workflow Quality And Governance

Goal: prepare the feature for company-scale usage.

Todo:

- [ ] Add status transition helper:
  - [ ] draft actions
  - [ ] open actions
  - [ ] accepted/declined/cancelled actions
  - [ ] expired actions
- [ ] Add validation before send:
  - [ ] at least one recipient
  - [ ] at least one valid line if backend requires lines
  - [ ] required template fields
  - [ ] valid `validUntil`
- [ ] Add optimistic/pending states for action buttons.
- [ ] Add consistent success/error notices.
- [ ] Add audit/activity panel if backend exposes timestamps/events.
- [ ] Add future approval placeholders:
  - [ ] discount threshold
  - [ ] non-standard terms
  - [ ] manager approval

Acceptance:

- [ ] Users cannot accidentally send incomplete offers.
- [ ] Every disabled action explains why.
- [ ] Workflow rules live in one helper instead of scattered JSX.

## Phase 7: Tests

Goal: cover route behavior and workflow rules before deeper refactoring.

- [ ] Route gating tests for `company.offer`.
- [ ] `withAuth` coverage for Offer generated client headers.
- [ ] Company list loader tests.
- [ ] Create flow action tests:
  - [ ] invalid org number
  - [ ] missing template
  - [ ] successful draft creation
  - [ ] backend error preservation
- [ ] Detail action tests:
  - [ ] update metadata
  - [ ] replace lines
  - [ ] set recipients
  - [ ] create contact
  - [ ] send/resend/cancel
  - [ ] revoke/enable recipient
  - [ ] message
- [ ] Catalog action tests:
  - [ ] create
  - [ ] update
  - [ ] deactivate
- [ ] Public route tests:
  - [ ] load token
  - [ ] invalid token
  - [ ] accept
  - [ ] decline validation
  - [ ] message validation
- [ ] Status/action helper tests.

Acceptance:

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Focused tests pass.

## Phase 8: Backend/API Gaps

Track these separately so frontend does not fake data it should receive from backend.

- [ ] Public message history endpoint:
  - `GET /offer-service/public/offers/{token}/messages`
- [ ] Offer list display fields:
  - [ ] customer display name
  - [ ] total amount
  - [ ] recipient count
  - [ ] last sent/opened timestamps
- [ ] Optional metrics endpoint for dashboard cards.
- [ ] Optional activity/audit endpoint.
- [ ] Optional approval/governance endpoints.
- [ ] Optional PDF/export endpoint.
- [ ] Optional signature/invoice/contract extension endpoints.

## Design Review Checklist

Use this before marking any Offer UI slice done.

- [ ] Page has one obvious primary action.
- [ ] Secondary actions are visually quieter.
- [ ] Destructive actions require confirmation.
- [ ] Form errors are specific and near the failing field.
- [ ] Empty states explain the next useful action.
- [ ] Status and expiry are visible without opening a menu.
- [ ] Totals are readable and formatted as NOK.
- [ ] Line item editor works on mobile and desktop.
- [ ] Internal links use `Link`/`NavLink`.
- [ ] Components import from `~/ui`.
- [ ] Route code does not use raw one-off layout where a local component would reduce complexity.
- [ ] UI text is Norwegian and domain-specific.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
