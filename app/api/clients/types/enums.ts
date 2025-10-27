// Enums
export const Roles = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Roles = (typeof Roles)[keyof typeof Roles];

export const RolesToDelete = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type RolesToDelete = (typeof RolesToDelete)[keyof typeof RolesToDelete];

export const UserRole = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  USER: 'USER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
