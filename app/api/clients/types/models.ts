// Models
import type { Roles, UserRole } from './enums';

export interface AcceptInviteDto {
    givenName: string;
    familyName: string;
    password: string;
    password2: string;
}

export interface AddCompanyRoleDto {
    userId: number;
    companyRoles: CompanyRoleAssignmentDto[];
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

export interface AuthenticatedUserPayload {
    id: number;
    email: string;
    roles: UserRole[];
    companyRoles: CompanyRoleDto[];
}

export interface AuthenticationTokenDto {
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
}

export interface CompanyRoleAssignmentDto {
    companyId: number;
    roles: Roles[];
}

export interface CompanyRoleDto {
    companyId: number;
    roles: Roles[];
}

export interface CompanySummaryDto {
    id: number;
    orgNumber: string;
    name?: string;
    organizationType?: OrganizationTypeDto;
    postalAddress?: AddressDto;
    businessAddress?: AddressDto;
}

export interface CreateCompanyDto {
    orgNumber: string;
}

export interface ForgotPasswordDto {
    email: string;
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

export interface ResetPasswordDto {
    resetPasswordToken: string;
    password: string;
    password2: string;
}

export interface SignInDto {
    email: string;
    password: string;
}

export interface SignOutDto {
    userId: number;
}
