import { createCookie } from 'react-router';

// Backend-issued, opaque, signed token proving this browser verified a specific
// mobile number via OTP recently (~60 days). Never parsed or modified here — just
// stored and replayed on the next identify call so returning guests skip the SMS step.
export const mobileVerificationTokenCookie = createCookie('mobile_verification_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});
