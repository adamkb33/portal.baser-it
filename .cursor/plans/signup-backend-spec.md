# Signup Verification Backend Spec

## Goals
- Always require email verification before login.
- Mobile verification required only when a mobile number is supplied.
- Client should not need to carry query params across multiple screens.
- Keep flow deterministic with a backend "next step".

## Endpoints

### 1) POST /auth/sign-up
Creates user (emailVerified=false) and starts verification flow.

Request
```json
{
  "givenName": "Ola",
  "familyName": "Nordmann",
  "email": "ola@example.com",
  "password": "secret",
  "password2": "secret",
  "mobileNumber": "+4799999999"
}
```

Response 200
```json
{
  "success": true,
  "message": { "id": "SIGNUP_OK", "value": "Sign up initiated." },
  "data": {
    "verificationSessionToken": "uuid",
    "emailSent": true,
    "mobileSent": true,
    "nextStep": "VERIFY_EMAIL"
  }
}
```

Notes
- nextStep is always VERIFY_EMAIL.
- verificationSessionToken is short-lived (for example 24h).

Errors
- 400 or 422 validation
- 409 email already used
- 429 rate limits

### 2) GET /auth/verify-email?token=...
Validates email verification token and marks emailVerified=true.

Response 200
```json
{
  "success": true,
  "message": { "id": "EMAIL_VERIFIED", "value": "Email verified." },
  "data": {
    "verificationSessionToken": "uuid",
    "mobileRequired": true,
    "mobileVerified": false,
    "nextStep": "VERIFY_MOBILE"
  }
}
```

Notes
- Response includes verificationSessionToken if a mobile is required.
- nextStep is VERIFY_MOBILE if mobileRequired and not verified, otherwise SIGN_IN.

Errors
- 400 invalid token
- 410 expired token

### 3) POST /auth/verify-mobile
Verifies OTP using the session token.

Request
```json
{
  "verificationSessionToken": "uuid",
  "code": "123456"
}
```

Response 200
```json
{
  "success": true,
  "message": { "id": "MOBILE_VERIFIED", "value": "Mobile verified." },
  "data": {
    "nextStep": "SIGN_IN"
  }
}
```

Errors
- 400 invalid token or code
- 410 session expired
- 429 too many attempts

### 4) GET /auth/verification-status
Gets verification state without needing email token.

Request
```
/auth/verification-status?verificationSessionToken=uuid
```

Response 200
```json
{
  "success": true,
  "message": { "id": "VERIFICATION_STATUS", "value": "OK" },
  "data": {
    "emailVerified": true,
    "mobileRequired": true,
    "mobileVerified": false,
    "emailSent": true,
    "mobileSent": true,
    "nextStep": "VERIFY_MOBILE"
  }
}
```

Notes
- Optional but simplifies UI routing and refresh.
- Enables a single "verification progress" screen.

### 5) POST /auth/resend-verification
Resends email verification link and optional SMS OTP.

Request
```json
{
  "email": "ola@example.com",
  "verificationSessionToken": "uuid"
}
```

Response 200
```json
{
  "success": true,
  "message": { "id": "VERIFICATION_RESENT", "value": "Sent." },
  "data": {
    "emailSent": true,
    "mobileSent": true
  }
}
```

Errors
- 404 unknown email
- 429 rate limit

## Data model notes
- EmailVerificationTokenEntity stores hashed token with expiry + usedAt.
- verificationSessionToken stored on user or separate table with expiry.
- mobileRequired is true when user has mobileNumber.
- mobileVerified is true when user_contact_info status is VERIFIED.

## API message IDs (examples)
- SIGNUP_OK
- EMAIL_VERIFIED
- MOBILE_VERIFIED
- VERIFICATION_STATUS
- VERIFICATION_RESENT
- INVALID_TOKEN
- TOKEN_EXPIRED
- OTP_INVALID
- OTP_EXPIRED
