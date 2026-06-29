# Offer Frontend Integration Plan

## Context

The generated Offer SDK is present under `app/api/generated/offer`, with runtime config in
`app/api/config/offer-client.ts`. The generated SDK exposes one `Offer` class containing both
company-user endpoints and public token endpoints.

The backend integration contract is in `docs/offer-integration/_frontend-integration.md`.
This plan translates that contract into frontend routes, gates, loaders/actions, and UI work for
this React Router app.

## Integration Goals

- Add Offer as a paid company product, gated the same way as Booking and Timesheet.
- Add authenticated company-user pages for listing, creating, editing, sending, cancelling, and managing offers.
- Add a public recipient page for token-based offer review, accept, decline, and message submission.
- Reuse existing company page templates, form patterns, generated SDK clients, and auth handling.
- Keep offer-specific business UI under `app/routes/company/offer` and public offer UI under `app/routes/offer/public`.

## Current Repo Findings

- `app/api/generated/offer/sdk.gen.ts` exports `Offer`.
- `app/api/config/offer-client.ts` already points the Offer client to `getGatewayUrl()` and uses `createLoggedAxios('offer')`.
- `app/api/utils/with-auth.ts` currently sets auth headers for base, booking, timesheet, notification, and diagnostic clients, but not the Offer client.
- `app/lib/routing/route-utils.ts` already supports `Access.PRODUCT`, but `extractProductFromRoute` does not map `offer` to `OFFER`.
- `app/routes/system-admin/companies/products/system-admin.companies.products.route.tsx` omits `OFFER` from `PRODUCT_VALUES`.
- Generated base/offer types already include `OFFER` and `flags.canAccessOffer`.
- Existing product routes live inside `COMPANY_ROUTES`; public booking routes live in a separate routing group. Offer should follow that split.

## Phase 1: Enable Offer As A Product

1. Update `app/api/utils/with-auth.ts`.
   - Import `client as offerClient` from `~/api/generated/offer/client.gen`.
   - Include `offerClient.setConfig({ headers })` in `setAuthorizationHeader`.
   - This is required for all authenticated `Offer.*` company-user calls.

2. Update `app/lib/routing/route-utils.ts`.
   - Extend product extraction to include route IDs containing `offer`.
   - Widen product type unions from `'BOOKING' | 'EVENT' | 'TIMESHEET'` to include `'OFFER'`.
   - This enables route-tree product filtering for `company.offer.*`.

3. Update `app/lib/auth-service.ts`.
   - Add `OFFER` to `AuthenticatedUserPayload.companyProducts` for consistency with generated backend types, even though current route gating uses `AuthController.getMe()` user context.

4. Update system-admin product assignment.
   - Add `OFFER` to `PRODUCT_VALUES` in `app/routes/system-admin/companies/products/system-admin.companies.products.route.tsx`.
   - Update text that currently says `BOOKING/EVENT/TIMESHEET`, for example `app/routes/system-admin/system-admin.route.tsx`.

5. Add tests around product gating.
   - Extend route-utils/navigation tests or add focused tests proving `company.offer` is hidden without `OFFER` and visible with `OFFER` plus `ADMIN`/`EMPLOYEE`.

## Phase 2: Routing

### Company Routes

Add a new Offer branch to `COMPANY_ROUTES` under `company.children`.

Recommended route tree:

```ts
{
  id: 'company.offer',
  href: '/company/offers',
  label: 'Tilbud',
  category: BrachCategory.COMPANY,
  placement: RoutePlaceMent.SIDEBAR,
  accessType: Access.PRODUCT,
  companyRoles: [CompanyRole.ADMIN, CompanyRole.EMPLOYEE],
  iconName: 'FileText',
  children: [
    { id: 'company.offer.create', href: '/company/offers/create', hidden: true, ... },
    { id: 'company.offer.detail', href: '/company/offers/:offerId', hidden: true, ... },
    { id: 'company.offer.catalog', href: '/company/offers/catalog', label: 'Varekatalog', ... },
  ],
}
```

