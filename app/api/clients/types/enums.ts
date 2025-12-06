// Enums
export const CompanyProducts = {
  BOOKING: 'BOOKING',
  EVENT: 'EVENT',
  TIMESHEET: 'TIMESHEET',
} as const;

export type CompanyProducts = (typeof CompanyProducts)[keyof typeof CompanyProducts];

export const CompanyRoles = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type CompanyRoles = (typeof CompanyRoles)[keyof typeof CompanyRoles];

export const DayOfWeek = {
  MONDAY: 'MONDAY',
  TUESDAY: 'TUESDAY',
  WEDNESDAY: 'WEDNESDAY',
  THURSDAY: 'THURSDAY',
  FRIDAY: 'FRIDAY',
  SATURDAY: 'SATURDAY',
  SUNDAY: 'SUNDAY',
} as const;

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export const Id = {
  ADD_CONTACT: 'ADD_CONTACT',
  SELECT_SERVICES: 'SELECT_SERVICES',
  SELECT_PROFILE: 'SELECT_PROFILE',
  SELECT_START_TIME: 'SELECT_START_TIME',
  OVERVIEW: 'OVERVIEW',
} as const;

export type Id = (typeof Id)[keyof typeof Id];

export const Products = {
  BOOKING: 'BOOKING',
  EVENT: 'EVENT',
  TIMESHEET: 'TIMESHEET',
} as const;

export type Products = (typeof Products)[keyof typeof Products];

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
  COMPANY_USER: 'COMPANY_USER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
