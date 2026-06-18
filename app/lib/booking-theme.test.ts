import { describe, expect, it } from 'vitest';
import { isBookingThemeKey } from './booking-theme';

describe('booking theme keys', () => {
  it('accepts allowlisted booking themes', () => {
    expect(isBookingThemeKey('pitell')).toBe(true);
    expect(isBookingThemeKey('ocean')).toBe(true);
    expect(isBookingThemeKey('sunset')).toBe(true);
    expect(isBookingThemeKey('forest')).toBe(true);
    expect(isBookingThemeKey('fredrikstad-barbershop')).toBe(true);
  });

  it('rejects missing or unsupported booking themes', () => {
    expect(isBookingThemeKey(null)).toBe(false);
    expect(isBookingThemeKey('neon')).toBe(false);
  });
});
