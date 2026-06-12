# Embed Route Spec

## Scope

- Domain: `app/routes/embed/*`
- Initial target content: booking public flow rendered inside embed route/iframe.
- This spec defines shell behavior, visibility rules, and acceptance criteria for embed mode.

## Goal

- Render embedded booking content without global application chrome.
- Ensure a consistent, minimal iframe view regardless of authenticated role (including system admin/super admin).

## Core Rule: Shell Isolation

- Embed mode must not render host app shell components around embedded content.
- Always hide these in embed mode:
  - Global header / top navbar
  - Global footer
  - Sidebar / desktop nav
  - Mobile menu trigger + mobile menu drawer
  - Any role-based admin navigation chrome

## Deterministic Activation Rules

- Embed shell mode must be determined server-side from the `/embed/*` route scope, not from client runtime heuristics.
- Do not require `window.parent !== window` to hide shell.
- If embed mode is active and route is in embed-supported scope, shell must be hidden on first server render.
- This prevents first-paint flashes where header/footer/mobile nav briefly appear before hydration.

## Route Scope Contract

- Embed shell isolation applies only to approved embed surfaces:
  - `booking/public/*` (initial scope)
- Non-embed routes keep standard shell unless explicitly added to embed scope.
- Scope checks must be centralized and versioned in one helper, not spread across route components.

## Role-Agnostic Behavior

- Embed shell restrictions are independent of auth role.
- If user is logged in as admin/super admin/system user, embedded output must still remain chrome-free.
- Role can affect API authorization/data, but must not affect embed shell visibility.

## First Paint and Hydration Requirements

- SSR output for embed mode must already be shell-free.
- Hydration must not change shell visibility (no shell mount/unmount flicker).
- Embed mode must behave identically with and without JavaScript enabled for shell visibility.

## Layout Contract

- Embed route should render only the embedded feature surface (booking page snippet).
- The iframe viewport should be used for content, not app-shell framing.
- No extra shell spacing/padding reserved for hidden header/footer/sidebar in embed mode.
- Content container must use embed-safe padding defaults independent of app-shell spacing tokens.

## Interaction Contract

- Embedded content keeps its own internal route UX (forms, step actions, bottom action bar).
- Embed route must not inject unrelated navigation controls from host app.

## Source of Truth

- Embed detection should be centralized (route-level context/flag), not duplicated per feature route.
- Shell visibility decisions should be made once in the root layout layer using embed flag.
- If both request-level and runtime embed signals exist, request-level embed signal is authoritative for shell rendering.

## Test Requirements

- Add/maintain route tests that verify, in embed mode:
  1. Header/navbar are absent.
  2. Footer is absent.
  3. Mobile menu controls are absent.
  4. Embedded booking content is present.
  5. Behavior is unchanged across authenticated roles.
  6. SSR response is already shell-free (no flicker risk).
  7. Non-embed requests still render full shell.

## Security & Robustness

- Accept only validated embed parameters (`companyId`, allowlisted theme/start values).
- Invalid embed params must return explicit 4xx errors and never fall back to full-shell booking route.
- Embed config cookies should be scoped minimally (path and lifetime appropriate to embed flow).
- Parent origins allowed to embed must be controlled via deploy-time allowlist and enforced with CSP `frame-ancestors`.
- Cross-window message payloads must be schema-validated before use.

## Observability

- Emit structured logs for embed activation decisions:
  - route path
  - embed mode resolved value
  - scope match result
  - reason when shell was not hidden
- Logging must exclude sensitive session data.

## Acceptance Criteria

1. Visiting embed route renders only embedded booking surface, without global shell.
2. Admin/super-admin users do not see host nav/footer/mobile menu inside embed output.
3. Standard non-embed routes continue to render normal app shell.

## Research Basis (Industry Conventions)

- Cross-window messaging must use strict origin controls:
  - Always send `postMessage` with explicit `targetOrigin` (not `*`) where possible.
  - Always verify `event.origin` on message receive.
  - Sources:
    - MDN `Window.postMessage`: [https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
    - OWASP HTML5 Security Cheat Sheet (Web Messaging): [https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)

- Embedding permissions should be explicitly controlled by policy:
  - Use CSP `frame-ancestors` to define which parent origins may embed the app.
  - Avoid relying only on legacy `X-Frame-Options`.
  - Source:
    - MDN CSP `frame-ancestors`: [https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)

- If sandboxed iframes are used, permissions should be least-privilege:
  - Avoid broad sandbox combinations without explicit need.
  - Source:
    - MDN `<iframe>` reference: [https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)

- Embedded UX should minimize layout shifts and unnecessary host chrome:
  - Keep embedded surface focused and stable to reduce CLS/visual jumps.
  - Source:
    - web.dev embed best practices: [https://web.dev/articles/embed-best-practices](https://web.dev/articles/embed-best-practices)

- Action target sizing in embedded flows should respect accessibility guidance:
  - Minimum 24x24 CSS px (WCAG 2.2 AA target size minimum), recommend 44x44 for primary touch actions.
  - Source:
    - W3C Understanding SC 2.5.5 (44x44): [https://www.w3.org/WAI/WCAG21/Understanding/target-size](https://www.w3.org/WAI/WCAG21/Understanding/target-size)

## Recommended Implementation Strategy

1. Resolve embed mode from the route path and keep optional embed configuration in a path-scoped cookie.
2. Compute `useEmbedShell` from `embedMode && inScopePath` only; avoid runtime iframe checks for shell toggling.
3. Render shell-free SSR HTML in embed mode to prevent first-paint chrome flicker.
4. Keep iframe messaging optional and additive (ready/resize/step events), never required for shell correctness.
5. Apply embed theme through semantic token overrides only (no component-level color branching).
