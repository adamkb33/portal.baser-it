export * from './audiences';
export * from './functions';
export * from './navigation';

import type { AuthenticatedUserPayload } from '~/api/clients/types';
import type { RouteTree, NavModel } from './functions';
import { createNavigationModel } from './navigation';

export function getNavigation(routes: RouteTree, payload?: AuthenticatedUserPayload | null): NavModel {
  return createNavigationModel({ routes, payload, baseHref: '/' });
}
