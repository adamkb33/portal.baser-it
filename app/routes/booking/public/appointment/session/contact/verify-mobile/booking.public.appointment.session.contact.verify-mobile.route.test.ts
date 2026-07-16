import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireBookingSession: vi.fn(),
  getAppointmentSessionRequirements: vi.fn(),
  verifyAppointmentSessionUserMobile: vi.fn(),
  resendAppointmentSessionMobileChallenge: vi.fn(),
  clearAppointmentSessionUser: vi.fn(),
  setAuthCookies: vi.fn(),
  resolveErrorPayload: vi.fn(),
  redirectWithError: vi.fn(),
}));

vi.mock('~/routes/booking/public/_utils/booking.require-authenticated-flow.server', () => ({
  requireBookingSession: mocks.requireBookingSession,
}));

vi.mock('~/api/generated/booking', () => ({
  PublicAppointmentSessionController: {
    getAppointmentSessionRequirements: mocks.getAppointmentSessionRequirements,
    verifyAppointmentSessionUserMobile: mocks.verifyAppointmentSessionUserMobile,
    resendAppointmentSessionMobileChallenge: mocks.resendAppointmentSessionMobileChallenge,
    clearAppointmentSessionUser: mocks.clearAppointmentSessionUser,
  },
}));

vi.mock('~/lib/auth-service', () => ({
  authService: {
    setAuthCookies: mocks.setAuthCookies,
  },
}));

vi.mock('~/lib/api-error', () => ({
  resolveErrorPayload: mocks.resolveErrorPayload,
}));

vi.mock('~/lib/flash-message.server', () => ({
  redirectWithError: mocks.redirectWithError,
}));

import { action, loader } from './booking.public.appointment.session.contact.verify-mobile.route';

function unwrapData<T = unknown>(result: unknown): T {
  if (result && typeof result === 'object' && 'data' in (result as Record<string, unknown>)) {
    return (result as { data: T }).data;
  }
  return result as T;
}

function getLocation(result: unknown): string | null {
  return result instanceof Response ? result.headers.get('Location') : null;
}

function createRequest(body?: FormData) {
  return new Request('https://portal.pitell.no/booking/public/appointment/session/contact/verify-mobile', {
    method: body ? 'POST' : 'GET',
    body,
  });
}

describe('booking contact verify-mobile route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireBookingSession.mockResolvedValue({
      session: {
        sessionId: 'session-1',
        companyId: 1,
      },
    });
    mocks.getAppointmentSessionRequirements.mockResolvedValue({
      data: {
        data: {
          sessionId: 'session-1',
          nextStep: 'VERIFY_MOBILE',
          needsUser: false,
          needsMobile: true,
          challengeId: 'challenge-1',
          maskedMobile: '******81',
          canAttachAuthenticatedUser: false,
        },
      },
    });
    mocks.setAuthCookies.mockResolvedValue(new Headers({ 'Set-Cookie': 'access=1' }));
    mocks.resolveErrorPayload.mockReturnValue({ message: 'fallback', status: 400 });
    mocks.redirectWithError.mockImplementation((_request: Request, href: string) => Response.redirect(href, 302));
  });

  it('loads the active SMS challenge from booking session requirements', async () => {
    const result = await loader({ request: createRequest() } as never);
    const payload = unwrapData<{ requirements: { challengeId: string; maskedMobile: string } }>(result);

    expect(mocks.getAppointmentSessionRequirements).toHaveBeenCalledWith({
      path: { sessionId: 'session-1' },
    });
    expect(mocks.resendAppointmentSessionMobileChallenge).not.toHaveBeenCalled();
    expect(payload.requirements.challengeId).toBe('challenge-1');
    expect(payload.requirements.maskedMobile).toBe('******81');
  });

  it.each([
    { nextStep: 'CONTACT_FORM', expectedLocation: '/booking/public/appointment/session/contact' },
    { nextStep: 'DONE', expectedLocation: '/booking/public/appointment/session/overview' },
  ])('redirects by backend nextStep $nextStep', async ({ nextStep, expectedLocation }) => {
    mocks.getAppointmentSessionRequirements.mockResolvedValueOnce({
      data: {
        data: {
          nextStep,
          needsUser: nextStep === 'CONTACT_FORM',
          needsMobile: false,
          canAttachAuthenticatedUser: false,
        },
      },
    });

    const result = await loader({ request: createRequest() } as never);

    expect(result).toBeInstanceOf(Response);
    expect(getLocation(result)).toBe(expectedLocation);
  });

  it('resends SMS only from an explicit resend action', async () => {
    const formData = new FormData();
    formData.set('intent', 'resend');

    const result = await action({ request: createRequest(formData) } as never);
    const payload = unwrapData<{ ok: boolean; message: string }>(result);

    expect(mocks.resendAppointmentSessionMobileChallenge).toHaveBeenCalledWith({
      path: { sessionId: 'session-1' },
    });
    expect(payload).toEqual({ ok: true, message: 'Ny SMS-kode er sendt.' });
  });

  it('clears the pending user when changing mobile number', async () => {
    const formData = new FormData();
    formData.set('intent', 'change-mobile');

    const result = await action({ request: createRequest(formData) } as never);

    expect(mocks.clearAppointmentSessionUser).toHaveBeenCalledWith({
      path: { sessionId: 'session-1' },
    });
    expect(getLocation(result)).toBe('/booking/public/appointment/session/contact');
  });

  it('verifies the SMS code, sets auth cookies, and continues to overview', async () => {
    const formData = new FormData();
    formData.set('intent', 'verify');
    formData.set('challengeId', 'challenge-1');
    formData.set('code', '123456');
    mocks.verifyAppointmentSessionUserMobile.mockResolvedValueOnce({
      data: {
        data: {
          sessionId: 'session-1',
          userId: 10,
          accountStatus: 'GUEST',
          authTokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            accessTokenExpiresAt: 1,
            refreshTokenExpiresAt: 2,
          },
          isReturning: false,
          nextStep: 'DONE',
        },
      },
    });

    const result = await action({ request: createRequest(formData) } as never);

    expect(mocks.verifyAppointmentSessionUserMobile).toHaveBeenCalledWith({
      path: { sessionId: 'session-1' },
      body: {
        challengeId: 'challenge-1',
        code: '123456',
      },
    });
    expect(mocks.setAuthCookies).toHaveBeenCalledWith('access-token', 'refresh-token', 1, 2);
    expect(getLocation(result)).toBe('/booking/public/appointment/session/overview');
  });
});
