import { beforeEach, describe, expect, it, vi } from 'vitest';

const baseSetConfig = vi.fn();
const bookingSetConfig = vi.fn();
const timesheetSetConfig = vi.fn();
const notificationSetConfig = vi.fn();
const parseAccessToken = vi.fn();

vi.mock('~/api/generated/base/client.gen', () => ({
  client: {
    setConfig: baseSetConfig,
  },
}));

vi.mock('~/api/generated/booking/client.gen', () => ({
  client: {
    setConfig: bookingSetConfig,
  },
}));

vi.mock('~/api/generated/timesheet/client.gen', () => ({
  client: {
    setConfig: timesheetSetConfig,
  },
}));

vi.mock('~/api/generated/notification/client.gen', () => ({
  client: {
    setConfig: notificationSetConfig,
  },
}));

vi.mock('~/routes/auth/_features/auth.cookies.server', () => ({
  accessTokenCookie: {
    parse: parseAccessToken,
  },
}));

vi.mock('~/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('withAuth', () => {
  beforeEach(() => {
    baseSetConfig.mockClear();
    bookingSetConfig.mockClear();
    timesheetSetConfig.mockClear();
    notificationSetConfig.mockClear();
    parseAccessToken.mockReset();
  });

  it('sets auth header for callback and clears after completion', async () => {
    parseAccessToken.mockResolvedValue('token-123');
    const { withAuth } = await import('~/api/utils/with-auth');
    const request = new Request('http://localhost/test', {
      headers: {
        Cookie: 'access_token=token-123',
      },
    });

    const result = await withAuth(request, async () => 'ok');

    expect(result).toBe('ok');
    expect(baseSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: 'Bearer token-123' } });
    expect(bookingSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: 'Bearer token-123' } });
    expect(timesheetSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: 'Bearer token-123' } });
    expect(notificationSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: 'Bearer token-123' } });
    // Reset must send an explicit `null`, not `{}` — the generated client's
    // mergeHeaders only clears a header when its value is null; an absent key
    // is left untouched, which silently kept the previous request's token.
    expect(baseSetConfig).toHaveBeenLastCalledWith({ headers: { Authorization: null } });
    expect(bookingSetConfig).toHaveBeenLastCalledWith({ headers: { Authorization: null } });
    expect(timesheetSetConfig).toHaveBeenLastCalledWith({ headers: { Authorization: null } });
    expect(notificationSetConfig).toHaveBeenLastCalledWith({ headers: { Authorization: null } });
  });

  it('clears headers when no token exists', async () => {
    parseAccessToken.mockResolvedValue(null);
    const { withAuth } = await import('~/api/utils/with-auth');
    const request = new Request('http://localhost/test');

    await withAuth(request, async () => 'ok');

    expect(baseSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: null } });
    expect(bookingSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: null } });
    expect(timesheetSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: null } });
    expect(notificationSetConfig).toHaveBeenNthCalledWith(1, { headers: { Authorization: null } });
    expect(baseSetConfig).toHaveBeenLastCalledWith({ headers: { Authorization: null } });
  });
});
