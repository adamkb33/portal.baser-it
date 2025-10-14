export * from './audiences';
export * from './registry';
export type { RegistryMeta, RegistryMetaTable } from './registry';

import type { AuthenticatedUserPayload } from '~/api/clients/types';
import { buildNavigationFromRoutes } from './build';
import type { RouteTree, NavModel } from './functions';
import { defaultMeta } from './registry';

export function getNavigation(ROUTES: RouteTree, payload?: AuthenticatedUserPayload | null): NavModel {
  return buildNavigationFromRoutes(ROUTES, payload, defaultMeta, '/');
}
