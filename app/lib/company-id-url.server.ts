import { encodeCompanyIdToken, decodeCompanyIdToken } from '~/lib/company-id-token.server';
import { redirect } from 'react-router';

export function getCompanyIdFromRequest(request: Request): number | null {
  const url = new URL(request.url);
  const companyIdParam = url.searchParams.get('companyId');
  if (!companyIdParam) return null;

  const decodedCompanyId = decodeCompanyIdToken(companyIdParam);
  if (decodedCompanyId !== null) return decodedCompanyId;

  const numericCompanyId = Number(companyIdParam);
  return Number.isNaN(numericCompanyId) ? null : numericCompanyId;
}

export function decodeFromRequest(request: Request): number | null {
  return getCompanyIdFromRequest(request);
}

export function ensureEncodedCompanyIdRedirect(
  request: Request,
  ensuredCompanyId: number | null | undefined,
): Response | null {
  if (ensuredCompanyId === null || ensuredCompanyId === undefined) return null;

  const url = new URL(request.url);
  const companyIdParam = url.searchParams.get('companyId');
  const encodedCompanyId = encodeCompanyIdToken(ensuredCompanyId);

  if (companyIdParam === encodedCompanyId) return null;

  url.searchParams.set('companyId', encodedCompanyId);
  return redirect(url.toString());
}
