import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getSessionResultMock = vi.fn();
const deleteSessionMock = vi.fn();
const getUserStatusMock = vi.fn();

vi.mock('~/routes/booking/public/_services/booking.appointment-session.service.server', () => ({
  AppointmentSessionService: {
    getResult: getSessionResultMock,
    delete: deleteSessionMock,
  },
}));

vi.mock('~/routes/booking/public/appointment/session/contact/_services/contact-auth.service.server', () => ({
  ContactAuthService: {
    getUserStatus: getUserStatusMock,
  },
}));

describe('requireAuthenticatedBookingFlow', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getSessionResultMock.mockReset();
    deleteSessionMock.mockReset();
    getUserStatusMock.mockReset();
    getSessionResultMock.mockImplementation(async () => {
      const session = await getSessionMock();
      return session ? { status: 'found', session } : { status: 'missing-cookie' };
    });
    deleteSessionMock.mockResolvedValue('appointment_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
  });

  it('redirects to contact when session user exists but auth status is missing', async () => {
    getSessionMock.mockResolvedValue({ sessionId: 's1', userId: 10 });
    getUserStatusMock.mockResolvedValue(null);

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/booking/public/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/booking/public/appointment/session/contact');
  });

  it('redirects to required auth next step when nextStep is not DONE', async () => {
    getSessionMock.mockResolvedValue({ sessionId: 's1', userId: 10 });
    getUserStatusMock.mockResolvedValue({
      nextStep: 'VERIFY_MOBILE',
      user: {
        mobileNumber: '+4740104131',
        mobileVerified: false,
      },
    });

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/booking/public/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe(
      '/booking/public/appointment/session/contact/verify-mobile',
    );
  });

  it('persists the verification token cookie when redirecting to the next auth step', async () => {
    getSessionMock.mockResolvedValue({ sessionId: 's1', userId: 10 });
    getUserStatusMock.mockResolvedValue({
      nextStep: 'VERIFY_MOBILE',
      user: {
        mobileNumber: '+4740104131',
        mobileVerified: false,
      },
      verificationToken: { value: 'vt-1', expiresAt: '2030-01-01T00:00:00.000Z' },
    });

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/booking/public/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe(
      '/booking/public/appointment/session/contact/verify-mobile',
    );
    expect((result as Response).headers.get('Set-Cookie')).toContain('verification_session_token=');
  });

  it('returns session when auth flow is done', async () => {
    const session = { sessionId: 's1', userId: 10 };
    getSessionMock.mockResolvedValue(session);
    getUserStatusMock.mockResolvedValue({ nextStep: 'DONE' });

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/booking/public/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toEqual({ session });
  });

  it('clears stale appointment session cookie and redirects to booking start', async () => {
    getSessionResultMock.mockResolvedValue({ status: 'stale-cookie' });

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/booking/public/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/booking/public/appointment');
    expect((result as Response).headers.get('Set-Cookie')).toContain('appointment_session=');
  });
});
