import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getResult: vi.fn(),
  deleteSession: vi.fn(),
  createSession: vi.fn(),
  validateCompanyBooking: vi.fn(),
}));

vi.mock('~/routes/_features/booking/_services/booking.appointment-session.service.server', () => ({
  AppointmentSessionService: {
    getResult: mocks.getResult,
    delete: mocks.deleteSession,
    create: mocks.createSession,
  },
}));

vi.mock('~/api/generated/booking', () => ({
  AppointmentsController: {
    validateCompanyBooking: mocks.validateCompanyBooking,
  },
}));

import { createBookingSessionLoader } from './booking.session.loader';
import { serializeEmbedConfig } from '~/lib/embed-config.server';

describe('booking session loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteSession.mockResolvedValue('appointment_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
    mocks.createSession.mockResolvedValue({
      session: { sessionId: 'new-session', companyId: 1 },
      setCookieHeader: 'appointment_session=new-session; Path=/; HttpOnly; SameSite=Lax',
    });
  });

  it('clears a stale cookie and creates a fresh session when companyId is present', async () => {
    mocks.getResult.mockResolvedValue({ status: 'stale-cookie' });

    const loader = createBookingSessionLoader({ surface: 'public' });
    const result = await loader({
      request: new Request('https://portal.pitell.no/booking/public/appointment/session?companyId=1'),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/booking/public/appointment/session/contact');
    expect(mocks.deleteSession).toHaveBeenCalledOnce();
    expect(mocks.validateCompanyBooking).toHaveBeenCalledWith({ path: { companyId: 1 } });
    expect(mocks.createSession).toHaveBeenCalledWith(1, expect.any(Request));
    expect((result as Response).headers.get('Set-Cookie')).toContain('appointment_session=');
  });

  it('clears a stale cookie and redirects to booking start when companyId is missing', async () => {
    mocks.getResult.mockResolvedValue({ status: 'stale-cookie' });

    const loader = createBookingSessionLoader({ surface: 'public' });
    const result = await loader({
      request: new Request('https://portal.pitell.no/booking/public/appointment/session'),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/booking/public/appointment');
    expect(mocks.deleteSession).toHaveBeenCalledOnce();
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect((result as Response).headers.get('Set-Cookie')).toContain('appointment_session=');
  });

  it('uses embed_config companyId to recreate a stale embedded session when query params are gone', async () => {
    mocks.getResult.mockResolvedValue({ status: 'stale-cookie' });
    const embedConfigCookie = await serializeEmbedConfig({
      companyId: 1,
      theme: 'fredrikstad-barbershop',
      parentOrigin: 'https://www.fredrikstadbarbershop.no',
    });

    const loader = createBookingSessionLoader({ surface: 'embed' });
    const result = await loader({
      request: new Request('https://portal.pitell.no/embed/booking/appointment/session', {
        headers: {
          Cookie: embedConfigCookie,
        },
      }),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get('Location')).toBe('/embed/booking/appointment/session/contact');
    expect(mocks.validateCompanyBooking).toHaveBeenCalledWith({ path: { companyId: 1 } });
    expect(mocks.createSession).toHaveBeenCalledWith(1, expect.any(Request));
    expect((result as Response).headers.get('Set-Cookie')).toContain('appointment_session=');
  });
});
