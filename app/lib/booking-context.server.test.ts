import { describe, expect, it } from 'vitest';
import {
  parseBookingContext,
  resolveBookingTheme,
  serializeBookingContext,
} from './booking-context.server';

describe('booking context cookie', () => {
  it('roundtrips an allowlisted theme through the scoped cookie', async () => {
    const setCookie = await serializeBookingContext({ companyId: 8, theme: 'fredrikstad-barbershop' });
    const request = new Request('http://localhost/booking/public/appointment/session', {
      headers: { Cookie: setCookie },
    });

    await expect(parseBookingContext(request)).resolves.toEqual({
      companyId: 8,
      theme: 'fredrikstad-barbershop',
    });
    expect(setCookie).toContain('booking_context=');
    expect(setCookie).toContain('Path=/booking');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('defaults missing theme input to pitell and rejects invalid input', () => {
    expect(resolveBookingTheme(null)).toBe('pitell');
    expect(resolveBookingTheme('fredrikstad-barbershop')).toBe('fredrikstad-barbershop');
    expect(resolveBookingTheme('neon')).toBeNull();
  });

  it('ignores invalid persisted company ids', async () => {
    const setCookie = await serializeBookingContext({ companyId: -1, theme: 'pitell' });
    const request = new Request('http://localhost/booking/public/appointment/session', {
      headers: { Cookie: setCookie },
    });

    await expect(parseBookingContext(request)).resolves.toEqual({
      companyId: null,
      theme: 'pitell',
    });
  });
});