Create these route files:

- `app/routes/company/offer/company.offer.layout.tsx`
- `app/routes/company/offer/company.offer.route.tsx`
- `app/routes/company/offer/create/company.offer.create.layout.tsx`
- `app/routes/company/offer/create/company.offer.create.route.tsx`
- `app/routes/company/offer/detail/company.offer.detail.layout.tsx`
- `app/routes/company/offer/detail/company.offer.detail.route.tsx`
- `app/routes/company/offer/catalog/company.offer.catalog.layout.tsx`
- `app/routes/company/offer/catalog/company.offer.catalog.route.tsx`

Use `CompanyPageTemplate` for list/catalog pages and `CompanyFormPageTemplate` for create/edit forms.

### Public Routes

Add a new public Offer routing group, separate from company routes. A route like `/offer/public/:token` keeps it clear that the URL is public and token-based.

Recommended route tree:

```ts
{
  id: 'offer',
  href: '/offer',
  category: BrachCategory.PUBLIC,
  accessType: Access.PUBLIC,
  children: [
    {
      id: 'offer.public',
      href: '/offer/public/:token',
      category: BrachCategory.PUBLIC,
      accessType: Access.PUBLIC,
      hidden: true,
    },
  ],
}
```

Implementation options:

- Add `app/lib/routing/offer/routes.ts`, import it into `app/lib/routing/route-tree.ts`, and spread it into `ROUTE_TREE`.
- Create `app/routes/offer/public/offer.public.route.tsx`.

The generated route builder maps route IDs to filenames by convention, so confirm generated path expectations after adding the route tree. Use the existing booking route layout as the reference.

## Phase 3: SDK Calls And Data Loading

All authenticated company calls must be wrapped in `withAuth(request, () => Offer.method(...))`.

### Company Offer List

Route: `/company/offers`

Loader:

