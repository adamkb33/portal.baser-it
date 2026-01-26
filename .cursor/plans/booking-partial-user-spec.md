# Booking Partial User Session Spec

## Goal
Persist a user on a public booking session before full verification is complete, so refreshes do not lose the user context. Full attach still requires email + mobile verification.

## New Endpoint

### POST /public/appointment-session/{sessionId}/set-pending-user
Store a user on the booking session in a “pending verification” state.

Request
```json
{
  "userId": 123
}
```

Response 200
```json
{
  "success": true,
  "message": { "id": "SESSION_PENDING_USER_SET", "value": "User stored." },
  "data": {
    "sessionId": "uuid",
    "userId": 123,
    "nextStep": "VERIFY_EMAIL"
  }
}
```

Notes
- `nextStep` is derived from user verification state (email/mobile).
- This endpoint does **not** enforce verification; it only persists the user to the session.
- The session should expose `pendingUserId` (or `userId`) so the frontend can rehydrate after refresh.

Errors
- 400 invalid userId
- 404 user not found

## Existing Endpoint (unchanged behavior)

### POST /public/appointment-session/{sessionId}/attach-user
Attach user to session **only when fully verified**.

Validation
- email exists and is verified
- mobile exists and is verified

Response (unchanged)
```json
{
  "success": true,
  "message": { "id": "SESSION_USER_ATTACHED", "value": "User attached." },
  "data": {
    "sessionId": "uuid",
    "nextStep": "DONE"
  }
}
```

If verification missing:
```json
{
  "success": false,
  "message": { "id": "EMAIL_NOT_VERIFIED", "value": "Email not verified." },
  "data": {
    "sessionId": "uuid",
    "nextStep": "VERIFY_EMAIL"
  }
}
```

## Session Requirements Update
Optionally extend `GET /public/appointment-session/{sessionId}/requirements` to include:
```json
{
  "needsUser": true,
  "needsEmail": false,
  "needsMobile": true,
  "nextStep": "VERIFY_MOBILE",
  "pendingUserId": 123
}
```

## NextStep Rules
- If email missing → `COLLECT_EMAIL`
- If mobile missing → `COLLECT_MOBILE`
- If email not verified → `VERIFY_EMAIL`
- If mobile not verified → `VERIFY_MOBILE`
- Else → `ATTACH_SESSION` or `DONE`

## API Message IDs (examples)
- SESSION_PENDING_USER_SET
- SESSION_USER_ATTACHED
- EMAIL_NOT_VERIFIED
- MOBILE_NOT_VERIFIED
- USER_NOT_FOUND
