import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getUserStatusMock = vi.fn();

vi.mock('~/lib/appointments.server', () => ({
  getSession: getSessionMock,
}));

vi.mock('~/routes/_features/booking/session/contact/_services/contact-auth.service.server', () => ({
  ContactAuthService: {
    getUserStatus: getUserStatusMock,
  },
}));

describe('requireAuthenticatedBookingFlow', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getUserStatusMock.mockReset();
  });

  it('redirects to contact when session user exists but auth status is missing', async () => {
    getSessionMock.mockResolvedValue({ sessionId: 's1', userId: 10 });
    getUserStatusMock.mockResolvedValue(null);

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/_features/booking/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/booking/public/appointment/session/contact');
  });

  it('redirects to required auth next step when nextStep is not DONE', async () => {
    getSessionMock.mockResolvedValue({ sessionId: 's1', userId: 10 });
    getUserStatusMock.mockResolvedValue({ nextStep: 'VERIFY_EMAIL' });

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/_features/booking/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/booking/public/appointment/session/contact/verify-email');
  });

  it('returns session when auth flow is done', async () => {
    const session = { sessionId: 's1', userId: 10 };
    getSessionMock.mockResolvedValue(session);
    getUserStatusMock.mockResolvedValue({ nextStep: 'DONE' });

    const { requireAuthenticatedBookingFlow } = await import(
      '~/routes/_features/booking/_utils/booking.require-authenticated-flow.server'
    );

    const result = await requireAuthenticatedBookingFlow(new Request('http://localhost/x'));

    expect(result).toEqual({ session });
  });
});
