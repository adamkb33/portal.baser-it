import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  readVerificationToken: vi.fn(),
  verificationStatus: vi.fn(),
  resolveErrorPayload: vi.fn(),
}));

vi.mock('~/api/generated/base', () => ({
  AuthController: {
    verificationStatus: mocks.verificationStatus,
  },
}));

vi.mock('~/routes/booking/public/_services/booking.appointment-session.service.server', () => ({
  AppointmentSessionService: {
    get: mocks.getSession,
  },
}));

vi.mock('~/routes/booking/public/appointment/session/contact/_services/verification-token.service.server', () => ({
  VerificationTokenService: {
    readVerificationToken: mocks.readVerificationToken,
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

  const init =
    result && typeof result === 'object' && 'init' in result
      ? (result as { init?: { headers?: HeadersInit } }).init
      : null;
  return new Headers(init?.headers);
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
    mocks.verificationStatus.mockResolvedValue({
      data: {
        data: {
          emailVerified: false,
          mobileRequired: true,
          mobileVerified: false,
          nextStep: 'VERIFY_MOBILE',
        },
      },
    });
    mocks.resolveErrorPayload.mockReturnValue({ message: 'Kunne ikke hente brukerdata', status: 400 });
  });

  it('checks verification status and stays on SMS input without sending SMS on page load', async () => {
    const result = await loader({
      request: createRequest('verification_session_token=vt-1'),
    } as never);
    const data = unwrapData<{ verificationSessionToken: string; mobileDelivery: string | null }>(result);

    expect(mocks.verificationStatus).toHaveBeenCalledOnce();
    expect(mocks.verificationStatus).toHaveBeenCalledWith({
      query: { verificationSessionToken: 'vt-1' },
    });
    expect(data.verificationSessionToken).toBe('vt-1');
    expect(data.mobileDelivery).toBe(null);
  });

  it('redirects without sending SMS when the appointment session is missing', async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session');
    expect(mocks.verificationStatus).not.toHaveBeenCalled();
  });

  it('redirects without sending SMS when the appointment session has no user', async () => {
    mocks.getSession.mockResolvedValueOnce({ sessionId: 'session-1', companyId: 1 });

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session');
    expect(mocks.verificationStatus).not.toHaveBeenCalled();
  });

  it('redirects without sending SMS when the verification token cookie is missing', async () => {
    mocks.readVerificationToken.mockResolvedValueOnce(null);

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe('/booking/public/appointment/session/contact');
    expect(mocks.verificationStatus).not.toHaveBeenCalled();
  });

  it.each([
    { nextStep: 'VERIFY_EMAIL', expectedLocation: '/booking/public/appointment/session/contact/verify-email' },
    { nextStep: 'DONE', expectedLocation: '/booking/public/appointment/session/employee' },
    { nextStep: 'COLLECT_MOBILE', expectedLocation: '/booking/public/appointment/session/contact/collect-mobile' },
    { nextStep: 'COLLECT_EMAIL', expectedLocation: '/booking/public/appointment/session/contact/collect-email' },
  ])('routes by verification status $nextStep without sending SMS', async ({ nextStep, expectedLocation }) => {
    mocks.verificationStatus.mockResolvedValueOnce({
      data: {
        data: {
          emailVerified: false,
          mobileRequired: true,
          mobileVerified: false,
          nextStep,
        },
      },
    });

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe(expectedLocation);
    expect(mocks.verificationStatus).toHaveBeenCalledOnce();
  });

  it.each([
    { query: 'mobileDelivery=SENT', expected: 'SENT' },
    { query: 'mobileDelivery=SKIPPED_ALREADY_ACTIVE', expected: 'SKIPPED_ALREADY_ACTIVE' },
    { query: 'mobileDelivery=FAILED', expected: 'FAILED' },
    { query: 'mobileDelivery=NOT_ATTEMPTED', expected: 'NOT_ATTEMPTED' },
    { query: 'mobileDelivery=UNKNOWN', expected: null },
  ])('uses signup mobileDelivery query for display only: $query', async ({ query, expected }) => {
    const result = await loader({
      request: new Request(
        `https://portal.pitell.no/booking/public/appointment/session/contact/verify-mobile?${query}`,
      ),
    } as never);
    const data = unwrapData<{ mobileDelivery: string | null }>(result);

    expect(data.mobileDelivery).toBe(expected);
    expect(mocks.verificationStatus).toHaveBeenCalledOnce();
  });

  it('keeps SMS resend as an explicit user action without client auto-resend', () => {
    expect(routeSource).not.toContain('resendFetcher.submit');
    expect(routeSource).not.toContain('sessionStorage');
    expect(routeSource).not.toContain('AUTO_RESEND');
    expect(routeSource).not.toContain('ensureSentOnce');
    expect(routeSource).not.toContain('ContactAuthService.resendVerification');
    expect(routeSource).toContain('<resendFetcher.Form');
    expect(routeSource).toContain("action={API_ROUTES_MAP['auth.resend-verification.mobile'].url}");
    expect(routeSource).toContain('Send SMS på nytt');
  });
});
