export type Area = 'start' | 'middle' | 'end' | 'account' | 'sidebar';
export type Audience = 'public' | 'auth' | 'employee' | 'admin';

export type RegistryChild = {
  id: string;
  label: string;
  href?: string;
  order?: number;
};

export type RegistryNode = {
  id: string;
  label: string;
  href?: string;
  area: Area;
  audience: Audience;
  order?: number;
  iconKey?: string;
  children?: RegistryChild[];
};

export type AuthSnapshot = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
};

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  iconKey?: string;
  children?: NavItem[];
};

export type NavModel = {
  start: NavItem[];
  middle: NavItem[];
  end: NavItem[];
  account: NavItem[];
  sidebar: NavItem[];
};

export type RouteNode = {
  route: string;
  label?: string;
  [k: string]: unknown;
};

export type RouteTree = Record<string, unknown> & {
  route?: string;
};

export function isRouteNode(v: unknown): v is RouteNode {
  return !!v && typeof v === 'object' && 'route' in (v as any) && typeof (v as any).route === 'string';
}

export function hasChildNodes(node: RouteNode): boolean {
  return Object.keys(node).some((k) => k !== 'route' && isRouteNode((node as any)[k]));
}

export function toHref(route: string, base = '/'): string {
  const normalized = route.startsWith('/') ? route : `/${route}`;

  return route === '' ? base : normalized;
}
