import { Access, BrachCategory, type RouteBranch } from '../route-types';

export const OFFER_ROUTES: RouteBranch[] = [
  {
    id: 'offer.public',
    href: '/offer/public/:token',
    category: BrachCategory.PUBLIC,
    accessType: Access.PUBLIC,
    hidden: true,
    excludeLayout: true,
  },
];
