import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  signInWithProvider: vi.fn(),
  signInLocal: vi.fn(),
  attachUserToSession: vi.fn(),
  resolvePostAuthRedirect: vi.fn(),
  getUserStatus: vi.fn(),
  signUp: vi.fn(),
  setPendingSessionUser: vi.fn(),
  completeProfile: vi.fn(),
  getSession: vi.fn(),
  accessSerialize: vi.fn(),
  refreshSerialize: vi.fn(),
  resolveErrorPayload: vi.fn(),
  redirectWithError: vi.fn(),
  redirectWithInfo: vi.fn(),
}));

vi.mock('~/routes/_features/booking/session/contact/_services/contact-auth.service.server', () => ({
  ContactAuthService: {
    signInWithProvider: mocks.signInWithProvider,
    signInLocal: mocks.signInLocal,
    attachUserToSession: mocks.attachUserToSession,
    resolvePostAuthRedirect: mocks.resolvePostAuthRedirect,
    getUserStatus: mocks.getUserStatus,
    signUp: mocks.signUp,
    setPendingSessionUser: mocks.setPendingSessionUser,
    completeProfile: mocks.completeProfile,
  },
}));

vi.mock('~/routes/_features/booking/_services/booking.appointment-session.service.server', () => ({
  AppointmentSessionService: {
    get: mocks.getSession,
  },
}));

vi.mock('~/routes/auth/_features/auth.cookies.server', () => ({
  accessTokenCookie: { serialize: mocks.accessSerialize },
  refreshTokenCookie: { serialize: mocks.refreshSerialize },
}));

vi.mock('~/lib/api-error', () => ({
  resolveErrorPayload: mocks.resolveErrorPayload,
}));

vi.mock('~/lib/flash-message.server', () => ({
  redirectWithError: mocks.redirectWithError,
  redirectWithInfo: mocks.redirectWithInfo,
}));

import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { action as bookingSignInAction } from './sign-in/booking.public.appointment.session.contact.sign-in.route';
import { action as bookingSignUpAction } from './sign-up/booking.public.appointment.session.contact.sign-up.route';
import { action as bookingCollectEmailAction } from './collect-email/booking.public.appointment.session.contact.collect-email.route';
import { action as bookingCollectMobileAction } from './collect-mobile/booking.public.appointment.session.contact.collect-mobile.route';

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

