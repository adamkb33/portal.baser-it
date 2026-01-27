# Backend Requirement: Resend Verification Should Return Token

## Summary

The `resendVerification` endpoint should return a `verificationSessionToken` in its response so the frontend can persist and reuse the latest token after a resend.

## Current Behavior

- Endpoint: `POST /auth/resend-verification`
- Response type: `ResendVerificationResponseDto`
- Current fields: `emailSent`, `mobileSent`
- No `verificationSessionToken` is returned, per `types.gen.ts`.

## Desired Behavior

Include `verificationSessionToken` in the resend response payload.

### Proposed Response Shape

```
ResendVerificationResponseDto {
  emailSent: boolean;
  mobileSent: boolean;
  verificationSessionToken: string;
}
```

## Rationale

- The frontend stores the token in session storage for verification flows.
- After a resend, the token should be re-sent (or rotated) to avoid relying on stale tokens.
- This allows the UI to continue verification seamlessly without leaking tokens into URL params.

## Acceptance Criteria

- `POST /auth/resend-verification` returns `verificationSessionToken`.
- OpenAPI spec updated accordingly.
- Regenerated client types include `verificationSessionToken` on `ResendVerificationResponseDto`.

