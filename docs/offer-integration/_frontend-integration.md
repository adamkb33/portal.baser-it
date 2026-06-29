# Offer Service Frontend Integration Spec

## Purpose

This document tells frontend exactly how to integrate the offer-service MVP:
which OpenAPI document to generate from, which endpoints to call, which DTOs to
send and receive, and how the company-user and public recipient flows should
behave in the UI.

The contract below is based on the implemented backend controllers and DTOs,
not only the design docs.

## API Base

- Backend host in local development: same monolith host as the rest of the app,
  normally `http://localhost:8010`.
- Offer-service route prefix: `/offer-service`.
- Grouped OpenAPI document: `GET /v3/api-docs/offer-service`.
- Compatibility OpenAPI alias: `GET /offer-service/api-docs`.
- Swagger UI: `/swagger-ui.html`, then select the `offer-service` group.

All company-user endpoints require the normal bearer token auth used by the
rest of the app. Public token endpoints do not require auth.

## Paid Product Gate

Offer-service is a paid company product.

- Product enum value: `OFFER`.
- Frontend should show company offer navigation/pages only when the selected
  company has the `OFFER` product.
- The auth permissions payload exposes this as `flags.canAccessOffer`.
- Do not infer product access from JWT claims. Use the API-provided auth/user
  context or permissions response, matching the existing booking/timesheet
  product gating pattern.
- Company users still need an allowed company role. The backend controllers
  require `EMPLOYEE` or `ADMIN`.

Recommended frontend gating:

```ts
const canAccessOffer = permissions.flags.canAccessCompany && permissions.flags.canAccessOffer;
```

If `canAccessOffer` is false, hide offer navigation and block direct route
access with the same paid-product/no-access state used for timesheet.

## Response Envelope

All controllers return the shared `ApiResponse<T>` envelope.

```ts
type ApiResponse<T> = {
  success: boolean;
  message: {
    id: string;
    value: string;
  };
  data?: T;
  errors?: Array<unknown>;
  meta?: unknown;
  timestamp: string;
};
```

Frontend feature code should consume `response.data` as the actual payload and
use the shared API/client error handling already used by other domains.

## Enums And Constants

```ts
type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
type MessageSender = 'COMPANY' | 'CUSTOMER';
type PitellProduct = 'BOOKING' | 'EVENT' | 'OFFER' | 'TIMESHEET';

const OFFER_TEMPLATE_IDS = {
  BLANK: 'blank',
  PAINT_JOB: 'paint_job',
} as const;

const CAR_PANEL_SLUGS = [
  'hood',
  'front_left_door',
  'front_right_door',
  'rear_left_door',
  'rear_right_door',
  'front_left_fender',
  'front_right_fender',
  'rear_left_quarter',
  'rear_right_quarter',
  'trunk',
  'roof',
  'front_bumper',
  'rear_bumper',
] as const;
```

## Core DTOs

Use generated types from OpenAPI when available. These shapes are included so
the frontend team knows how to build screens and local form state.

```ts
type OfferCustomerDto = {
  id: number;
  companyId: number;
  orgNumber: string;
  displayName: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OfferCustomerContactDto = {
  id: number;
  customerId: number;
  name?: string | null;
  email: string;
  mobileNumber?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OfferDto = {
  id: number;
  companyId: number;
  customerId: number;
  templateId: string;
  status: OfferStatus;
  validUntil?: string | null; // YYYY-MM-DD
  data: Record<string, unknown>;
  declineReason?: string | null;
  acceptedByRecipientId?: number | null;
  declinedByRecipientId?: number | null;
  sentAt?: string | null;
  revision: number;
  openForAction: boolean;
  expired: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OfferLineDto = {
  id: number;
  offerId: number;
  catalogItemId?: number | null;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  vatRate: string | number;
  position: number;
  lineSubtotal: string | number;
  lineVat: string | number;
  lineTotal: string | number;
};

type OfferLineSetDto = {
  lines: OfferLineDto[];
  totals: {
    subtotal: string | number;
    vat: string | number;
    total: string | number;
  };
};

type OfferRecipientDto = {
  id: number;
  offerId: number;
  contactId: number;
  nameSnapshot?: string | null;
  emailSnapshot: string;
  mobileNumberSnapshot?: string | null;
  revokedAt?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OfferMessageDto = {
  id: number;
  offerId: number;
  sender: MessageSender;
  senderCompanyUserId?: number | null;
  senderRecipientId?: number | null;
  senderNameSnapshot?: string | null;
  senderEmailSnapshot?: string | null;
  body: string;
  createdAt?: string | null;
};

type PublicOfferPageDto = {
  offerId: number;
  templateId: string;
  template: OfferTemplateDto;
  status: OfferStatus;
  validUntil?: string | null;
  revision: number;
  snapshot: Record<string, unknown>;
  recipient: {
    id: number;
    name?: string | null;
    email: string;
    mobileNumber?: string | null;
  };
  openForAction: boolean;
  expired: boolean;
  declineReason?: string | null;
  sentAt?: string | null;
};
```

