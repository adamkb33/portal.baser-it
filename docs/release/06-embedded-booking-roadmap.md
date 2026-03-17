# Embedded Multi-Tenant Booking Roadmap

## Objective

Create a production-ready embedded booking experience that companies can place on their own websites without sending end users into the main application shell.

The embed should:

- run inside an `iframe`
- keep the booking experience on the customer company's website
- support tenant-level color-palette customization
- remain secure, reliable, and operationally manageable in a multi-tenant setup

## Core Product Decision

The recommended direction is not to iframe the full main frontend. The better architecture is:

- a dedicated embedded booking surface
- served from a separate booking origin or subdomain
- designed specifically for iframe embedding
- themed by tenant configuration
- isolated from the internal admin/product shell

Recommended shape:

- internal app stays as the main product
- embedded booking lives as a controlled public runtime
- tenant website embeds only the booking runtime

This is the safer and cleaner model for a multi-tenant product.

## Why This Is the Right Direction

If the main app shell is embedded directly, you inherit unnecessary problems:

- auth and navigation complexity
- sidebar/navbar/layout behavior that does not belong in an embed
- higher security surface
- branding confusion
- poorer control over sizing, loading, and parent-page integration

A dedicated embedded booking runtime is better because:

- it is easier to theme
- it is easier to sandbox
- it is easier to resize and message to the host page
- it keeps the public booking surface separate from the internal workspace
- it makes tenant onboarding cleaner

## Best-Practice Basis

This roadmap is based on current iframe and embed guidance:

- MDN recommends controlled cross-origin communication through `postMessage`, with strict `targetOrigin` and origin checks
- MDN documents `sandbox` restrictions for `iframe`s and the risks of over-permissive combinations
- MDN documents `frame-ancestors` CSP for controlling which parent sites may embed a page
- web.dev recommends reserving iframe space, lazy-loading where appropriate, and treating embeds as performance-sensitive products

Sources:

