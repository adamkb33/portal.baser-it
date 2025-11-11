// Common Responses
import type { ApiResponse } from './generic-wrapper';
import type { AuthenticatedUserPayload, AuthenticationTokenDto, CompanySummaryDto, CompanyUserDto, ContactDto, InvitedUserTokenDto, JwtClaims, ServiceDto, ServiceGroupDto } from './models';

export type ApiResponseAuthenticatedUserPayload = ApiResponse<AuthenticatedUserPayload>;
export type ApiResponseAuthenticationTokenDto = ApiResponse<AuthenticationTokenDto>;
export type ApiResponseBoolean = ApiResponse<Boolean>;
export type ApiResponseCompanySummaryDto = ApiResponse<CompanySummaryDto>;
export type ApiResponseCompanyUserDto = ApiResponse<CompanyUserDto>;
export type ApiResponseContactDto = ApiResponse<ContactDto>;
export type ApiResponseInvitedUserTokenDto = ApiResponse<InvitedUserTokenDto>;
export type ApiResponseJwtClaims = ApiResponse<JwtClaims>;
export type ApiResponseListCompanySummaryDto = ApiResponse<ListCompanySummaryDto>;
export type ApiResponseListCompanyUserDto = ApiResponse<ListCompanyUserDto>;
export type ApiResponseListContactDto = ApiResponse<ListContactDto>;
export type ApiResponseListDailyScheduleDto = ApiResponse<ListDailyScheduleDto>;
export type ApiResponseListServiceDto = ApiResponse<ListServiceDto>;
export type ApiResponseListServiceGroupDto = ApiResponse<ListServiceGroupDto>;
export type ApiResponseServiceDto = ApiResponse<ServiceDto>;
export type ApiResponseServiceGroupDto = ApiResponse<ServiceGroupDto>;
export type ApiResponseUnit = ApiResponse<void>;
