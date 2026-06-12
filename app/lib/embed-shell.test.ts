import { describe, expect, it } from 'vitest';
import { isEmbedThemeKey } from './embed-shell';

describe('embed theme keys', () => {
  it('accepts allowlisted embed themes', () => {
    expect(isEmbedThemeKey('pitell')).toBe(true);
    expect(isEmbedThemeKey('ocean')).toBe(true);
    expect(isEmbedThemeKey('sunset')).toBe(true);
    expect(isEmbedThemeKey('forest')).toBe(true);
    expect(isEmbedThemeKey('fredrikstad-barbershop')).toBe(true);
  });

  it('rejects missing or unsupported embed themes', () => {
    expect(isEmbedThemeKey(null)).toBe(false);
    expect(isEmbedThemeKey('neon')).toBe(false);
  });
});