- [MDN: `window.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [MDN: `<iframe>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
- [MDN: `sandbox`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/sandbox)
- [MDN: `frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)
- [MDN: `Set-Cookie`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [web.dev: Embed Best Practices](https://web.dev/articles/embed-best-practices)
- [OWASP: Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html)

## Scope

This roadmap covers:

- embed architecture
- multi-tenant theming model
- host-to-iframe integration contract
- security rules
- booking UX constraints for embed usage

This roadmap does not yet cover:

- broader performance optimization
- full release operations
- analytics/BI planning

## First Build Target (Implement This First)

This is the first milestone to ship before broader multi-tenant theming and advanced embed controls.

Goal:

- customer website gets one copy-paste iframe snippet
- snippet preloads a valid company context
- user is taken directly into booking flow from the contact step

### Why This First

- It solves the immediate business need (embed + valid company + direct start).
- It reuses your existing public booking flow, which already supports session bootstrap from `companyId`.
- It gives you a stable baseline before adding more host-controlled options.

## Research Summary (Best-Practice Constraints)

- Use strict `postMessage` origin checks and exact `targetOrigin` (MDN `postMessage`).
- Control who can frame the embed using CSP `frame-ancestors` (MDN CSP).
- Use deliberate iframe sandboxing; avoid over-permissive combinations (MDN iframe/sandbox).
- Reserve iframe space and use lazy loading where appropriate to avoid layout shift/perf issues (web.dev embeds).
- Treat clickjacking defenses as layered: CSP + cookie policy + UI/flow hardening (OWASP clickjacking guidance).

## First Release Technical Contract

### 1. Embed URL Contract

Use one canonical embed entrypoint:

`https://booking.<your-domain>/embed?companyId=<id>&start=contact`

Behavior:

- `companyId` is required
- `start=contact` is the only allowed start value in first release
- embed entrypoint must initialize/validate booking session and route to contact step

If invalid:

- invalid or missing `companyId` must show controlled error state in-frame
- no raw crashes

### 2. Security Contract For Company Context

First release can accept raw `companyId`, but roadmap should immediately include signed embed config:

Recommended next hardening:

- `embedToken` (JWT or signed blob) containing:
  - `companyId`
  - `allowedOrigins` (or tenant id mapped server-side)
  - `exp`
  - optional fixed `start=contact`
- server validates token before allowing embed session bootstrap

Rule:

- host page should not be trusted to provide unrestricted runtime config

### 3. Host Snippet (Copy-Paste)

Use this as the first integration artifact:

```html
<div id="pitell-booking-embed" style="width:100%;min-height:760px;"></div>
<script>
  (function () {
    var container = document.getElementById('pitell-booking-embed');
    var iframe = document.createElement('iframe');
    var embedOrigin = 'https://booking.example.com';
    var src = embedOrigin + '/embed?companyId=123&start=contact';

    iframe.src = src;
    iframe.title = 'Booking';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.minHeight = '760px';
    iframe.allow = 'clipboard-write';

    // Keep sandbox minimal, then widen only if required by real behavior.
    iframe.sandbox = 'allow-scripts allow-forms allow-same-origin';

    container.appendChild(iframe);

    window.addEventListener('message', function (event) {
      if (event.origin !== embedOrigin) return;
      if (!event.data || event.data.type !== 'embed:resize') return;
      if (typeof event.data.height !== 'number') return;
      iframe.style.height = Math.max(640, event.data.height) + 'px';
    });
  })();
</script>
```

Implementation note:

- If you can avoid cookie-dependent behavior in-frame, remove `allow-same-origin` later for tighter isolation.
- If cookie/session behavior requires it, keep `allow-same-origin` and compensate with strict origin isolation + `frame-ancestors`.

### 4. Embed Runtime Messaging (First Release)

Outbound events from iframe:

- `embed:ready`
- `embed:resize` with `{ height }`
- `embed:error` with safe error code (no sensitive internals)
- `embed:booking-success` when relevant

Inbound events from host (first release):

- none required (keep control narrow)

### 5. HTTP/Header Controls

Embed runtime should send CSP with explicit framing allowlist, for example:

`Content-Security-Policy: frame-ancestors https://customer-a.com https://*.customer-b.com;`

Also keep legacy compatibility as needed:

- `X-Frame-Options` fallback policy for non-embed surfaces (`DENY`/`SAMEORIGIN` where applicable)

Cookie/session note:

- if cross-site iframe cookies are required, configure with `SameSite=None; Secure; HttpOnly`
- keep session lifetime short for embedded public flows

## Engineering Tasks For First Build Target

1. Add embed entry route (`/embed`) that only accepts `companyId` + `start=contact`.
2. Reuse existing booking session bootstrap logic from public booking session routes.
3. Force first navigation target to contact step after session setup.
4. Add embed layout shell (no workspace chrome, compact spacing).
5. Implement `postMessage` emitter for `embed:ready` and `embed:resize`.
6. Add host integration snippet docs with one copy-paste example.
7. Configure `frame-ancestors` allowlisting strategy (per tenant/domain).
8. Add controlled in-frame error UI for invalid company and startup failures.
9. Add integration tests:
   - valid company -> contact step
   - invalid company -> controlled error
   - iframe resize messaging works
   - disallowed parent domain blocked by policy

## Definition Of Done For First Build Target

- customer can paste one snippet into external website and load embed
- embed starts from contact step for specified company
- invalid company is handled gracefully
- parent/iframe resize integration works
- embed is only frameable from approved domains
- no internal app chrome leaks into embed

## Immediate Roadmap (After First Build Target)

After this first milestone is stable:

1. Replace raw `companyId` embed param with signed `embedToken` as default.
2. Add tenant theme token resolution.
3. Add optional host-driven locale/height mode events.
4. Add dashboard-generated embed snippet and key/token management UX.

## Workstream 1: Product and Architecture Boundary

### Objective

Define exactly what the embedded booking product is and what it is not.

### Decisions To Lock

- The embed is public booking only.
- The embed does not expose internal workspace UI.
- The embed should have its own compact layout shell.
- The embed should support tenant theme input limited to palette tokens.
- The embed should be treated as a product surface, not just an iframe wrapper.

### Checklist

- Define a dedicated embedded booking route group or frontend entry surface.
- Remove internal product chrome from the embed:
  - navbar
  - sidebar
  - workspace templates
  - company admin navigation
- Define which booking flows are embeddable:
  - landing/start
  - employee selection if used
  - service selection
  - time selection
  - contact/auth continuation if required
  - success
  - cancellation or rescheduling if included
- Decide whether public auth steps stay inside the iframe or open externally.

### Recommendation

Keep the entire booking journey inside the embed only if the auth/contact steps can be made compact and brand-safe. If not, keep booking selection embedded and move account-sensitive flows to controlled hosted pages.

### Definition of Done

- The team has a written contract describing exactly which flows live in the embedded runtime.

## Workstream 2: Tenant Theme Model

### Objective

Support tenant-level visual customization without allowing design entropy.

### Principle

Do not allow free-form design overrides. Only allow controlled color palette inputs mapped into semantic tokens.

### Recommended Theme Model

Each tenant can configure a small theme object such as:

- primary
- secondary
- accent
- surface
- background
- text
- success
- danger

But the embed should not consume these raw values directly throughout the UI. Instead:

- tenant palette is validated
- raw colors are mapped into semantic embed tokens
- components consume semantic tokens only

### Checklist

- Create a tenant embed theme schema.
- Define safe contrast requirements.
- Define a token-mapping layer for the embed runtime.
- Decide where the theme comes from:
  - server-side tenant config
  - signed embed config
  - query param pointing to tenant identity, with theme resolved server-side
- Prevent arbitrary CSS injection or style overrides.
- Build fallback palette behavior for missing or invalid tenant themes.

### Recommendation

Resolve theme server-side from tenant identity. Do not trust raw host-page styling or unrestricted query-param color injection.

### Definition of Done

- The embed can render in tenant-specific colors while still using the same shared component system and accessibility rules.

## Workstream 3: Embed Integration Contract

### Objective

Define how the customer website and the booking iframe communicate.

### Why This Matters

The embed cannot rely on DOM access across origins. It needs a clean integration contract.

### Recommended Contract

Use `postMessage` for controlled communication between host page and iframe.

Examples of messages:

- `embed:ready`
- `embed:resize`
- `embed:navigate`
- `embed:booking-success`
- `embed:error`

Optional host-to-iframe messages:

- `host:set-theme-preview`
- `host:set-locale`
- `host:set-height-mode`

### Checklist

- Define all allowed message event types.
- Validate `origin` on both sides.
- Use exact `targetOrigin`, never `*` in production flows.
- Add automatic height reporting from iframe to host.
- Reserve sensible minimum heights to avoid layout shift.
- Decide whether the host can influence route start state, selected employee, or campaign context.
- Write an embed integration spec with sample host code.

### Recommendation

Keep host-to-iframe control narrow. The more initialization state the host can push in, the more fragile tenant integrations become.

### Definition of Done

- The iframe can be embedded with a documented snippet and resize correctly on customer sites.

## Workstream 4: Security and Isolation

### Objective

Make the embedded runtime safe in a multi-tenant environment.

### Security Principles

- isolate the embedded product from the internal workspace
- only allow approved parent domains
- keep cross-origin communication explicit
- minimize iframe capabilities

### Checklist

- Serve the embed from a dedicated origin or subdomain.
- Use CSP `frame-ancestors` to allow only intended parent domains.
- Decide tenant allowlisting model for embed parents.
- Define `sandbox` settings deliberately.
- Avoid over-permissive iframe capability flags.
- Review cookies/session behavior for iframe contexts.
- Decide whether the embed is fully stateless or uses short-lived public booking session state.
- Review clickjacking and unauthorized embedding risks.
- Sign or verify tenant embed configuration to prevent spoofed cross-tenant usage.

### Recommendation

Do not allow open embedding from any origin by default. Embed access should be explicitly controlled per tenant or per approved domain set.

### Definition of Done

- The embedded booking surface can only be loaded and used in approved contexts, with explicit messaging and framing rules.

## Workstream 5: UX Rules for Embedded Booking

### Objective

Make the booking flow feel native enough inside a customer site while remaining predictable and branded as a Pitell-powered experience.

### Constraints

Embedded products need tighter rules than full sites:

- compact layout
- low navigation complexity
- no dead-end transitions
- clear success and failure states
- controlled scrolling behavior

### Checklist

- Design a dedicated compact embed layout.
- Avoid workspace-style headers and route chrome.
- Reduce unnecessary copy and spacing.
- Make forms and selectors compact and mobile-safe.
- Ensure the success page works cleanly inside an iframe.
- Decide how cancellation/rescheduling should behave in embedded mode.
- Decide if “open in full page” is offered as an escape hatch.
- Add a small “Powered by Pitell” or equivalent trust indicator only if product strategy wants it.

### Recommendation

Treat the embedded runtime as a streamlined booking funnel, not as a general-purpose public website.

### Definition of Done

- The embed looks deliberate inside a third-party website and does not feel like a shrunk version of the main app.

## Workstream 6: Implementation Plan

### Phase 1: Architecture

- Define the embedded route scope.
- Define tenant identity and theme resolution.
- Define parent-domain allowlisting.
- Define the postMessage event contract.

### Phase 2: UI Foundation

- Create an embed-specific public layout shell.
- Create tenant theme token mapping.
- Refactor booking pages that belong inside the embed to consume embed-safe templates and tokens.

### Phase 3: Host Integration

- Build iframe auto-resize messaging.
- Create a copy-paste embed snippet for customer sites.
- Add local preview tooling for tenant themes and embed hosts.

### Phase 4: Security Hardening

- Apply `frame-ancestors`
- finalize sandbox rules
- validate origin checks
- verify session/public-state behavior

### Phase 5: QA

- Cross-browser iframe testing
- mobile embed testing
- host-page CSS interference testing
- multi-tenant theme testing
- invalid-domain embedding tests

## Definition of Ready for Build

Before implementation starts, these must be decided:

- embedded route scope
- embed origin strategy
- tenant theme schema
- parent-domain allowlist model
- host/iframe messaging contract
- whether auth/contact continuation stays inside the iframe

## Launch Checklist

- Embedded booking runs on a dedicated public runtime.
- The embed does not expose internal workspace UI.
- Tenant theme is tokenized and palette-limited.
- Approved host domains are enforced.
- `postMessage` uses explicit origin validation.
- Iframe sizing is stable and avoids layout shift.
- The booking flow works on desktop and mobile embeds.
- The customer receives a documented embed snippet and integration guide.
