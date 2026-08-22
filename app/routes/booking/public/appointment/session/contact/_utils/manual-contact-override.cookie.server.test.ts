import { describe, expect, it } from 'vitest';
import {
  clearManualContactOverride,
  hasManualContactOverride,
  setManualContactOverride,
} from './manual-contact-override.cookie.server';

function cookieHeader(setCookie: string): string {
  return setCookie.split(';', 1)[0];
}

describe('manual contact override cookie', () => {
  it('applies only to the booking session that set it', async () => {
    const setCookie = await setManualContactOverride('session-a');
    const request = new Request('https://portal.pitell.no/booking/public/appointment/session/contact', {
      headers: { Cookie: cookieHeader(setCookie) },
    });

    await expect(hasManualContactOverride(request, 'session-a')).resolves.toBe(true);
    await expect(hasManualContactOverride(request, 'session-b')).resolves.toBe(false);
  });

  it('can be cleared after contact information is saved', async () => {
    const cleared = await clearManualContactOverride();

    expect(cleared).toContain('booking_manual_contact=');
    expect(cleared).toContain('Max-Age=0');
  });
});
