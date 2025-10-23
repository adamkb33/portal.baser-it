// Enums
export const CompanyRoles = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type CompanyRoles = (typeof CompanyRoles)[keyof typeof CompanyRoles];

export const Roles = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Roles = (typeof Roles)[keyof typeof Roles];

export const UserRole = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  USER: 'USER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