## Company-User Flow

The normal company-user flow should be:

1. Load templates with `GET /offer-service/company-user/offer-templates`.
2. Resolve the customer by organization number with
   `POST /offer-service/company-user/offer-customers`.
3. Load/create/update customer contacts.
4. Create a draft offer for the customer and selected template.
5. Add offer lines manually or from catalog items.
6. Select one or more customer contacts as recipients.
7. Send the offer.
8. Company can view messages, reply, edit while open, and re-send.
9. Once accepted, declined, cancelled, or expired, disable edit/send/message
   actions and keep the page readable.

Use `OfferDto.openForAction` and `OfferDto.expired` from the backend instead of
reimplementing all status/expiry logic in the frontend.

## Public Recipient Flow

The public recipient route should read the token from the URL, for example:

```text
/offers/public/:token
```

The frontend route can be different, but it must call:

```text
GET /offer-service/public/offers/{token}
```

The public page should:

- Render template-specific values by combining `PublicOfferPageDto.template`
  with `PublicOfferPageDto.snapshot.data`.
- Disable accept, decline, and message submit when `openForAction` is `false`.
- Show an expired/read-only state when `expired` is `true`.
- Keep terminal offers visible even when actions are disabled.
- Show `declineReason` when status is `DECLINED`.

Current backend gap: public recipients can post a message, but there is no
implemented public endpoint to fetch the full message thread. Company users can
fetch messages with the company-user endpoint. If the public page must display
the conversation history, add a backend endpoint before wiring that UI:

```text
GET /offer-service/public/offers/{token}/messages
```

## Endpoint Reference

All paths below include the `/offer-service` prefix.

### Templates

| Method | Path                                         | Auth   | Request | Response data        |
| ------ | -------------------------------------------- | ------ | ------- | -------------------- |
| GET    | `/company-user/offer-templates`              | Bearer | none    | `OfferTemplateDto[]` |
| GET    | `/company-user/offer-templates/{templateId}` | Bearer | none    | `OfferTemplateDto`   |

`OfferTemplateDto`:

```ts
type OfferTemplateDto = {
  id: string;
  name: string;
  fields: OfferTemplateFieldDto[];
  createdAt?: string | null;
};

type OfferTemplateFieldDto = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'panel_selector' | string;
  required: boolean;
  validation?: OfferTemplateFieldValidationDto | null;
  options?: OfferTemplateFieldOptionDto[] | null;
};

type OfferTemplateFieldValidationDto = {
  pattern?: string | null;
};

type OfferTemplateFieldOptionDto = {
  value: string;
  label: string;
};
```

Template behavior:

- `blank` has an optional `description` field.
- `paint_job` has `reg_number`, `description`, `date_received`, `ready_date`,
  and `panels`.
- `paint_job.panels` is returned as `type = "panel_selector"` with concrete
  `options`; frontend does not need to know about backend option sources.
- `paint_job.panels` is stored in `offers.data`; it does not create line items.
- Frontend must add price lines separately.

Dynamic form rendering:

```ts
function getTemplateValue(data: Record<string, unknown>, field: OfferTemplateFieldDto) {
  return data[field.key] ?? null;
}

for (const field of template.fields) {
  const value = getTemplateValue(offer.data, field);

  switch (field.type) {
    case 'text':
      renderTextInput(field, value);
      break;
    case 'textarea':
      renderTextarea(field, value);
      break;
    case 'date':
      renderDateInput(field, value);
      break;
    case 'panel_selector':
      renderPanelSelector(field, value, field.options ?? []);
      break;
    default:
      renderUnsupportedField(field);
  }
}
```

Recommended `paint_job` `data` payload:

```json
{
  "reg_number": "AB12345",
  "description": "Paint left front door and hood",
  "date_received": "2026-06-27",
  "ready_date": "2026-07-03",
  "panels": ["front_left_door", "hood"]
}
```

### Customers And Contacts

