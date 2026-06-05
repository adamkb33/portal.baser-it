import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionMock = vi.fn();
const getAuthMock = vi.fn();
const readVerificationTokenMock = vi.fn();
const getSessionUserStatusMock = vi.fn();

vi.mock('~/routes/_features/booking/_services/booking.appointment-session.service.server', () => ({
  AppointmentSessionService: {
    get: getSessionMock,
  },
}));

vi.mock('~/lib/auth-service', () => ({
  authService: {
    getAuth: getAuthMock,
  },
}));

vi.mock('~/routes/_features/booking/session/contact/_services/verification-token.service.server', () => ({
  VerificationTokenService: {
    readVerificationToken: readVerificationTokenMock,
  },
}));

describe('ContactSessionService.getContactContext', () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    getAuthMock.mockReset();
    readVerificationTokenMock.mockReset();
    getSessionUserStatusMock.mockReset();
  });
});
