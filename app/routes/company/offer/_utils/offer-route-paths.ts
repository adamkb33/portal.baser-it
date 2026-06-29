import { ROUTES_MAP } from '~/lib/routing/route-tree';

export function getCompanyOfferDetailHref(offerId: number | string): string {
  return ROUTES_MAP['company.offer.detail'].href.replace(':offerId', String(offerId));
}
