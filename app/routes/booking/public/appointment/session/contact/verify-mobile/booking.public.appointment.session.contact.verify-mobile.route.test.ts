import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  readVerificationToken: vi.fn(),
  buildVerificationCookieHeader: vi.fn(),
  resendVerification: vi.fn(),
  resolveErrorPayload: vi.fn(),
}));

vi.mock('~/routes/booking/public/_services/booking.appointment-session.service.server', () => ({
  AppointmentSessionService: {
    get: mocks.getSession,
  },
}));

vi.mock('~/routes/booking/public/appointment/session/contact/_services/verification-token.service.server', () => ({
  VerificationTokenService: {
    readVerificationToken: mocks.readVerificationToken,
    buildVerificationCookieHeader: mocks.buildVerificationCookieHeader,
  },
}));

vi.mock('~/routes/booking/public/appointment/session/contact/_services/contact-auth.service.server', () => ({
  ContactAuthService: {
    resendVerification: mocks.resendVerification,
  },
}));

vi.mock('~/lib/api-error', () => ({
  resolveErrorPayload: mocks.resolveErrorPayload,
}));

import { loader } from './booking.public.appointment.session.contact.verify-mobile.route';

const routeSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'booking.public.appointment.session.contact.verify-mobile.route.tsx'),
  'utf8',
);

function unwrapData<T = unknown>(result: unknown): T {
  if (result && typeof result === 'object' && 'data' in (result as Record<string, unknown>)) {
    return (result as { data: T }).data;
  }
  return result as T;
}

function getHeaders(result: unknown): Headers {
  if (result instanceof Response) {
    return result.headers;
  }

  const init = result && typeof result === 'object' && 'init' in result ? (result as { init?: { headers?: HeadersInit } }).init : null;
  return new Headers(init?.headers);
}

function getSetCookie(result: unknown): string {
  return getHeaders(result).get('Set-Cookie') ?? '';
}

function getCookiePair(result: unknown, name: string): string {
  const setCookie = getSetCookie(result);
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  if (!match) {
    throw new Error(`Missing cookie ${name}`);
  }
  return `${name}=${match[1]}`;
}

function getLocation(result: unknown): string | null {
  return getHeaders(result).get('Location');
}

function createRequest(cookie?: string) {
  return new Request('https://portal.pitell.no/booking/public/appointment/session/contact/verify-mobile', {
    headers: cookie ? { Cookie: cookie } : undefined,
  });
}

