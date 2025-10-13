// Primitives
export type Email = string;
export type ID = string | number;
export type DateTime = string;

// Enums
export type CompanyRole = 'ADMIN' | 'EMPLOYEE';
export type UserRole = 'SYSTEM_ADMIN' | 'USER';

// Core
export interface ApiError { code: string; message: string; field?: string; details?: string; }
export interface ApiMeta { total?: number; requestId?: string; pagination?: PaginationMeta; sorting?: SortingMeta; filtering?: FilteringMeta; }
export interface PaginationMeta { page: number; size: number; totalElements: number; totalPages: number; }
export interface SortingMeta { sortBy: string; direction: string; }
export interface FilteringMeta { appliedFilters: Record<string, unknown>; }

// Generic Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  meta?: ApiMeta;
  timestamp: DateTime;
}

// Models

export interface AcceptInviteDto {
    givenName: string;
    familyName: string;
    password: string;
    password2: string;
}

export interface AddressDto {
    municipality?: string;
    countryCode?: string;
    postalCode?: string;
    addressLines?: string[];
    country?: string;
    municipalityCode?: string;
    city?: string;
}

export interface AuthenticationRequestDto {
    email: string;
    password: string;
}

export interface AuthenticationTokenDto {
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
}

export interface CompanyRoleAssignmentDto {
    companyId: number;
    role: CompanyRole;
}

export interface CompanySummaryDto {
    id: number;
    orgNumber: string;
    name: string;
    organizationType: OrganizationTypeDto;
    postalAddress: AddressDto;
    businessAddress: AddressDto;
}

export interface CreateCompanyDto {
    orgNumber: string;
}

export interface InvitedUserTokenDto {
    inviteToken: string;
}

export interface InviteUserDto {
    email: string;
    userRoles: UserRole[];
    companyRoles: CompanyRoleAssignmentDto[];
}

export interface Link {
    href?: string;
    templated?: boolean;
}

export interface OrganizationTypeDto {
    code?: string;
    description?: string;
    retiredAt?: string;
}

export interface RefreshTokenRequestDto {
    refreshToken: string;
}

export interface SignOutRequestDto {
    userId: number;
}

// Common Responses
export type ApiResponseAuthenticationTokenDto = ApiResponse<AuthenticationTokenDto>;
export type ApiResponseCompanySummaryDto = ApiResponse<CompanySummaryDto>;
export type ApiResponseInvitedUserTokenDto = ApiResponse<InvitedUserTokenDto>;
export type ApiResponseString = ApiResponse<string>;
export type ApiResponseUnit = ApiResponse<void>;