describe('booking contact auth routes matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveErrorPayload.mockReturnValue({ message: 'fallback', status: 400 });
    mocks.redirectWithError.mockImplementation((_req: Request, href: string) => Response.redirect(href, 302));
    mocks.redirectWithInfo.mockImplementation((_req: Request, href: string) => Response.redirect(href, 302));
    mocks.resolvePostAuthRedirect.mockResolvedValue({
      nextStepHref: ROUTES_MAP['booking.public.appointment.session.employee'].href,
      verificationCookieHeader: null,
    });
    mocks.getUserStatus.mockResolvedValue({
      nextStep: 'DONE',
    });
    mocks.getSession.mockResolvedValue({
      sessionId: 's1',
      userId: 10,
    });
    mocks.accessSerialize.mockResolvedValue('access=1');
    mocks.refreshSerialize.mockResolvedValue('refresh=1');
  });

  describe('sign-in action', () => {
    it('redirects with flash error when Google idToken is missing', async () => {
      mocks.redirectWithError.mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: '/booking/public/appointment/session/contact/sign-in?provider=GOOGLE' },
        }),
      );
      const formData = new FormData();
      formData.set('provider', 'GOOGLE');

      const result = await bookingSignInAction({
        request: new Request('http://localhost/booking/sign-in', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.redirectWithError).toHaveBeenCalledWith(
        expect.any(Request),
        '/booking/sign-in?provider=GOOGLE',
        'Kunne ikke logge inn med Google. Prøv igjen.',
      );
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe('/booking/public/appointment/session/contact/sign-in?provider=GOOGLE');
    });

    it.each([
      {
        name: 'local sign-in',
        form: { provider: 'LOCAL', email: 'user@example.com', password: 'secret' },
        response: {
          userId: 1,
          nextStep: 'DONE',
          authTokens: {
            accessToken: 'a',
            refreshToken: 'r',
            accessTokenExpiresAt: 1,
            refreshTokenExpiresAt: 2,
          },
        },
      },
      {
        name: 'google sign-in',
        form: { provider: 'GOOGLE', idToken: 'id-token' },
        response: {
          userId: 2,
          nextStep: 'VERIFY_EMAIL',
        },
      },
    ])('$name follows post-auth redirect', async ({ form, response }) => {
      if (form.provider === 'GOOGLE') {
        mocks.signInWithProvider.mockResolvedValueOnce(response);
      } else {
        mocks.signInLocal.mockResolvedValueOnce(response);
      }

      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.set(k, v));

      const result = await bookingSignInAction({
        request: new Request('http://localhost/booking/sign-in', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.attachUserToSession).toHaveBeenCalledOnce();
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe(ROUTES_MAP['booking.public.appointment.session.employee'].href);
    });

    it('redirects with backend error message when sign-in fails', async () => {
      mocks.signInLocal.mockRejectedValueOnce(new Error('bad credentials'));
      mocks.resolveErrorPayload.mockReturnValueOnce({ message: 'Invalid credentials', status: 401 });
      mocks.redirectWithError.mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: '/booking/public/appointment/session/contact/sign-in?email=user%40example.com' },
        }),
      );

      const formData = new FormData();
      formData.set('provider', 'LOCAL');
      formData.set('email', 'user@example.com');
      formData.set('password', 'wrong-password');

      const result = await bookingSignInAction({
        request: new Request('http://localhost/booking/sign-in', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.redirectWithError).toHaveBeenCalledWith(
        expect.any(Request),
        '/booking/sign-in?email=user%40example.com',
        'Invalid credentials',
      );
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe('/booking/public/appointment/session/contact/sign-in?email=user%40example.com');
    });
  });

  describe('sign-up action', () => {
    it('redirects with flash error when signup response is null', async () => {
      mocks.signUp.mockResolvedValueOnce(null);
      mocks.redirectWithError.mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: {
            Location:
              '/booking/public/appointment/session/contact/sign-up?givenName=Ada&familyName=Lovelace&email=ada%40example.com&mobileNumber=%2B4712345678',
          },
        }),
      );

      const formData = new FormData();
      formData.set('givenName', 'Ada');
      formData.set('familyName', 'Lovelace');
      formData.set('email', 'ada@example.com');
      formData.set('password', 'secret');
      formData.set('password2', 'secret');
      formData.set('mobileNumber', '+4712345678');

      const result = await bookingSignUpAction({
        request: new Request('http://localhost/booking/sign-up', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.redirectWithError).toHaveBeenCalledWith(
        expect.any(Request),
        '/booking/sign-up?givenName=Ada&familyName=Lovelace&email=ada%40example.com&mobileNumber=%2B4712345678',
        'Kunne ikke opprette konto. Prøv igjen.',
      );
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe(
        '/booking/public/appointment/session/contact/sign-up?givenName=Ada&familyName=Lovelace&email=ada%40example.com&mobileNumber=%2B4712345678',
      );
    });

    it('sets pending user and redirects to next step when signup succeeds', async () => {
      mocks.signUp.mockResolvedValueOnce({
        userId: 10,
        nextStep: 'VERIFY_MOBILE',
        authTokens: {
          accessToken: 'a',
          refreshToken: 'r',
          accessTokenExpiresAt: 1,
          refreshTokenExpiresAt: 2,
        },
      });
      mocks.setPendingSessionUser.mockResolvedValueOnce({ ok: true });
      mocks.resolvePostAuthRedirect.mockResolvedValueOnce({
        nextStepHref: ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href,
        verificationCookieHeader: 'verification=1',
      });

      const formData = new FormData();
      formData.set('givenName', 'Ada');
      formData.set('familyName', 'Lovelace');
      formData.set('email', 'ada@example.com');
      formData.set('password', 'secret');
      formData.set('password2', 'secret');
      formData.set('mobileNumber', '+4712345678');
      formData.set('redirectUrl', 'booking');

      const result = await bookingSignUpAction({
        request: new Request('http://localhost/booking/sign-up', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.setPendingSessionUser).toHaveBeenCalledWith('s1', 10);
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe(ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href);
    });
  });

  describe('collect profile routes', () => {
    it.each([
      {
        name: 'collect email',
        actionFn: bookingCollectEmailAction,
        field: 'email',
        value: 'user@example.com',
      },
      {
        name: 'collect mobile',
        actionFn: bookingCollectMobileAction,
        field: 'mobileNumber',
        value: '+4712345678',
      },
    ])('$name resolves next step redirect', async ({ actionFn, field, value }) => {
      mocks.completeProfile.mockResolvedValueOnce({
        userId: 10,
        nextStep: 'DONE',
      });
      mocks.resolvePostAuthRedirect.mockResolvedValueOnce({
        nextStepHref: ROUTES_MAP['booking.public.appointment.session.employee'].href,
        verificationCookieHeader: null,
      });
      mocks.getUserStatus.mockResolvedValueOnce({
        nextStep: 'DONE',
      });

      const formData = new FormData();
      formData.set(field, value);

      const result = await actionFn({
        request: new Request('http://localhost/booking/collect', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.completeProfile).toHaveBeenCalledOnce();
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe(ROUTES_MAP['booking.public.appointment.session.employee'].href);
    });

    it('collect mobile uses complete-profile response directly when user-status is unauthenticated', async () => {
      mocks.completeProfile.mockResolvedValueOnce({
        userId: 10,
        mobileNumber: '+4712345678',
        nextStep: 'VERIFY_MOBILE',
        verificationToken: {
          value: 'verification-token',
          expiresAt: '2026-06-17T22:47:34',
        },
      });
      mocks.resolvePostAuthRedirect.mockResolvedValueOnce({
        nextStepHref: ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href,
        verificationCookieHeader: 'verification_session_token=verification-token; Path=/; HttpOnly',
      });
      mocks.getUserStatus.mockRejectedValueOnce(new Error('UNAUTHENTICATED'));

      const formData = new FormData();
      formData.set('mobileNumber', '+4712345678');

      const result = await bookingCollectMobileAction({
        request: new Request('http://localhost/booking/collect-mobile', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.completeProfile).toHaveBeenCalledOnce();
      expect(mocks.getUserStatus).not.toHaveBeenCalled();
      expect(getStatus(result)).toBe(302);
      expect(getLocation(result)).toBe(ROUTES_MAP['booking.public.appointment.session.contact.verify-mobile'].href);
      expect((result as Response).headers.get('Set-Cookie')).toContain('verification_session_token=');
    });

    it.each([
      {
        name: 'collect email error',
        actionFn: bookingCollectEmailAction,
        field: 'email',
        value: 'user@example.com',
        retryHref: '/booking/collect?email=user%40example.com',
      },
      {
        name: 'collect mobile error',
        actionFn: bookingCollectMobileAction,
        field: 'mobileNumber',
        value: '+4712345678',
        retryHref: '/booking/collect?mobileNumber=%2B4712345678',
      },
    ])('$name redirects with flash error and retry query', async ({ actionFn, field, value, retryHref }) => {
      mocks.completeProfile.mockRejectedValueOnce(new Error('bad request'));
      mocks.resolveErrorPayload.mockReturnValueOnce({ message: 'Invalid profile input', status: 400 });
      mocks.redirectWithError.mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: {
            Location: `/booking/public/appointment/session/contact/${field === 'email' ? 'collect-email' : 'collect-mobile'}?${field}=${encodeURIComponent(value)}`,
          },
        }),
      );

      const formData = new FormData();
      formData.set(field, value);

      const result = await actionFn({
        request: new Request('http://localhost/booking/collect', { method: 'POST', body: formData }),
      } as never);

      expect(mocks.redirectWithError).toHaveBeenCalledWith(expect.any(Request), retryHref, 'Invalid profile input');
      expect(getStatus(result)).toBe(302);
    });
  });
});