| Method | Path                                                              | Auth   | Request                             | Response data               |
| ------ | ----------------------------------------------------------------- | ------ | ----------------------------------- | --------------------------- |
| GET    | `/company-user/offer-customers?orgNumber=999888777`               | Bearer | query `orgNumber`, exactly 9 digits | `OfferCustomerDto`          |
| POST   | `/company-user/offer-customers`                                   | Bearer | `ResolveOfferCustomerRequest`       | `OfferCustomerDto`          |
| GET    | `/company-user/offer-customers/{customerId}/contacts`             | Bearer | none                                | `OfferCustomerContactDto[]` |
| POST   | `/company-user/offer-customers/{customerId}/contacts`             | Bearer | `CreateOfferCustomerContactRequest` | `OfferCustomerContactDto`   |
| PUT    | `/company-user/offer-customers/{customerId}/contacts/{contactId}` | Bearer | `UpdateOfferCustomerContactRequest` | `OfferCustomerContactDto`   |
| DELETE | `/company-user/offer-customers/{customerId}/contacts/{contactId}` | Bearer | none                                | empty/unit response         |

Requests:

```ts
type ResolveOfferCustomerRequest = {
  orgNumber: string; // required, /^[0-9]{9}$/
};

type CreateOfferCustomerContactRequest = {
  name?: string | null;
  email: string; // required email
  mobileNumber?: string | null;
};

type UpdateOfferCustomerContactRequest = CreateOfferCustomerContactRequest;
```

Frontend notes:

- Organization number is the customer lookup key.
- Customer display name currently falls back to `orgNumber`. Enrichment/name
  display can later come from Brreg through backend.
- Contacts are reusable for that customer.
- Contact email is required.
- `mobileNumber` is the field name, not `phone`.

### Offers

| Method | Path                                    | Auth   | Request                 | Response data       |
| ------ | --------------------------------------- | ------ | ----------------------- | ------------------- |
| GET    | `/company-user/offers`                  | Bearer | optional query `status` | `OfferDto[]`        |
| POST   | `/company-user/offers`                  | Bearer | `CreateOfferRequest`    | `OfferDto`          |
| GET    | `/company-user/offers/{offerId}`        | Bearer | none                    | `OfferDto`          |
| PUT    | `/company-user/offers/{offerId}`        | Bearer | `UpdateOfferRequest`    | `OfferDto`          |
| DELETE | `/company-user/offers/{offerId}`        | Bearer | none                    | empty/unit response |
| POST   | `/company-user/offers/{offerId}/send`   | Bearer | none                    | `OfferDto`          |
| POST   | `/company-user/offers/{offerId}/resend` | Bearer | none                    | `OfferDto`          |
| POST   | `/company-user/offers/{offerId}/cancel` | Bearer | none                    | `OfferDto`          |

Requests:

```ts
type CreateOfferRequest = {
  customerId: number; // required, positive
  templateId: 'blank' | 'paint_job' | string; // required
  validUntil?: string | null; // YYYY-MM-DD, optional
  data?: Record<string, unknown> | null;
};

type UpdateOfferRequest = {
  validUntil?: string | null;
  data?: Record<string, unknown> | null;
};
```

Status rules:

- `DRAFT`: editable, can be deleted, can be sent.
- `SENT`: visible to recipients, can be edited and re-sent while open for
  action.
- `ACCEPTED`, `DECLINED`, `CANCELLED`: terminal and read-only.
- There is no persisted `EXPIRED` status. Expiry is computed from `validUntil`.
- If `validUntil` is omitted/null, the offer does not expire automatically.
- If set, the offer is open through the end of that date in Europe/Oslo.

Frontend action rules:

```ts
const canEditOffer = offer.status === 'DRAFT' || offer.openForAction;
const canDeleteOffer = offer.status === 'DRAFT';
const canSendOffer = offer.status === 'DRAFT' || offer.openForAction;
const canCancelOffer = offer.openForAction;
const isReadOnly = !canEditOffer;
```

Use backend errors as final authority; these predicates are for UI state only.

### Offer Lines

| Method | Path                                   | Auth   | Request                    | Response data     |
| ------ | -------------------------------------- | ------ | -------------------------- | ----------------- |
| GET    | `/company-user/offers/{offerId}/lines` | Bearer | none                       | `OfferLineSetDto` |
| PUT    | `/company-user/offers/{offerId}/lines` | Bearer | `ReplaceOfferLinesRequest` | `OfferLineSetDto` |

Request:

```ts
type ReplaceOfferLinesRequest = {
  lines: Array<{
    catalogItemId?: number | null; // positive when present
    description: string; // required, non-blank
    quantity?: string | number; // min 0.01, defaults to 1
    unitPrice: string | number; // min 0
    vatRate?: string | number | null; // min 0, defaults to 25
    position?: number | null; // min 0
  }>;
};
```

Frontend notes:

- Currency is always Norwegian kroner. Do not render a currency selector.
- Default VAT is 25 if `vatRate` is not supplied.
- Send all current lines on `PUT`; the backend replaces the set.
- Line totals come from backend. Use returned `totals` for display.
- Selected car panels do not create lines; users add lines manually.

### Catalog Items

| Method | Path                                                | Auth   | Request                         | Response data           |
| ------ | --------------------------------------------------- | ------ | ------------------------------- | ----------------------- |
| GET    | `/company-user/offer-catalog-items`                 | Bearer | none                            | `OfferCatalogItemDto[]` |
| POST   | `/company-user/offer-catalog-items`                 | Bearer | `CreateOfferCatalogItemRequest` | `OfferCatalogItemDto`   |
| PUT    | `/company-user/offer-catalog-items/{catalogItemId}` | Bearer | `UpdateOfferCatalogItemRequest` | `OfferCatalogItemDto`   |
| DELETE | `/company-user/offer-catalog-items/{catalogItemId}` | Bearer | none                            | `OfferCatalogItemDto`   |

Requests:

```ts
type CreateOfferCatalogItemRequest = {
  name: string; // required
  defaultUnitPrice: string | number; // min 0
  defaultVatRate?: string | number | null; // min 0, defaults to 25
};

type UpdateOfferCatalogItemRequest = CreateOfferCatalogItemRequest;
```

Frontend notes:

- Catalog items are reusable line presets.
- Applying a catalog item to an offer line should copy description/price/VAT
  into the line form. Existing offer lines are snapshots and are not updated
  when a catalog item later changes.

### Recipients

| Method | Path                                                             | Auth   | Request                     | Response data                     |
| ------ | ---------------------------------------------------------------- | ------ | --------------------------- | --------------------------------- |
| GET    | `/company-user/offers/{offerId}/recipients`                      | Bearer | none                        | `OfferRecipientDto[]`             |
| PUT    | `/company-user/offers/{offerId}/recipients`                      | Bearer | `SetOfferRecipientsRequest` | `OfferRecipientDto[]`             |
| POST   | `/company-user/offers/{offerId}/recipients/{recipientId}/revoke` | Bearer | none                        | `OfferRecipientDto`               |
| POST   | `/company-user/offers/{offerId}/recipients/{recipientId}/enable` | Bearer | none                        | `GeneratedOfferRecipientTokenDto` |

Request:

```ts
type SetOfferRecipientsRequest = {
  contactIds: number[]; // min length 1, all positive
};

type GeneratedOfferRecipientTokenDto = {
  recipientId: number;
  email: string;
  rawToken: string;
};
```

Frontend notes:

- Recipients are selected from the customer contacts attached to the offer's
  customer.
- Recipient rows snapshot contact name/email/mobile at selection time.
- `PUT /recipients` replaces the selected recipient set.
- `revoke` disables that recipient's token without cancelling the offer.
- `enable` clears revocation and generates a new raw token. Treat this as a
  manual/admin resend-link action, not the default happy-path button.
- Normal sending happens through `POST /company-user/offers/{offerId}/send`.

### Messages

| Method | Path                                      | Auth   | Request                     | Response data       |
| ------ | ----------------------------------------- | ------ | --------------------------- | ------------------- |
| GET    | `/company-user/offers/{offerId}/messages` | Bearer | none                        | `OfferMessageDto[]` |
| POST   | `/company-user/offers/{offerId}/messages` | Bearer | `CreateOfferMessageRequest` | `OfferMessageDto`   |
| POST   | `/public/offers/{token}/messages`         | Public | `CreateOfferMessageRequest` | `OfferMessageDto`   |

Request:

```ts
type CreateOfferMessageRequest = {
  body: string; // required, non-blank
};
```

Message rules:

- Messages are allowed only while the offer is open for action.
- Company messages notify active, non-revoked recipients.
- Customer messages are stored with `senderRecipientId`.
- Company messages are stored with `senderCompanyUserId`.
- Messages do not change offer status.
- After accepted, declined, cancelled, or expired, message submit must be
  disabled.

### Public Offer Page

| Method | Path                              | Auth   | Request                     | Response data        |
| ------ | --------------------------------- | ------ | --------------------------- | -------------------- |
| GET    | `/public/offers/{token}`          | Public | none                        | `PublicOfferPageDto` |
| POST   | `/public/offers/{token}/accept`   | Public | none                        | `PublicOfferPageDto` |
| POST   | `/public/offers/{token}/decline`  | Public | `PublicDeclineOfferRequest` | `PublicOfferPageDto` |
| POST   | `/public/offers/{token}/messages` | Public | `CreateOfferMessageRequest` | `OfferMessageDto`    |

