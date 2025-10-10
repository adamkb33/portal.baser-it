# Token Persistence Framework Plan

## Goals
- Persist authentication artifacts (access + refresh tokens) after sign-in or invite acceptance.
- Provide a single, typed API for storing, reading, and clearing tokens with graceful error handling.
- Maintain compatibility with server-rendered React Router actions while keeping browser-only logic isolated.

## Requirements
- **Environment awareness:** avoid touching `window`/`localStorage` during SSR; expose safe no-ops server side.
- **Data model:** support `accessToken`, `refreshToken`, and expiry timestamps; allow future metadata (e.g., scopes).
- **Security posture:** minimize exposure in memory, namespace keys, and enable optional encryption/obfuscation.
- **Extensibility:** allow swapping storage (e.g., sessionStorage) or plugging in secure storage later.
- **Testing:** provide utilities for unit tests to stub storage without mutating global state.

## Proposed Architecture
1. **Token DTO** – Shared TypeScript interface describing the persisted payload.
2. **Storage Abstraction** – Module exporting a small interface (`TokenStorage`) with `read`, `write`, `clear`.
3. **Local Storage Adapter** – Browser-only implementation that guards against unavailable storage and JSON errors.
4. **Memory Fallback** – In-memory implementation used during SSR/tests to prevent crashes.
5. **Facade Hook/Helpers** – High-level helpers (`persistTokens`, `loadTokens`, `clearTokens`) that pick the right adapter based on environment and handle parsing.
6. **Token-Aware HTTP Client** – Axios (or fetch) interceptor that inspects stored tokens before each request; injects the access token header when valid, falls back to the refresh endpoint when the token is expired, and clears storage on unrecoverable failures.
7. **Event Hooks** – Optional `window` `storage` event listener utility so other tabs sync logout/login state.

## Implementation Stages
1. **Scaffold shared types and interfaces** in `app/features/auth/token/types.ts`.
2. **Build storage adapters** (`local-storage-adapter.ts`, `memory-storage-adapter.ts`) with defensive programming and logging hooks.
3. **Create environment-aware facade** (`token-storage.ts`) that delegates to the correct adapter.
4. **Introduce API client interceptor** that reads the stored tokens, verifies expiry, and automatically invokes the refresh endpoint when needed before retrying the original request.
5. **Integrate with existing flows** (`sign-in` and `accept-invite` actions) to persist tokens after successful responses.
6. **Introduce React hooks** (e.g., `useAuthTokens`) for components that need live access.
7. **Add tests** for adapters, facades, and the interceptor logic using Vitest or similar, mocking `window.localStorage` and the network layer.
8. **Document usage** in README or dedicated docs, including security guidance and future migration path (e.g., to cookie-based storage).

## Security & Best Practices
- Namespace keys (e.g., `portal.auth.tokens`) and version them to allow migrations.
- Sanitize inputs and wrap JSON parsing/stringifying in try/catch to avoid corrupt state.
- Expose a single `clearTokens` used by logout flows and error handlers.
- Consider optional encryption (pluggable interface) if threat model requires additional protection.

## Open Questions / Next Steps
- **Storage strategy:** Refresh tokens remain in the client storage layer (localStorage) to support multiple front-end clients consuming the same backend.
- **Refresh cadence:** Background refresh scheduling is out of scope; tokens refresh on-demand via the interceptor when requests detect expiry.
- **State notifications:** Token changes will broadcast through a lightweight event emitter so other app areas (e.g., contexts, tabs) can react.

Once this plan is approved, we can proceed with scaffolding the types and adapters before wiring them into the SSR actions.
