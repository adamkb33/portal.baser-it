import { createCookie } from 'react-router';

export const accessTokenCookie = createCookie('access_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

export const refreshTokenCookie = createCookie('refresh_token', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});