- `Offer.getOffers({ query: { status } })`
- Optional status filter: `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `CANCELLED`

UI:

- Header actions: `Nytt tilbud`, `Varekatalog`
- Status filter control
- Summary/KPI cards for draft, sent/open, accepted, declined/cancelled
- Responsive list/table with customer, status, valid until, total if available from loaded detail or omitted until metrics exist

### Company Offer Create

Route: `/company/offers/create`

Loader:

- `Offer.getTemplates()`
- `Offer.getCatalogItems()`

Action flow:

1. Validate org number, template ID, valid-until date, template data, initial lines, and recipient contact data.
2. Resolve customer with `Offer.resolveCustomer({ body: { orgNumber } })`.
3. Create any new customer contacts with `Offer.createContact({ path: { customerId }, body })`.
4. Create draft with `Offer.createOffer({ body: { customerId, templateId, validUntil, data } })`.
5. Save lines with `Offer.replaceOfferLines({ path: { offerId }, body: { lines } })`.
6. Save recipients with `Offer.setRecipients({ path: { offerId }, body: { contactIds } })`.
7. Redirect to `/company/offers/:offerId`.

Do not send automatically in the first version unless the UI has an explicit submit intent like `save-and-send`.

### Company Offer Detail/Editor

Route: `/company/offers/:offerId`

Loader:

- `Offer.getOffer({ path: { offerId } })`
- `Offer.getOfferLines({ path: { offerId } })`
- `Offer.getRecipients({ path: { offerId } })`
- `Offer.getMessages({ path: { offerId } })`
- `Offer.getTemplates()`
- `Offer.getCatalogItems()`
- After loading the offer, load customer contacts with `Offer.getContacts({ path: { customerId: offer.customerId } })`

Actions:

- Save offer metadata/template data: `Offer.updateOffer({ path: { offerId }, body: { validUntil, data } })`
- Save lines: `Offer.replaceOfferLines({ path: { offerId }, body: { lines } })`
- Save recipients: `Offer.setRecipients({ path: { offerId }, body: { contactIds } })`
- Send: `Offer.sendOffer({ path: { offerId } })`
- Resend: `Offer.resendOffer({ path: { offerId } })`
- Cancel: `Offer.cancelOffer({ path: { offerId } })`
- Revoke recipient: `Offer.revokeRecipient({ path: { offerId, recipientId } })`
- Enable recipient/token: `Offer.enableRecipient({ path: { offerId, recipientId } })`
- Company message: `Offer.createMessage1({ path: { offerId }, body: { body } })`
- Update/create/delete contacts as needed through the customer contact endpoints.

Use backend fields for action state:

- Editable when `offer.status === 'DRAFT' || offer.openForAction`
- Delete only when `offer.status === 'DRAFT'`
- Cancel when `offer.openForAction`
- Read-only when `!offer.openForAction` or terminal status
- Expired state from `offer.expired`

### Catalog Page

Route: `/company/offers/catalog`

Loader:

- `Offer.getCatalogItems()`

Actions:

- Create: `Offer.createCatalogItem({ body })`
- Update: `Offer.updateCatalogItem({ path: { catalogItemId }, body })`
- Deactivate/delete: `Offer.deactivateCatalogItem({ path: { catalogItemId } })`

Catalog items are templates for new offer lines. Existing offer lines are snapshots and should not update automatically after catalog changes.

### Public Offer Page

Route: `/offer/public/:token`

Loader:

- `Offer.getOffer1({ path: { token } })`

Actions:

- Accept: `Offer.acceptOffer({ path: { token } })`
- Decline: `Offer.declineOffer({ path: { token }, body: { reason } })`
- Message: `Offer.createMessage({ path: { token }, body: { body } })`

UI rules:

- Render `PublicOfferPageDto.snapshot`, not editable company offer state.
- Disable accept, decline, and message when `openForAction` is false.
- Show expired/read-only state when `expired` is true.
- Keep terminal offers visible.
- Show `declineReason` when status is `DECLINED`.
- Public message history cannot be shown yet because there is no `GET /public/offers/{token}/messages` endpoint.

## Phase 4: Offer-Specific Components

Reuse existing primitives/templates from `~/ui`:

- `CompanyPageTemplate`
- `CompanyFormPageTemplate`
- `Panel`
- `Card`
- `KpiCard`
- `Notice`
- `Badge`
- `Button`
- `FormField`
- `Input`
- `Textarea`
- `Checkbox`
- `Tabs`
- `Select`
- `ConfirmDialog`
- table primitives where useful

Add offer-specific components under `app/routes/company/offer/_components`:

- `offer-status-badge.tsx`
- `offer-summary-cards.tsx`
- `offer-list-table.tsx`
- `offer-template-selector.tsx`
- `offer-template-field-renderer.tsx`
- `offer-customer-resolver.tsx`
- `offer-contact-editor.tsx`
- `offer-recipient-selector.tsx`
- `offer-line-editor.tsx`
- `offer-totals-summary.tsx`
- `offer-action-bar.tsx`
- `offer-message-thread.tsx`
- `offer-catalog-item-form.tsx`

Add shared offer utilities under `app/routes/company/offer/_utils`:

- `offer-status.ts` for labels, badge variants, and action predicates.
- `offer-money.ts` for `nb-NO` currency formatting.
- `offer-lines.ts` for line normalization, position ordering, and totals display helpers.
- `offer-template-data.ts` for typed local parsing of `OfferDto.data`/`PublicOfferPageDto.snapshot`.

Add public-specific components under `app/routes/offer/public/_components` if the layout diverges:

- `public-offer-summary.tsx`
- `public-offer-actions.tsx`
- `public-offer-message-form.tsx`

## Phase 5: Forms And Validation

Add zod schemas under `app/routes/company/offer/_schemas`:

- `offer-customer.schema.ts`
- `offer-contact.schema.ts`
- `offer-draft.schema.ts`
- `offer-line.schema.ts`
- `offer-recipient.schema.ts`
- `offer-catalog-item.schema.ts`
- `offer-message.schema.ts`
- `public-decline-offer.schema.ts`

Validation rules to enforce client-side/server-side in route actions:

- `orgNumber`: exactly 9 digits.
- `email`: valid email.
- `mobileNumber`: optional, use existing mobile-number conventions if a shared validator exists.
- `quantity`: positive number.
- `unitPrice`: non-negative number.
- `vatRate`: default to backend/default catalog rate when omitted; otherwise non-negative.
- `validUntil`: optional `YYYY-MM-DD`; do not reimplement expiry rules beyond format validation.
- Message body: non-empty, bounded length.
- Decline reason: required, bounded length.

## Phase 6: Template Handling

Implementation approach:

- Treat `OfferTemplateDto.fields` as the backend source of truth for every template form.
- Do not hard-code fields based on known template IDs such as `blank` or `paint_job`.
- The create/edit UI first lists available templates from `Offer.getTemplates()`, then renders fields for the selected template.
- Store submitted template-specific form data in `OfferDto.data` using the exact `OfferTemplateFieldDto.key` values returned by the backend.
- Supported field renderers for the current backend contract:
  - `text`: single-line input.
  - `textarea`: multi-line input.
  - `date`: date input.
  - `panel_selector`: checkbox group using backend-provided `options`.
- Unknown field types must render a clear unsupported-field fallback instead of silently dropping data.
- Required fields and `validation.pattern` must be enforced server-side in the route action before calling `Offer.createOffer` or `Offer.updateOffer`.
- Selected car panels are template data only; they do not create line items unless the user explicitly adds priced lines.
- Build a shared renderer/parser layer so create, detail edit, and public snapshot rendering use the same template metadata rules.

## Phase 7: Error And Empty States

Use existing `resolveErrorPayload` and `Notice`.

Cases to handle:

- Missing product: route hidden by navigation; direct route should fail through backend/route access and show the same no-access behavior used by other company products.
- Missing company context: existing `company` layout redirects to company context selection.
- `404` customer/contact/offer/template/token: show not found or invalid link state.
- Expired/terminal action: refresh the offer/public page and show read-only state.
- Line validation errors: keep form values and show row-level messages.
- Send without recipients/lines: preserve editor state and show a clear validation notice.

## Phase 8: Tests And Verification

Focused tests:

- Product gating includes `OFFER` in route-utils/navigation.
- `withAuth` sets/clears auth headers for `offerClient`.
- Create offer action validates org number and calls resolve/create/save steps in order.
- Detail action dispatches correct SDK method by intent.
- Public route actions call accept/decline/message endpoints and preserve token path.
- Status helper tests for editable/read-only/action visibility.

Manual verification:

- System admin can assign `OFFER` to a company.
- Company sidebar shows `Tilbud` only for companies with `OFFER`.
- `/company/offers` loads and filters list.
- Create draft from org number, template, lines, and recipients.
- Edit draft/open offer.
- Send, resend, cancel, revoke/enable recipient.
- Public token route renders snapshot.
- Public accept/decline/message actions disable after terminal state.

## Implementation Order

1. Product infrastructure: `withAuth`, route-utils, auth-service type, system-admin product list, tests.
2. Add route tree entries and empty route shells for company and public Offer pages.
3. Add offer utilities, schemas, and status/money helpers.
4. Build company offer list.
5. Build create draft flow.
6. Build detail/editor flow with lines, recipients, messages, and actions.
7. Build catalog CRUD.
8. Build public token page.
9. Add focused tests and run route/type generation/build.

## Backend/API Gaps To Track

- Public message history is not available. Add `GET /offer-service/public/offers/{token}/messages` before showing conversation history on the public page.
- Offer list does not appear to include totals directly. If the list needs total amounts without per-offer detail fetches, add a list DTO field or a metrics endpoint.
- If direct frontend route blocking needs a polished paid-product page rather than backend `403`, add or reuse a shared product-access guard component.
