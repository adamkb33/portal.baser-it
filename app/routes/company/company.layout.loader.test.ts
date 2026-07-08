import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthPayloadFromRequest: vi.fn(),
  redirectWithInfo: vi.fn(),
  redirectWithError: vi.fn(),
}));

vi.mock('~/lib/auth.utils', () => ({
  getAuthPayloadFromRequest: mocks.getAuthPayloadFromRequest,
}));

vi.mock('~/routes/company/_lib/flash-message.server', () => ({
  redirectWithInfo: mocks.redirectWithInfo,
  redirectWithError: mocks.redirectWithError,
}));

import { ROUTES_MAP } from '~/lib/routing/route-tree';
import { loader } from './company.layout';

describe('company.layout loader guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirectWithInfo.mockImplementation(async (_request: Request, href: string) =>
      Response.redirect(`http://localhost${href}`, 302),
    );
    mocks.redirectWithError.mockImplementation(async (_request: Request, href: string) =>
      Response.redirect(`http://localhost${href}`, 302),
    );
  });

  it('redirects to root when auth payload is missing', async () => {
    mocks.getAuthPayloadFromRequest.mockResolvedValueOnce(null);

    const result = await loader({
      request: new Request('http://localhost/company'),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect((result as Response).headers.get('Location')).toBe('/');
  });

  it('redirects to company context when companyId is missing', async () => {
    mocks.getAuthPayloadFromRequest.mockResolvedValueOnce({ id: 1, companyId: undefined });

    const result = await loader({
      request: new Request('http://localhost/company'),
    } as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect((result as Response).headers.get('Location')).toBe(ROUTES_MAP['user.company-context'].href);
  });

  it('redirects with info when backend reports COMPANY_CONTEXT_REQUIRED', async () => {
    const request = new Request('http://localhost/company');
    mocks.getAuthPayloadFromRequest.mockRejectedValueOnce({
      response: {
        data: {
          message: {
            id: 'COMPANY_CONTEXT_REQUIRED',
          },
        },
      },
    });

    await loader({ request } as never);

    expect(mocks.redirectWithInfo).toHaveBeenCalledOnce();
    expect(mocks.redirectWithInfo).toHaveBeenCalledWith(
      request,
      ROUTES_MAP['user.company-context'].href,
      expect.objectContaining({ id: 'COMPANY_CONTEXT_REQUIRED' }),
    );
  });

  it('redirects with error when an unexpected loader error occurs', async () => {
    const request = new Request('http://localhost/company');
    mocks.getAuthPayloadFromRequest.mockRejectedValueOnce(new Error('boom'));

    await loader({ request } as never);

    expect(mocks.redirectWithError).toHaveBeenCalledOnce();
    expect(mocks.redirectWithError).toHaveBeenCalledWith(request, '/', 'Kunne ikke laste selskapssiden. Prøv igjen.');
  });
});
