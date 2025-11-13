// Common Responses
import type { ApiResponse } from './generic-wrapper';
import type { AppointmentDto, AuthenticatedUserPayload, AuthenticationTokenDto, CompanySummaryDto, CompanyUserDto, ContactDto, DailyScheduleDto, InvitedUserTokenDto, JwtClaims, PaginatedResponseAppointmentDto, ScheduleDto, ServiceDto, ServiceGroupDto } from './models';

export type ApiResponseAppointmentDto = ApiResponse<AppointmentDto>;
export type ApiResponseAuthenticatedUserPayload = ApiResponse<AuthenticatedUserPayload>;
export type ApiResponseAuthenticationTokenDto = ApiResponse<AuthenticationTokenDto>;
export type ApiResponseBoolean = ApiResponse<Boolean>;
export type ApiResponseCompanySummaryDto = ApiResponse<CompanySummaryDto>;
export type ApiResponseCompanyUserDto = ApiResponse<CompanyUserDto>;
export type ApiResponseContactDto = ApiResponse<ContactDto>;
export type ApiResponseInvitedUserTokenDto = ApiResponse<InvitedUserTokenDto>;
export type ApiResponseJwtClaims = ApiResponse<JwtClaims>;
export type ApiResponseListCompanySummaryDto = ApiResponse<CompanySummaryDto[]>;
export type ApiResponseListCompanyUserDto = ApiResponse<CompanyUserDto[]>;
export type ApiResponseListContactDto = ApiResponse<ContactDto[]>;
export type ApiResponseListDailyScheduleDto = ApiResponse<DailyScheduleDto[]>;
export type ApiResponseListServiceDto = ApiResponse<ServiceDto[]>;
export type ApiResponseListServiceGroupDto = ApiResponse<ServiceGroupDto[]>;
export type ApiResponsePaginatedResponseAppointmentDto = ApiResponse<PaginatedResponseAppointmentDto>;
export type ApiResponseScheduleDto = ApiResponse<ScheduleDto>;
export type ApiResponseServiceDto = ApiResponse<ServiceDto>;
export type ApiResponseServiceGroupDto = ApiResponse<ServiceGroupDto>;
export type ApiResponseUnit = ApiResponse<void>;
