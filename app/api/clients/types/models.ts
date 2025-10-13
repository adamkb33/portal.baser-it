// Models
import type { CompanyRole, UserRole } from './enums';

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