describe('booking contact verify-mobile route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ sessionId: 'session-1', companyId: 1, userId: 10 });
    mocks.readVerificationToken.mockResolvedValue('vt-1');
    mocks.buildVerificationCookieHeader.mockResolvedValue('verification_session_token=vt-2; Path=/; HttpOnly; SameSite=Lax');
    mocks.resendVerification.mockResolvedValue({
      nextToken: 'vt-1',
      nextTokenExpiresAt: null,
      successMessage: 'Ny kode sendt.',
      data: null,
    });
    mocks.resolveErrorPayload.mockReturnValue({ message: 'Kunne ikke hente brukerdata', status: 400 });
  });

  it('auto-sends one SMS from the loader on first page load', async () => {
    const result = await loader({ request: createRequest() } as never);
    const data = unwrapData<{ verificationSessionToken: string }>(result);

    expect(mocks.resendVerification).toHaveBeenCalledOnce();
    expect(mocks.resendVerification).toHaveBeenCalledWith({
      verificationSessionToken: 'vt-1',
      sendEmail: false,
      sendMobile: true,
    });
    expect(data.verificationSessionToken).toBe('vt-1');
    expect(getSetCookie(result)).toContain('booking_mobile_code_sent=');
  });

  it('does not auto-send again when the guard cookie matches the verification token', async () => {
    const firstResult = await loader({ request: createRequest() } as never);
    const guardCookie = getCookiePair(firstResult, 'booking_mobile_code_sent');
    mocks.resendVerification.mockClear();

    const result = await loader({ request: createRequest(guardCookie) } as never);
    const data = unwrapData<{ verificationSessionToken: string }>(result);

    expect(mocks.resendVerification).not.toHaveBeenCalled();
    expect(data.verificationSessionToken).toBe('vt-1');
    expect(getSetCookie(result)).toBe('');
  });

  it('auto-sends again when a new verification token is issued', async () => {
    const firstResult = await loader({ request: createRequest() } as never);
    const guardCookie = getCookiePair(firstResult, 'booking_mobile_code_sent');
    mocks.resendVerification.mockClear();
    mocks.readVerificationToken.mockResolvedValueOnce('vt-2');
    mocks.resendVerification.mockResolvedValueOnce({
      nextToken: 'vt-2',
      nextTokenExpiresAt: null,
      successMessage: 'Ny kode sendt.',
      data: null,
    });

    const result = await loader({ request: createRequest(guardCookie) } as never);
    const data = unwrapData<{ verificationSessionToken: string }>(result);

    expect(mocks.resendVerification).toHaveBeenCalledOnce();
    expect(mocks.resendVerification).toHaveBeenCalledWith({
      verificationSessionToken: 'vt-2',
      sendEmail: false,
      sendMobile: true,
    });
    expect(data.verificationSessionToken).toBe('vt-2');
    expect(getSetCookie(result)).toContain('booking_mobile_code_sent=');
  });

  it('uses a rotated backend verification token for the page and cookies', async () => {
    mocks.resendVerification.mockResolvedValueOnce({
      nextToken: 'vt-2',
      nextTokenExpiresAt: '2030-01-01T00:00:00.000Z',
      successMessage: 'Ny kode sendt.',
      data: null,
    });

    const result = await loader({ request: createRequest() } as never);
    const data = unwrapData<{ verificationSessionToken: string }>(result);
    const setCookie = getSetCookie(result);

    expect(data.verificationSessionToken).toBe('vt-2');
    expect(mocks.buildVerificationCookieHeader).toHaveBeenCalledWith('vt-2', '2030-01-01T00:00:00.000Z');
    expect(setCookie).toContain('verification_session_token=vt-2');
    expect(setCookie).toContain('booking_mobile_code_sent=');
  });

  it('does not fail the page if the backend rejects the automatic send', async () => {
    mocks.resendVerification.mockRejectedValueOnce(new Error('SMS cooldown'));

    const result = await loader({ request: createRequest() } as never);
    const data = unwrapData<{ verificationSessionToken: string }>(result);

    expect(data.verificationSessionToken).toBe('vt-1');
    expect(getSetCookie(result)).toContain('booking_mobile_code_sent=');
  });

  it('redirects without sending SMS when the appointment session is missing', async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session');
    expect(mocks.resendVerification).not.toHaveBeenCalled();
  });

  it('redirects without sending SMS when the appointment session has no user', async () => {
    mocks.getSession.mockResolvedValueOnce({ sessionId: 'session-1', companyId: 1 });

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session');
    expect(mocks.resendVerification).not.toHaveBeenCalled();
  });

  it('redirects without sending SMS when the verification token cookie is missing', async () => {
    mocks.readVerificationToken.mockResolvedValueOnce(null);

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session/contact');
    expect(mocks.resendVerification).not.toHaveBeenCalled();
  });

  it('keeps SMS resend as an explicit user action without client auto-resend', () => {
    expect(routeSource).not.toContain('resendFetcher.submit');
    expect(routeSource).not.toContain('sessionStorage');
    expect(routeSource).not.toContain('AUTO_RESEND');
    expect(routeSource).toContain('<resendFetcher.Form');
    expect(routeSource).toContain("action={API_ROUTES_MAP['auth.resend-verification.mobile'].url}");
    expect(routeSource).toContain('Send SMS på nytt');
  });
});
