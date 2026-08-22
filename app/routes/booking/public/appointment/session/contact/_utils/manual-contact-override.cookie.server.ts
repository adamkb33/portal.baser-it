import { createCookie } from 'react-router';

const manualContactOverrideCookie = createCookie('booking_manual_contact', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/booking/public/appointment/session/contact',
  maxAge: 60 * 60 * 24,
});

export async function hasManualContactOverride(request: Request, sessionId: string): Promise<boolean> {
  const value = await manualContactOverrideCookie.parse(request.headers.get('Cookie'));
  return typeof value === 'string' && value === sessionId;
}

export function setManualContactOverride(sessionId: string): Promise<string> {
  return manualContactOverrideCookie.serialize(sessionId);
}

export function clearManualContactOverride(): Promise<string> {
  return manualContactOverrideCookie.serialize('', { maxAge: 0 });
}
