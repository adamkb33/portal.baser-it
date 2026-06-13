import { describe, expect, it } from 'vitest';
import { loader } from './embed.route';
import { ROUTES_MAP } from '~/lib/routing/route-tree';

function unwrapData<T = unknown>(result: unknown): T {
  if (result && typeof result === 'object' && 'data' in (result as Record<string, unknown>)) {
    return (result as { data: T }).data;
  }
  return result as T;
}

function getStatus(result: unknown): number | null {
  if (result && typeof result === 'object' && 'init' in (result as Record<string, unknown>)) {
    return ((result as { init?: { status?: number } | null }).init?.status ?? null) as number | null;
  }
  return result instanceof Response ? result.status : null;
}

function getLocation(result: unknown): string | null {
  if (result && typeof result === 'object' && 'init' in (result as Record<string, unknown>)) {
    const headers = (result as { init?: { headers?: Headers } | null }).init?.headers;
    return headers?.get('Location') ?? null;
  }
  return result instanceof Response ? result.headers.get('Location') : null;
}

function getSetCookies(result: unknown): string[] {
  if (result && typeof result === 'object' && 'init' in (result as Record<string, unknown>)) {
    const headers = (result as { init?: { headers?: Headers | [string, string][] } | null }).init?.headers;
    if (!headers) return [];
    if (Array.isArray(headers)) {
      return headers
        .filter(([name]) => name.toLowerCase() === 'set-cookie')
        .map(([, value]) => value);
    }
    return headers.get('Set-Cookie') ? [headers.get('Set-Cookie') as string] : [];
  }
  if (result instanceof Response) {
    const value = result.headers.get('Set-Cookie');
    return value ? [value] : [];
  }
  return [];
}

describe('embed route loader', () => {
  it('redirects to booking session when companyId is valid', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=123'),
    } as never);

    const setCookies = getSetCookies(result).join('\n');
    expect(getStatus(result)).toBe(302);
    expect(getLocation(result)).toBe(`${ROUTES_MAP['embed.booking.appointment.session'].href}?companyId=123`);
    expect(setCookies).toContain('embed_config=');
  });

  it('allows start=contact and redirects to booking session', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=55&start=contact'),
    } as never);

    const setCookies = getSetCookies(result).join('\n');
    expect(getStatus(result)).toBe(302);
    expect(getLocation(result)).toBe(`${ROUTES_MAP['embed.booking.appointment.session'].href}?companyId=55`);
    expect(setCookies).toContain('embed_config=');
  });

  it('returns 400 when companyId is missing', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed'),
    } as never);

    expect(getStatus(result)).toBe(400);
    expect(unwrapData(result)).toMatchObject({
      error: 'Mangler eller ugyldig companyId.',
    });
  });

  it('ignores unsupported start values and still redirects to booking session', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=8&start=overview'),
    } as never);

    expect(getStatus(result)).toBe(302);
    expect(getLocation(result)).toBe(`${ROUTES_MAP['embed.booking.appointment.session'].href}?companyId=8`);
  });

  it('returns 400 when theme is invalid', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=8&theme=neon'),
    } as never);

    expect(getStatus(result)).toBe(400);
    expect(unwrapData(result)).toMatchObject({
      error: 'Ugyldig theme-verdi.',
    });
  });

  it('stores valid theme in embed config cookie and keeps redirect URL clean', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=8&theme=fredrikstad-barbershop'),
    } as never);

    const setCookies = getSetCookies(result).join('\n');
    expect(getStatus(result)).toBe(302);
    expect(getLocation(result)).toBe(`${ROUTES_MAP['embed.booking.appointment.session'].href}?companyId=8`);
    expect(setCookies).toContain('embed_config=');
    expect(setCookies).not.toContain('embed_mode=');
    expect(setCookies).not.toContain('embed_theme=fredrikstad-barbershop');
  });

  it('stores a valid parentOrigin in embed config cookie and keeps redirect URL clean', async () => {
    const result = await loader({
      request: new Request(
        'http://localhost/embed?companyId=8&theme=fredrikstad-barbershop&parentOrigin=https%3A%2F%2Fclient.example%2Fbooking',
      ),
    } as never);

    const setCookies = getSetCookies(result).join('\n');
    expect(getStatus(result)).toBe(302);
    expect(getLocation(result)).toBe(`${ROUTES_MAP['embed.booking.appointment.session'].href}?companyId=8`);
    expect(setCookies).toContain('embed_config=');
    expect(setCookies).not.toContain('parentOrigin=https://client.example');
  });

  it('returns 400 when parentOrigin is invalid', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=8&parentOrigin=not-a-url'),
    } as never);

    expect(getStatus(result)).toBe(400);
    expect(unwrapData(result)).toMatchObject({
      error: 'Ugyldig parentOrigin-verdi.',
    });
  });

  it('clears the appointment session cookie when reset is requested', async () => {
    const result = await loader({
      request: new Request('http://localhost/embed?companyId=8&reset=1'),
    } as never);

    const setCookies = getSetCookies(result).join('\n');
    expect(getStatus(result)).toBe(302);
    expect(getLocation(result)).toBe(`${ROUTES_MAP['embed.booking.appointment.session'].href}?companyId=8`);
    expect(setCookies).toContain('appointment_session=');
    expect(setCookies).toContain('Max-Age=0');
    expect(setCookies).toContain('Path=/');
    expect(setCookies).toContain('Secure');
    expect(setCookies).toContain('SameSite=None');
  });
});
