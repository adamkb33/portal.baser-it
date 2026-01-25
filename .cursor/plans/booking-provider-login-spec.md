# Booking Provider Login Backend Spec

## Goals
- Backend determines the next step for provider logins based on missing user data.
- If provider user lacks email, collect email before continuing.
- If provider user lacks mobile, collect mobile before continuing.
- If provider user has email and mobile, skip data collection.
- Frontend only follows `nextStep` and does not infer missing data.

## Core Concepts
### NextStep enum
```
COLLECT_EMAIL
COLLECT_MOBILE
ATTACH_SESSION
DONE
```

### MissingData rules
- If user.email is null/empty → `nextStep=COLLECT_EMAIL`
- Else if user.mobileNumber is null/empty → `nextStep=COLLECT_MOBILE`
- Else → `nextStep=ATTACH_SESSION` (or `DONE` if already attached)

## Endpoints

### 1) POST /auth/sign-in (provider)
Return next step for provider logins.

Request
```json
{
  "provider": "GOOGLE",
  "idToken": "..."
}
```

Response 200
```json
{
  "success": true,
  "message": { "id": "SIGNIN_OK", "value": "Signed in." },
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "accessTokenExpiresAt": 1700000000,
    "refreshTokenExpiresAt": 1700000000,
    "userId": 123,
    "email": null,
    "mobileNumber": "+4799999999",
    "nextStep": "COLLECT_EMAIL"
  }
}
```

Notes
- `nextStep` is derived from user fields.
- Include `email` and `mobileNumber` so the UI can show what is missing.

Errors
- 400 invalid provider token
- 401 unauthorized

---

### 2) POST /auth/provider/complete-profile
Update missing fields for provider user and return next step.

Request
```json
{
  "userId": 123,
  "email": "ola@example.com",
  "mobileNumber": "+4799999999"
}
```

Response 200
```json
{
  "success": true,
  "message": { "id": "PROFILE_UPDATED", "value": "Profile updated." },
  "data": {
    "userId": 123,
    "email": "ola@example.com",
    "mobileNumber": "+4799999999",
    "nextStep": "ATTACH_SESSION"
  }
}
```

Notes
- Accept partial updates; backend decides `nextStep`.
- Validation: email format, mobile format (required if missing).

---

### 3) POST /booking/public/appointment-session/{sessionId}/attach-user
Attach an authenticated user to the public booking session.

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
  "message": { "id": "SESSION_USER_ATTACHED", "value": "User attached." },
  "data": {
    "sessionId": "uuid",
    "nextStep": "DONE"
  }
}
```

Notes
- Should be allowed only when user has email and mobile, and both are verified.
- If requirements missing, return `nextStep=COLLECT_EMAIL` or `COLLECT_MOBILE`.
- If email or mobile is unverified, return `nextStep=VERIFY_EMAIL` or `VERIFY_MOBILE`.

Validation
- email must exist and be verified
- mobile must exist and be verified

---

### Optional: GET /booking/public/appointment-session/{sessionId}/requirements
Return what the session still needs.

Response 200
```json
{
  "success": true,
  "message": { "id": "SESSION_REQUIREMENTS", "value": "OK" },
  "data": {
    "needsUser": true,
    "needsEmail": false,
    "needsMobile": true,
    "nextStep": "COLLECT_MOBILE"
  }
}
```

## API Message IDs (examples)
- SIGNIN_OK
- PROFILE_UPDATED
- SESSION_USER_ATTACHED
- SESSION_REQUIREMENTS
- INVALID_PROVIDER_TOKEN
- EMAIL_REQUIRED
- MOBILE_REQUIRED
- USER_NOT_FOUND
