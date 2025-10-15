import type { ComponentType } from 'react';
import type { CompanyRole } from '../../api/clients/types';

export type Audience = 'public' | 'auth' | 'role';

export const NAV_PLACEMENT = {
  NavbarStart: 'navbar_start',
  NavbarMiddle: 'navbar_middle',
  NavbarEnd: 'navbar_end',
  Account: 'account',
  Sidebar: 'sidebar',
} as const;

export type NavPlacement = (typeof NAV_PLACEMENT)[keyof typeof NAV_PLACEMENT];
export const NAV_PLACEMENT_LIST: NavPlacement[] = Object.values(NAV_PLACEMENT);

export type NavConfig = {
  placement: NavPlacement;
  order?: number;
  icon?: ComponentType<{ className?: string }>;
};

export enum AudienceType {
  Public = 'public',
  NoAuth = 'no-auth',
  Auth = 'auth',
  Role = 'role',
}

export type RouteAccess =
  | { audience: AudienceType.NoAuth }
  | { audience: AudienceType.Public }
  | { audience: AudienceType.Auth }
  | { audience: AudienceType.Role; companyRoles: readonly CompanyRole[] };

export type RouteDefinition = {
  label: string;
  access?: RouteAccess;
  nav?: NavConfig;
  children?: Record<string, RouteDefinition>;
};

export type RoutesShape = Record<string, RouteDefinition>;

export interface RouteBranch {
  $id: string;
  label: string;
  route: string;
  $access?: RouteAccess;
  $nav?: NavConfig | null;
  $children: Record<string, RouteBranch>;
  [child: string]: unknown;
}

export interface RouteTree {
  route: string;
  $children: Record<string, RouteBranch>;
  [child: string]: unknown;
}

export type AuthSnapshot = {
  isAuthenticated: boolean;
  companyRoles: Set<CompanyRole>;
};

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  children?: NavItem[];
};

export type NavModel = Record<NavPlacement, NavItem[]>;

export function toHref(route: string, base = '/'): string {
  if (!route) return base;
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return normalized;
}
