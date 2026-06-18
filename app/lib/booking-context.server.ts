import { createCookie } from 'react-router';
import type { BookingThemeKey } from './booking-theme';
import { isBookingThemeKey } from './booking-theme';

export type BookingContext = {
  companyId: number | null;
  theme: BookingThemeKey;
};

const DEFAULT_BOOKING_THEME: BookingThemeKey = 'pitell';
const DEFAULT_BOOKING_CONTEXT: BookingContext = {
  companyId: null,
  theme: DEFAULT_BOOKING_THEME,
};

const bookingContextCookie = createCookie('booking_context', {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/booking',
  maxAge: 60 * 60 * 4,
});

export async function parseBookingContext(request: Request): Promise<BookingContext> {
  const value = await bookingContextCookie.parse(request.headers.get('Cookie'));

  if (!value || typeof value !== 'object') {
    return DEFAULT_BOOKING_CONTEXT;
  }

  const themeCandidate = (value as Record<string, unknown>).theme;
  const companyIdCandidate = (value as Record<string, unknown>).companyId;
  const companyId =
    typeof companyIdCandidate === 'number' && Number.isInteger(companyIdCandidate) && companyIdCandidate > 0
      ? companyIdCandidate
      : null;

  if (typeof themeCandidate === 'string' && isBookingThemeKey(themeCandidate)) {
    return { companyId, theme: themeCandidate };
  }

  return DEFAULT_BOOKING_CONTEXT;
}

export async function serializeBookingContext(context: BookingContext): Promise<string> {
  return bookingContextCookie.serialize(context);
}

export function resolveBookingTheme(value: string | null): BookingThemeKey | null {
  if (!value) {
    return DEFAULT_BOOKING_THEME;
  }

  return isBookingThemeKey(value) ? value : null;
}
