import type { IconName } from './route-icon-map';

export enum Access {
  PUBLIC = 'PUBLIC',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  ROLE = 'ROLE',
  PRODUCT = 'PRODUCT',
}

export enum BrachCategory {
  PUBLIC = 'PUBLIC',
  AUTH = 'AUTH',
  NONE = 'NONE',
  COMPANY = 'COMPANY',
  USER = 'USER',
}

export enum RoutePlaceMent {
  NAVIGATION = 'NAVIGATION',
  SIDEBAR = 'SIDEBAR',
  FOOTER = 'FOOTER',
}

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum CompanyRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export type RouteBranch = {
  id: string;
  href: string;
  label?: string;
  accessType?: Access;
  placement?: RoutePlaceMent;
  hidden?: boolean;
  category: BrachCategory;
  userRoles?: UserRole[];
  companyRoles?: CompanyRole[];
  iconName?: IconName;
  children?: RouteBranch[];
  excludeLayout?: boolean;
};

export type ApiRoute = {
  id: string;
  url: string;
  children?: ApiRoute[];
};
