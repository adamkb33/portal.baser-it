// Models
import type { CompanyProducts, DayOfWeek, Roles, UserRole } from './enums';

export interface AcceptNewInviteDto {
    givenName: string;
    familyName: string;
    password: string;
    password2: string;
}

export interface AddCompanyRoleDto {
    userId: number;
    companyRoles: CompanyRoleAssignmentDto[];
}

/**
 * Request to add products to a company
 */
export type AddProductToCompanyDto = {
    companyId: number;
    products: CompanyProducts[];
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

export interface AppointmentDto {
    id: number;
    profileId: number;
    contactId: number;
    startTime: string;
    endTime: string;
    services: AppointmentServiceDto[];
}

export interface AppointmentServiceDto {
    id: number;
    appointmentId: number;
    serviceId: number;
    name: string;
    duration: number;
    price: number;
}

export interface AppointmentSessionDto {
    sessionId: string;
    companyId: number;
    contactId?: number;
    selectedServices?: number[];
    selectedUserId?: number;
    selectedStartTime?: string;
}

export interface AppointmentSessionGetScheduleDto {
    sessionId: string;
    date: string;
    serviceIds: number[];
}

export interface AuthenticatedUserPayload {
    id: number;
    email: string;
    roles: UserRole[];
    company?: AuthUserCompany;
}

export interface AuthenticationTokenDto {
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
}

export interface AuthUserCompany {
    companyId: number;
    companyOrgNum: string;
    companyRoles: Roles[];
    companyProducts: CompanyProducts[];
}

export interface BulkImageUploadRequest {
    images: ImageUpload[];
}

export interface CompanyRoleAssignmentDto {
    companyId: number;
    roles: Roles[];
}

export interface CompanySignInDto {
    companyId: number;
}

export interface CompanySummaryDto {
    id: number;
    orgNumber: string;
    name?: string;
    organizationType?: OrganizationTypeDto;
    postalAddress?: AddressDto;
    businessAddress?: AddressDto;
}

export interface CompanyUserDto {
    userId: number;
    email: string;
    roles: Roles[];
}

export interface CompanyUserProfileDto {
    id: number;
    userId: number;
    companyId: number;
    imageId?: number;
    description?: string;
}

export interface ContactDto {
    id: number;
    companyId: number;
    givenName: string;
    familyName: string;
    email?: ContactEmailDto;
    mobileNumberDto?: ContactMobileNumberDto;
}

export interface ContactEmailDto {
    id?: number;
    value?: string;
}

export interface ContactMobileNumberDto {
    id: number;
    value: string;
}

export interface CreateAppointmentCompanyUserDto {
    contactId: number;
    date: string;
    startTime: string;
    serviceIds: number[];
}

export interface CreateAppointmentDto {
    profileId: number;
    contactId: number;
    startTime: string;
    serviceIds: number[];
}

export interface CreateCompanyDto {
    orgNumber: string;
}

export interface CreateContactDto {
    givenName: string;
    familyName: string;
    email?: string;
    mobileNumber?: string;
}

export interface CreateOrUpdateDailySchedulesDto {
    id?: number;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
}

export interface CreateServiceDto {
    serviceGroupId: number;
    name: string;
    price: number;
    duration: number;
    images: ImageUpload[];
}

export interface CreateServiceGroupDto {
    name: string;
}

export interface DailyScheduleDto {
    id: number;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
}

export interface EditCompanyUserDto {
    roles: Roles[];
}

export interface ExistingUserAcceptInviteDto {
    hasAccepted: boolean;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface GetCompanyUsersByIdDto {
    companyId: number;
    userIds: number[];
}

export interface GetCompanyUserScheduleDto {
    profileId: number;
    date: string;
    serviceIds: number[];
}

export interface GetContactsByIdsDto {
    contactIds: number[];
}

export interface GetOrCreateContactDto {
    companyId: number;
    givenName: string;
    familyName: string;
    email?: string;
    mobileNumber?: string;
}

export interface GroupedService {
    id: number;
    name: string;
    price: number;
    duration: number;
    images?: ImageDto[];
}

export interface GroupedServiceGroupsDto {
    companyId: number;
    id: number;
    name: string;
    services: GroupedService[];
}

export interface ImageDto {
    id?: number;
    url: string;
    label?: string;
    contentType?: string;
    size: number;
}

export interface ImageUpload {
    fileName: string;
    label: string;
    contentType: string;
    data: string;
}

export interface InviteCompanyUserDto {
    email: string;
    roles: Roles[];
}

export interface InvitedUserTokenDto {
    inviteToken: string;
}

export interface InviteUserDto {
    email: string;
    userRoles: UserRole[];
    companyRoles: CompanyRoleAssignmentDto[];
}

export interface JwtClaims {
    sub?: number;
    email?: string;
    roles?: string[];
    company?: JwtCompanyClaim;
    exp?: number;
    iat?: number;
}

export interface JwtCompanyClaim {
    companyId?: number;
    companyOrgNum: string;
    companyRoles?: string[];
    companyProducts?: string[];
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

export interface PaginatedResponseAppointmentDto {
    content: AppointmentDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PaginatedResponseCompanyUserDto {
    content: CompanyUserDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PaginatedResponseContactDto {
    content: ContactDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PaginatedResponseServiceDto {
    content: ServiceDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PaginatedResponseServiceGroupDto {
    content: ServiceGroupDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PublicCompanyUserDto {
    userId: number;
    email: string;
}

export interface RefreshTokenRequestDto {
    refreshToken: string;
}

export interface RequestCompanyRoleDeleteDto {
    userId: number;
    rolesToDelete: Roles[];
}

export interface ResetPasswordDto {
    resetPasswordToken: string;
    password: string;
    password2: string;
}

export interface ScheduleDto {
    profileId: number;
    date: string;
    timeSlots: ScheduleTimeSlot[];
}

export interface ScheduleTimeSlot {
    startTime: string;
    endTime: string;
}

export interface SelectCompanyUserAppointmentSessionDto {
    sessionId: string;
    selectedCompanyUserId: number;
}

export interface SelectServicesAppointmentSessionDto {
    sessionId: string;
    selectedServices: number[];
}

export interface ServiceDto {
    id: number;
    companyId: number;
    serviceGroupId: number;
    name: string;
    price: number;
    duration: number;
    images?: ImageDto[];
}

export interface ServiceGroupDto {
    id: number;
    companyId: number;
    name: string;
}

export interface SignInDto {
    email: string;
    password: string;
}

export interface SignOutDto {
    userId: number;
}

export interface SingleImageUploadRequest {
    image: ImageUpload;
}

export interface UpdateCompanyUserProfileDto {
    image?: ImageUpload;
    description?: string;
    services: number[];
}

export interface UpdateContactDto {
    givenName: string;
    familyName: string;
    email?: string;
    mobileNumber?: string;
}

export interface UpdateServiceDto {
    id: number;
    serviceGroupId: number;
    price: number;
    name: string;
    duration: number;
    newImages: ImageUpload[];
    deleteImageIds: number[];
}

export interface UpdateServiceGroupDto {
    id: number;
    name: string;
}

export interface UserDto {
    id: number;
    givenName: string;
    familyName: string;
    email: string;
}
