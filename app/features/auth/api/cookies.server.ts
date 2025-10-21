import { createCookie } from 'react-router';

export const accessTokenCookie = createCookie('access_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
});

export const refreshTokenCookie = createCookie('refresh_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
});

export const companyContextCookie = createCookie('company_context', {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  path: '/',
});