Request:

```ts
type PublicDeclineOfferRequest = {
  reason: string; // required, non-blank
};
```

Public page rendering:

- `template.fields` contains labels, field types, validation hints, and any
  select/panel options needed to render template-specific values.
- `snapshot.data` contains template-specific values from the last sent revision.
- `snapshot.lines`, `snapshot.subtotal`, `snapshot.vat`, and `snapshot.total`
  contain immutable sent offer totals.
- Render public template values by looping over `template.fields` and reading
  `snapshot.data[field.key]`.
- Show accept/decline buttons only when `openForAction === true`.
- On accept success, render returned status `ACCEPTED` and disable actions.
- On decline success, render returned status `DECLINED`, show reason, and
  disable actions.
- If token is invalid or revoked, use the shared error handling and show an
  invalid/expired link page.

Example public snapshot shape:

```json
{
  "offerId": 123,
  "revision": 1,
  "templateId": "paint_job",
  "data": {
    "reg_number": "AB12345",
    "description": "Paint left front door and hood",
    "panels": ["front_left_door", "hood"]
  },
  "lines": [
    {
      "description": "Lakkering av dor",
      "quantity": 1,
      "unitPrice": 6500,
      "vatRate": 25,
      "lineSubtotal": 6500,
      "lineVat": 1625,
      "lineTotal": 8125
    }
  ],
  "subtotal": 6500,
  "vat": 1625,
  "total": 8125
}
```

## Recommended Frontend Screens

### Company Offer List

- Route suggestion: `/company/offers`.
- Fetch `GET /offer-service/company-user/offers`.
- Optional status tabs/filter: all, draft, sent, accepted, declined, cancelled.
- Display customer using `customerId` initially. If richer customer display is
  needed, resolve/enrich by org number in a later backend iteration.
- Show badges for `status`, `expired`, and `openForAction`.

### Company Offer Editor

- Route suggestion: `/company/offers/:offerId`.
- Load offer, templates, lines, recipients, messages, and customer contacts.
- For new offer:
  - resolve customer by org number,
  - create/select contact persons,
  - create draft offer,
  - add lines,
  - set recipients,
  - send.
- For existing offer:
  - allow edits only when backend indicates it is editable/open.
  - save template data with `PUT /offers/{offerId}`.
  - save prices with `PUT /offers/{offerId}/lines`.
  - save recipients with `PUT /offers/{offerId}/recipients`.

### Public Offer Page

- Route suggestion: `/offer/:token` or `/public/offers/:token`.
- Fetch public page by token.
- Render latest snapshot, not live editable offer data.
- Browser print is the MVP print/PDF path.
- Actions:
  - accept,
  - decline with required reason,
  - post message if enabled.

## Validation Summary

Frontend should validate before submit to improve UX, but backend remains final
authority.

- `orgNumber`: required, exactly 9 digits.
- contact `email`: required valid email.
- contact `mobileNumber`: optional string.
- `customerId`: positive number.
- `templateId`: required.
- `validUntil`: optional `YYYY-MM-DD`.
- line `description`: required non-blank.
- line `quantity`: greater than or equal to `0.01`.
- line `unitPrice`: greater than or equal to `0`.
- line `vatRate`: optional, greater than or equal to `0`, default `25`.
- recipients `contactIds`: at least one selected contact.
- message `body`: required non-blank.
- decline `reason`: required non-blank.

## Error And Read-Only Handling

The UI should not assume a button is valid just because it is visible. Always
handle backend errors.

Common backend business failures the frontend should map to useful states:

- Unknown customer/contact/offer/template/token: show not found or invalid link.
- Revoked public token: show invalid/revoked link page.
- Terminal offer action: refresh offer/public page and show read-only state.
- Expired offer action: refresh offer/public page and show expired state.
- Validation error: show field errors where possible.

## OpenAPI Client Generation

Preferred generation source for offer frontend work:

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:8010/v3/api-docs/offer-service',
  output: 'src/api/offer',
});
```

If the frontend already generates one monolith client, use
`http://localhost:8010/v3/api-docs` and consume operations tagged `offer`.

Do not manually edit generated client files. Add frontend-specific convenience
wrappers outside the generated output if needed.

## MVP Gaps To Confirm Before Final UI Wiring

- Public message thread read endpoint is missing. Add it if the public recipient
  page must show previous company/customer messages.
- Company notification audience is deferred in backend. The backend currently
  notifies recipients for sent/cancelled/company-message events, but does not
  notify company users when customers message, accept, or decline.
- Customer display names are not stored beyond `orgNumber`/fallback display.
  Rich company names should come from a later Brreg/enrichment path.
