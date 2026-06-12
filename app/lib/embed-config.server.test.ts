import { describe, expect, it } from 'vitest';
import {
  parseEmbedConfig,
  resolveEmbedParentOrigin,
  resolveEmbedTheme,
  serializeEmbedConfig,
} from './embed-config.server';

describe('embed config cookie', () => {
  it('roundtrips an allowlisted theme through the scoped cookie', async () => {
    const setCookie = await serializeEmbedConfig({ theme: 'fredrikstad-barbershop', parentOrigin: null });
    const request = new Request('http://localhost/embed/booking', {
      headers: { Cookie: setCookie },
    });

    await expect(parseEmbedConfig(request)).resolves.toEqual({
      theme: 'fredrikstad-barbershop',
      parentOrigin: null,
    });
    expect(setCookie).toContain('embed_config=');
    expect(setCookie).toContain('Path=/embed');
  });

  it('defaults missing theme input to pitell and rejects invalid input', () => {
    expect(resolveEmbedTheme(null)).toBe('pitell');
    expect(resolveEmbedTheme('fredrikstad-barbershop')).toBe('fredrikstad-barbershop');
    expect(resolveEmbedTheme('neon')).toBeNull();
  });

  it('roundtrips parent origin through the scoped cookie', async () => {
    const setCookie = await serializeEmbedConfig({
      theme: 'pitell',
      parentOrigin: 'https://client.example',
    });
    const request = new Request('http://localhost/embed/booking', {
      headers: { Cookie: setCookie },
    });

    await expect(parseEmbedConfig(request)).resolves.toEqual({
      theme: 'pitell',
      parentOrigin: 'https://client.example',
    });
  });

  it('normalizes valid parent origins and rejects unsupported values', () => {
    expect(resolveEmbedParentOrigin('https://client.example/path?x=1')).toBe('https://client.example');
    expect(resolveEmbedParentOrigin('http://localhost:8080')).toBe('http://localhost:8080');
    expect(resolveEmbedParentOrigin('ftp://client.example')).toBeNull();
    expect(resolveEmbedParentOrigin('not-a-url')).toBeNull();
  });
});
